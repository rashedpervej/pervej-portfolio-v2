import React, { useState, useEffect, useCallback } from "react";
import { usePortfolio } from "../context/PortfolioContext";
import { Quote, ChevronLeft, ChevronRight, Star } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "motion/react";
import FormattedText from "./FormattedText";

export default function Testimonials() {
  const { portfolioData, theme } = usePortfolio();
  const isLight = theme === "light";
  const testimonials = portfolioData.testimonials || [];

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  const handlePrev = () => {
    if (emblaApi) emblaApi.scrollPrev();
  };

  const handleNext = () => {
    if (emblaApi) emblaApi.scrollNext();
  };

  if (!testimonials.length) return null;

  return (
    <section id="testimonials" className={`py-6 sm:py-8 md:py-9 lg:py-10 relative overflow-hidden ${
      isLight ? "bg-transparent border-y border-zinc-200/80" : "bg-[#050508] border-y border-white/5"
    }`}>
      {/* Absolute glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[120px] pointer-events-none ${
        isLight ? "bg-purple-200/30" : "bg-purple-900/5"
      }`} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center"
      >
        {/* Title */}
        <div className="flex flex-col items-center mb-4 sm:mb-5 lg:mb-6">
          <h2 className={`font-display font-bold text-3xl sm:text-5xl tracking-tight ${
            isLight ? "text-zinc-950" : "text-white"
          }`}>
            Client Testimonials
          </h2>
          <div className="w-12 h-[2px] bg-purple-500 mt-4" />
        </div>

        {/* Carousel Container - Touch / Swipe Friendly */}
        <div className="relative">
          <div
            ref={emblaRef}
            className="overflow-hidden cursor-grab active:cursor-grabbing rounded-3xl"
          >
            <div className="flex -ml-4">
              {testimonials.map((item: any, idx) => (
                <div
                  key={item.id || idx}
                  className="flex-[0_0_100%] min-w-0 pl-4"
                >
                  <div className={`relative p-6 sm:p-12 rounded-3xl min-h-[260px] flex flex-col justify-between select-none h-full text-center transition-all duration-300 ${
                    isLight
                      ? "bg-white/70 border border-white/95 shadow-[0_16px_40px_rgba(100,100,160,0.08),inset_0_1.5px_1px_rgba(255,255,255,1)] backdrop-blur-xl"
                      : "bg-[#0e0f18]/85 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/60"
                  }`}>
                    <div className={`absolute top-6 left-6 pointer-events-none ${
                      isLight ? "text-purple-300/30" : "text-purple-500/20"
                    }`}>
                      <Quote className="w-12 sm:w-16 h-12 sm:h-16 transform -scale-x-100" />
                    </div>

                    <div className="space-y-6 relative z-10 my-auto pt-4">
                      {/* Star Rating */}
                      <div className="flex justify-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-500 fill-amber-500" />
                        ))}
                      </div>

                      <div className={`text-sm sm:text-lg italic font-sans leading-relaxed px-2 sm:px-6 ${
                        isLight ? "text-zinc-700" : "text-zinc-200"
                      }`}>
                        "<FormattedText content={item.quote} />"
                      </div>

                      <div>
                        <h4 className={`font-display font-semibold text-sm sm:text-base ${
                          isLight ? "text-zinc-950 font-bold" : "text-white"
                        }`}>
                          {item.author}
                        </h4>
                        <p className={`font-mono text-[10px] sm:text-xs uppercase tracking-wider mt-1 ${
                          isLight ? "text-zinc-500 font-medium" : "text-zinc-400"
                        }`}>
                          {item.role} — <span className={isLight ? "text-purple-600 font-semibold" : "text-purple-400 font-semibold"}>{item.company}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Controls & Pagination Dots */}
          <div className="flex items-center justify-center gap-4 mt-5 relative z-20">
            <button
              onClick={handlePrev}
              aria-label="Previous Testimonial"
              className={`p-2.5 rounded-xl border transition-all active:scale-90 ${
                isLight
                  ? "bg-white/70 hover:bg-white/95 text-zinc-700 hover:text-zinc-950 border-white/90 shadow-sm backdrop-blur-md"
                  : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border-white/5"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => emblaApi?.scrollTo(idx)}
                  aria-label={`Go to testimonial ${idx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    selectedIndex === idx
                      ? "bg-purple-600 w-6 shadow-md shadow-purple-600/30"
                      : isLight
                      ? "bg-zinc-300 w-2 hover:bg-zinc-400"
                      : "bg-white/15 w-2 hover:bg-white/30"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              aria-label="Next Testimonial"
              className={`p-2.5 rounded-xl border transition-all active:scale-90 ${
                isLight
                  ? "bg-white/70 hover:bg-white/95 text-zinc-700 hover:text-zinc-950 border-white/90 shadow-sm backdrop-blur-md"
                  : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border-white/5"
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
