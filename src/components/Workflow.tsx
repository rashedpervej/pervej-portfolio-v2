import React from "react";
import { motion } from "motion/react";
import { Compass, Palette, PackageCheck, ArrowRight, Sparkles } from "lucide-react";
import { usePortfolio } from "../context/PortfolioContext";

interface StepItem {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
  deliverable: string;
  accentGlow: string;
  accentBorder: string;
  accentBadge: string;
}

const steps: StepItem[] = [
  {
    number: "01",
    title: "Discovery & Brand Core",
    subtitle: "Uncovering the Soul & Strategy",
    description: "Research, brand purpose, audience, positioning, and core messaging.",
    icon: Compass,
    tags: ["Market Research", "Brand Purpose", "Audience Persona", "Strategic Positioning", "Core Messaging"],
    deliverable: "Strategic Brand Foundation",
    accentGlow: "from-purple-500/15 via-indigo-500/10 to-transparent",
    accentBorder: "group-hover:border-purple-400/40",
    accentBadge: "text-purple-300 border-purple-400/30 bg-purple-500/10",
  },
  {
    number: "02",
    title: "Visual Conceptualization",
    subtitle: "Crafting the Narrative Arc",
    description: "Color psychology, typography, art direction, composition, and visual storytelling.",
    icon: Palette,
    tags: ["Color Psychology", "Typography System", "Art Direction", "Composition", "Visual Storytelling"],
    deliverable: "Visual Identity & Design System",
    accentGlow: "from-indigo-500/15 via-blue-500/10 to-transparent",
    accentBorder: "group-hover:border-indigo-400/40",
    accentBadge: "text-indigo-300 border-indigo-400/30 bg-indigo-500/10",
  },
  {
    number: "03",
    title: "High-Fidelity Execution",
    subtitle: "Pixel-Perfect Production",
    description: "Packaging, dielines, vector systems, campaign assets, and production-ready deliverables.",
    icon: PackageCheck,
    tags: ["Packaging & Dielines", "Vector Systems", "Campaign Assets", "Production Master Files", "Quality Assurance"],
    deliverable: "Production-Ready Master Suite",
    accentGlow: "from-blue-500/15 via-purple-500/10 to-transparent",
    accentBorder: "group-hover:border-blue-400/40",
    accentBadge: "text-blue-300 border-blue-400/30 bg-blue-500/10",
  },
];

