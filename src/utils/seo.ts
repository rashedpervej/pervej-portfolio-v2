import { SiteSettings } from "../context/PortfolioContext";

/**
 * Returns the current deployment origin (e.g. "https://my-domain.com" or "https://preview.aistudio.google.com").
 * Returns an empty string in SSR/non-browser contexts.
 */
export function getCurrentOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
}

/**
 * Universal resolution of Social / Open Graph Image URLs:
 * - If image path is missing or empty, defaults to current origin + "/og-image.jpg"
 * - If contains the legacy hard-coded domain "pervej.pro.bd", smoothly transitions it to the current deployment origin
 * - If already a full external URL (Supabase CDN, AWS S3, Cloudinary, data:, blob:), preserves it intact
 * - If a relative path (e.g. "/og-image.jpg" or "/brand-header.webp"), dynamically prepends the current deployment origin
 */
export function resolveSocialImageUrl(rawImage?: string): string {
  const origin = getCurrentOrigin();

  if (!rawImage || !rawImage.trim()) {
    return origin ? `${origin}/og-image.jpg` : "/og-image.jpg";
  }

  let cleaned = rawImage.trim();

  // Transparently migrate legacy pervej.pro.bd URL to dynamic universal path
  if (cleaned.includes("pervej.pro.bd")) {
    cleaned = cleaned.replace(/^https?:\/\/(www\.)?pervej\.pro\.bd\/?/, "/");
    if (!cleaned.startsWith("/")) {
      cleaned = "/" + cleaned;
    }
  }

  // Preserve absolute URLs and inline data/blob streams
  if (/^(https?:|\/\/|data:|blob:)/i.test(cleaned)) {
    return cleaned;
  }

  // Prepend current origin for relative paths
  const normalizedPath = cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
  return origin ? `${origin}${normalizedPath}` : normalizedPath;
}

/**
 * Universal resolution of Canonical / Social Page URLs:
 * - If empty, uses current deployment origin + current pathname
 * - If contains legacy hard-coded domain "pervej.pro.bd", smoothly normalizes to current deployment
 * - If relative path, prepends current deployment origin
 * - If valid absolute URL, returns it as-is
 */
export function resolveCanonicalUrl(rawUrl?: string): string {
  const origin = getCurrentOrigin();
  const pathname =
    typeof window !== "undefined" && window.location?.pathname
      ? window.location.pathname
      : "/";

  if (!rawUrl || !rawUrl.trim()) {
    return origin ? `${origin}${pathname}` : pathname;
  }

  let cleaned = rawUrl.trim();

  // Normalize legacy domain
  if (cleaned.includes("pervej.pro.bd")) {
    cleaned = cleaned.replace(/^https?:\/\/(www\.)?pervej\.pro\.bd\/?/, "/");
    if (!cleaned.startsWith("/")) {
      cleaned = "/" + cleaned;
    }
  }

  if (/^https?:\/\//i.test(cleaned)) {
    return cleaned;
  }

  const normalizedPath = cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
  return origin ? `${origin}${normalizedPath}` : normalizedPath;
}

/**
 * Safely extracts hostname for live preview cards and social badges.
 */
export function getDisplayHostname(rawUrl?: string): string {
  const resolved = resolveCanonicalUrl(rawUrl);
  try {
    const parsed = new URL(resolved);
    return parsed.hostname;
  } catch {
    if (typeof window !== "undefined" && window.location?.hostname) {
      return window.location.hostname;
    }
    return "portfolio.app";
  }
}

/**
 * Synchronizes document <head> elements (Title, Description, Canonical, Open Graph, Twitter Cards, Schema.org)
 * directly with current database / CMS site settings.
 */
export function syncDocumentSeo(settings: Partial<SiteSettings>): void {
  if (typeof document === "undefined") return;

  const defaultTitle = "Rashed Pervej | Senior Visualizer Portfolio";
  const defaultDesc =
    "Award-winning portfolio of Rashed Pervej, Senior Visualizer & Graphic Designer specializing in brand identity, packaging, and motion graphics.";

  const activeTitle = settings.ogTitle || settings.seoTitle || defaultTitle;
  const activeDesc = settings.ogDescription || settings.seoDescription || defaultDesc;
  const resolvedOgImage = resolveSocialImageUrl(settings.ogImage);
  const resolvedOgUrl = resolveCanonicalUrl(settings.ogUrl);

  // 1. Standard HTML Head Metadata
  if (settings.seoTitle || settings.ogTitle) {
    document.title = activeTitle;
  }

  const updateOrCreateTag = (
    tagName: string,
    attrKey: string,
    attrVal: string,
    contentAttr: string,
    contentVal: string
  ) => {
    let el = document.querySelector(`${tagName}[${attrKey}="${attrVal}"]`);
    if (!el) {
      el = document.createElement(tagName);
      el.setAttribute(attrKey, attrVal);
      document.head.appendChild(el);
    }
    el.setAttribute(contentAttr, contentVal);
  };

  // Meta description
  updateOrCreateTag("meta", "name", "description", "content", activeDesc);

  // Meta keywords
  if (settings.seoKeywords) {
    updateOrCreateTag("meta", "name", "keywords", "content", settings.seoKeywords);
  }

  // Canonical link tag
  updateOrCreateTag("link", "rel", "canonical", "href", resolvedOgUrl);

  // 2. Open Graph Meta Tags (Facebook, LinkedIn, Slack, WhatsApp)
  updateOrCreateTag("meta", "property", "og:type", "content", "website");
  updateOrCreateTag("meta", "property", "og:title", "content", activeTitle);
  updateOrCreateTag("meta", "property", "og:description", "content", activeDesc);
  updateOrCreateTag("meta", "property", "og:image", "content", resolvedOgImage);
  updateOrCreateTag("meta", "property", "og:image:width", "content", "1200");
  updateOrCreateTag("meta", "property", "og:image:height", "content", "630");
  updateOrCreateTag("meta", "property", "og:image:alt", "content", activeTitle);
  updateOrCreateTag("meta", "property", "og:url", "content", resolvedOgUrl);
  updateOrCreateTag(
    "meta",
    "property",
    "og:site_name",
    "content",
    settings.seoTitle || "Rashed Pervej Portfolio"
  );

  // 3. Twitter / X Social Cards
  updateOrCreateTag("meta", "name", "twitter:card", "content", "summary_large_image");
  updateOrCreateTag("meta", "name", "twitter:title", "content", activeTitle);
  updateOrCreateTag("meta", "name", "twitter:description", "content", activeDesc);
  updateOrCreateTag("meta", "name", "twitter:image", "content", resolvedOgImage);
  updateOrCreateTag("meta", "name", "twitter:image:alt", "content", activeTitle);
  updateOrCreateTag("meta", "name", "twitter:url", "content", resolvedOgUrl);

  // 4. Schema.org JSON-LD Structured Data
  const jsonLd = document.querySelector('script[type="application/ld+json"]');
  if (jsonLd) {
    try {
      const parsed = JSON.parse(jsonLd.textContent || "{}");
      if (parsed && typeof parsed === "object") {
        parsed.url = resolvedOgUrl;
        jsonLd.textContent = JSON.stringify(parsed, null, 2);
      }
    } catch (_) {}
  }
}
