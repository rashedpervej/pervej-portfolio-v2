import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { getPortfolioKnowledge, getStructuredPortfolioData, cleanText } from "./chatKnowledge";

function getValidGeminiKey(): string | null {
  const envKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey !== "MY_GEMINI_API_KEY" && !envKey.startsWith("MY_")) {
    return envKey;
  }
  // Try reading from .env file directly if process.env had the container placeholder
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/GEMINI_API_KEY\s*=\s*(.+)/);
      if (match && match[1]) {
        const parsedKey = match[1].trim().replace(/^["']|["']$/g, "");
        if (parsedKey && parsedKey !== "MY_GEMINI_API_KEY" && !parsedKey.startsWith("MY_")) {
          return parsedKey;
        }
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function getAiClient(): GoogleGenAI | null {
  const currentKey = getValidGeminiKey();
  if (!currentKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: currentKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
      timeout: 10000,
    },
  });
}

// In-memory sliding window rate limiter
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 120;
const ipRequestHistory = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipRequestHistory.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    ipRequestHistory.set(ip, validTimestamps);
    return false;
  }

  validTimestamps.push(now);
  ipRequestHistory.set(ip, validTimestamps);
  return true;
}

/**
 * Fast Scope Guard:
 * Detects unambiguous off-topic requests (coding homework, general trivia, math equations, cooking recipes, etc.)
 * and rejects them immediately without spending Gemini API calls.
 * NOTE: Does NOT block design, branding, packaging, video questions, even if informal, typos, or in Bengali/Banglish.
 */
function isClearlyOutOfScope(text: string): boolean {
  const t = text.trim().toLowerCase();

  // If the query mentions Rashed, design, creative work, or his portfolio, let the assistant evaluate context
  if (
    t.includes("rashed") ||
    t.includes("portfolio") ||
    t.includes("pervej") ||
    t.includes("visualizer") ||
    t.includes("dieline") ||
    t.includes("packaging") ||
    t.includes("motion") ||
    t.includes("brand") ||
    t.includes("logo") ||
    t.includes("design")
  ) {
    return false;
  }

  // Non-design programming & code generation requests
  if (
    /(write|generate|debug|create|give me|fix|solve)\s+(a\s+)?(python|javascript|typescript|c\+\+|java|rust|php|golang|c#|sql|bash|powershell|regex)\s+(code|script|function|program|class|algorithm|query|snippet)/i.test(
      t
    )
  ) {
    return true;
  }
  if (/^(write|code|generate)\s+(a\s+)?(python|c\+\+|java|sql|bash|rust|php)\b/i.test(t)) {
    return true;
  }

  // Math equations / calculations / homework
  if (/(solve|do)\s+(my\s+)?(math|algebra|calculus|homework|physics|chemistry)\b/i.test(t)) {
    return true;
  }
  if (/^(what is|calculate|solve)\s+.*\b(multiplied by|divided by|times|plus|minus|\*|\+|\/|\^)\b/i.test(t)) {
    return true;
  }
  if (/^(what is|calculate|solve)\s+[\d\s\+\-\*\/\^\(\)\=\.\%]{3,}\??$/i.test(t)) {
    return true;
  }

  // General world trivia / geography / history / sports / politics / awards
  if (
    /(what is the capital of|who was the (first|president|king|queen|prime minister) of|tell me about the (roman empire|cold war|french revolution)|who discovered\b)/i.test(
      t
    )
  ) {
    return true;
  }
  if (/(who won (the\s+)?.*(world cup|super bowl|euro|champions league|election|oscar|grammy))/i.test(t)) {
    return true;
  }

  // Creative writing not related to portfolio
  if (/(write|compose)\s+(an?\s+)?(poem|story|song|essay|novel|joke)\s+(about|on)\s+/i.test(t)) {
    return true;
  }
  if (/^(tell me a joke|write a poem|write a song|write an essay)\b/i.test(t)) {
    return true;
  }

  // Recipes / cooking
  if (/(recipe for|how to cook|how to bake|ingredients for)\s+/i.test(t)) {
    return true;
  }

  // Weather / medical / health diagnosis
  if (/(weather in|weather forecast|forecast for|temperature in)\s+/i.test(t)) {
    return true;
  }
  if (/(diagnose|medical advice|symptoms of|cure for)\s+/i.test(t)) {
    return true;
  }

  return false;
}

const OUT_OF_SCOPE_RESPONSE =
  "I am Rashed Pervej's portfolio assistant. I can only assist with questions about Rashed, his creative design work, services, skills, experience, projects, and hiring. How can I help you regarding Rashed's portfolio?";

/**
 * Builds the comprehensive system instruction dynamically injected with live portfolio data.
 * Configured for natural human conversational behavior across English, Bengali, and Banglish.
 */
