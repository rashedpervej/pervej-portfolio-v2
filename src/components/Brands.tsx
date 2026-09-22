import React from "react";
import { usePortfolio } from "../context/PortfolioContext";
import { Star } from "lucide-react";
import { motion } from "motion/react";

export default function Brands() {
  const { portfolioData, theme } = usePortfolio();
  const isLight = theme === "light";
  const brands = portfolioData.selectedBrands;

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

        {/* Dynamic Horizontal Ticker Marquee */}
        <div className="relative w-full overflow-hidden py-2">
          <div className="flex gap-16 items-center animate-[marquee_25s_linear_infinite] whitespace-nowrap min-w-full">
            {/* Duplicate array to create endless scroll */}
            {[...brands, ...brands].map((brand, index) => (
              <div
                key={index}
                className="flex items-center gap-3 shrink-0 select-none group"
              >
                <Star className="w-3.5 h-3.5 text-purple-500 opacity-50 group-hover:rotate-45 transition-transform duration-300" />
                <span className={`font-display font-medium text-lg sm:text-xl tracking-tight transition-colors duration-200 ${
                  isLight ? "text-zinc-600 group-hover:text-zinc-950" : "text-zinc-400 group-hover:text-white"
                }`}>
                  {brand.logoText}
                </span>
                {brand.market && (
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase border ${
                    isLight ? "bg-purple-100/80 text-purple-700 border-purple-200" : "bg-white/5 text-zinc-500 border-white/5"
                  }`}>
                    {brand.market}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Static Grid on Mobile, nicely structured */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t ${
          isLight ? "border-zinc-200/80" : "border-white/5"
        }`}>
          {brands.slice(0, 11).map((brand, i) => (
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
                {brand.name}
              </p>
              <span className={`text-[9px] font-mono uppercase tracking-widest mt-1 block ${
                isLight ? "text-zinc-400" : "text-zinc-600"
              }`}>
                {brand.market || "Local Client"}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Add Custom marquee keyframes if they are not inside Tailwind, we will inject a style tag */}
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
