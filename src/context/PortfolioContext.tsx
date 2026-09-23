import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { portfolioData as fallbackData } from "../data";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import defaultResumePdf from "../assets/CV/Rashed Pervej _ Resume _ Jul 26.pdf";
import { FALLBACK_SECTIONS, FALLBACK_SITE_SETTINGS } from "../data/fallbackContent";
import {
  getInitialSections,
  getInitialSiteSettings,
  scheduleSnapshotSync,
  loadPersistentSnapshot,
  fetchServerSnapshot,
  isValidSnapshotData,
} from "../utils/persistentSnapshot";

export interface SectionRecord {
  id: string;
  key: string;
  name: string;
  type: string; // 'single' (one object) or 'collection' (list of objects)
  fields_schema: any[];
  published_content: any;
  draft_content: any;
  is_visible: boolean;
  order_index: number;
}

export interface ProjectSettings {
  showCategoryFilters?: boolean;
  showFilterAll?: boolean;
  showFilterBranding?: boolean;
  showFilterMotion?: boolean;
  showFilterMarketing?: boolean;
  showFilterInternational?: boolean;
  showCategory: boolean;
  showYear: boolean;
  showAwardBadge: boolean;
  showClientName: boolean;
  showServices: boolean;
  showToolsUsed: boolean;
  showProjectDuration: boolean;
  showLiveUrl: boolean;
  showBehanceUrl: boolean;
  showCaseStudyButton: boolean;
  showProjectTags: boolean;
}

export type ThemeMode = "dark" | "light";

export type BackgroundStyle =
  | "liquid"
  | "aurora"
  | "mesh"
  | "floating-orbs"
  | "iridescent"
  | "cinematic"
  | "minimal";

export interface SiteSettings {
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  cvSource?: "upload" | "url";
  cvUrl?: string;
  cvFileName?: string;
  primaryColor?: string;
  customCss?: string;
  enableChatbot?: boolean;
  backgroundStyle?: BackgroundStyle;
  projectSettings?: ProjectSettings;
  marqueeSpeed?: number;
}

