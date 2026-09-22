import React, { useState, useEffect } from "react";
import { usePortfolio } from "../context/PortfolioContext";
import { Palette, Box, Film, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";
import FormattedText from "./FormattedText";
import { Service } from "../data";
import brandHeaderImage from "../assets/images/brand-header.webp";
import packagingHeaderImage from "../assets/images/packeging-header.webp";
import motionHeaderImage from "../assets/images/motion-header.webp";
import mentorHeaderImage from "../assets/images/mentor-header.webp";

const getFallbackImage = (title: string, index: number) => {
  const normalized = (title || "").toLowerCase();
  if (normalized.includes("brand")) return brandHeaderImage;
  if (normalized.includes("packag") || normalized.includes("packeg")) return packagingHeaderImage;
  if (normalized.includes("motion") || normalized.includes("video")) return motionHeaderImage;
  if (normalized.includes("direction") || normalized.includes("ops") || normalized.includes("mentor") || normalized.includes("creative")) return mentorHeaderImage;

  switch (index) {
    case 0:
      return brandHeaderImage;
    case 1:
      return packagingHeaderImage;
    case 2:
      return motionHeaderImage;
    default:
      return mentorHeaderImage;
  }
};

function ServiceCard({ service, index }: { service: Service; index: number; key?: React.Key }) {
  const { theme } = usePortfolio();
  const isLight = theme === "light";
  const fallback = getFallbackImage(service.title || "", index);
  const primaryImage = service.image || fallback;
  const [imgSrc, setImgSrc] = useState(primaryImage);

  useEffect(() => {
    setImgSrc(service.image || fallback);
  }, [service.image, fallback]);

  const getServiceIcon = (idx: number) => {
    switch (idx) {
      case 0:
        return <Palette className="w-6 h-6 text-purple-600" />;
      case 1:
        return <Box className="w-6 h-6 text-indigo-600" />;
      case 2:
        return <Film className="w-6 h-6 text-pink-600" />;
      default:
        return <ShieldAlert className="w-6 h-6 text-emerald-600" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`rounded-2xl transition-all duration-500 group flex flex-col justify-between text-left overflow-hidden h-full ${
        isLight
          ? "bg-white/65 hover:bg-white/85 border border-white/90 hover:border-purple-300 shadow-[0_10px_30px_rgba(100,100,160,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] backdrop-blur-xl hover:shadow-[0_16px_40px_rgba(147,51,234,0.1)]"
          : "bg-[#0e0f18]/85 hover:bg-[#131422]/95 border border-white/10 hover:border-purple-500/40 backdrop-blur-xl shadow-xl shadow-black/40"
      }`}
    >
      <div>
        {/* Premium Image Banner at the top of the card */}
        <div className={`relative w-full h-[155px] overflow-hidden bg-zinc-900 border-b ${
          isLight ? "border-zinc-200/80" : "border-white/10"
        }`}>
          <img
            src={imgSrc}
            onError={() => setImgSrc(fallback)}
            alt={service.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Overlaid Icon (bottom-left of the image banner) */}
          <div className={`absolute bottom-3 left-4 w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg transition-all duration-300 backdrop-blur-md ${
            isLight
              ? "bg-white/90 border-white/90 group-hover:border-purple-300 shadow-[0_4px_12px_rgba(100,100,160,0.1)]"
              : "bg-black/80 border-white/15 group-hover:bg-purple-600/10 group-hover:border-purple-500/30"
          }`}>
            {getServiceIcon(index)}
          </div>
        </div>

        {/* Content Area with custom padding */}
        <div className="p-6 sm:p-8">
          <h3 className={`font-display font-semibold text-xl transition-colors mb-3 ${
            isLight ? "text-zinc-900 group-hover:text-purple-600" : "text-white group-hover:text-purple-300"
          }`}>
            <FormattedText content={service.title} />
          </h3>
          <div className={`text-xs sm:text-sm leading-relaxed mb-1 ${
            isLight ? "text-zinc-600" : "text-zinc-300"
          }`}>
            <FormattedText content={service.description} />
          </div>
        </div>
      </div>

      {/* Skills/Bullets list, positioned at the bottom of the card */}
      <div className="px-6 sm:px-8 pb-6 sm:pb-8">
        <div className={`w-full h-[1px] mb-4 ${isLight ? "bg-zinc-200/80" : "bg-white/10"}`} />
        <div className="flex flex-wrap gap-2">
          {service.skills.map((skill, sIdx) => (
            <span
              key={sIdx}
              className={`px-2.5 py-1 rounded-md text-[10px] font-mono transition-colors ${
                isLight
                  ? "bg-white/80 border border-purple-200/60 text-zinc-700 shadow-sm group-hover:bg-purple-100/70 group-hover:text-purple-700 group-hover:border-purple-300"
                  : "bg-white/[0.05] border border-white/10 text-zinc-200 group-hover:bg-purple-500/10 group-hover:text-purple-300 group-hover:border-purple-500/20"
              }`}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function Services() {
  const { portfolioData, theme } = usePortfolio();
  const isLight = theme === "light";
  const services = portfolioData.services;

  return (
    <section id="services" className={`py-24 relative overflow-hidden ${isLight ? "bg-transparent" : "bg-[#030303]"}`}>
      {/* Decorative Orb */}
      <div className={`absolute top-1/2 left-0 -translate-y-1/2 w-80 h-80 rounded-full blur-[120px] pointer-events-none ${
        isLight ? "bg-purple-200/25" : "bg-purple-900/5"
      }`} />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-start mb-16 text-left"
        >
          <h2 className={`font-display font-bold text-3xl sm:text-5xl tracking-tight ${isLight ? "text-zinc-950" : "text-white"}`}>
            Professional Services & <br />
            <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
              Creative Disciplines
            </span>
          </h2>
          <div className="w-12 h-[2px] bg-purple-500 mt-4" />
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <ServiceCard key={index} service={service} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
