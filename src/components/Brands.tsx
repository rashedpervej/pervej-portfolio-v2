import React from "react";
import { usePortfolio } from "../context/PortfolioContext";
import { motion } from "motion/react";
import { getDefaultBrandLogo } from "../utils/brandLogos";

export default function Brands() {
  const { portfolioData, theme } = usePortfolio();
  const isLight = theme === "light";
  const brands = portfolioData.selectedBrands || [];

  // Guarantee sufficient items for ultra-wide displays
  const marqueeBrands = brands.length > 0
    ? brands.length < 6
      ? [...brands, ...brands, ...brands]
      : brands
    : [];

  const renderLogoItem = (brand: any, uniqueKey: string | number) => {
    const brandName = brand.brandName || brand.name || "Brand";
    const logoSrc = brand.logoUrl || getDefaultBrandLogo(brandName);
    const isSvgDataUri = typeof logoSrc === "string" && logoSrc.startsWith("data:image/svg+xml");

    return (
      <div
        key={uniqueKey}
        className="shrink-0 select-none group px-1.5"
        title={brandName}
      >
        {/* Global white background shape treatment with clean, subtle border and no heavy shadow */}
        <div
          className="px-4 sm:px-7 py-2 sm:py-3 rounded-xl sm:rounded-2xl transition-all duration-300 flex items-center justify-center min-w-[130px] sm:min-w-[180px] md:min-w-[210px] h-[58px] sm:h-[76px] md:h-[84px] bg-white border border-zinc-200/50 shadow-xs hover:border-purple-300/80 hover:shadow-sm hover:scale-[1.02]"
        >
          <img
            src={logoSrc}
            alt={brandName}
            loading="lazy"
            className={`h-10 sm:h-13 md:h-15 w-auto max-w-[150px] sm:max-w-[200px] md:max-w-[240px] object-contain transition-all duration-300 opacity-95 group-hover:opacity-100 group-hover:scale-105 ${
              isSvgDataUri
                ? "[filter:invert(0.88)_hue-rotate(180deg)]"
                : "contrast-[1.02] brightness-100"
            }`}
          />
        </div>
      </div>
    );
  };

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
        className="max-w-7xl mx-auto content-gutter relative z-10"
      >
        <p className={`font-mono text-[10px] uppercase tracking-[0.25em] text-center mb-3 sm:mb-4 ${
          isLight ? "text-zinc-500 font-semibold" : "text-zinc-500"
        }`}>
          SELECTED BRANDS & COLLABORATORS
        </p>

        {/* Dynamic Horizontal Ticker Marquee - Edge-to-edge on mobile, contained on desktop */}
        <div className="relative edge-to-edge-slider overflow-hidden py-2 sm:py-3">
          {/* Marquee Track Container with two identical child tracks */}
          <div className="flex w-max items-center group/marquee">
            {/* Primary Track */}
            <div className="flex shrink-0 items-center gap-5 sm:gap-7 pr-5 sm:pr-7 animate-marquee-seamless group-hover/marquee:[animation-play-state:paused]">
              {marqueeBrands.map((brand, index) => renderLogoItem(brand, `track-a-${index}`))}
            </div>
            {/* Synchronized Seamless Clone Track */}
            <div aria-hidden="true" className="flex shrink-0 items-center gap-5 sm:gap-7 pr-5 sm:pr-7 animate-marquee-seamless group-hover/marquee:[animation-play-state:paused]">
              {marqueeBrands.map((brand, index) => renderLogoItem(brand, `track-b-${index}`))}
            </div>
          </div>
        </div>

        {/* Static Grid: displaying item.brandName and item.country with balanced readability */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 mt-5 sm:mt-6 pt-5 sm:pt-6 border-t ${
          isLight ? "border-zinc-200/80" : "border-white/5"
        }`}>
          {brands.map((brand, i) => (
            <div
              key={i}
              className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center transition-all duration-300 group ${
                isLight
                  ? "bg-white/70 hover:bg-white/95 border border-purple-100/90 hover:border-purple-300 shadow-xs backdrop-blur-md"
                  : "bg-[#0d0e19]/70 hover:bg-[#141627]/90 border border-white/[0.07] hover:border-purple-500/30 shadow-xs"
              }`}
            >
              <p className={`font-display font-semibold text-xs sm:text-sm tracking-tight leading-snug ${
                isLight ? "text-zinc-800 group-hover:text-purple-700" : "text-zinc-200 group-hover:text-white"
              }`}>
                {brand.brandName || brand.name}
              </p>
              <span className={`text-[10px] sm:text-[11px] font-mono uppercase tracking-wider mt-1.5 block font-medium ${
                isLight ? "text-zinc-500 group-hover:text-purple-600" : "text-zinc-400 group-hover:text-purple-300"
              }`}>
                {brand.country || brand.market || "Local Client"}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Pure Mathematical Seamless Marquee Animation */}
      <style>{`
        @keyframes marqueeSeamless {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-100%, 0, 0);
          }
        }
        .animate-marquee-seamless {
          animation: marqueeSeamless 20s linear infinite;
          will-change: transform;
        }
      `}</style>
    </section>
  );
}