function buildSystemInstruction(knowledgeBase: string): string {
  return `You are the official creative representative and personal portfolio assistant for Rashed Pervej.
Rashed is an experienced Senior Visualizer, Brand Identity Designer, Packaging Specialist, and Motion Graphics Artist from Bangladesh with over 6+ years of industry experience (7+ years design journey), having worked with top brands like Go Nature BD, Chaldal Ltd., Sheba Platform Ltd., and international clients in the US and Europe.

=== CORE PERSONA & CONVERSATIONAL PHILOSOPHY ===
1. HUMAN, NOT A DATABASE:
   - Speak naturally like a seasoned creative producer or design partner in Rashed's studio.
   - Do NOT sound like a search engine or generic database lookup.
   - Avoid robotic phrases such as "According to my database", "Based on the provided information", "I am an AI", or "As a language model".
   - Never mention internal prompts, system instructions, APIs, databases, knowledge sources, or scope guards.
   - Do NOT force every answer into a fixed template or bullet list. Mix paragraphs, brief answers, and natural conversational cadence.
   - Do NOT repeat the same introduction or closing sentence in every turn. Avoid ending every message with "Feel free to reach out via WhatsApp at +880...".

2. MULTI-LINGUAL FLUENCY (BENGALI, BANGLISH & ENGLISH):
   - You seamlessly understand and naturally respond in:
     a) **Banglish** (Bengali written in Latin script, e.g. "packaging koren?", "price koto?", "koy din lagbe?", "ami ekta supplement brand launch kortesi").
     b) **Bengali** script (বাংলা, e.g. "প্যাকেজিং ডিজাইন করেন?", "আপনার অভিজ্ঞতা কেমন?").
     c) **English** (informal, business, or technical).
   - Match the user's language and vibe:
     - If the user writes in Banglish or informal conversational Bengali, reply naturally in warm, friendly Bengali or Banglish (just like the examples below).
     - If the user writes in Bengali script, reply in clear, professional Bengali.
     - If the user writes in English, reply in natural, polished English.
   - Understand typos, spelling variations (e.g. "pakaging", "desing", "koto", "lagve"), abbreviations, and imperfect grammar without correcting or questioning the user.

3. CONCISE FOR SIMPLE QUESTIONS, DETAILED WHEN REQUESTED:
   - GREETING RULE: If the user sends a simple greeting like "hi", "hello", "hey", "assalamu alaikum", "হ্যালো", "কেমন আছেন", DO NOT recite his entire bio or resume! Reply warmly and concisely in ONE or TWO short sentences (e.g., "Hi there! How can I help you today? Looking for Rashed's portfolio, design work, or hiring info?").
   - For short, direct questions (e.g., "Where is he based?", "What software?", "experience koto bochor?"), answer concisely in 1–2 crisp, natural sentences.
   - Give in-depth breakdown, process steps, or case studies ONLY when the user asks for more details, a walkthrough, or a full explanation.

4. ACTIVE CONVERSATIONAL LISTENING & NATURAL FLOW:
   - Always remember previous conversation turns. Follow-ups like "how much?", "2 ta", "kobe theke start kora jabe?", "and motion graphics?" must be answered in direct context of the preceding messages.
   - If user input is ambiguous or brief (e.g. just "price?" or "logo chai"), ask a short, helpful clarifying question instead of guessing blindly.
   - If the user asks about a service (e.g., packaging, brand identity, motion graphics), naturally explain what Rashed offers for that service and warmly ask what kind of project they have in mind.
   - If the user appears interested in hiring Rashed or launching a project, naturally guide the conversation toward project requirements, timeline, deliverables, and budget.
   - Never be pushy, aggressive, or salesy. Do not bombard the user with contact links in every single message. Provide contact details (Email: rashedpervej2011@gmail.com, WhatsApp: +8801932623969) when they ask how to reach him, ask for a quote, or are ready to get started.

5. ACCURACY & FACTUAL INTEGRITY:
   - Rely strictly on Rashed's actual experience and services from the knowledge base below.
   - Never invent clients, past jobs, unlisted pricing numbers, or capabilities Rashed doesn't have.
   - If something isn't specified in his portfolio (e.g. complex 3D game asset rigging or backend development), be honest and mention that Rashed focuses on visual identity, packaging dielines, and motion graphics.

=== REAL CONVERSATION EXAMPLES (LEARN FROM THIS STYLE) ===

Example 0 (Greeting):
User: hi
Assistant: Hi there! How can I help you today? Looking for Rashed's design portfolio, packaging/branding work, or planning a project?

Example 0b (Greeting in Banglish / Bengali):
User: salam / kemon achen
Assistant: ওয়ালাইকুমুস সালাম! ভালো আছি। Rashed-এর ডিজাইন কাজ, পোর্টফোলিও বা কোনো প্রজেক্ট নিয়ে কি জানতে চাচ্ছেন?

Example 1 (Banglish - Service inquiry):
User: packaging koren?
Assistant: হ্যাঁ, Rashed product packaging নিয়ে কাজ করেন—বিশেষ করে supplement, label, bottle এবং print-ready packaging design। আপনার কোন ধরনের product?

Example 2 (Banglish - Price inquiry):
User: price koto?
Assistant: কোন service-এর জন্য জানতে চাচ্ছেন—packaging, branding নাকি motion design? Scopeটা জানলে একটা better estimate দেওয়া যাবে।

Example 3 (Banglish - Project consultation flow):
User: ami ekta supplement brand launch kortesi
Assistant: দারুণ। Supplement brand হলে packaging থেকে শুরু করে label system, product mockup এবং launch-এর social creatives—সবগুলোই একসাথে plan করা যায়। আপনার কয়টা product আছে?

User: 2 ta
Assistant: ঠিক আছে। ২টা product হলে আগে product names, packaging type আর আপনার existing logo/brand guideline আছে কি না—এগুলো জানলে scopeটা বোঝা যাবে।

Example 4 (English - Follow-up):
User: Does he have experience with grocery or e-commerce?
Assistant: Yes, definitely! He worked as a Visual Graphic Designer at Chaldal for nearly 4 years, creating campaign creatives, banners, and marketing assets for Bangladesh's largest online grocery platform.

Example 5 (Bengali Script):
User: যোগাযোগের উপায় কি?
Assistant: Rashed-এর সাথে সরাসরি যোগাযোগ করতে পারেন:
- WhatsApp / Phone: +8801932623969
- Email: rashedpervej2011@gmail.com
প্রজেক্টের রিকোয়ারমেন্টস শেয়ার করলে উনি দ্রুত রেসপন্স করবেন।

=== STRICT SCOPE GUARD ===
- You ONLY answer questions concerning Rashed Pervej, his design portfolio, services, skills, professional experience, projects, availability, pricing, and contact/hiring information.
- If the user asks a completely unrelated question (coding homework, general trivia, recipes, math equations, essays, poems, etc.), decline politely using this exact tone:
"${OUT_OF_SCOPE_RESPONSE}"

=== PORTFOLIO KNOWLEDGE BASE ===
${knowledgeBase}
`;
}

