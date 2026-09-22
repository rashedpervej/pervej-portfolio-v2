import React, { useState, useEffect, useLayoutEffect, Suspense, lazy } from "react";
import { PortfolioProvider, usePortfolio } from "./context/PortfolioContext";
import Header from "./components/Header";
import Hero from "./components/Hero";
import About from "./components/About";
import Experience from "./components/Experience";
import Projects from "./components/Projects";
import Brands from "./components/Brands";
import Skills from "./components/Skills";
import Services from "./components/Services";
import Testimonials from "./components/Testimonials";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import DynamicBackground from "./components/DynamicBackground";

// Lazy-load heavy route-level and feature-level components to optimize initial bundle and Core Web Vitals
const Admin = lazy(() => import("./components/Admin"));
const InvoiceMaker = lazy(() => import("./components/InvoiceMaker"));
const AIChatBot = lazy(() => import("./components/AIChatBot"));
const DynamicSection = lazy(() => import("./components/DynamicSection"));

// Elegant lightweight route loading fallback
function RouteLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090a0f] text-zinc-300">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
        <span className="text-xs font-mono tracking-widest uppercase text-zinc-500">Loading module...</span>
      </div>
    </div>
  );
}

function ScrollToTop({ currentPath }: { currentPath: string }) {
  useEffect(() => {
    // Disable default browser scroll restoration on route navigation
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useLayoutEffect(() => {
    // Reset scroll immediately when path changes
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentPath]);

  useEffect(() => {
    // Secondary frame check to guarantee top scroll position after layout renders
    const frame = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
    return () => cancelAnimationFrame(frame);
  }, [currentPath]);

  return null;
}

function MainPortfolio() {
  const { getSectionOrder, isSectionVisible, getSectionRecord, siteSettings, theme } = usePortfolio();
  const orderedSections = getSectionOrder();
  const isLight = theme === "light";

  const isChatbotEnabled = siteSettings.enableChatbot !== false && (siteSettings.enableChatbot as any) !== "false";

  return (
    <div
      className={`min-h-screen flex flex-col font-sans selection:bg-purple-600 selection:text-white relative overflow-x-clip ${
        isLight ? "portfolio-canvas bg-[#f0f3fa] text-zinc-900" : "bg-[#090a0f] text-zinc-100"
      }`}
    >
      {/* Responsive Dynamic Atmospheric Background Stage */}
      <DynamicBackground />

      <Header />
      <main className="flex-grow relative z-10">
        {orderedSections.map((key) => {
          if (!isSectionVisible(key)) return null;

          switch (key) {
            case "hero":
              return <Hero key={key} />;
            case "about":
              return <About key={key} />;
            case "experience":
              return <Experience key={key} />;
            case "projects":
              return <Projects key={key} />;
            case "brands":
              return <Brands key={key} />;
            case "skills":
              return <Skills key={key} />;
            case "services":
              return <Services key={key} />;
            case "testimonials":
              return <Testimonials key={key} />;
            case "contact":
              return <Contact key={key} />;
            case "educationCertifications":
            case "education_certifications":
              return null;
            default: {
              const record = getSectionRecord(key);
              if (record) {
                return (
                  <Suspense key={key} fallback={null}>
                    <DynamicSection section={record} />
                  </Suspense>
                );
              }
              return null;
            }
          }
        })}
      </main>
      <Footer />
      {isChatbotEnabled && (
        <Suspense fallback={null}>
          <AIChatBot />
        </Suspense>
      )}
    </div>
  );
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handleLocationChange);

    // Patch history pushState and replaceState to catch all internal route navigations
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      originalPushState.apply(this, args);
      handleLocationChange();
    };

    window.history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      handleLocationChange();
    };

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  return (
    <PortfolioProvider>
      <ScrollToTop currentPath={currentPath} />
      {currentPath === "/admin" ? (
        <Suspense fallback={<RouteLoadingFallback />}>
          <Admin />
        </Suspense>
      ) : currentPath === "/invoice-maker" ? (
        <Suspense fallback={<RouteLoadingFallback />}>
          <InvoiceMaker />
        </Suspense>
      ) : (
        <MainPortfolio />
      )}
    </PortfolioProvider>
  );
}

