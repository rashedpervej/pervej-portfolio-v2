import fs from "fs";
import path from "path";
import { portfolioData as defaultPortfolioData } from "../src/data";
import { FALLBACK_FAQS } from "../src/data/fallbackContent";

let cachedKnowledge: string | null = null;
let lastKnowledgeFetch = 0;
const KNOWLEDGE_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export function cleanText(input: any): string {
  if (!input || typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface StructuredPortfolioData {
  name: string;
  role: string;
  headline: string;
  heroBio: string;
  aboutSummary: string;
  aboutDetail: string;
  location: string;
  availability: string;
  experienceYears: string;
  email: string;
  phone: string;
  linkedin: string;
  behance: string;
  experiences: any[];
  services: any[];
  skills: any;
  brands: any[];
  projects: any[];
  educationCertifications: any[];
  testimonials: any[];
  faqs: Array<{ question: string; answer: string }>;
}

let cachedStructuredData: StructuredPortfolioData | null = null;

/**
 * Loads raw section and FAQ data from Supabase, falling back to data/snapshot.json and src/data.ts
 */
export async function getStructuredPortfolioData(): Promise<StructuredPortfolioData> {
  const now = Date.now();
  if (cachedStructuredData && now - lastKnowledgeFetch < KNOWLEDGE_CACHE_TTL) {
    return cachedStructuredData;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  let sectionsMap: Record<string, any> = {};
  let faqsList: Array<{ question: string; answer: string }> = [];

  // 1. Try querying Supabase
  if (supabaseUrl && supabaseKey && supabaseUrl !== "https://your-supabase-project.supabase.co") {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const [sectionsRes, faqsRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/sections?select=key,published_content,content&order=order_index`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
          signal: controller.signal,
        }).then((r) => (r.ok ? r.json() : null)),
        fetch(`${supabaseUrl}/rest/v1/faq_knowledge_base?select=question,answer&status=eq.published`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
          signal: controller.signal,
        }).then((r) => (r.ok ? r.json() : null)),
      ]);

      clearTimeout(timeoutId);

      if (Array.isArray(sectionsRes) && sectionsRes.length > 0) {
        sectionsRes.forEach((sec: any) => {
          if (sec?.key) {
            sectionsMap[sec.key] = sec.published_content || sec.content;
          }
        });
      }

      if (Array.isArray(faqsRes) && faqsRes.length > 0) {
        faqsList = faqsRes.map((f: any) => ({
          question: cleanText(f.question),
          answer: cleanText(f.answer),
        }));
      }
    } catch (e: any) {
      // Graceful fallback to snapshot
    }
  }

  // 2. Fallback to local snapshot.json if sections not loaded from Supabase
  if (Object.keys(sectionsMap).length === 0) {
    try {
      const snapshotPath = path.join(process.cwd(), "data", "snapshot.json");
      if (fs.existsSync(snapshotPath)) {
        const raw = fs.readFileSync(snapshotPath, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.sections)) {
          parsed.sections.forEach((sec: any) => {
            if (sec?.key) {
              sectionsMap[sec.key] = sec.published_content || sec.content;
            }
          });
        }
      }
    } catch (e: any) {
      // Fall through to hardcoded fallback
    }
  }

  // Fallback FAQs if not populated
  if (faqsList.length === 0 && Array.isArray(FALLBACK_FAQS)) {
    faqsList = FALLBACK_FAQS.filter((f) => f.status === "published").map((f) => ({
      question: cleanText(f.question),
      answer: cleanText(f.answer),
    }));
  }

  const hero = sectionsMap.hero || {};
  const about = sectionsMap.about || {};
  const contact = sectionsMap.contact || {};
  const experienceList = Array.isArray(sectionsMap.experience)
    ? sectionsMap.experience
    : defaultPortfolioData.experiences;
  const skillsData = sectionsMap.skills || defaultPortfolioData.skills;
  const servicesList = Array.isArray(sectionsMap.services)
    ? sectionsMap.services
    : defaultPortfolioData.services;
  const brandsList = Array.isArray(sectionsMap.brands)
    ? sectionsMap.brands
    : defaultPortfolioData.selectedBrands;
  const projectsList = Array.isArray(sectionsMap.projects)
    ? sectionsMap.projects
    : defaultPortfolioData.projects;
  const educationList = Array.isArray(sectionsMap.educationCertifications)
    ? sectionsMap.educationCertifications
    : defaultPortfolioData.educationCertifications;
  const testimonialsList = Array.isArray(sectionsMap.testimonials)
    ? sectionsMap.testimonials
    : defaultPortfolioData.testimonials;

  const data: StructuredPortfolioData = {
    name: cleanText(hero.name || defaultPortfolioData.personalInfo.name) || "Rashed Pervej",
    role: cleanText(hero.role || defaultPortfolioData.personalInfo.role) || "Senior Visualizer & Graphic Designer",
    headline: cleanText(hero.headline || defaultPortfolioData.personalInfo.headline) || "Brand Identity | Motion Graphics | Packaging",
    heroBio: cleanText(hero.heroBio || defaultPortfolioData.personalInfo.heroBio),
    aboutSummary: cleanText(about.aboutSummary || defaultPortfolioData.personalInfo.aboutSummary),
    aboutDetail: cleanText(about.aboutDetail || defaultPortfolioData.personalInfo.aboutDetail),
    location: cleanText(contact.location || hero.location || defaultPortfolioData.personalInfo.location) || "Jashore, Bangladesh",
    availability: cleanText(hero.availability || defaultPortfolioData.personalInfo.availability) || "Available for Remote & Hybrid globally",
    experienceYears: cleanText(hero.experienceYears || defaultPortfolioData.personalInfo.experienceYears) || "6+",
    email: cleanText(contact.email || defaultPortfolioData.personalInfo.email) || "rashedpervej2011@gmail.com",
    phone: cleanText(contact.phone || defaultPortfolioData.personalInfo.phone) || "+8801932623969",
    linkedin: cleanText(contact.linkedin || defaultPortfolioData.personalInfo.linkedin) || "linkedin.com/in/rpervej",
    behance: cleanText(contact.behance || defaultPortfolioData.personalInfo.behance) || "be.net/rashedpervej",
    experiences: experienceList,
    services: servicesList,
    skills: skillsData,
    brands: brandsList,
    projects: projectsList,
    educationCertifications: educationList,
    testimonials: testimonialsList,
    faqs: faqsList,
  };

  cachedStructuredData = data;
  return data;
}

/**
 * Loads dynamic knowledge base as formatted Markdown for Gemini System Instruction
 */
export async function getPortfolioKnowledge(): Promise<string> {
  const now = Date.now();
  if (cachedKnowledge && now - lastKnowledgeFetch < KNOWLEDGE_CACHE_TTL) {
    return cachedKnowledge;
  }

  const d = await getStructuredPortfolioData();

  const sections: string[] = [];

  sections.push(`### 1. IDENTITY & PROFILE
- **Name**: ${d.name}
- **Primary Title**: ${d.role}
- **Specializations**: ${d.headline}
- **Experience**: ${d.experienceYears} years (Over 7 years total design journey)
- **Base Location**: ${d.location}
- **Availability**: ${d.availability} (Open to Remote, Hybrid, Contract, and Full-time roles worldwide)
- **Summary**: ${d.aboutSummary || d.heroBio}
- **Design Philosophy**: ${d.aboutDetail || "Transforming ideas into cohesive brand experiences through strategic visual storytelling, rigorous pre-press print standards, and modern AI-enhanced workflows."}
`);

  sections.push(`### 2. CONTACT & HIRING CHANNELS
- **Email**: ${d.email}
- **WhatsApp / Phone**: ${d.phone}
- **Behance Portfolio**: https://${d.behance.replace(/^https?:\/\//, "")}
- **LinkedIn**: https://${d.linkedin.replace(/^https?:\/\//, "")}
`);

  sections.push(`### 3. PRICING & ENGAGEMENT MODEL
- **Pricing Strategy**: Rashed does not charge rigid, one-size-fits-all hourly rates. All pricing is customized and project-based depending on specific deliverables, scope, complexity, and timeline.
- **Service Categories for Quotes**:
  1. Brand Identity Systems (Logos, styleguides, typography, color palettes, stationery)
  2. Premium Packaging & 3D Dielines (Food supplements, consumer healthcare, retail boxes, vendor pre-press)
  3. Motion Graphics & Video Promos (Animated marketing ads, kinetic typography, Reels, showreels)
- **How to Get a Quote**: Clients are invited to reach out via WhatsApp at ${d.phone} or email at ${d.email} with their project brief for a personalized quote.
`);

  if (Array.isArray(d.experiences) && d.experiences.length > 0) {
    const expText = d.experiences
      .map((exp: any) => {
        const descItems = Array.isArray(exp.description)
          ? exp.description.map((item: string) => `    - ${cleanText(item)}`).join("\n")
          : `    - ${cleanText(exp.description)}`;
        return `- **${cleanText(exp.role)}** at **${cleanText(exp.company)}** (${cleanText(exp.period)} | ${cleanText(exp.location)} | ${cleanText(exp.type || "Full-Time")})\n${descItems}`;
      })
      .join("\n");
    sections.push(`### 4. PROFESSIONAL WORK EXPERIENCE\n${expText}\n`);
  }

  if (Array.isArray(d.services) && d.services.length > 0) {
    const srvText = d.services
      .map((s: any) => {
        const skills = Array.isArray(s.skills) ? s.skills.join(", ") : cleanText(s.skills);
        return `- **${cleanText(s.title)}**: ${cleanText(s.description)}\n  *Deliverables/Skills*: ${skills}`;
      })
      .join("\n");
    sections.push(`### 5. CORE DESIGN SERVICES\n${srvText}\n`);
  }

  const creativeTools = d.skills?.creativeTools || [];
  const coreCompetencies = d.skills?.coreCompetencies || [];
  const toolsFormatted = Array.isArray(creativeTools)
    ? creativeTools.map((t: any) => cleanText(t.name || t)).filter(Boolean).join(", ")
    : "Adobe Photoshop, Adobe Illustrator, Adobe After Effects, Canva, CapCut, WordPress, AI-Assisted Design";
  const compsFormatted = Array.isArray(coreCompetencies)
    ? coreCompetencies.map((c: any) => cleanText(c)).filter(Boolean).join(", ")
    : "Brand Identity, Packaging Design, Motion Graphics, Creative Direction, AI-Assisted Design";

  sections.push(`### 6. SKILLS & CREATIVE TOOLS
- **Software Toolkit**: ${toolsFormatted}
- **Core Competencies**: ${compsFormatted}
`);

  if (Array.isArray(d.brands) && d.brands.length > 0) {
    const brandsText = d.brands
      .map((b: any) => {
        const bName = cleanText(b.brandName || b.name);
        const market = cleanText(b.market || b.country || "Global");
        return `- **${bName}** (${market})`;
      })
      .join("\n");
    sections.push(`### 7. SELECTED CLIENT BRANDS & MARKETS\n${brandsText}\n`);
  }

  if (Array.isArray(d.projects) && d.projects.length > 0) {
    const projText = d.projects
      .map((p: any) => {
        const title = cleanText(p.title);
        const cat = cleanText(p.category || p.serviceProvided || "");
        const desc = cleanText(p.description);
        const year = cleanText(p.year);
        return `- **${title}** (${year}${cat ? ` | ${cat}` : ""}): ${desc}`;
      })
      .join("\n");
    sections.push(`### 8. FEATURED PORTFOLIO PROJECTS\n${projText}\n`);
  }

  if (Array.isArray(d.educationCertifications) && d.educationCertifications.length > 0) {
    const eduText = d.educationCertifications
      .map((e: any) => `- **${cleanText(e.title)}** – ${cleanText(e.institution)} (${cleanText(e.period || "")})`)
      .join("\n");
    sections.push(`### 9. EDUCATION & CERTIFICATIONS\n${eduText}\n`);
  }

  if (Array.isArray(d.testimonials) && d.testimonials.length > 0) {
    const testText = d.testimonials
      .map((t: any) => `> "${cleanText(t.quote)}"\n  — **${cleanText(t.author)}**, ${cleanText(t.role)} at ${cleanText(t.company)}`)
      .join("\n\n");
    sections.push(`### 10. CLIENT TESTIMONIALS & REVIEWS\n${testText}\n`);
  }

  if (d.faqs.length > 0) {
    const faqText = d.faqs
      .map((f: any) => `**Q: ${f.question}**\n**A:** ${f.answer}`)
      .join("\n\n");
    sections.push(`### 11. VERIFIED FAQ KNOWLEDGE\n${faqText}\n`);
  }

  const finalKnowledge = sections.join("\n");
  cachedKnowledge = finalKnowledge;
  lastKnowledgeFetch = now;
  return finalKnowledge;
}
