import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, MapPin, ChevronDown, ChevronUp, Briefcase } from "lucide-react";
import { usePortfolio } from "../context/PortfolioContext";
import FormattedText from "./FormattedText";

export default function Experience() {
  const { portfolioData, theme } = usePortfolio();
  const isLight = theme === "light";
  const experiences = portfolioData.experiences;
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0); // First expanded by default

  const toggleExpand = (index: number) => {
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else {
      setExpandedIndex(index);
    }
  };

  return (
    <section id="experience" className={`py-6 sm:py-8 md:py-9 lg:py-10 relative overflow-hidden ${isLight ? "bg-transparent" : "bg-[#030303]"}`}>
      {/* Decorative Orb */}
      <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[130px] pointer-events-none ${
        isLight ? "bg-purple-200/25" : "bg-purple-950/10"
      }`} />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-start mb-5 sm:mb-6 lg:mb-8 text-left"
        >
          <h2 className={`font-display font-bold text-3xl sm:text-5xl tracking-tight ${isLight ? "text-zinc-950" : "text-white"}`}>
            Work Experience & <br />
            <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
              Creative Milestones
            </span>
          </h2>
          <div className="w-12 h-[2px] bg-purple-500 mt-4" />
        </motion.div>

        {/* Timeline container */}
        <div className={`relative max-w-4xl mx-auto pl-4 sm:pl-8 border-l space-y-6 ${
          isLight ? "border-purple-200/80" : "border-zinc-800"
        }`}>
          {experiences.map((item, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative group"
              >
                {/* Floating Bullet Icon */}
                <div
                  onClick={() => toggleExpand(index)}
                  className={`absolute -left-[20px] sm:-left-[36px] -top-2 sm:top-1 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 z-20 cursor-pointer ${
                    isExpanded
                      ? isLight
                        ? "bg-gradient-to-tr from-purple-600 to-indigo-600 border-2 border-white text-white shadow-[0_4px_16px_rgba(147,51,234,0.45)] scale-110 ring-4 ring-purple-100"
                        : "bg-gradient-to-tr from-purple-600 to-indigo-600 border border-purple-400 text-white shadow-[0_0_18px_rgba(168,85,247,0.6)] scale-110"
                      : isLight
                      ? "bg-white/95 border-2 border-purple-200 text-purple-600 shadow-[0_4px_12px_rgba(100,100,160,0.12)] group-hover:border-purple-400 group-hover:text-purple-700 group-hover:scale-105"
                      : "bg-[#0e0e18] border border-purple-500/40 text-purple-300 shadow-[0_0_12px_rgba(147,51,234,0.25)] group-hover:border-purple-400 group-hover:text-white group-hover:bg-purple-950/40"
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                </div>

                {/* Main Card */}
                <div
                  onClick={() => toggleExpand(index)}
                  className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 border text-left ${
                    isLight
                      ? isExpanded
                        ? "bg-white/75 backdrop-blur-xl border-white/95 shadow-[0_12px_32px_rgba(100,100,160,0.08),inset_0_1.5px_1px_rgba(255,255,255,1)] ring-1 ring-purple-400/30"
                        : "bg-white/55 hover:bg-white/75 backdrop-blur-md border-white/85 shadow-[0_6px_20px_rgba(100,100,160,0.05),inset_0_1px_1px_rgba(255,255,255,0.95)] hover:border-purple-300"
                      : isExpanded
                      ? "bg-[#11121d]/90 backdrop-blur-xl border-purple-500/40 shadow-xl shadow-black/50 ring-1 ring-purple-500/20"
                      : "bg-[#090a12]/85 hover:bg-[#0f101b]/95 backdrop-blur-md border-white/10 hover:border-purple-500/30 shadow-md shadow-black/40"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      {/* Role & Company */}
                      <h3 className={`font-display font-semibold text-lg sm:text-xl ${isLight ? "text-zinc-900" : "text-white"}`}>
                        <FormattedText content={item.role} />{" "}
                        <span className="text-purple-600 font-medium">
                          @ <FormattedText content={item.company} />
                        </span>
                      </h3>

                      {/* Meta links */}
                      <div className={`flex flex-wrap items-center gap-4 text-xs mt-1.5 font-sans ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
                        <span className="flex items-center gap-1">
                          <Calendar className={`w-3.5 h-3.5 ${isLight ? "text-purple-600" : "text-purple-400"}`} />
                          {item.period}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                          {item.location}
                        </span>
                        {item.type && (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-mono border ${
                            isLight
                              ? "bg-purple-100 text-purple-700 border-purple-200"
                              : "bg-purple-500/10 text-purple-300 border-purple-500/10"
                          }`}>
                            {item.type}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Toggle Button */}
                    <div className={`self-end sm:self-center transition-colors ${
                      isLight ? "text-zinc-400 group-hover:text-zinc-700" : "text-zinc-500 group-hover:text-zinc-300"
                    }`}>
                      {isExpanded ? <ChevronUp className={`w-5 h-5 ${isLight ? "text-purple-600" : "text-purple-400"}`} /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>

                  {/* Description - Expanded with motion layout */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className={`pt-6 border-t mt-5 space-y-3 ${isLight ? "border-zinc-200/80" : "border-white/10"}`}>
                          {item.description.map((bullet, idx) => (
                            <div key={idx} className={`flex gap-2 items-start text-xs sm:text-sm font-sans leading-relaxed ${
                              isLight ? "text-zinc-600" : "text-zinc-300"
                            }`}>
                              <span className={`mt-1.5 shrink-0 ${isLight ? "text-purple-600" : "text-purple-400"}`}>■</span>
                              <FormattedText content={bullet} />
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