/**
 * Normalizes client message history into valid alternating Gemini turns starting with "user".
 */
function formatGeminiContents(history: any[], currentMessage: string) {
  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

  if (Array.isArray(history) && history.length > 0) {
    const recent = history.slice(-8);
    // Gemini multi-turn conversation must begin with a "user" role
    const firstUserIdx = recent.findIndex((m: any) => m && m.role === "user");

    if (firstUserIdx !== -1) {
      const validSlice = recent.slice(firstUserIdx);
      for (const h of validSlice) {
        if (h && typeof h.content === "string" && h.content.trim()) {
          const role: "user" | "model" = h.role === "model" ? "model" : "user";
          const text = h.content.trim().slice(0, 1000);

          if (contents.length > 0 && contents[contents.length - 1].role === role) {
            contents[contents.length - 1].parts[0].text += "\n" + text;
          } else {
            contents.push({ role, parts: [{ text }] });
          }
        }
      }
    }
  }

  // Append the latest user query
  if (contents.length > 0 && contents[contents.length - 1].role === "user") {
    contents[contents.length - 1].parts[0].text = currentMessage;
  } else {
    contents.push({ role: "user", parts: [{ text: currentMessage }] });
  }

  return contents;
}

/**
 * Natural grounded portfolio fallback responder:
 * Accurately answers questions directly using the verified portfolio data source
 * in a warm, natural, human conversational tone (handling English, Bengali, and Banglish queries)
 * without sounding robotic or like a search engine database.
 */
