import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Download } from "lucide-react";
import { usePortfolio } from "../context/PortfolioContext";
import { 
  navigateToSection, 
  isProgrammaticScrollActive 
} from "../utils/scroll";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import defaultResumePdf from "../assets/CV/Rashed Pervej _ Resume _ Jul 26.pdf";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<string>(() => {
    try {
      return sessionStorage.getItem("portfolio_active_section") || "hero";
    } catch {
      return "hero";
    }
  });
  const { portfolioData, siteSettings, trackEvent, isSectionVisible, theme } = usePortfolio();
  const isLight = theme === "light";

  const allNavItems = [
    { label: "Home", href: "/", id: "hero" },
    { label: "About", href: "/", id: "about" },
    { label: "Experience", href: "/", id: "experience" },
    { label: "Skills", href: "/", id: "skills" },
    { label: "Services", href: "/", id: "services" },
    { label: "Projects", href: "/", id: "projects" },
    { label: "Contact", href: "/", id: "contact" }
  ];

  const navItems = allNavItems.filter((item) => isSectionVisible(item.id));

  // Sync active section when History API or programmatic changes occur
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const targetSection = e.state?.section || "hero";
      setActiveSection(targetSection);
    };

    const handleSectionChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ section: string }>;
      if (customEvent.detail?.section) {
        setActiveSection(customEvent.detail.section);
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("portfolio:sectionchange", handleSectionChange);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("portfolio:sectionchange", handleSectionChange);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // 1. Header glass background toggle
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // 2. Scroll progress indicator bar
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(progress);
      }

      // 3. Do not overwrite active section while programmatic scroll animation is actively running
      if (isProgrammaticScrollActive()) {
        return;
      }

      // 4. Physical DOM positions calculation for active indicator
      if (window.scrollY < 80) {
        setActiveSection((prev) => {
          if (prev !== "hero") {
            try { sessionStorage.setItem("portfolio_active_section", "hero"); } catch {}
            if (window.location.pathname === "/") {
              window.history.replaceState({ section: "hero" }, "", "/");
            }
            return "hero";
          }
          return prev;
        });
        return;
      }

      // Near bottom of page -> Contact
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50) {
        const lastItem = navItems[navItems.length - 1];
        if (lastItem) {
          setActiveSection((prev) => {
            if (prev !== lastItem.id) {
              try { sessionStorage.setItem("portfolio_active_section", lastItem.id); } catch {}
              if (window.location.pathname === "/") {
                window.history.replaceState({ section: lastItem.id }, "", "/");
              }
              return lastItem.id;
            }
            return prev;
          });
        }
        return;
      }

      // Mid-page scrolling: find which section header/content is under focus line
      const scrollPos = window.scrollY + 140;
      const sectionsInDoc = navItems
        .map((item) => {
          const el = document.getElementById(item.id);
          return {
            id: item.id,
            top: el ? el.getBoundingClientRect().top + window.scrollY : 0,
            hasEl: el !== null,
          };
        })
        .filter((item) => item.hasEl)
        .sort((a, b) => a.top - b.top);

      let foundActive = sectionsInDoc[0]?.id || "hero";
      for (let i = sectionsInDoc.length - 1; i >= 0; i--) {
        if (scrollPos >= sectionsInDoc[i].top) {
          foundActive = sectionsInDoc[i].id;
          break;
        }
      }

      setActiveSection((prev) => {
        if (prev !== foundActive) {
          try { sessionStorage.setItem("portfolio_active_section", foundActive); } catch {}
          if (window.location.pathname === "/") {
            window.history.replaceState({ section: foundActive }, "", "/");
          }
          return foundActive;
        }
        return prev;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [navItems]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string, isMobile = false) => {
    e.preventDefault();
    setActiveSection(sectionId);
    navigateToSection(sectionId, { delay: isMobile ? 220 : 0 });
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const downloadCV = async () => {
    const cvSource = siteSettings.cvSource || "upload";
    const url = siteSettings.cvUrl || defaultResumePdf;
    
    // Original filename configured by user or fallback
    let fileName = siteSettings.cvFileName?.trim() || "Rashed Pervej _ Resume _ Jul 26.pdf";
    if (!fileName.toLowerCase().endsWith(".pdf")) {
      fileName += ".pdf";
    }

    // Track download analytics
    trackEvent("cv_download", {
      type: cvSource,
      fileName,
      timestamp: new Date().toISOString(),
    });

    setIsDownloading(true);

    try {
      let blob: Blob | null = null;

      // 1. If stored in Supabase 'cv' bucket, download via Supabase Client API to avoid CORS and raw URL exposure
      if (siteSettings.cvUrl && isSupabaseConfigured && supabase && (url.includes("/storage/v1/object/") || url.includes("/cv/"))) {
        try {
          let storagePath = "";
          if (url.includes("/storage/v1/object/public/cv/")) {
            storagePath = url.split("/storage/v1/object/public/cv/")[1];
          } else if (url.includes("/storage/v1/object/sign/cv/")) {
            storagePath = url.split("/storage/v1/object/sign/cv/")[1]?.split("?")[0];
          } else if (url.includes("/cv/")) {
            storagePath = url.split("/cv/")[1]?.split("?")[0];
          }

          if (storagePath) {
            const decodedPath = decodeURIComponent(storagePath);
            const { data, error } = await supabase.storage.from("cv").download(decodedPath);
            if (!error && data) {
              blob = data;
            } else if (error) {
              console.warn("Supabase storage SDK download warning:", error);
            }
          }
        } catch (sErr) {
          console.warn("Error attempting Supabase SDK download:", sErr);
        }
      }

      // 2. Fallback to direct fetch to blob if not loaded via Supabase SDK or if url is a data URL / external URL
      if (!blob) {
        if (url.startsWith("data:")) {
          try {
            const arr = url.split(",");
            const mime = arr[0].match(/:(.*?);/)?.[1] || "application/pdf";
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            blob = new Blob([u8arr], { type: mime });
          } catch (e) {
            console.warn("Error converting data URL to blob:", e);
          }
        } else {
          try {
            const response = await fetch(url);
            if (response.ok) {
              blob = await response.blob();
            }
          } catch (fetchErr) {
            console.warn("Error fetching CV URL:", fetchErr);
          }

          if (!blob && url !== defaultResumePdf) {
            try {
              console.warn("Falling back to default asset PDF...");
              const fallbackRes = await fetch(defaultResumePdf);
              if (fallbackRes.ok) {
                blob = await fallbackRes.blob();
              }
            } catch (fbErr) {
              console.warn("Failed to fetch default resume PDF:", fbErr);
            }
          }
        }
      }

      if (!blob) {
        // Direct browser navigation link fallback if blob creation was impossible
        const link = document.createElement("a");
        link.href = url || defaultResumePdf;
        link.download = fileName;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsDownloading(false);
        return;
      }

      // Ensure blob content type is application/pdf for consistency
      const pdfBlob = blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });

      // 3. Create temporary Object URL and trigger immediate forced download with original filename
      const blobUrl = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Revoke object URL after brief timeout
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 2000);

    } catch (err: any) {
      console.error("CV download failed:", err);
      alert(`Could not download CV file automatically: ${err.message || "Unknown error"}. Please check Admin Settings.`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      {/* Scroll Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-zinc-900 z-[100]">
        <div
          className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 transition-all duration-100 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isLight
            ? isScrolled
              ? "py-3.5 liquid-glass-nav"
              : "py-5 bg-white/35 backdrop-blur-md border-b border-white/50"
            : isScrolled
              ? "py-4 bg-[#030303]/85 backdrop-blur-md border-b border-white/5"
              : "py-6 bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <a
            href="/"
            onClick={(e) => handleNavClick(e, "hero")}
            className="flex items-center gap-2 group"
          >
            <span
              className={`font-display font-extrabold text-xl tracking-tight flex items-center gap-0.5 transition-colors duration-300 ${
                isLight ? "text-zinc-900 group-hover:text-purple-600" : "text-white"
              }`}
            >
              RASHED<span className="text-purple-500">.</span>P
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item, index) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={index}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.id)}
                  className={`font-sans text-xs uppercase tracking-widest transition-all duration-300 relative py-1 ${
                    isActive
                      ? isLight
                        ? "text-purple-700 font-semibold"
                        : "text-white font-semibold"
                      : isLight
                        ? "text-zinc-600 hover:text-zinc-950"
                        : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="activeNavIndicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Action Buttons: Theme Toggle & CV Download */}
          <div className="hidden md:flex items-center gap-3.5">
            {/* Apple-style Liquid Glass Theme Toggle */}
            <ThemeToggle />

            {/* Download CV Button */}
            <button
              onClick={downloadCV}
              disabled={isDownloading}
              aria-label="Download Curriculum Vitae"
              className={`group relative inline-flex items-center gap-2 px-4.5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ease-out overflow-hidden active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                isLight
                  ? "bg-white/65 hover:bg-white/90 border border-white/90 hover:border-purple-400/40 text-purple-950 shadow-[0_4px_16px_rgba(100,100,160,0.08),inset_0_1px_1px_rgba(255,255,255,0.95)] hover:shadow-[0_8px_24px_rgba(168,85,247,0.18)]"
                  : "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:brightness-110 text-white"
              }`}
            >
              {/* Glossy Shine Sweep Overlay */}
              <span className="absolute inset-0 pointer-events-none -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12" />

              <span className="relative z-10 inline-flex items-center gap-2">
                {isDownloading ? (
                  <div className="w-3.5 h-3.5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className={`w-3.5 h-3.5 transition-transform group-hover:translate-y-[1px] ${
                    isLight ? "text-purple-600" : "text-purple-400"
                  }`} />
                )}
                {isDownloading ? "Downloading..." : "Download CV"}
              </span>
            </button>
          </div>

          {/* Mobile Menu Trigger & Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle compact />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all duration-300 cursor-pointer ${
                isLight
                  ? "text-zinc-700 hover:text-zinc-950 bg-white/50 border border-white/80 shadow-xs"
                  : "text-zinc-300 hover:text-white"
              }`}
            >
              {mobileMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className={`md:hidden border-b overflow-hidden ${
                isLight
                  ? "bg-[#f8f9fc]/88 backdrop-blur-2xl saturate-[180%] border-white/85 shadow-2xl"
                  : "border-white/10 bg-[#050508]/98 backdrop-blur-lg"
              }`}
            >
              <div className="px-6 py-6 flex flex-col gap-5">
                {/* Mobile Navigation Links */}
                {navItems.map((item, index) => {
                  const isActive = activeSection === item.id;
                  return (
                    <a
                      key={index}
                      href={item.href}
                      onClick={(e) => {
                        setMobileMenuOpen(false);
                        handleNavClick(e, item.id, true);
                      }}
                      className={`font-display font-medium text-lg flex items-center justify-between transition-colors ${
                        isActive
                          ? isLight
                            ? "text-purple-700 font-bold"
                            : "text-purple-400 font-semibold"
                          : isLight
                            ? "text-zinc-700 hover:text-purple-600"
                            : "text-zinc-300 hover:text-white"
                      }`}
                    >
                      <span>{item.label}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.6)]" />}
                    </a>
                  );
                })}

                {/* Mobile Bottom Bar with Theme Toggle and CV Download */}
                <div className={`pt-4 border-t flex flex-col gap-3 ${isLight ? "border-zinc-200/80" : "border-white/5"}`}>
                  <div className="flex items-center justify-between py-1">
                    <span className={`text-xs uppercase tracking-widest font-mono ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
                      Interface Theme
                    </span>
                    <ThemeToggle />
                  </div>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      downloadCV();
                    }}
                    disabled={isDownloading}
                    className="group relative flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 hover:brightness-110 text-sm font-semibold text-white transition-all duration-300 ease-out overflow-hidden cursor-pointer shadow-md hover:shadow-purple-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {/* Glossy Shine Sweep Overlay */}
                    <span className="absolute inset-0 pointer-events-none -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12" />

                    <span className="relative z-10 inline-flex items-center gap-2">
                      {isDownloading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {isDownloading ? "Downloading..." : "Download CV"}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
