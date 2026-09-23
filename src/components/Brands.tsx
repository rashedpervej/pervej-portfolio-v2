import React from "react";
import { usePortfolio } from "../context/PortfolioContext";
import { motion } from "motion/react";
import { getDefaultBrandLogo } from "../utils/brandLogos";

export default function Brands() {
  const { portfolioData, theme } = usePortfolio();
  const isLight = theme === "light";
  const brands = portfolioData.selectedBrands || [];

  return (
    <section
      id="brands"
      className={`py-12 sm:py-16 lg:py-20 relative overflow-hidden ${
        isLight ? "bg-transparent border-y border-zinc-200/80" : "bg-[#030303] border-y border-white/5"
      }`}
    >
      {/* Absolute faint lighting */}
      <div className={`absolute top-1/2 left-0 -translate-y-1/2 w-64 h-32 blur-[50px] pointer-events-none ${
        isLight ? "bg-purple-300/20" : "bg-purple-500/5"
      }`} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-6 relative z-10"
      >
        <p className={`font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-center mb-4 sm:mb-6 ${
          isLight ? "text-zinc-500 font-semibold" : "text-zinc-500"
        }`}>
          SELECTED BRANDS &amp; COLLABORATORS
        </p>

        {/* Dynamic Horizontal Ticker Marquee - ONLY brand logo image rendered via item.logoUrl */}
        <div className="relative w-full overflow-hidden py-3 sm:py-4">
          <div className="flex gap-6 sm:gap-12 md:gap-16 items-center animate-[marquee_20s_linear_infinite] sm:animate-[marquee_25s_linear_infinite] whitespace-nowrap min-w-full w-max hover:[animation-play-state:paused]">
            {/* Duplicate array to create seamless endless scroll */}
            {[...brands, ...brands].map((brand, index) => {
              const brandName = brand.brandName || brand.name || `Brand ${index + 1}`;
              const logoSrc = brand.logoUrl || getDefaultBrandLogo(brandName);

              return (
                <div
                  key={index}
                  className="flex items-center justify-center shrink-0 select-none group px-2 sm:px-4 py-1"
                  title={brandName}
                >
                  <img
                    src={logoSrc}
                    alt={brandName}
                    loading="lazy"
                    className={`h-6 sm:h-8 md:h-9 w-auto max-w-[95px] sm:max-w-[150px] object-contain transition-all duration-300 filter grayscale opacity-45 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 ${
                      isLight
                        ? "brightness-95 contrast-125 group-hover:brightness-100 group-hover:drop-shadow-[0_2px_12px_rgba(168,85,247,0.35)]"
                        : "brightness-110 contrast-100 group-hover:brightness-125 group-hover:drop-shadow-[0_0_14px_rgba(168,85,247,0.55)]"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Static Grid on Mobile: strictly 2-column grid on mobile (grid-cols-2) */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t ${
          isLight ? "border-zinc-200/80" : "border-white/5"
        }`}>
          {brands.map((brand, i) => (
            <div
              key={i}
              className={`p-3.5 sm:p-4 rounded-xl text-center transition-all duration-300 group ${
                isLight
                  ? "bg-white/60 hover:bg-white/90 border border-white/90 hover:border-purple-300 shadow-[0_2px_8px_rgba(100,100,160,0.05),inset_0_1px_1px_rgba(255,255,255,0.95)] backdrop-blur-md"
                  : "bg-white/[0.01] border border-white/5 hover:border-purple-500/20"
              }`}
            >
              <p className={`font-display font-medium text-xs sm:text-sm truncate ${
                isLight ? "text-zinc-800 group-hover:text-purple-700 font-semibold" : "text-zinc-300 group-hover:text-white"
              }`}>
                {brand.brandName || brand.name}
              </p>
              <span className={`text-[8.5px] sm:text-[9px] font-mono uppercase tracking-wider sm:tracking-widest mt-0.5 sm:mt-1 block truncate ${
                isLight ? "text-zinc-400" : "text-zinc-600"
              }`}>
                {brand.country || brand.market || "Local Client"}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Custom marquee keyframes */}
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
      `}</style>
    </section>
  );
}