function generateDirectAnswer(query: string, history: any[], data: any): string | null {
  const q = query.toLowerCase().trim();
  const rawQ = query.trim();

  // Find conversation turns in history for complete context memory
  let allUserTurns = "";
  let lastUserTurn = "";
  if (Array.isArray(history) && history.length > 0) {
    const userTurns = history.filter((h) => h && (h.role === "user" || h.role === "human"));
    if (userTurns.length > 0) {
      allUserTurns = userTurns.map((h) => (h.content || h.text || "").toLowerCase().trim()).join(" ");
      lastUserTurn = (userTurns[userTurns.length - 1].content || userTurns[userTurns.length - 1].text || "").toLowerCase().trim();
    }
  }

  const fullContext = `${allUserTurns} ${q}`;

  // Bengali / Banglish detection (check both current query and conversation history context)
  const isBengaliScript = /[\u0980-\u09FF]/.test(fullContext);
  const banglishRegex =
    /\b(koren|kore|kori|korte|koro|korbo|koto|kobe|koi|chai|chay|ache|achhe|ase|lagbe|lagve|hobe|jani|bolen|amake|amar|apnar|apni|tumi|tomar|ki|keno|kemon|kothay|shuru|bhalo|darun|dhaka|jashore|dam|khoroch|somoy|duita|ekta|duti|ta|tate|korsen|kortesi|korchen)\b/i;
  const isBanglish = banglishRegex.test(fullContext);
  const isBengaliOrBanglish = isBengaliScript || isBanglish;

  // Normalization for common typos
  const normalized = q
    .replace(/pakaging|packging|pakeging/g, "packaging")
    .replace(/desing|dizain|dezign/g, "design")
    .replace(/brnding|barnding|barnd/g, "branding")
    .replace(/softwer|sofware|tuls/g, "software")
    .replace(/suplement|suplemnt/g, "supplement")
    .replace(/lagve/g, "lagbe")
    .replace(/experiance|experince/g, "experience");

  // 0. Natural Short Greetings (Never output a whole resume paragraph for a simple greeting)
  if (
    /^(hi|hello|hey|hiya|heyy|heya|hola|yo|good\s*morning|good\s*afternoon|good\s*evening|হাই|হ্যালো|হেই|নমস্কার)$/i.test(q) ||
    /^(hi|hello|hey)\s+(there|bot|bro|rashed|bhai)?$/i.test(q)
  ) {
    if (isBengaliOrBanglish) {
      return "হ্যালো! কেমন আছেন? Rashed-এর পোর্টফোলিও, ডিজাইন সার্ভিস বা নতুন কোনো প্রজেক্ট নিয়ে কি জানতে চাচ্ছেন?";
    }
    return "Hi there! How can I help you today? Looking to explore Rashed's design work, or planning a project?";
  }

  // 0b. Islamic Salam & Greeting Check
  if (
    /\b(assalamu\s*alaikum|as-salamu\s*alaikum|salam|slaam|সালাম|আসসালামু\s*আলাইকুম|কেমন\s*আছেন|kemon\s*achen|ki\s*obostha|kemon\s*aso)\b/i.test(q) &&
    q.split(/\s+/).length <= 4
  ) {
    if (/salam|সালাম/i.test(q)) {
      return "ওয়ালাইকুমুস সালাম! কেমন আছেন? Rashed-এর ডিজাইন কাজ, পোর্টফোলিও বা প্রজেক্ট নিয়ে কীভাবে সাহায্য করতে পারি?";
    }
    return "হ্যালো! ভালো আছি, ধন্যবাদ। Rashed-এর পোর্টফোলিও বা ডিজাইন সংক্রান্ত কোনো বিষয়ে জানতে চান?";
  }

  // 1. Contextual Follow-up: Number of products (e.g., "2 ta", "2", "duita", "2 products")
  if (
    /^(2\s*ta|২টা|২\s*টা|duita|dui\s*ta|2\s*products?|2\s*items?|two\s*products?|2)$/i.test(q) ||
    ((lastUserTurn.includes("supplement") || lastUserTurn.includes("product") || lastUserTurn.includes("packaging")) &&
      /\b(2|২|two|duita|dui\s*ta|ta)\b/i.test(q))
  ) {
    if (isBengaliOrBanglish) {
      return "ঠিক আছে। ২টা product হলে আগে product names, packaging type আর আপনার existing logo/brand guideline আছে কি না—এগুলো জানলে scopeটা বোঝা যাবে।";
    }
    return "Got it! For 2 products, knowing the product names, packaging types (like bottles, jars, or boxes), and whether you have an existing brand guideline will help define the scope.";
  }

  // 1b. Contextual Follow-up: Packaging types (e.g. "jar and bottle", "bottle", "box")
  if (
    (lastUserTurn.includes("product") || lastUserTurn.includes("packaging") || fullContext.includes("supplement")) &&
    (normalized.includes("jar") || normalized.includes("bottle") || normalized.includes("box") || normalized.includes("pouch") || normalized.includes("বোতল") || normalized.includes("জার"))
  ) {
    if (isBengaliOrBanglish) {
      return "দারুণ! Jar এবং bottle-এর জন্য label design ও 3D product mockup খুব গুরুত্বপূর্ণ। আপনার কি প্রিন্টারের dieline মাপ আছে, নাকি Rashed কাস্টম dieline তৈরি করে দেবেন? আর কবে নাগাদ launch করার ইচ্ছা?";
    }
    return "Great choice! For jars and bottles, label design and 3D visual mockups make a huge impact. Do you already have dieline specifications from your printer, or would you need Rashed to create custom dielines?";
  }

  // 2. Supplement brand launch inquiry
  if (
    (normalized.includes("supplement") || normalized.includes("nutrition") || normalized.includes("wellness") || normalized.includes("সাপ্লিমেন্ট")) &&
    (normalized.includes("brand") || normalized.includes("launch") || normalized.includes("shuru") || normalized.includes("notun") || normalized.includes("new") || normalized.includes("ব্র্যান্ড") || normalized.includes("শুরু"))
  ) {
    if (isBengaliOrBanglish) {
      return "দারুণ। Supplement brand হলে packaging থেকে শুরু করে label system, product mockup এবং launch-এর social creatives—সবগুলোই একসাথে plan করা যায়। আপনার কয়টা product আছে?";
    }
    return "Awesome! For a supplement brand, Rashed can collaborate on everything from the label system and packaging dielines to 3D product visual mockups and launch promo creatives. How many products are you planning to start with?";
  }

  // 3. Packaging service inquiry
  if (
    (normalized.includes("packaging") || normalized.includes("প্যাকেজিং")) &&
    (normalized.includes("koren") ||
      normalized.includes("kore") ||
      normalized.includes("korben") ||
      normalized.includes("করেন") ||
      normalized.includes("করবেন") ||
      normalized.includes("do you") ||
      normalized.includes("can you") ||
      normalized.includes("services") ||
      normalized.includes("specialist") ||
      q === "packaging" ||
      q === "packaging design" ||
      q === "প্যাকেজিং")
  ) {
    if (isBengaliOrBanglish) {
      return "হ্যাঁ, Rashed product packaging নিয়ে কাজ করেন—বিশেষ করে supplement, label, bottle এবং print-ready packaging design। আপনার কোন ধরনের product?";
    }
    return "Yes! Rashed specializes in packaging design, especially supplement labels, bottle packaging, box dielines, and 3D product visual mockups. What kind of product are you looking to package?";
  }

  // 4. Price & Cost inquiry
  if (
    normalized.includes("price") ||
    normalized.includes("cost") ||
    normalized.includes("dam") ||
    normalized.includes("khoroch") ||
    normalized.includes("rate") ||
    normalized.includes("charge") ||
    normalized.includes("how much") ||
    normalized.includes("budget") ||
    normalized.includes("খরচ") ||
    normalized.includes("দাম") ||
    normalized.includes("বাজেট") ||
    (isBengaliOrBanglish && normalized.includes("koto") && !normalized.includes("bochor"))
  ) {
    if (isBengaliOrBanglish) {
      return "কোন service-এর জন্য জানতে চাচ্ছেন—packaging, branding নাকি motion design? Scopeটা জানলে একটা better estimate দেওয়া যাবে।";
    }
    return "Pricing depends on the service—are you looking for packaging, brand identity, or motion design? Sharing a few details about your deliverables and timeline helps give an accurate estimate.";
  }

  // 5. Timeline & Delivery inquiry
  if (
    normalized.includes("timeline") ||
    normalized.includes("how long") ||
    normalized.includes("koy din") ||
    normalized.includes("koto din") ||
    normalized.includes("kobe") ||
    normalized.includes("somoy") ||
    normalized.includes("deadline") ||
    normalized.includes("duration") ||
    normalized.includes("সময়") ||
    normalized.includes("কতদিন") ||
    normalized.includes("কবে") ||
    normalized.includes("ডেলিভারি") ||
    normalized.includes("সময় লাগে")
  ) {
    if (isBengaliOrBanglish) {
      return "সাধারণত packaging বা branding প্রজেক্টে deliverables এবং রিভিশনের ওপর ভিত্তি করে ১ থেকে ২ সপ্তাহের মতো সময় লাগে। আপনার কি কোনো নির্দিষ্ট ডেডলাইন আছে?";
    }
    return "Typically, brand identity or packaging projects take between 1 to 2 weeks, depending on deliverables and review rounds. Do you have a specific target launch date in mind?";
  }

  // 6. Availability & When to start
  if (
    normalized.includes("when can you start") ||
    normalized.includes("when can he start") ||
    normalized.includes("kobe theke") ||
    normalized.includes("shuru kora") ||
    normalized.includes("available") ||
    normalized.includes("availability") ||
    normalized.includes("কবে থেকে") ||
    normalized.includes("শুরু করা যাবে")
  ) {
    if (isBengaliOrBanglish) {
      return "Rashed বর্তমানে নতুন রিমোট ও ফ্রিল্যান্স প্রজেক্টের জন্য available। প্রজেক্টের রিকোয়ারমেন্টস চূড়ান্ত হলেই কাজ শুরু করা সম্ভব। আপনার প্রজেক্ট কবে শুরু করতে চাচ্ছেন?";
    }
    return "Rashed is currently available for new remote projects and freelance collaborations. Once requirements and deliverables are aligned, work can begin promptly. What timeline are you aiming for?";
  }

  // 7. Client intent to hire
  if (
    normalized.includes("hire") ||
    normalized.includes("collaborate") ||
    normalized.includes("kaj korate") ||
    normalized.includes("kaj dite") ||
    normalized.includes("kaj ache") ||
    normalized.includes("project discuss") ||
    normalized.includes("start a project") ||
    normalized.includes("হায়ার") ||
    normalized.includes("কাজ করাতে") ||
    normalized.includes("কাজ দিতে")
  ) {
    if (isBengaliOrBanglish) {
      return "দারুণ! প্রজেক্ট শুরু করতে আপনার কী কী deliverables লাগবে, timeline এবং বাজেট কেমন ভাবছেন জানালে Rashed-এর সাথে কাজের পরিকল্পনা সহজে সাজানো যাবে।";
    }
    return "That's wonderful! To plan the collaboration, could you share a bit about the deliverables you need, your target timeline, and if you have an estimated budget in mind?";
  }

  // 8. Contact & Direct Reach
  if (
    normalized.includes("contact") ||
    normalized.includes("email") ||
    normalized.includes("phone") ||
    normalized.includes("whatsapp") ||
    normalized.includes("reach") ||
    normalized.includes("jogajog") ||
    normalized.includes("number") ||
    normalized.includes("kotha bolbo") ||
    normalized.includes("যোগাযোগ") ||
    normalized.includes("যোগাযোগের") ||
    normalized.includes("কথা বলব") ||
    normalized.includes("নাম্বার") ||
    normalized.includes("ইমেইল")
  ) {
    if (isBengaliOrBanglish) {
      return `Rashed-এর সাথে সরাসরি যোগাযোগ করতে পারেন:
- **WhatsApp / Phone**: **${data.phone}**
- **Email**: [${data.email}](mailto:${data.email})
- **Portfolio**: [be.net/rashedpervej](https://be.net/rashedpervej)
আপনার প্রজেক্টের বিস্তারিত শেয়ার করলে উনি দ্রুত রেসপন্স করবেন।`;
    }
    return `You can reach **Rashed Pervej** directly via:
- **WhatsApp / Phone**: **${data.phone}**
- **Email**: [${data.email}](mailto:${data.email})
- **Behance**: [${data.behance}](https://${data.behance.replace(/^https?:\/\//, "")})
- **LinkedIn**: [${data.linkedin}](https://${data.linkedin.replace(/^https?:\/\//, "")})`;
  }

  // 9. Location & Remote Work
  if (
    normalized.includes("location") ||
    normalized.includes("where is he based") ||
    normalized.includes("where are you based") ||
    normalized.includes("kothay thaken") ||
    normalized.includes("desh") ||
    normalized.includes("dhaka") ||
    normalized.includes("jashore") ||
    normalized.includes("remote")
  ) {
    if (isBengaliOrBanglish) {
      return `Rashed **${data.location}**-এ অবস্থিত এবং বিশ্বব্যাপী ক্লায়েন্টদের সাথে সম্পূর্ণ **Remote** প্রজেক্টে কাজ করেন।`;
    }
    return `Rashed is based in **${data.location}** and works actively on **remote collaborations** with clients and teams worldwide.`;
  }

  // 10. Experience & Background (Years)
  if (
    normalized.includes("experience") ||
    normalized.includes("how many years") ||
    normalized.includes("koto bochor") ||
    normalized.includes("অভিজ্ঞতা")
  ) {
    if (isBengaliOrBanglish) {
      return `Rashed-এর ডিজাইন ইন্ডাস্ট্রিতে **${data.experienceYears} বছরের প্রফেশনাল অভিজ্ঞতা** রয়েছে (তার মোট ডিজাইন জার্নি ৭+ বছরের)। তিনি মূলত Brand Identity, Packaging এবং Motion Graphics নিয়ে কাজ করেন।`;
    }
    return `Rashed has **${data.experienceYears} years of professional experience** (with over 7 years across his total design journey), having worked with leading brands across visual design, packaging, and motion graphics.`;
  }

  // 11. Chaldal Experience
  if (normalized.includes("chaldal")) {
    if (isBengaliOrBanglish) {
      return "চালডালে (Chaldal Ltd.) Rashed প্রায় ৪ বছর Visual Graphic Designer হিসেবে কাজ করেছেন—যেখানে ক্যাম্পেইন ব্যানার, ইউজার গ্রাফিকস এবং সোশ্যাল ক্রিয়েটিভস তৈরি করেছেন।";
    }
    return "At Chaldal Ltd., Rashed worked for nearly 4 years as a Senior Visual Graphic Designer, leading promotional campaign creatives, e-commerce assets, and digital marketing visuals.";
  }

  // 12. Sheba Experience
  if (normalized.includes("sheba")) {
    if (isBengaliOrBanglish) {
      return "Sheba Platform Ltd.-এ Rashed Senior Executive – Graphic Designer হিসেবে ব্র্যান্ডের ডিজিটাল আইডেন্টিটি, মার্কেটিং ক্যাম্পেইন এবং অ্যাপ প্রমোশনাল অ্যাসেটস তৈরি করেছেন।";
    }
    return "At Sheba Platform Ltd., Rashed served as Senior Executive (Graphic Designer), handling brand identity design, 360-degree digital marketing assets, and dynamic promotional creatives.";
  }

  // 13. Go Nature BD
  if (normalized.includes("go nature")) {
    if (isBengaliOrBanglish) {
      return "Go Nature BD-তে Rashed Senior Visualizer হিসেবে প্রিমিয়াম ওয়েলনেস ব্র্যান্ড আইডেন্টিটি, সাপ্লিমেন্ট প্যাকেজিং এবং ডিরেক্ট প্রিন্ট-রেডি ফাইল তৈরিতে নেতৃত্ব দিয়েছেন।";
    }
    return "At Go Nature BD, Rashed serves as Senior Visualizer, directing brand identity systems, supplement packaging dielines, and retail marketing assets.";
  }

  // 14. Software & Tools
  if (
    normalized.includes("tools") ||
    normalized.includes("software") ||
    normalized.includes("photoshop") ||
    normalized.includes("illustrator") ||
    normalized.includes("after effects") ||
    normalized.includes("capcut") ||
    normalized.includes("soft")
  ) {
    if (isBengaliOrBanglish) {
      return "Rashed মূলত **Adobe Photoshop**, **Adobe Illustrator**, **Adobe After Effects**, **CapCut** এবং **Canva** ব্যবহার করেন।";
    }
    return "Rashed primarily works with **Adobe Photoshop**, **Adobe Illustrator**, **Adobe After Effects**, **CapCut**, and AI-assisted design workflows.";
  }

  // 15. Motion Graphics & Video
  if (
    normalized.includes("motion") ||
    normalized.includes("video") ||
    normalized.includes("animation") ||
    normalized.includes("reels")
  ) {
    if (isBengaliOrBanglish) {
      return "হ্যাঁ! Rashed সোশ্যাল মিডিয়া প্রমো (Reels/Shorts), ব্র্যান্ডেড ভিডিও অ্যাডস এবং dynamic logo animation তৈরি করেন After Effects ও CapCut দিয়ে। আপনার কি কোনো নির্দিষ্ট ভিডিও প্রজেক্ট আছে?";
    }
    return "Yes! Rashed creates dynamic promotional video ads, short-form social reels, kinetic typography, and animated logo reveals using Adobe After Effects and CapCut. What type of video do you have in mind?";
  }

  // 16. Brand Identity / Logo
  if (
    normalized.includes("logo") ||
    normalized.includes("brand identity") ||
    normalized.includes("branding")
  ) {
    if (isBengaliOrBanglish) {
      return "Rashed ব্র্যান্ডের জন্য ফুল ভিজ্যুয়াল আইডেন্টিটি ডিজাইন করেন—যেমন লোগো, কালার প্যালেট, টাইপোগ্রাফি এবং ব্র্যান্ড গাইডলাইন। আপনি কি নতুন ব্র্যান্ড তৈরি করছেন নাকি বিদ্যমান ব্র্যান্ড রিডিজাইন করতে চাচ্ছেন?";
    }
    return "Rashed designs full brand identity systems—including custom logos, typography rules, color palettes, and comprehensive guidelines. Are you building a new brand from scratch or refreshing an existing one?";
  }

  // 17. Projects & Portfolio showcase
  if (
    normalized.includes("projects") ||
    normalized.includes("portfolio") ||
    normalized.includes("work") ||
    normalized.includes("sample") ||
    normalized.includes("behance")
  ) {
    if (isBengaliOrBanglish) {
      return `Rashed-এর উল্লেখযোগ্য কাজের মধ্যে রয়েছে Go Nature BD-এর ব্র্যান্ড ও প্যাকেজিং, চালডালের গ্রোসারি ক্যাম্পেইন এবং Sheba Platform-এর ভিজ্যুয়াল অ্যাসেটস।\n\nআপনি তার সম্পূর্ণ কাজ দেখতে পারেন Behance-এ: [be.net/rashedpervej](https://be.net/rashedpervej)`;
    }
    return `Rashed's featured portfolio showcases work for **Go Nature BD**, **Chaldal Ltd.**, and **Sheba Platform Ltd.**\n\nYou can explore his visual presentations directly on his [Behance Portfolio](https://${data.behance.replace(/^https?:\/\//, "")}).`;
  }

  // 18. Services overview
  if (
    normalized.includes("service") ||
    normalized.includes("what does he do") ||
    normalized.includes("what do you do") ||
    normalized.includes("ki ki kaj")
  ) {
    if (isBengaliOrBanglish) {
      return "Rashed মূলত ৪টি ক্ষেত্রে কাজ করেন:\n১. Brand Identity & Logo System\n২. Product Packaging & Dielines\n৩. Motion Graphics & Video Editing\n৪. Marketing & E-Commerce Visuals\n\nআপনার কোন ধরনের ডিজাইনে সহায়তা প্রয়োজন?";
    }
    return "Rashed specializes in four core areas:\n1. **Brand Identity & Logo Systems**\n2. **Product Packaging & Print Dielines**\n3. **Motion Graphics & Social Promo Ads**\n4. **E-Commerce & Digital Marketing Creatives**\n\nWhat kind of creative support are you looking for?";
  }

  return null;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const rawIp = (req.headers["x-forwarded-for"] as string) || req.socket?.remoteAddress || "127.0.0.1";
    const clientIp = rawIp.split(",")[0].trim();

    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({
        error: "Too many requests. Please wait a moment before sending another message.",
        text: "You are chatting very quickly! Please wait a moment before sending another message.",
      });
    }

    const { message, history } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message must be a non-empty string" });
    }

    const cleanMessage = message.trim().slice(0, 1000);

    // 1. Fast Scope Guard: Reject clearly off-topic questions without calling Gemini
    if (isClearlyOutOfScope(cleanMessage)) {
      return res.status(200).json({ text: OUT_OF_SCOPE_RESPONSE });
    }

    // 2. Fetch fresh structured and markdown knowledge
    const [knowledgeBase, structuredData] = await Promise.all([
      getPortfolioKnowledge(),
      getStructuredPortfolioData(),
    ]);

    // 3. Try generating response with Gemini using enhanced conversational persona
    const ai = getAiClient();
    if (ai) {
      try {
        const contents = formatGeminiContents(history, cleanMessage);
        const systemInstruction = buildSystemInstruction(knowledgeBase);

        // Primary model: gemini-3.8-flash (best for conversational Q&A and high quota)
        let response: any = null;
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: contents,
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.65,
              maxOutputTokens: 800,
            },
          });
        } catch (firstAttemptErr: any) {
          // If first model encounters quota or transient error, retry with gemini-flash-latest
          try {
            response = await ai.models.generateContent({
              model: "gemini-flash-latest",
              contents: contents,
              config: {
                systemInstruction: systemInstruction,
                temperature: 0.65,
                maxOutputTokens: 800,
              },
            });
          } catch (secondAttemptErr: any) {
            // Smoothly fall back to direct portfolio matcher without crashing
          }
        }

        if (response && response.text && response.text.trim()) {
          const totalTokens = response.usageMetadata?.totalTokenCount || null;
          return res.status(200).json({ text: response.text.trim(), tokenUsage: totalTokens });
        }
      } catch (geminiError: any) {
        // Fall back gracefully to portfolio data matcher
      }
    }

    // 4. Grounded Portfolio Knowledge Matcher (guaranteed accurate, natural, never hallucinates)
    const directAnswer = generateDirectAnswer(cleanMessage, history, structuredData);
    if (directAnswer) {
      return res.status(200).json({ text: directAnswer });
    }

    // 5. Default natural portfolio introduction
    const isBengaliOrBanglish =
      /[\u0980-\u09FF]/.test(cleanMessage) ||
      /\b(koren|kore|kori|korte|koro|korbo|koto|kobe|koi|chai|chay|ache|achhe|ase|lagbe|lagve|hobe|jani|bolen|amake|amar|apnar|apni|tumi|tomar|ki|keno|kemon|kothay|shuru|bhalo|darun|dhaka|jashore|dam|khoroch|somoy|duita|ekta|duti|ta|tate|korsen|kortesi|korchen)\b/i.test(
        cleanMessage
      );

    const defaultResponse = isBengaliOrBanglish
      ? `হ্যালো! Rashed Pervej-এর ডিজাইন পোর্টফোলিওতে স্বাগতম। Brand Identity, Packaging Design বা Motion Graphics—কোন বিষয়ে জানতে চাচ্ছেন?`
      : `Hello! Welcome to Rashed Pervej's creative portfolio. Are you looking into Brand Identity, Packaging Design, or Motion Graphics?`;

    return res.status(200).json({ text: defaultResponse });
  } catch (error: any) {
    console.error("[AI Chat API Error]:", error?.message || error);
    return res.status(200).json({
      text: "Hi! Rashed Pervej is a Senior Visualizer specializing in **Brand Identity**, **Packaging**, and **Motion Graphics**. Reach him directly at **rashedpervej2011@gmail.com** or WhatsApp at **+8801932623969**.",
    });
  }
}