interface PortfolioContextType {
  portfolioData: typeof fallbackData;
  isLoading: boolean;
  isPreviewMode: boolean;
  setIsPreviewMode: (preview: boolean) => void;
  isSupabaseActive: boolean;
  isDatabaseOffline: boolean;
  sections: SectionRecord[];
  setSections: React.Dispatch<React.SetStateAction<SectionRecord[]>>;
  siteSettings: SiteSettings;
  setSiteSettings: React.Dispatch<React.SetStateAction<SiteSettings>>;
  refreshData: () => Promise<void>;
  trackEvent: (eventType: string, details?: any) => Promise<void>;
  isSectionVisible: (key: string) => boolean;
  getSectionOrder: () => string[];
  getSectionRecord: (key: string) => SectionRecord | undefined;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  backgroundStyle: BackgroundStyle;
  setBackgroundStyle: (style: BackgroundStyle) => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

// Default section ordering matching the DB
const DEFAULT_SECTION_ORDER = [
  "hero",
  "about",
  "experience",
  "skills",
  "brands",
  "services",
  "projects",
  "testimonials",
  "contact",
];

const createDefaultSections = (): SectionRecord[] => {
  return FALLBACK_SECTIONS;
};

function adjustHexColor(hex: string, percent: number): string {
  let cleanHex = hex.replace("#", "");
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split("").map((c) => c + c).join("");
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return hex;
  let r = (num >> 16) + Math.round(255 * (percent / 100));
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100));
  let b = (num & 0x0000ff) + Math.round(255 * (percent / 100));

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from latest persistent snapshot if available; otherwise fallback dataset
  const [sections, setSections] = useState<SectionRecord[]>(() => getInitialSections());
  const [isDatabaseOffline, setIsDatabaseOffline] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => getInitialSiteSettings());
  const [activeData, setActiveData] = useState<typeof fallbackData>(fallbackData);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Theme Management: Light Mode Liquid Glass / Dark Mode
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem("portfolio_theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch (e) {}
    return "dark";
  });

  // Dynamic Background Style State - Defaults permanently to "liquid" (Liquid Glass)
  const [backgroundStyle, setBackgroundStyleState] = useState<BackgroundStyle>(() => {
    try {
      const saved = localStorage.getItem("portfolio_bg_style");
      if (saved && saved !== "liquid") {
        // Reset any prior alternative preset back to Liquid Glass
        localStorage.setItem("portfolio_bg_style", "liquid");
      }
    } catch (e) {}
    return "liquid";
  });

  const setBackgroundStyle = useCallback((newStyle: BackgroundStyle) => {
    setBackgroundStyleState(newStyle);
    try {
      localStorage.setItem("portfolio_bg_style", newStyle);
    } catch (e) {}
  }, []);

  const applyThemeToDOM = (themeMode: ThemeMode) => {
    const root = document.documentElement;
    if (themeMode === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
      root.style.colorScheme = "light";
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
      root.setAttribute("data-theme", "dark");
      root.style.colorScheme = "dark";
    }
  };

  const setTheme = useCallback((newTheme: ThemeMode) => {
    applyThemeToDOM(newTheme);
    setThemeState(newTheme);
    try {
      localStorage.setItem("portfolio_theme", newTheme);
    } catch (e) {}
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "light" ? "dark" : "light";
      applyThemeToDOM(next);
      try {
        localStorage.setItem("portfolio_theme", next);
      } catch (e) {}
      return next;
    });
  }, []);

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  // Synchronize SEO metadata and Brand Theme dynamically to document head DOM
  useEffect(() => {
    if (siteSettings.seoTitle) {
      document.title = siteSettings.seoTitle;
    }

    if (siteSettings.seoDescription) {
      let descMeta = document.querySelector('meta[name="description"]');
      if (!descMeta) {
        descMeta = document.createElement("meta");
        descMeta.setAttribute("name", "description");
        document.head.appendChild(descMeta);
      }
      descMeta.setAttribute("content", siteSettings.seoDescription);
    }

    if (siteSettings.seoKeywords) {
      let keywordsMeta = document.querySelector('meta[name="keywords"]');
      if (!keywordsMeta) {
        keywordsMeta = document.createElement("meta");
        keywordsMeta.setAttribute("name", "keywords");
        document.head.appendChild(keywordsMeta);
      }
      keywordsMeta.setAttribute("content", siteSettings.seoKeywords);
    }

    if (siteSettings.primaryColor) {
      const baseColor = siteSettings.primaryColor;
      const lighterColor = adjustHexColor(baseColor, 18);
      const darkerColor = adjustHexColor(baseColor, -18);

      document.documentElement.style.setProperty("--primary-brand", baseColor);
      document.documentElement.style.setProperty("--primary-brand-400", lighterColor);
      document.documentElement.style.setProperty("--primary-brand-600", darkerColor);

      let themeMeta = document.querySelector('meta[name="theme-color"]');
      if (!themeMeta) {
        themeMeta = document.createElement("meta");
        themeMeta.setAttribute("name", "theme-color");
        document.head.appendChild(themeMeta);
      }
      themeMeta.setAttribute("content", baseColor);
    }

    // Synchronize Global Open Graph (OG) & Twitter Card tags
    const updateMetaTag = (selector: string, attrName: string, attrVal: string, content: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const ogTitle = siteSettings.ogTitle || siteSettings.seoTitle || "Rashed Pervej | Senior Visualizer Portfolio";
    const ogDescription = siteSettings.ogDescription || siteSettings.seoDescription || "Award-winning portfolio of Rashed Pervej, Senior Visualizer & Graphic Designer specializing in brand identity, packaging, and motion graphics.";
    const ogImage = siteSettings.ogImage || "https://pervej.pro.bd/og-image.jpg";
    const ogUrl = siteSettings.ogUrl || "https://pervej.pro.bd/";

    updateMetaTag('meta[property="og:title"]', "property", "og:title", ogTitle);
    updateMetaTag('meta[property="og:description"]', "property", "og:description", ogDescription);
    updateMetaTag('meta[property="og:image"]', "property", "og:image", ogImage);
    updateMetaTag('meta[property="og:url"]', "property", "og:url", ogUrl);
    updateMetaTag('meta[property="og:type"]', "property", "og:type", "website");
    updateMetaTag('meta[property="og:site_name"]', "property", "og:site_name", "Rashed Pervej Portfolio");

    updateMetaTag('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    updateMetaTag('meta[name="twitter:title"]', "name", "twitter:title", ogTitle);
    updateMetaTag('meta[name="twitter:description"]', "name", "twitter:description", ogDescription);
    updateMetaTag('meta[name="twitter:image"]', "name", "twitter:image", ogImage);
    updateMetaTag('meta[name="twitter:url"]', "name", "twitter:url", ogUrl);
  }, [
    siteSettings.seoTitle,
    siteSettings.seoDescription,
    siteSettings.seoKeywords,
    siteSettings.primaryColor,
    siteSettings.ogTitle,
    siteSettings.ogDescription,
    siteSettings.ogImage,
    siteSettings.ogUrl,
  ]);

  // Load all sections and settings from Supabase
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    if (!isSupabaseConfigured || !supabase) {
      // Supabase not configured -> serve persistent snapshot or bundled static fallback
      setIsDatabaseOffline(true);
      let snapshot = loadPersistentSnapshot();
      if (!snapshot || !isValidSnapshotData(snapshot.sections, snapshot.siteSettings)) {
        snapshot = await fetchServerSnapshot();
      }
      if (snapshot && isValidSnapshotData(snapshot.sections, snapshot.siteSettings)) {
        setSections(snapshot.sections);
        setSiteSettings((prev) => ({ ...prev, ...snapshot.siteSettings }));
      } else {
        setSections(FALLBACK_SECTIONS);
        setSiteSettings(FALLBACK_SITE_SETTINGS);
      }
      setIsLoading(false);
      return;
    }

    try {
      // 4-second timeout safeguard to prevent unhandled freezes if network stalls
      const timeoutPromise = new Promise<{ timeout: true }>((_, reject) =>
        setTimeout(() => reject(new Error("Supabase request timed out")), 4000)
      );

      const fetchPromise = Promise.all([
        supabase
          .from("sections")
          .select("*")
          .order("order_index", { ascending: true }),
        supabase
          .from("site_settings")
          .select("*"),
      ]);

      const [sectionsRes, settingsRes] = (await Promise.race([
        fetchPromise,
        timeoutPromise,
      ])) as any;

      const { data: sectionData, error: sectionError } = sectionsRes;
      const { data: settingsData, error: settingsError } = settingsRes;

      if (sectionError) {
        throw sectionError;
      }

      // Strict validation: must be complete, non-empty, and valid
      if (!isValidSnapshotData(sectionData)) {
        throw new Error("Supabase returned incomplete or invalid sections data");
      }

      // Process settings if available
      let mergedSettings: any = {};
      if (!settingsError && settingsData && Array.isArray(settingsData)) {
        settingsData.forEach((row: any) => {
          let val = row.value;
          if (val === "true") val = true;
          if (val === "false") val = false;
          if (row.key === "marqueeSpeed" && typeof val === "string" && !isNaN(Number(val))) {
            val = Number(val);
          }
          mergedSettings[row.key] = val;
        });
      }

      let updatedSiteSettings: SiteSettings = FALLBACK_SITE_SETTINGS;
      setSiteSettings((prev) => {
        updatedSiteSettings = { ...FALLBACK_SITE_SETTINGS, ...prev, ...mergedSettings };
        return updatedSiteSettings;
      });

      const fetchedKeys = sectionData.map((s: any) => s.key);
      const merged: SectionRecord[] = sectionData.map((remoteSec: any) => {
        const fallbackSec = FALLBACK_SECTIONS.find((s) => s.key === remoteSec.key);
        return {
          id: remoteSec.id,
          key: remoteSec.key,
          name: remoteSec.name || fallbackSec?.name || remoteSec.key,
          type: remoteSec.type || fallbackSec?.type || "single",
          fields_schema: remoteSec.fields_schema || fallbackSec?.fields_schema || [],
          published_content:
            remoteSec.published_content ?? fallbackSec?.published_content ?? null,
          draft_content: remoteSec.draft_content ?? fallbackSec?.draft_content ?? null,
          is_visible: remoteSec.is_visible !== false,
          order_index: remoteSec.order_index ?? 0,
        };
      });

      // Ensure any essential sections from fallback are present if omitted from remote
      FALLBACK_SECTIONS.forEach((fbSec) => {
        if (!fetchedKeys.includes(fbSec.key)) {
          merged.push(fbSec);
        }
      });

      merged.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
      setSections(merged);
      setIsDatabaseOffline(false);

      // AUTOMATIC PERSISTENT FALLBACK SNAPSHOT SYNCHRONIZATION:
      // When valid, complete data is received from Supabase, automatically synchronize to snapshot.
      // Non-blocking, failsafe, and will never overwrite with invalid data.
      scheduleSnapshotSync(merged, updatedSiteSettings);
    } catch (err) {
      console.warn(
        "Supabase database is unavailable, timed out, or returned incomplete data. Serving latest valid persistent fallback snapshot.",
        err
      );
      setIsDatabaseOffline(true);

      // Failure behavior:
      // 1. Supabase unavailable/timeout/error -> serve the latest valid persistent fallback snapshot.
      // 2. If both Supabase and local persistent snapshot are unavailable -> try server snapshot, then bundled static fallback data.
      let snapshot = loadPersistentSnapshot();
      if (!snapshot || !isValidSnapshotData(snapshot.sections, snapshot.siteSettings)) {
        snapshot = await fetchServerSnapshot();
      }

      if (snapshot && isValidSnapshotData(snapshot.sections, snapshot.siteSettings)) {
        setSections(snapshot.sections);
        setSiteSettings((prev) => ({ ...prev, ...snapshot.siteSettings }));
      } else {
        setSections(FALLBACK_SECTIONS);
        setSiteSettings(FALLBACK_SITE_SETTINGS);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync / resolve portfolioData based on preview toggle and section records
  useEffect(() => {
    if (sections.length === 0) {
      setActiveData(fallbackData);
      return;
    }

    // Build active data from active state (draft vs published)
    const resolvedData = { ...fallbackData };

    sections.forEach((section) => {
      const content = isPreviewMode
        ? section.draft_content || section.published_content
        : section.published_content || section.draft_content;

      if (!content) return; // Skip if no content is populated

      switch (section.key) {
        case "personal_info":
        case "hero":
          // Blend hero and personal_info as they share properties
          resolvedData.personalInfo = {
            ...resolvedData.personalInfo,
            ...content,
          };
          break;
        case "about":
        case "contact":
          resolvedData.personalInfo = {
            ...resolvedData.personalInfo,
            ...content,
          };
          break;
        case "experience":
          if (Array.isArray(content) && content.length > 0) {
            resolvedData.experiences = content;
          }
          break;
        case "projects":
          if (Array.isArray(content) && content.length > 0) {
            resolvedData.projects = content;
          }
          break;
        case "brands":
          if (Array.isArray(content) && content.length > 0) {
            resolvedData.selectedBrands = content;
          }
          break;
        case "skills":
          if (content && typeof content === "object" && Object.keys(content).length > 0) {
            resolvedData.skills = {
              ...resolvedData.skills,
              ...content,
            };
          }
          break;
        case "services":
          if (Array.isArray(content) && content.length > 0) {
            resolvedData.services = content;
          }
          break;
        case "testimonials":
          if (Array.isArray(content) && content.length > 0) {
            resolvedData.testimonials = content;
          }
          break;
        case "educationCertifications":
        case "education_certifications":
          if (Array.isArray(content)) {
            resolvedData.educationCertifications = content;
          } else if (content && Array.isArray(content.items)) {
            resolvedData.educationCertifications = content.items;
          }
          break;
        default:
          // Keep as generic sections for dynamic rendering
          break;
      }
    });

    setActiveData(resolvedData);
  }, [sections, isPreviewMode]);

  // Load on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Helper: check section visibility
  const isSectionVisible = useCallback((key: string): boolean => {
    const section = sections.find((s) => s.key === key);
    if (!section) return true;
    return section.is_visible === true || (section.is_visible as any) === "true";
  }, [sections]);

  // Helper: get dynamic section order
  const getSectionOrder = useCallback((): string[] => {
    if (sections.length === 0) return DEFAULT_SECTION_ORDER;
    
    // Extract section keys in their sorted order
    const orderedKeys = sections
      .filter((s) => !["personal_info", "site_settings", "seo", "footer", "navigation", "educationCertifications", "education_certifications"].includes(s.key))
      .map((s) => s.key);
      
    // If some default sections are missing in DB representation, append them
    DEFAULT_SECTION_ORDER.forEach((key) => {
      if (!orderedKeys.includes(key)) {
        orderedKeys.push(key);
      }
    });

    return orderedKeys.filter((key) => key !== "educationCertifications" && key !== "education_certifications");
  }, [sections]);

  // Helper: get full record of a section (for custom components / admin editor)
  const getSectionRecord = useCallback((key: string) => {
    return sections.find((s) => s.key === key);
  }, [sections]);

  // Analytics event tracker
  const trackEvent = useCallback(async (eventType: string, details: any = {}) => {
    // Also log to console in development
    console.log(`[Analytics Event] ${eventType}:`, details);

    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from("analytics_events").insert({
        event_type: eventType,
        event_details: details,
      });
    } catch (err) {
      console.warn("Failed to write analytics event to Supabase:", err);
    }
  }, []);

  return (
    <PortfolioContext.Provider
      value={{
        portfolioData: activeData,
        isLoading,
        isPreviewMode,
        setIsPreviewMode,
        isSupabaseActive: isSupabaseConfigured,
        isDatabaseOffline,
        sections,
        setSections,
        siteSettings,
        setSiteSettings,
        refreshData: fetchData,
        trackEvent,
        isSectionVisible,
        getSectionOrder,
        getSectionRecord,
        theme,
        setTheme,
        toggleTheme,
        backgroundStyle,
        setBackgroundStyle,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
};
