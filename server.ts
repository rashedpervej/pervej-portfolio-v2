import fs from "fs";
import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import chatHandler from "./api/chat";
import contactHandler from "./api/contact";
import { getLeads, updateLead, deleteLead } from "./api/leads";
import healthHandler from "./api/health";
import snapshotHandler from "./api/snapshot";
import { injectSocialMeta } from "./api/socialMeta";

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = 3000;

app.use(express.json());

// API routes FIRST
app.get("/api/health", healthHandler);
app.head("/api/health", healthHandler);
app.get("/api/health/db", healthHandler);
app.head("/api/health/db", healthHandler);
app.post("/api/chat", chatHandler);
app.post("/api/contact", contactHandler);
app.get("/api/leads", getLeads);
app.post("/api/leads/update", updateLead);
app.post("/api/leads/delete", deleteLead);
app.get("/api/snapshot", snapshotHandler);
app.post("/api/snapshot", snapshotHandler);

// Configure Vite or Static Asset Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    // Intercept HTML / crawler requests to inject live OG & Twitter meta tags
    app.use(async (req, res, next) => {
      const url = req.originalUrl;
      // Skip API routes, Vite HMR, and requests for assets with extensions
      if (req.method !== "GET" || url.startsWith("/api") || path.extname(url.split("?")[0])) {
        return next();
      }

      const accept = req.headers.accept || "";
      const userAgent = req.headers["user-agent"] || "";
      const isCrawler = /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Discordbot|Slackbot|Pinterest|Googlebot|bingbot|Applebot/i.test(userAgent);
      const wantsHtml = accept.includes("text/html");

      if (isCrawler || wantsHtml) {
        try {
          const indexPath = path.resolve(process.cwd(), "index.html");
          if (fs.existsSync(indexPath)) {
            let template = fs.readFileSync(indexPath, "utf-8");
            template = await vite.transformIndexHtml(url, template);
            const finalHtml = injectSocialMeta(template);
            return res.status(200).set({ "Content-Type": "text/html" }).end(finalHtml);
          }
        } catch (e) {
          console.error("Error transforming dev index.html with OG tags:", e);
        }
      }
      next();
    });

    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded with dynamic OG meta injection.");
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(
      "/assets",
      express.static(path.join(distPath, "assets"), {
        maxAge: "1y",
        immutable: true,
      })
    );
    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith("index.html")) {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          }
        },
      })
    );
    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      try {
        const indexHtmlPath = path.join(distPath, "index.html");
        if (fs.existsSync(indexHtmlPath)) {
          const rawHtml = fs.readFileSync(indexHtmlPath, "utf-8");
          const finalHtml = injectSocialMeta(rawHtml);
          return res.status(200).set({ "Content-Type": "text/html" }).send(finalHtml);
        }
      } catch (err) {
        console.error("Error serving index.html with OG tags in production:", err);
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled static assets from dist/ with dynamic OG meta injection.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT} [NODE_ENV=${process.env.NODE_ENV || "development"}]`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
