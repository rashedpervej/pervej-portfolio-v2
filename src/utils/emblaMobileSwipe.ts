import type { EmblaCarouselType } from "embla-carousel";

interface SwipeOptions {
  threshold?: number; // Minimum drag distance in pixels to trigger slide change (default: 25px)
  onSwipeChange?: (direction: -1 | 1) => void;
}

/**
 * Increases touch/swipe sensitivity for Embla Carousel on mobile devices:
 * - Allows slides to change smoothly with a shorter drag distance (25px-30px)
 * - Leverages Embla's internal engine to calculate the exact spring trajectory with zero stutter
 * - Protects vertical page scrolling (touch-pan-y) without hijacking or accidental triggers
 * - Leaves desktop hover/click/drag behavior completely untouched
 */
export function setupEmblaMobileSwipe(
  emblaApi: EmblaCarouselType | undefined,
  options: SwipeOptions = {}
): () => void {
  if (!emblaApi) return () => {};

  const threshold = options.threshold ?? 25;
  const onSwipeChange = options.onSwipeChange;

  let cleanupListeners: (() => void) | null = null;

  const initEnhancement = () => {
    if (cleanupListeners) {
      cleanupListeners();
      cleanupListeners = null;
    }

    try {
      const engine = emblaApi.internalEngine();
      if (!engine || !engine.scrollTarget) return;

      const rootNode = emblaApi.rootNode();
      if (!rootNode) return;

      // Retain original byDistance method
      const originalByDistance =
        (engine.scrollTarget as any).__originalByDistance ||
        engine.scrollTarget.byDistance;
      (engine.scrollTarget as any).__originalByDistance = originalByDistance;

      let touchStartX = 0;
      let touchStartY = 0;
      let isTracking = false;
      let touchAxis: "x" | "y" | null = null;

      const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length !== 1) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchAxis = null;
        isTracking = true;
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (!isTracking || touchAxis || !e.touches || e.touches.length === 0) return;
        const dx = Math.abs(e.touches[0].clientX - touchStartX);
        const dy = Math.abs(e.touches[0].clientY - touchStartY);
        if (dx > 6 || dy > 6) {
          touchAxis = dx >= dy ? "x" : "y";
        }
      };

      const handleTouchEnd = () => {
        isTracking = false;
        // Keep touchAxis briefly active during the synchronous pointerUp / byDistance execution
        setTimeout(() => {
          touchAxis = null;
        }, 120);
      };

      rootNode.addEventListener("touchstart", handleTouchStart, { passive: true });
      rootNode.addEventListener("touchmove", handleTouchMove, { passive: true });
      rootNode.addEventListener("touchend", handleTouchEnd, { passive: true });
      rootNode.addEventListener("touchcancel", handleTouchEnd, { passive: true });

      // Override scrollTarget.byDistance to enable short drag threshold on mobile
      engine.scrollTarget.byDistance = function (distance: number, snap: boolean) {
        const isMobileOrTouch =
          typeof window !== "undefined" &&
          (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768);

        // Only intervene for touch horizontal swipes when snapping is requested
        if (!isMobileOrTouch || !snap || touchAxis === "y") {
          return originalByDistance.call(engine.scrollTarget, distance, snap);
        }

        const { target, index, scrollSnaps, scrollTarget } = engine;
        const currentIndex = index.get();
        const currentSnap = scrollSnaps[currentIndex];
        const targetLocation = target.get() + distance;
        const diff = targetLocation - currentSnap;

        // If dragged left past threshold -> smoothly advance to next slide
        if (diff <= -threshold) {
          const nextIndex = index.clone().add(1).get();
          if (onSwipeChange) onSwipeChange(-1);
          return scrollTarget.byIndex(nextIndex, -1);
        }

        // If dragged right past threshold -> smoothly go to previous slide
        if (diff >= threshold) {
          const prevIndex = index.clone().add(-1).get();
          if (onSwipeChange) onSwipeChange(1);
          return scrollTarget.byIndex(prevIndex, 1);
        }

        return originalByDistance.call(engine.scrollTarget, distance, snap);
      };

      cleanupListeners = () => {
        rootNode.removeEventListener("touchstart", handleTouchStart);
        rootNode.removeEventListener("touchmove", handleTouchMove);
        rootNode.removeEventListener("touchend", handleTouchEnd);
        rootNode.removeEventListener("touchcancel", handleTouchEnd);
      };
    } catch (err) {
      console.warn("Error setting up mobile swipe sensitivity:", err);
    }
  };

  initEnhancement();

  emblaApi.on("reInit", initEnhancement);

  return () => {
    if (cleanupListeners) cleanupListeners();
    emblaApi.off("reInit", initEnhancement);
  };
}
