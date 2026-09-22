import React from "react";
import { usePortfolio } from "../context/PortfolioContext";
import { motion } from "motion/react";
import { getDefaultBrandLogo } from "../utils/brandLogos";

export default function Brands() {
  const { portfolioData, siteSettings, theme } = usePortfolio();
  const isLight = theme === "light";
  const brands = portfolioData.selectedBrands || [];
  const marqueeSpeed = siteSettings?.marqueeSpeed ?? 25;

  // Ensure seamless endless scroll without blank gaps or stutter by repeating items adequately into two exact halves
  const baseBrands = brands.length > 0 ? brands : [];
  const repeatCount = baseBrands.length > 0 ? Math.max(1, Math.ceil(8 / baseBrands.length)) : 1;
  const singleHalf = Array(repeatCount).fill(baseBrands).flat();
  const marqueeItems = [...singleHalf, ...singleHalf];

  return (
    <section id="brands" className={`py-5 sm:py-6 md:py-7 lg:py-8 relative overflow-hidden ${
      isLight ? "bg-transparent border-y border-zinc-200/80" : "bg-[#030303] border-y border-white/5"
    }`}>
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
        <p className={`font-mono text-[10px] uppercase tracking-[0.25em] text-center mb-3 sm:mb-4 ${
          isLight ? "text-zinc-500 font-semibold" : "text-zinc-500"
        }`}>
          SELECTED BRANDS & COLLABORATORS
        </p>

        {/* Dynamic Horizontal Ticker Marquee with Responsive Logo Sizing & Controlled Speed */}
        <div className="relative w-full overflow-hidden py-3">
          {/* Edge gradients for smooth fade in/out */}
          <div className={`absolute left-0 top-0 bottom-0 w-12 sm:w-20 z-10 pointer-events-none ${
            isLight
              ? "bg-gradient-to-r from-stone-50/80 sm:from-white/90 to-transparent"
              : "bg-gradient-to-r from-[#030303] to-transparent"
          }`} />
          <div className={`absolute right-0 top-0 bottom-0 w-12 sm:w-20 z-10 pointer-events-none ${
            isLight
              ? "bg-gradient-to-l from-stone-50/80 sm:from-white/90 to-transparent"
              : "bg-gradient-to-l from-[#030303] to-transparent"
          }`} />

          <div
            className="flex items-center animate-[marquee_25s_linear_infinite] whitespace-nowrap min-w-full hover:[animation-play-state:paused]"
            style={{ animationDuration: `${marqueeSpeed}s` }}
          >
            {marqueeItems.map((brand, index) => {
              const brandName = brand.brandName || brand.name || `Brand ${index + 1}`;
              const logoSrc = brand.logoUrl || getDefaultBrandLogo(brandName);

              return (
                <div
                  key={index}
                  className="w-[30%] sm:w-[22%] lg:w-[18%] flex-shrink-0 flex items-center justify-center px-4 select-none group"
                  title={brandName}
                >
                  <img
                    src={logoSrc}
                    alt={brandName}
                    loading="lazy"
                    className={`h-6 sm:h-7 md:h-8 w-auto max-w-[120px] sm:max-w-[140px] object-contain transition-all duration-300 filter grayscale opacity-45 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 ${
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

        {/* Static Grid on Mobile, nicely structured: displaying only item.brandName and item.country */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t ${
          isLight ? "border-zinc-200/80" : "border-white/5"
        }`}>
          {brands.map((brand, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl text-center transition-all duration-300 group ${
                isLight
                  ? "bg-white/60 hover:bg-white/90 border border-white/90 hover:border-purple-300 shadow-[0_2px_8px_rgba(100,100,160,0.05),inset_0_1px_1px_rgba(255,255,255,0.95)] backdrop-blur-md"
                  : "bg-white/[0.01] border border-white/5 hover:border-purple-500/20"
              }`}
            >
              <p className={`font-display font-medium text-xs sm:text-sm ${
                isLight ? "text-zinc-800 group-hover:text-purple-700 font-semibold" : "text-zinc-300 group-hover:text-white"
              }`}>
                {brand.brandName || brand.name}
              </p>
              <span className={`text-[9px] font-mono uppercase tracking-widest mt-1 block ${
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
      `}</style>
    </section>
  );
}