export default function Workflow() {
  const { theme } = usePortfolio();
  const isLight = theme === "light";

  return (
    <section
      id="workflow"
      className={`py-10 sm:py-12 md:py-14 lg:py-16 relative overflow-hidden transition-colors duration-300 ${
        isLight
          ? "bg-transparent border-t border-zinc-200/80"
          : "bg-[#04060e] border-t border-white/[0.06]"
      }`}
      style={{ scrollMarginTop: "80px" }}
    >
      {/* Ambient Lighting Orbs - Futuristic Indigo/Purple/Navy Radiance */}
      <div
        aria-hidden="true"
        className={`absolute top-0 left-1/4 -translate-x-1/2 w-[520px] h-[520px] rounded-full blur-[140px] pointer-events-none transition-opacity duration-700 ${
          isLight ? "bg-purple-200/30 opacity-60" : "bg-purple-900/15 opacity-80"
        }`}
      />
      <div
        aria-hidden="true"
        className={`absolute bottom-0 right-1/4 translate-x-1/2 w-[560px] h-[560px] rounded-full blur-[150px] pointer-events-none transition-opacity duration-700 ${
          isLight ? "bg-indigo-200/25 opacity-50" : "bg-indigo-900/15 opacity-70"
        }`}
      />
      <div
        aria-hidden="true"
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full blur-[160px] pointer-events-none ${
          isLight ? "bg-blue-100/30 opacity-40" : "bg-blue-950/10 opacity-60"
        }`}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-12 lg:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-start text-left max-w-2xl"
          >
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold uppercase tracking-[0.25em] ${
                  isLight
                    ? "bg-purple-100/90 text-purple-700 border border-purple-200 shadow-sm"
                    : "bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                }`}
              >
                <Sparkles className="w-3 h-3 text-purple-400" />
                WORKFLOW &amp; PIPELINE
              </span>
            </div>

            {/* Title */}
            <h2
              className={`font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-[1.12] ${
                isLight ? "text-zinc-950" : "text-white"
              }`}
            >
              Creative Strategy &amp;{" "}
              <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent">
                Visual Narrative
              </span>
            </h2>

            {/* Editorial Lead Description */}
            <p
              className={`mt-4 text-sm sm:text-base leading-relaxed ${
                isLight ? "text-zinc-600" : "text-zinc-400"
              }`}
            >
              A disciplined, three-stage creative pipeline engineered to transform strategic discovery
              into timeless brand identities, tactile packaging, and high-impact visual systems.
            </p>
          </motion.div>

          {/* Process Flow Indicator Pill */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className={`hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full border backdrop-blur-md self-start md:self-end ${
              isLight
                ? "bg-white/80 border-zinc-200 text-zinc-600 text-xs shadow-sm"
                : "bg-white/[0.04] border-white/10 text-zinc-400 text-xs"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono uppercase tracking-widest text-[10px]">
              End-to-End Delivery Architecture
            </span>
          </motion.div>
        </div>

        {/* Desktop Process Connecting Beam Line (01 → 02 → 03) */}
        <div className="hidden lg:block relative mb-4">
          <div
            aria-hidden="true"
            className={`absolute top-1/2 left-[16.66%] right-[16.66%] -translate-y-1/2 h-[1px] ${
              isLight
                ? "bg-gradient-to-r from-purple-300 via-indigo-300 to-blue-300"
                : "bg-gradient-to-r from-purple-500/25 via-indigo-400/40 to-blue-500/25"
            }`}
          />
          {/* Central subtle directional chevron connectors */}
          <div className="grid grid-cols-3 gap-6 relative">
            <div className="flex justify-end pr-4">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase border backdrop-blur-md ${
                  isLight
                    ? "bg-white text-purple-700 border-purple-200 shadow-xs"
                    : "bg-[#090c19] text-purple-300 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                }`}
              >
                PHASE 01 → 02
              </span>
            </div>
            <div className="flex justify-end pr-4">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase border backdrop-blur-md ${
                  isLight
                    ? "bg-white text-indigo-700 border-indigo-200 shadow-xs"
                    : "bg-[#090c19] text-indigo-300 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                }`}
              >
                PHASE 02 → 03
              </span>
            </div>
            <div className="flex justify-end pr-2">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase border backdrop-blur-md ${
                  isLight
                    ? "bg-white text-blue-700 border-blue-200 shadow-xs"
                    : "bg-[#090c19] text-blue-300 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                }`}
              >
                COMPLETION
              </span>
            </div>
          </div>
        </div>

        {/* 3 Elegant Glassmorphism Cards (Horizontal Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-7 items-stretch">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <motion.div
                key={step.number}
                id={`workflow-step-${step.number}`}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.55, delay: index * 0.12 }}
                className={`relative rounded-2xl md:rounded-[22px] p-6 sm:p-7 md:p-8 flex flex-col justify-between transition-all duration-500 group overflow-hidden ${
                  isLight
                    ? "bg-white/80 hover:bg-white/95 border border-zinc-200/90 hover:border-purple-300 shadow-[0_12px_32px_rgba(90,105,150,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] hover:shadow-[0_20px_45px_rgba(147,51,234,0.12)]"
                    : "bg-[#0b0e1d]/75 hover:bg-[#0f1327]/90 border border-white/[0.08] hover:border-purple-400/30 shadow-[0_16px_40px_rgba(0,0,0,0.55)] hover:shadow-[0_22px_50px_rgba(99,102,241,0.15)] backdrop-blur-xl"
                } ${step.accentBorder}`}
              >
                {/* Luminous Specular Top Rim Line */}
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:via-purple-400/50 transition-all duration-500"
                />

                {/* Ambient Soft Card Depth Gradient */}
                <div
                  aria-hidden="true"
                  className={`absolute inset-0 bg-gradient-to-b ${step.accentGlow} opacity-30 group-hover:opacity-75 transition-opacity duration-500 pointer-events-none`}
                />

                <div className="relative z-10">
                  {/* Card Header: Step Pill & Modern Minimal Icon */}
                  <div className="flex items-center justify-between gap-4 mb-5">
                    {/* Step Number Tag */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center justify-center font-mono font-bold text-xs sm:text-sm px-3 py-1 rounded-full border backdrop-blur-sm transition-all duration-300 ${
                          isLight
                            ? "bg-zinc-100 text-zinc-900 border-zinc-300 group-hover:border-purple-300 group-hover:bg-purple-50 group-hover:text-purple-700"
                            : `${step.accentBadge} group-hover:border-white/30 group-hover:shadow-[0_0_12px_rgba(168,85,247,0.25)]`
                        }`}
                      >
                        {step.number}
                      </span>
                      <span
                        className={`font-mono text-[10px] uppercase tracking-widest ${
                          isLight ? "text-zinc-500" : "text-zinc-500"
                        }`}
                      >
                        STAGE
                      </span>
                    </div>

                    {/* Minimal Modern Icon in Frosted Pill */}
                    <div
                      className={`p-2.5 rounded-xl border transition-all duration-300 ${
                        isLight
                          ? "bg-zinc-100/90 border-zinc-200 text-zinc-800 group-hover:text-purple-600 group-hover:border-purple-300"
                          : "bg-white/[0.04] border-white/[0.09] text-zinc-300 group-hover:text-white group-hover:border-purple-400/30 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                      }`}
                    >
                      <IconComponent className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                  </div>

                  {/* Step Title */}
                  <h3
                    className={`font-display font-bold text-xl sm:text-2xl tracking-tight leading-snug transition-colors duration-300 ${
                      isLight
                        ? "text-zinc-950 group-hover:text-purple-900"
                        : "text-white group-hover:text-purple-200"
                    }`}
                  >
                    {step.title}
                  </h3>

                  {/* Editorial Subtitle */}
                  <p
                    className={`font-serif italic text-sm sm:text-base mt-1.5 mb-3 transition-colors duration-300 ${
                      isLight ? "text-purple-700 font-medium" : "text-purple-300/85"
                    }`}
                  >
                    {step.subtitle}
                  </p>

                  {/* Description */}
                  <p
                    className={`text-xs sm:text-sm leading-relaxed mb-6 font-sans ${
                      isLight ? "text-zinc-600" : "text-zinc-400"
                    }`}
                  >
                    {step.description}
                  </p>

                  {/* Deliverables / Scope Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-4 border-t border-white/[0.06] mb-6">
                    {step.tags.map((tag, tagIdx) => (
                      <span
                        key={tagIdx}
                        className={`text-[10px] sm:text-[11px] font-mono tracking-wide px-2.5 py-1 rounded-md transition-colors duration-200 whitespace-nowrap ${
                          isLight
                            ? "bg-zinc-100 text-zinc-700 border border-zinc-200/80 group-hover:border-purple-200"
                            : "bg-white/[0.03] text-zinc-300 border border-white/[0.06] group-hover:border-white/10 group-hover:bg-white/[0.05]"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer: Phase Deliverable Bar */}
                <div
                  className={`pt-3.5 border-t flex items-center justify-between text-xs transition-colors duration-300 relative z-10 ${
                    isLight
                      ? "border-zinc-200/80 text-zinc-600"
                      : "border-white/[0.06] text-zinc-400"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span className="font-mono text-[10px] uppercase tracking-wider">
                      {step.deliverable}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center text-xs font-mono font-medium gap-1 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 ${
                      isLight ? "text-purple-700" : "text-purple-300"
                    }`}
                  >
                    Phase {step.number}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Process Credential Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, delay: 0.4 }}
          className={`mt-8 sm:mt-10 p-4 sm:p-5 rounded-xl border backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left ${
            isLight
              ? "bg-white/70 border-zinc-200 text-zinc-700 shadow-xs"
              : "bg-white/[0.02] border-white/[0.06] text-zinc-400"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isLight ? "bg-purple-100 text-purple-700" : "bg-purple-500/10 text-purple-400"
              }`}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-xs sm:text-sm font-sans">
              <strong className={isLight ? "text-zinc-900" : "text-white"}>
                Senior Art Direction Standard:
              </strong>{" "}
              Every milestone is grounded in rigorous market validation and verified against technical print &amp; digital specs before handoff.
            </p>
          </div>

          <a
            href="#contact"
            id="workflow-discuss-cta"
            className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg font-sans text-xs font-medium transition-all duration-300 ${
              isLight
                ? "bg-zinc-900 text-white hover:bg-purple-700 shadow-sm"
                : "bg-purple-600/90 text-white hover:bg-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
            }`}
          >
            <span>Initiate Collaboration</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
