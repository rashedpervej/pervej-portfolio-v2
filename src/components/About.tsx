import React from "react";
import { motion } from "motion/react";
import { GraduationCap, Award, Shield, FileCheck, CheckCircle2, ExternalLink } from "lucide-react";
import { usePortfolio } from "../context/PortfolioContext";
import FormattedText from "./FormattedText";

export default function About() {
  const { portfolioData, theme, isSectionVisible } = usePortfolio();
  const isLight = theme === "light";
  const info = portfolioData.personalInfo;
  const certs = portfolioData.educationCertifications || [];
  const isCertsVisible = isSectionVisible("educationCertifications");

  const highlights = [
    {
      icon: Award,
      title: "6+ Years Design Ops",
      desc: "Delivering strategic brand visualizers for national & international companies."
    },
    {
      icon: Shield,
      title: "Security Minded",
      desc: "Conducted annual InfoSec training to safeguard intellectual assets and brand guidelines."
    },
    {
      icon: FileCheck,
      title: "Print-Ready Precision",
      desc: "Delivering complete, flawless packaging artwork and complex physical labels."
    }
  ];

  return (
    <section id="about" className={`py-6 sm:py-8 md:py-9 lg:py-10 relative overflow-hidden ${isLight ? "bg-transparent" : "bg-[#050508]"}`}>
      {/* Decorative Orbs */}
      <div className={`absolute top-1/2 right-0 -translate-y-1/2 w-72 h-72 rounded-full blur-[100px] pointer-events-none ${
        isLight ? "bg-purple-200/30" : "bg-purple-900/5"
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
            Creative Strategy & <br />
            <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
              Visual Narrative
            </span>
          </h2>
          <div className="w-12 h-[2px] bg-purple-500 mt-4" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Side: Summary & Details */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`${isCertsVisible ? "lg:col-span-7" : "lg:col-span-12"} space-y-6`}
          >
            <h3 className={`font-display font-medium text-xl sm:text-2xl ${isLight ? "text-zinc-900" : "text-zinc-100"}`}>
              "Visuals aren't just seen; they are experienced."
            </h3>
            <p className={`text-sm sm:text-base leading-relaxed ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
              <FormattedText content={info.aboutSummary} />
            </p>
            <p className={`text-sm sm:text-base leading-relaxed ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
              <FormattedText content={info.aboutDetail} />
            </p>

            {/* Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
              {highlights.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.5, delay: 0.15 + index * 0.1 }}
                    className={`p-5 rounded-xl space-y-3 group transition-all duration-300 ${
                      isLight
                        ? "bg-white/65 hover:bg-white/85 border border-white/90 hover:border-purple-300 shadow-[0_4px_16px_rgba(100,100,160,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] backdrop-blur-md"
                        : "bg-[#0d0e17]/80 hover:bg-[#121320]/90 border border-white/10 hover:border-purple-500/30 backdrop-blur-md shadow-lg shadow-black/30"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isLight ? "bg-purple-100 border border-purple-200" : "bg-purple-500/10 border border-purple-500/10"
                    }`}>
                      <Icon className={`w-5 h-5 ${isLight ? "text-purple-600" : "text-purple-400"}`} />
                    </div>
                    <div>
                      <h4 className={`font-display font-semibold text-xs sm:text-sm uppercase tracking-wide ${
                        isLight ? "text-zinc-800" : "text-zinc-100"
                      }`}>
                        {item.title}
                      </h4>
                      <p className={`text-[11px] mt-1 leading-relaxed ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Right Side: Education & Certifications */}
          {isCertsVisible && (
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5 space-y-6"
            >
              <div className={`p-6 rounded-2xl space-y-6 ${
                isLight
                  ? "bg-white/65 backdrop-blur-xl border border-white/90 shadow-[0_12px_32px_rgba(100,100,160,0.07),inset_0_1.5px_1px_rgba(255,255,255,1)]"
                  : "glass-panel border border-white/10"
              }`}>
                <h4 className={`font-display font-medium text-base tracking-wide uppercase flex items-center gap-2 ${
                  isLight ? "text-zinc-900" : "text-white"
                }`}>
                  <GraduationCap className={`w-5 h-5 ${isLight ? "text-purple-600" : "text-purple-400"}`} />
                  Education & Certs
                </h4>
                <div className={`w-full h-[1px] ${isLight ? "bg-zinc-200/80" : "bg-white/10"}`} />

                <div className="space-y-6">
                  {certs.length === 0 ? (
                    <p className={`text-xs ${isLight ? "text-zinc-500" : "text-zinc-400"} italic`}>
                      No certifications listed yet.
                    </p>
                  ) : (
                    certs.map((item, index) => (
                      <div key={index} className="flex gap-4 items-start relative group">
                        {/* Circle Bullet */}
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500 mt-1.5 shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.5)] group-hover:scale-125 transition-transform" />
                        
                        <div>
                          <h5 className={`font-display font-medium text-xs sm:text-sm leading-tight ${
                            isLight ? "text-zinc-900" : "text-zinc-200"
                          }`}>
                            {item.title}
                          </h5>
                          <p className={`font-sans text-xs mt-1 ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
                            {item.institution}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-[10px] text-zinc-400">
                              {item.period}
                            </span>
                            {(item as any).credentialUrl && (
                              <a
                                href={(item as any).credentialUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-[10px] text-purple-400 hover:text-purple-300 underline inline-flex items-center gap-0.5"
                              >
                                Verify <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Languages Highlight */}
                <div className={`pt-4 border-t ${isLight ? "border-zinc-200/80" : "border-white/5"}`}>
                  <h5 className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-2">
                    LANGUAGES & PROFICIENCY
                  </h5>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className={`w-4 h-4 ${isLight ? "text-purple-600" : "text-purple-400"}`} />
                    <span className={`font-sans text-xs ${isLight ? "text-zinc-700" : "text-zinc-300"}`}>
                      English — Professional proficiency for global teams
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
