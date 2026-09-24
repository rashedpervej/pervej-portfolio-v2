import fs from "fs";
import path from "path";
import type { Request } from "express";
import { createClient } from "@supabase/supabase-js";

export interface SocialMetadata {
  title: string;
  description: string;
  image: string;
  url: string;
  type: string;
  siteName: string;
}

export const DEFAULT_SOCIAL_METADATA: SocialMetadata = {
  title: "Rashed Pervej | Senior Visualizer Portfolio",
  description:
    "Award-winning portfolio of Rashed Pervej, Senior Visualizer & Graphic Designer specializing in brand identity, packaging, and motion graphics.",
  image: "/og-image.jpg",
  url: "/",
  type: "website",
  siteName: "Rashed Pervej Portfolio",
};

// In-memory cache for DB-fetched metadata
let cachedMeta: SocialMetadata | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 15000; // 15 seconds

/**
 * Universal resolution of Social / Open Graph Image URLs for server-side responses:
 * - If image path is missing or empty, defaults to current origin + "/og-image.jpg"
 * - If contains the legacy hard-coded domain "pervej.pro.bd", smoothly transitions it to the current deployment origin
 * - If already a full external URL (Supabase CDN, AWS S3, Cloudinary, data:, blob:), preserves it intact
 * - If a relative path, prepends the current deployment origin
 */
export function resolveServerSocialImageUrl(rawImage?: string, origin?: string): string {
  const baseOrigin = origin ? origin.replace(/\/+$/, "") : "";

  if (!rawImage || !rawImage.trim()) {
    return baseOrigin ? `${baseOrigin}/og-image.jpg` : "/og-image.jpg";
  }

  let cleaned = rawImage.trim();

  if (cleaned.includes("pervej.pro.bd")) {
    cleaned = cleaned.replace(/^https?:\/\/(www\.)?pervej\.pro\.bd\/?/, "/");
    if (!cleaned.startsWith("/")) {
      cleaned = "/" + cleaned;
    }
  }

  if (/^(https?:|\/\/|data:|blob:)/i.test(cleaned)) {
    return cleaned;
  }

  const normalizedPath = cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
  return baseOrigin ? `${baseOrigin}${normalizedPath}` : normalizedPath;
}

/**
 * Universal resolution of Canonical / Page URLs for server-side responses
 */
export function resolveServerCanonicalUrl(rawUrl?: string, origin?: string, pathname: string = "/"): string {
  const baseOrigin = origin ? origin.replace(/\/+$/, "") : "";
  const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (!rawUrl || !rawUrl.trim()) {
    return baseOrigin ? `${baseOrigin}${cleanPath}` : cleanPath;
  }

  let cleaned = rawUrl.trim();

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
  return baseOrigin ? `${baseOrigin}${normalizedPath}` : normalizedPath;
}

/**
 * Reads social share metadata directly from connected Supabase DB/CMS if configured,
 * falling back to local persistent snapshot.json, and finally to defaults.
 */
export async function getSocialMetadata(): Promise<SocialMetadata> {
  const now = Date.now();
  if (cachedMeta && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedMeta;
  }

  // 1. Try querying connected Supabase DB site_settings table
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey && supabaseUrl !== "https://your-supabase-project.supabase.co") {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });

      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["ogTitle", "ogDescription", "ogImage", "ogUrl", "seoTitle", "seoDescription"]);

      if (!error && Array.isArray(data) && data.length > 0) {
        const settingsMap: Record<string, string> = {};
        data.forEach((row) => {
          if (row.key && typeof row.value === "string") {
            settingsMap[row.key] = row.value;
          }
        });

        const result: SocialMetadata = {
          title: settingsMap.ogTitle || settingsMap.seoTitle || DEFAULT_SOCIAL_METADATA.title,
          description: settingsMap.ogDescription || settingsMap.seoDescription || DEFAULT_SOCIAL_METADATA.description,
          image: settingsMap.ogImage || DEFAULT_SOCIAL_METADATA.image,
          url: settingsMap.ogUrl || DEFAULT_SOCIAL_METADATA.url,
          type: "website",
          siteName: settingsMap.seoTitle || DEFAULT_SOCIAL_METADATA.siteName,
        };

        cachedMeta = result;
        lastFetchTime = now;
        return result;
      }
    } catch (dbErr) {
      console.warn("[SocialMeta] Direct Supabase fetch attempt encountered error, falling back to snapshot:", dbErr);
    }
  }

  // 2. Try reading from server snapshot.json
  try {
    const snapshotPath = path.join(process.cwd(), "data", "snapshot.json");
    if (fs.existsSync(snapshotPath)) {
      const raw = fs.readFileSync(snapshotPath, "utf-8");
      const parsed = JSON.parse(raw);
      const settings = parsed.siteSettings || parsed.site_settings || {};
      const result: SocialMetadata = {
        title: settings.ogTitle || settings.seoTitle || DEFAULT_SOCIAL_METADATA.title,
        description: settings.ogDescription || settings.seoDescription || DEFAULT_SOCIAL_METADATA.description,
        image: settings.ogImage || DEFAULT_SOCIAL_METADATA.image,
        url: settings.ogUrl || DEFAULT_SOCIAL_METADATA.url,
        type: "website",
        siteName: settings.seoTitle || DEFAULT_SOCIAL_METADATA.siteName,
      };
      cachedMeta = result;
      lastFetchTime = now;
      return result;
    }
  } catch (err) {
    console.error("Failed to read social metadata from snapshot:", err);
  }

  return DEFAULT_SOCIAL_METADATA;
}

