import fs from "fs";
import path from "path";

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
  description: "Award-winning portfolio of Rashed Pervej, Senior Visualizer & Graphic Designer specializing in brand identity, packaging, and motion graphics.",
  image: "https://pervej.pro.bd/og-image.jpg",
  url: "https://pervej.pro.bd/",
  type: "website",
  siteName: "Rashed Pervej Portfolio",
};

/**
 * Reads social share metadata from the local snapshot or falls back to production defaults.
 */
export function getSocialMetadata(): SocialMetadata {
  try {
    const snapshotPath = path.join(process.cwd(), "data", "snapshot.json");
    if (fs.existsSync(snapshotPath)) {
      const raw = fs.readFileSync(snapshotPath, "utf-8");
      const parsed = JSON.parse(raw);
      const settings = parsed.siteSettings || parsed.site_settings || {};
      return {
        title: settings.ogTitle || settings.seoTitle || DEFAULT_SOCIAL_METADATA.title,
        description: settings.ogDescription || settings.seoDescription || DEFAULT_SOCIAL_METADATA.description,
        image: settings.ogImage || DEFAULT_SOCIAL_METADATA.image,
        url: settings.ogUrl || DEFAULT_SOCIAL_METADATA.url,
        type: "website",
        siteName: DEFAULT_SOCIAL_METADATA.siteName,
      };
    }
  } catch (err) {
    console.error("Failed to read social metadata from snapshot:", err);
  }
  return DEFAULT_SOCIAL_METADATA;
}

/**
 * Injects dynamic Open Graph & Twitter Card meta tags into HTML template
 * so social crawlers (Facebook, WhatsApp, LinkedIn, X, Slack) receive live metadata
 * in the initial server-rendered HTTP response.
 */
export function injectSocialMeta(html: string): string {
  const meta = getSocialMetadata();

  const escapeAttr = (str: string) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const safeTitle = escapeAttr(meta.title);
  const safeDesc = escapeAttr(meta.description);
  const safeImage = escapeAttr(meta.image);
  const safeUrl = escapeAttr(meta.url);

  let updated = html;

  // Title tag
  if (/<title>[\s\S]*?<\/title>/i.test(updated)) {
    updated = updated.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`);
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
