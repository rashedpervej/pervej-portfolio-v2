import React, { useState, useEffect, useCallback } from "react";
import { usePortfolio } from "../context/PortfolioContext";
import { Quote, ChevronLeft, ChevronRight, Star } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "motion/react";
import FormattedText from "./FormattedText";

export default function Testimonials() {
  const { portfolioData, theme } = usePortfolio();
  const isLight = theme === "light";
  const testimonials = portfolioData.testimonials || [];

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  const handlePrev = () => {
    if (emblaApi) emblaApi.scrollPrev();
  };

  const handleNext = () => {
    if (emblaApi) emblaApi.scrollNext();
  };

  if (!testimonials.length) return null;

  return (
    <section
      id="testimonials"
      className={`py-16 sm:py-20 lg:py-24 relative overflow-hidden ${
        isLight
          ? "bg-transparent border-y border-zinc-200/80"
          : "bg-[#050508] border-y border-white/5"
      }`}
    >
      {/* Ambient glow */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[120px] pointer-events-none ${
          isLight ? "bg-purple-200/30" : "bg-purple-900/5"
        }`}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center"
      >
        {/* Title */}
        <div className="flex flex-col items-center mb-8 sm:mb-10">
          <h2
            className={`font-display font-bold text-3xl sm:text-5xl tracking-tight ${
              isLight ? "text-zinc-950" : "text-white"
            }`}
          >
            Client{" "}
            <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
              Testimonials
            </span>
          </h2>
          <div className="w-12 h-[2px] bg-purple-500 mt-4" />
        </div>

        {/* Carousel */}
        <div
          role="region"
          aria-label="Client testimonials carousel"
          aria-live="polite"
          aria-atomic="false"
        >
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex">
              {testimonials.map((item, idx) => {
                const quoteText = item.quote || item.content || item.message || "";
                const authorName = item.author || item.name || "Client";
                const authorRole = item.role || item.position || "";
                const authorCompany = item.company || "";
                const avatar = item.avatar;

                return (
                  <div
                    key={item.id || idx}
                    className="flex-[0_0_100%] min-w-0 px-2"
                    aria-hidden={idx !== selectedIndex}
                  >
                    <div
                      className={`rounded-2xl border p-7 sm:p-10 text-left ${
                        isLight
                          ? "bg-white/80 border-white/90 shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
                          : "bg-[#0e0f18]/90 border-white/8"
                      }`}
                    >
                      <Quote
                        className="w-8 h-8 text-purple-400 mb-4"
                        aria-hidden="true"
                      />

                      {/* Stars */}
                      <div className="flex items-center gap-0.5 mb-4" aria-label="5 out of 5 stars">
                        {Array.from({ length: 5 }).map((_, si) => (
                          <Star
                            key={si}
                            className="w-4 h-4 text-amber-400 fill-amber-400"
                            aria-hidden="true"
                          />
                        ))}
                      </div>

                      <blockquote
                        className={`text-base sm:text-lg leading-relaxed mb-6 font-medium italic ${
                          isLight ? "text-zinc-700" : "text-zinc-200"
                        }`}
                      >
                        &ldquo;<FormattedText content={quoteText} />&rdquo;
                      </blockquote>

                      <div className="flex items-center gap-3">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={`Portrait of ${authorName}`}
                            loading="lazy"
                            decoding="async"
                            className="w-11 h-11 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div
                            className="w-11 h-11 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0"
                            aria-hidden="true"
                          >
                            <span className="text-purple-400 font-bold text-sm">
                              {(authorName || "?")[0]}
                            </span>
                          </div>
                        )}
                        <div>
                          <p
                            className={`font-semibold text-sm ${
                              isLight ? "text-zinc-900" : "text-white"
                            }`}
                          >
                            {authorName}
                          </p>
                          {(authorRole || authorCompany) ? (
                            <p
                              className={`text-xs ${
                                isLight ? "text-zinc-500" : "text-zinc-400"
                              }`}
                            >
                              {authorRole}
                              {authorCompany ? ` · ${authorCompany}` : ""}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Controls */}
        {testimonials.length > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={handlePrev}
              aria-label="Previous testimonial"
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                isLight
                  ? "border-zinc-200 text-zinc-600 hover:border-purple-300 hover:text-purple-600"
                  : "border-white/10 text-zinc-400 hover:border-purple-500/40 hover:text-purple-300"
              }`}
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>

            {/* Dot indicators */}
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Testimonial slides">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === selectedIndex}
                  aria-label={`Go to testimonial ${i + 1}`}
                  onClick={() => emblaApi?.scrollTo(i)}
                  className={`rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                    i === selectedIndex
                      ? "w-6 h-2 bg-purple-500"
                      : isLight
                      ? "w-2 h-2 bg-zinc-300 hover:bg-purple-300"
                      : "w-2 h-2 bg-zinc-600 hover:bg-purple-500/50"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              aria-label="Next testimonial"
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                isLight
                  ? "border-zinc-200 text-zinc-600 hover:border-purple-300 hover:text-purple-600"
                  : "border-white/10 text-zinc-400 hover:border-purple-500/40 hover:text-purple-300"
              }`}
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </motion.div>
    </section>
  );
}
