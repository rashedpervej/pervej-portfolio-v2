import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowDown, Award, Zap, Paintbrush, Play } from "lucide-react";
import { usePortfolio } from "../context/PortfolioContext";
import { scrollToSection, navigateToSection } from "../utils/scroll";
import FormattedText from "./FormattedText";
import defaultHeaderImage from "../assets/images/Rashed Header Image.webp";

// Simple custom hook to handle counter animations
function AnimatedCounter({ value, duration = 2 }: { value: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const target = parseInt(value.replace(/\D/g, ""), 10);
  const isPlus = value.includes("+");

  useEffect(() => {
    let start = 0;
    const end = target;
    if (end === 0) return;
    
    const stepTime = Math.abs(Math.floor((duration * 1000) / end));
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) {
        clearInterval(timer);
      }
    }, Math.max(stepTime, 20));

    return () => clearInterval(timer);
  }, [target, duration]);

  return (
    <span>
      {count}
      {isPlus ? "+" : ""}
    </span>
  );
}

export default function Hero() {
  const { portfolioData, theme } = usePortfolio();
  const isLight = theme === "light";
  const info = portfolioData.personalInfo || {};

  const primaryImage = info.portraitImage || info.heroImage || info.avatar || defaultHeaderImage;
  const [imgSrc, setImgSrc] = useState(primaryImage);

  useEffect(() => {
    setImgSrc(primaryImage);
  }, [primaryImage]);

  // Name splitting for second word coloring
  const fullDisplayName = info.name || "Rashed Pervej";
  const nameParts = fullDisplayName.trim().split(" ");
  const firstName = nameParts[0] || "Rashed";
  const lastName = nameParts.slice(1).join(" ") || "Pervej";

  const primaryCtaText = info.primaryCtaText || "Explore My Work";
  const primaryCtaLink = info.primaryCtaLink || "projects";
  const secondaryCtaText = info.secondaryCtaText || "Get In Touch";
  const secondaryCtaLink = info.secondaryCtaLink || "contact";

  const experienceYears = info.experienceYears || "6+";
  const yearsLabel = info.yearsLabel || "Years Experience";

  const selectedBrandsCount = info.selectedBrandsCount || "11+";
  const brandsLabel = info.brandsLabel || "Selected Brands";

  const creativeAssetsCount = info.creativeAssetsCount || "200+";
  const assetsLabel = info.assetsLabel || "Creative Assets";

  const availabilityTag = info.availability || "Available for Remote & Hybrid";
  const roleText = info.role || "Senior Visualizer";
  const bioText = info.heroBio || "Senior Visualizer with 6+ years of premium experience. Specialize in high-impact brand identities, modern motion graphics, and tactical food supplement packaging.";

  const handleCtaClick = (e: React.MouseEvent<HTMLAnchorElement>, link: string) => {
    e.preventDefault();
    const sectionId = link.replace(/^#/, "").replace(/^\//, "") || "hero";
    navigateToSection(sectionId);
  };

  return (
    <section
      id="hero"
      className={`relative min-h-[100svh] flex items-center justify-center pt-20 sm:pt-24 lg:pt-28 pb-16 sm:pb-20 lg:pb-24 overflow-hidden ${
        isLight ? "bg-transparent" : "bg-[#030303]"
      }`}
    >
      {/* Decorative Blur Orbs */}
      <div className={`absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[120px] animate-pulse-slow pointer-events-none ${
        isLight ? "bg-purple-300/30" : "bg-purple-900/10"
      }`} />
      <div className={`absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full blur-[150px] animate-pulse-slow-reverse pointer-events-none ${
        isLight ? "bg-indigo-300/25" : "bg-indigo-950/15"
      }`} />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 w-full relative z-10 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center">
        {/* Left Column: Core Text */}
        <div className="flex flex-col gap-5 lg:gap-5 items-start text-left">
          {/* Tagline / Availability Indicator */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full text-[10.5px] sm:text-[11px] font-mono tracking-wider uppercase transition-all duration-300 ${
              isLight
                ? "bg-white/70 border border-white/90 text-purple-700 shadow-[0_4px_14px_rgba(147,51,234,0.08),inset_0_1px_1px_rgba(255,255,255,0.95)] backdrop-blur-md"
                : "bg-purple-500/10 border border-purple-500/20 text-purple-400"
            }`}
          >
            <Zap className={`w-3.5 h-3.5 animate-pulse ${isLight ? "text-purple-600" : "text-purple-400"}`} />
            <FormattedText content={availabilityTag} />
          </motion.div>

          {/* Role / Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`font-mono text-[11px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] ${
              isLight ? "text-zinc-500 font-medium" : "text-zinc-500"
            }`}
          >
            <FormattedText content={roleText} />
          </motion.p>

          {/* Headline Name */}
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ fontSize: "clamp(2.75rem, 6vw, 5rem)" }}
            className={`font-display font-black leading-none tracking-tight ${
              isLight ? "text-zinc-950" : "text-white"
            }`}
          >
            <FormattedText content={fullDisplayName} />
          </motion.h1>

          {/* Bio Description */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className={`text-base sm:text-[17px] lg:text-lg leading-[1.65] max-w-xl font-sans ${
              isLight ? "text-zinc-600" : "text-zinc-400"
            }`}
          >
            <FormattedText content={bioText} />
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center gap-3 w-full sm:w-auto"
          >
            <a
              href="/"
              onClick={(e) => handleCtaClick(e, primaryCtaLink)}
              className="btn-keep-white group relative px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] sm:text-xs uppercase tracking-widest font-semibold transition-all duration-300 shadow-lg shadow-purple-600/25 active:scale-95 flex items-center justify-center gap-2 border border-purple-400/30 overflow-hidden cursor-pointer"
            >
              <span className="absolute inset-0 pointer-events-none -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12" />
              <Paintbrush className="w-4 h-4 text-purple-200" />
              <FormattedText content={primaryCtaText} />
            </a>
            <a
              href="/"
              onClick={(e) => handleCtaClick(e, secondaryCtaLink)}
              className={`px-5 py-2.5 rounded-xl text-[11px] sm:text-xs uppercase tracking-widest font-semibold transition-all duration-300 active:scale-95 cursor-pointer text-center ${
                isLight
                  ? "bg-white/65 hover:bg-white/95 text-zinc-900 border border-white/90 hover:border-purple-400/40 shadow-[0_4px_16px_rgba(100,100,160,0.08),inset_0_1px_1px_rgba(255,255,255,0.95)] hover:shadow-[0_8px_24px_rgba(168,85,247,0.14)] backdrop-blur-md"
                  : "bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20"
              }`}
            >
              <FormattedText content={secondaryCtaText} />
            </a>
          </motion.div>

          {/* Stats Metadata Group */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="grid grid-cols-3 gap-3 sm:flex sm:flex-wrap sm:items-start sm:gap-x-8 sm:gap-y-4 pt-1 w-full sm:w-auto"
          >
            <div className="flex flex-col">
              <p className={`font-display font-medium text-2xl sm:text-3xl ${isLight ? "text-zinc-900" : "text-white"}`}>
                <AnimatedCounter value={experienceYears} />
              </p>
              <p className={`font-mono text-[9.5px] sm:text-[11px] uppercase tracking-wider mt-0.5 leading-tight ${isLight ? "text-zinc-500" : "text-zinc-500"}`}>
                {yearsLabel}
              </p>
            </div>
            <div className="flex flex-col">
              <p className={`font-display font-medium text-2xl sm:text-3xl ${isLight ? "text-zinc-900" : "text-white"}`}>
                <AnimatedCounter value={selectedBrandsCount} />
              </p>
              <p className={`font-mono text-[9.5px] sm:text-[11px] uppercase tracking-wider mt-0.5 leading-tight ${isLight ? "text-zinc-500" : "text-zinc-500"}`}>
                {brandsLabel}
              </p>
            </div>
            <div className="flex flex-col">
              <p className={`font-display font-medium text-2xl sm:text-3xl ${isLight ? "text-zinc-900" : "text-white"}`}>
                <AnimatedCounter value={creativeAssetsCount} />
              </p>
              <p className={`font-mono text-[9.5px] sm:text-[11px] uppercase tracking-wider mt-0.5 leading-tight ${isLight ? "text-zinc-500" : "text-zinc-500"}`}>
                {assetsLabel}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Hero Portrait Image */}
        <div className="flex justify-center lg:justify-end w-full mt-2 lg:mt-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className={`relative w-full max-w-[340px] xs:max-w-[370px] sm:max-w-[420px] aspect-[3.8/4.8] lg:w-[400px] lg:h-[500px] lg:aspect-auto rounded-[2rem] sm:rounded-[2.25rem] overflow-hidden shadow-2xl group flex flex-col justify-end transition-all duration-500 ${
              isLight
                ? "border border-white/90 bg-white/40 shadow-[0_20px_50px_rgba(100,100,160,0.12),inset_0_1.5px_1px_rgba(255,255,255,1)] backdrop-blur-xl"
                : "border border-white/10 bg-zinc-950"
            }`}
          >
            {/* Ambient Radial Glow Behind Frame */}
            <div className={`absolute -inset-1 bg-gradient-to-tr from-purple-600/30 via-indigo-600/20 to-transparent blur-2xl transition-opacity duration-700 pointer-events-none ${
              isLight ? "opacity-30 group-hover:opacity-60" : "opacity-50 group-hover:opacity-80"
            }`} />

            {/* Portrait Image */}
            <img
              src={imgSrc}
              onError={() => setImgSrc(defaultHeaderImage)}
              alt={info.name || "Rashed Pervej - Senior Visualizer"}
              width="400"
              height="500"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover object-top filter brightness-95 contrast-105 group-hover:scale-105 transition-transform duration-700"
            />

            {/* Subtle Gradient Vignette at Bottom for Edge Blend */}
            <div className={`absolute inset-0 bg-gradient-to-t via-transparent to-transparent pointer-events-none ${
              isLight ? "from-white/30 opacity-30" : "from-zinc-950/50 opacity-50"
            }`} />
          </motion.div>
        </div>
      </div>

      {/* Decorative Absolute Elements - Scroll Indicator */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none select-none z-20">
        <a
          href="#about"
          onClick={(e) => {
            e.preventDefault();
            const target = document.getElementById("about");
            if (target) target.scrollIntoView({ behavior: "smooth" });
          }}
          className="pointer-events-auto flex flex-col items-center gap-2 group cursor-pointer"
          aria-label="Scroll to About section"
        >
          <span
            className={`font-mono text-[10px] uppercase tracking-[0.2em] leading-none transition-colors ${
              isLight ? "text-zinc-500 group-hover:text-purple-600" : "text-zinc-400 group-hover:text-purple-300"
            }`}
          >
            scroll
          </span>
          <ArrowDown
            className={`w-4 h-4 animate-bounce shrink-0 transition-colors ${
              isLight ? "text-zinc-500 group-hover:text-purple-600" : "text-zinc-400 group-hover:text-purple-300"
            }`}
          />
        </a>
      </div>
    </section>
  );
}