/**
 * Injects dynamic Open Graph & Twitter Card meta tags into HTML template
 * using the current deployment origin from the incoming request.
 */
export async function injectSocialMeta(html: string, req?: Request): Promise<string> {
  const meta = await getSocialMetadata();

  // Determine current deployment origin
  let origin = "";
  let pathname = "/";
  if (req) {
    const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "http";
    const host = (req.headers["x-forwarded-host"] as string) || req.get("host") || "";
    if (host) {
      origin = `${proto}://${host}`;
    }
    pathname = req.originalUrl || "/";
  }

  const resolvedImage = resolveServerSocialImageUrl(meta.image, origin);
  const resolvedUrl = resolveServerCanonicalUrl(meta.url, origin, pathname);

  const escapeAttr = (str: string) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const safeTitle = escapeAttr(meta.title);
  const safeDesc = escapeAttr(meta.description);
  const safeImage = escapeAttr(resolvedImage);
  const safeUrl = escapeAttr(resolvedUrl);

  let updated = html;

  // Title tag
  if (/<title>[\s\S]*?<\/title>/i.test(updated)) {
    updated = updated.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`);
  }

  // Canonical tag
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(updated)) {
    updated = updated.replace(/<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${safeUrl}" />`);
  }

  // Meta description
  if (/<meta\s+name=["']description["'][^>]*>/i.test(updated)) {
    updated = updated.replace(/<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${safeDesc}" />`);
  }

  // Open Graph Tags
  if (/<meta\s+property=["']og:title["'][^>]*>/i.test(updated)) {
    updated = updated.replace(/<meta\s+property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${safeTitle}" />`);
  } else {
    updated = updated.replace(/<\/head>/i, `  <meta property="og:title" content="${safeTitle}" />\n</head>`);
  }

  if (/<meta\s+property=["']og:description["'][^>]*>/i.test(updated)) {
    updated = updated.replace(/<meta\s+property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${safeDesc}" />`);
  } else {
    updated = updated.replace(/<\/head>/i, `  <meta property="og:description" content="${safeDesc}" />\n</head>`);
  }

  if (/<meta\s+property=["']og:image["'][^>]*>/i.test(updated)) {
    updated = updated.replace(/<meta\s+property=["']og:image["'][^>]*>/i, `<meta property="og:image" content="${safeImage}" />`);
  } else {
    updated = updated.replace(/<\/head>/i, `  <meta property="og:image" content="${safeImage}" />\n</head>`);
  }

  if (/<meta\s+property=["']og:url["'][^>]*>/i.test(updated)) {
    updated = updated.replace(/<meta\s+property=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${safeUrl}" />`);
  } else {
    updated = updated.replace(/<\/head>/i, `  <meta property="og:url" content="${safeUrl}" />\n</head>`);
  }

  // Twitter / X Tags
  if (/<meta\s+name=["']twitter:title["'][^>]*>/i.test(updated)) {
    updated = updated.replace(/<meta\s+name=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${safeTitle}" />`);
  }

  if (/<meta\s+name=["']twitter:description["'][^>]*>/i.test(updated)) {
    updated = updated.replace(/<meta\s+name=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${safeDesc}" />`);
  }

  if (/<meta\s+name=["']twitter:image["'][^>]*>/i.test(updated)) {
    updated = updated.replace(/<meta\s+name=["']twitter:image["'][^>]*>/i, `<meta name="twitter:image" content="${safeImage}" />`);
  }

  if (/<meta\s+name=["']twitter:url["'][^>]*>/i.test(updated)) {
    updated = updated.replace(/<meta\s+name=["']twitter:url["'][^>]*>/i, `<meta name="twitter:url" content="${safeUrl}" />`);
  }

  return updated;
}
