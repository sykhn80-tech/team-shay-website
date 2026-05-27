import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { createAgentSessionToken } from "./_core/agentSession";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, agentProcedure, publicProcedure, router } from "./_core/trpc";
import {
  authenticateAgent,
  createAgentProperty,
  createLeadSubmission,
  createStaffAccount,
  createTestimonial,
  deleteAgentProperty,
  deletePropertyById,
  deleteStaffAccount,
  deleteTestimonial,
  ensureCmsSeedData,
  ensureDefaultAgentAccounts,
  getAgentPropertyById,
  getHomepagePayload,
  getPropertyById,
  getSiteSettings,
  listAgentProperties,
  listAllProperties,
  listAllTestimonials,
  listLeadSubmissions,
  listPublishedProperties,
  passwordFromAgentEmail,
  listStaffAccounts,
  updateAgentProperty,
  updatePropertyById,
  updateSiteSettings,
  updateStaffAccount,
  updateTestimonial,
  hashAgentPassword,
  listCrmLeads,
  getCrmLeadById,
  createCrmLead,
  updateCrmLead,
  deleteCrmLead,
  bulkImportCrmLeads,
  deduplicateCrmLeads,
} from "./db";
import { storagePut } from "./storage";

const imageInputSchema = z.object({
  name: z.string().min(1),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  dataBase64: z.string().min(1),
});

const storedOrUploadedImageSchema = z.union([imageInputSchema, z.string().url(), z.null()]).optional();

const propertyInputSchema = z.object({
  agentId: z.number().int().positive().optional(),
  title: z.string().min(2),
  address: z.string().min(2),
  street: z.string().trim().optional().nullable(),
  neighborhood: z.string().min(2),
  city: z.string().min(2).default("ירושלים"),
  price: z.number().int().positive(),
  rooms: z.number().int().positive(),
  sqm: z.number().int().positive(),
  builtSqm: z.number().int().positive().optional().nullable(),
  outdoorSpace: z.string().trim().optional().nullable(),
  floor: z.number().int().optional().nullable(),
  status: z.enum(["חדש", "בלעדי", "למכירה", "נמכר"]),
  description: z.string().min(10),
  descriptionHtml: z.string().optional().nullable(),
  isPublished: z.boolean().default(true),
  featuredImageIndex: z.number().int().min(0).optional().nullable(),
  featuredImageUrl: z.string().min(1).optional().nullable(),
  images: z.array(imageInputSchema).max(12).default([]),
});

const staffInputSchema = z.object({
  accountRole: z.enum(["agent", "admin"]).default("agent"),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  password: z.string().min(6).optional(),
  roleTitle: z.string().min(2),
  bio: z.string().optional().nullable(),
  photoUrl: storedOrUploadedImageSchema,
  sortOrder: z.number().int().default(0),
  isFeaturedOnHomepage: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

const testimonialInputSchema = z.object({
  quote: z.string().min(4),
  sourceName: z.string().min(2),
  sourceLabel: z.string().min(2).default("WhatsApp"),
  stars: z.number().int().min(1).max(5).default(5),
  whatsappImageUrl: storedOrUploadedImageSchema,
  displayOrder: z.number().int().min(1).default(1),
  isPublished: z.boolean().default(true),
});

const siteSettingsInputSchema = z.object({
  siteName: z.string().min(2).optional(),
  headerLogoUrl: storedOrUploadedImageSchema,
  footerLogoUrl: storedOrUploadedImageSchema,
  landsmanLogoUrl: storedOrUploadedImageSchema,
  heroBackgroundUrl: storedOrUploadedImageSchema,
  shayAboutImageUrl: storedOrUploadedImageSchema,
  heroHeadline: z.string().min(2).optional(),
  heroTypingText: z.string().min(2).optional(),
  whatsappLink: z.string().url().optional(),
  officePhone: z.string().min(6).optional(),
  aboutTitle: z.string().min(2).optional(),
  aboutSubtitle: z.string().min(2).optional(),
  landsmanTitle: z.string().min(2).optional(),
  landsmanBody: z.string().min(2).optional(),
  footerSlogan: z.string().min(2).optional(),
});

const leadInputSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(6),
  neighborhood: z.string().min(2),
  rooms: z.number().int().positive(),
  sqm: z.number().int().positive(),
  notes: z.string().optional().nullable(),
});

const marketingInputSchema = z.object({
  neighborhood: z.string().trim().default(""),
  street: z.string().trim().default(""),
  floor: z.string().trim().default(""),
  rooms: z.string().trim().default(""),
  sqm: z.string().trim().default(""),
  balcony: z.string().trim().default(""),
  elevator: z.boolean().default(false),
  parking: z.boolean().default(false),
  storage: z.boolean().default(false),
  renovated: z.boolean().default(false),
  price: z.string().trim().default(""),
  exclusive: z.boolean().default(false),
  notes: z.string().trim().default(""),
});

const cmaInputSchema = z.object({
  city: z.string().trim().default(""),
  neighborhood: z.string().trim().min(2),
  street: z.string().trim().default(""),
  rooms: z.string().trim().min(1),
  minSqm: z.string().trim().default(""),
  maxSqm: z.string().trim().default(""),
  notes: z.string().trim().default(""),
});

const cmaAiSummarySchema = z.object({
  marketAnalysis: z.string().min(20),
  recommendedRange: z.object({
    min: z.number().positive(),
    max: z.number().positive(),
  }),
  averagePricePerSqm: z.number().positive(),
  sellerRecommendation: z.string().min(20),
});

const CMA_DEFAULT_CITY_NAME = "ישראל";
const NADLAN_NEIGHBORHOOD_INDEX_TTL_MS = 1000 * 60 * 60 * 6;

type GovmapAutocompletePayload = {
  results?: Array<{
    id?: string;
    text?: string;
    type?: string;
    shape?: string;
  }>;
};

type GovmapAutocompleteResult = NonNullable<GovmapAutocompletePayload["results"]>[number];

type GovmapDealLocator = {
  dealscount?: string;
  settlementNameHeb?: string | null;
  streetNameHeb?: string | null;
  houseNum?: number | null;
  polygon_id?: string;
};

type GovmapNeighborhoodDealsPayload = {
  totalCount?: string;
  data?: Array<{
    dealId?: number;
    dealAmount?: number;
    dealDate?: string;
    settlementNameHeb?: string;
    streetNameHeb?: string | null;
    houseNum?: number | null;
    floorNo?: string | null;
    assetArea?: number | null;
    assetRoomNum?: number | null;
    propertyTypeDescription?: string | null;
    dealNatureDescription?: string | null;
    neighborhood?: string | null;
  }>;
};

type NadlanNeighborhoodIndexEntry = {
  UNIQ_ID_OLD?: number;
};

type NadlanNeighborhoodPage = {
  neighborhoodId?: number;
  neighborhoodName?: string;
  settlementID?: number;
  settlementName?: string;
  otherNeighborhoodStreets?: Array<{
    id?: number;
    title?: string;
  }>;
  trends?: {
    rooms?: Array<{
      numRooms?: number;
      summary?: {
        lastYearAvgPrice?: number | null;
        priceDifferencePercentage?: number | null;
      };
    }>;
    indexes?: {
      SquareMeter?: number | null;
    };
  };
};

type CmaComparableDeal = {
  dealId: number;
  address: string;
  street: string;
  neighborhood: string;
  rooms: number | null;
  sqm: number | null;
  floor: string | null;
  nonBuiltSqm: number | null;
  price: number;
  pricePerSqm: number | null;
  matchScore: number;
  matchLevel: "high" | "medium" | "low";
  matchLabel: string;
  matchReason: string;
  dealDate: string;
  propertyType: string;
};

type CmaStreetSuggestion = {
  street: string;
  searchUrl: string;
  searchQuery: string;
};

type CmaAiSummary = z.infer<typeof cmaAiSummarySchema>;

const CMA_MAX_PRICE_PER_SQM_SPREAD = 15_000;
const CMA_MIN_DEAL_PRICE = 850_000;
const CMA_MATCH_MIN_QUALITY_SCORE = 58;

let cachedNadlanNeighborhoodIndex: Record<string, NadlanNeighborhoodIndexEntry> | null = null;
let cachedNadlanNeighborhoodIndexFetchedAt = 0;

function extractMarketingSection(raw: string, pattern: RegExp) {
  const match = raw.match(pattern);
  return match ? match[1].trim() : "";
}

function buildMarketingPrompt(input: z.infer<typeof marketingInputSchema>) {
  const details = [
    "עיר: ירושלים",
    input.neighborhood && `שכונה: ${input.neighborhood}`,
    input.street && `רחוב: ${input.street}`,
    input.floor && `קומה: ${input.floor}`,
    input.rooms && `חדרים: ${input.rooms}`,
    input.sqm && `מ"ר בנוי: ${input.sqm}`,
    input.balcony && `מרפסת/גינה: ${input.balcony}`,
    input.elevator && "מעלית: יש",
    input.parking && "חניה: יש",
    input.storage && "מחסן: יש",
    input.renovated && "מצב שיפוץ: משופץ",
    input.price && `מחיר: ${Number(input.price).toLocaleString("he-IL")} ₪`,
    input.exclusive && "בלעדיות: כן",
    input.notes && `הערות: ${input.notes}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `אתה מומחה קופירייטינג נדל"ן ישראלי של צוות שי, לנדסמן ירושלים — אחד הצוותים המובילים בעיר.
המשימה: לכתוב תוכן שיווקי שמוכר חלום, לא רק דירה. הטקסט גורם לאנשים לעצור בפיד, לקרוא עד הסוף, וליצור קשר.

עקרונות ברזל (חובה בכל הפלט):
1) פתיחה שמייצרת FOMO או רגש — לעולם לא לפתוח ב"דירה למכירה".
2) פנייה לקונה ספציפי לפי ההקשר: משפחה / משקיע / זוג צעיר.
3) למכור את החוויה והתחושה של החיים בנכס, לא רק מפרט.
4) שפה חיה, טבעית וישראלית.
5) לייצר דחיפות אמיתית, במיוחד כשיש בלעדיות.
6) לא להמציא פרטים שלא ניתנו.
7) כל פוסט חייב להסתיים בדיוק במשפט: "בלעדיות צוות שי | לנדסמן ירושלים"
8) אין לציין חיסרון או מה שאין בנכס (לדוגמה: "ללא מעלית", "אין חניה", "אין מחסן") אלא אם נכתב מפורשות בהערות.
9) הדגש המרכזי הוא הנתונים הקיימים של הנכס. תיאור האזור צריך להיות כללי, קצר ואמין — בלי שמות מוסדות/רחובות/נתונים שלא נמסרו.
10) אם נתון מסוים לא סופק, פשוט מדלגים עליו ולא משלימים לבד.

פרטי הנכס:
${details}

כללי פורמט:
- עברית בלבד.
- שמור בדיוק על כותרות הסקשנים הבאות.
- ללא הקדמות מחוץ לסקשנים.

פלט נדרש:

─── פייסבוק ───
פתיחה חזקה שעוצרת גלילה (שאלה / עובדה מפתיעה / תמונת מצב רגשית).
תיאור שמוכר את החיים בדירה ולא רק את המפרט.
פרטים טכניים בשורה אחת קצרה.
CTA ברור עם תחושת דחיפות.
5-7 האשטאגים ממוקדים ירושלים.
אורך יעד: 150-200 מילים.

─── אינסטגרם ───
קפשן שמתאים לתמונה יפה — קצר, אימפקטי, עם נשימה.
מקסימום 5-6 שורות.
CTA ל-DM.
10 האשטאגים (מיקום + נדל"ן + ירושלים).

─── יד2 ───
כותרת חזקה לנכס (לא גנרית).
תיאור מקצועי שמדגיש יתרון תחרותי.
פרטים טכניים מסודרים וברורים.
ללא האשטאגים.`;
}

function parseNumericInput(value: string) {
  const normalized = value.replace(/[^\d.]/g, "");
  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseGovmapPointShape(shape: string) {
  const pointMatch = shape.match(/^POINT\(([-\d.]+)\s+([-\d.]+)\)$/i);
  if (pointMatch) {
    return {
      x: Number(pointMatch[1]),
      y: Number(pointMatch[2]),
    };
  }

  // Fallback for shapes like POLYGON / MULTIPOLYGON / LINESTRING:
  // pick the first coordinate pair we can find.
  const coordinateMatch = shape.match(/([-\d.]+)\s+([-\d.]+)/);
  if (coordinateMatch) {
    return {
      x: Number(coordinateMatch[1]),
      y: Number(coordinateMatch[2]),
    };
  }

  throw new Error("לא הצלחנו לקרוא את המיקום של השכונה ממקור העסקאות.");
}

function roundCurrency(value: number) {
  return Math.round(value / 1000) * 1000;
}

function buildComparableAddress(streetName: string | null | undefined, houseNum: number | null | undefined) {
  if (streetName && houseNum) return `${streetName} ${houseNum}`;
  if (streetName) return streetName;
  return "כתובת לא זמינה";
}

function formatComparableDealDate(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function buildYad2StreetSearchUrl(street: string, neighborhood: string, rooms: string, city: string) {
  const query = `site:yad2.co.il/realestate/forsale ${street} ${neighborhood} ${city} ${rooms} חדרים`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function normalizeHebrewToken(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/["'׳״]/g, "")
    .toLowerCase();
}

function sanitizeNeighborhoodInput(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^(שכונה|שכונת)\s+/i, "")
    .trim();
}

function sanitizeStreetInput(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^(רחוב|רח׳|רח)\s+/i, "")
    .trim();
}

function sanitizeCityInput(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^עיר\s+/i, "")
    .trim();
}

function buildCmaPrompt(
  input: z.infer<typeof cmaInputSchema>,
  deals: CmaComparableDeal[],
  pageData: NadlanNeighborhoodPage | null,
  cityName: string,
  fallbackSummary: CmaAiSummary,
) {
  return `אתה אנליסט נדל"ן ירושלמי בכיר של צוות שי | לנדסמן ירושלים.
המטרה: להפיק סיכום CMA קצר, מדויק, אמין ומכירתי לבעל נכס.

חובה:
1) להסתמך רק על הנתונים שניתנו.
2) לא להמציא רחובות, מוסדות, תשואות או מגמות שלא מופיעות בנתונים.
3) לכתוב עברית טבעית, מקצועית וקצרה.
4) אם חסר ודאות, להיות שמרן.
5) להחזיר JSON בלבד, בלי markdown ובלי טקסט נוסף.

נתוני קלט:
- עיר: ${cityName}
- שכונה: ${input.neighborhood}
- רחוב יעד (אם קיים): ${input.street || "לא הוזן"}
- חדרים מבוקשים: ${input.rooms}
- טווח מ"ר: ${input.minSqm || "לא הוזן"} - ${input.maxSqm || "לא הוזן"}
- דגשים מהסוכן: ${input.notes || "ללא"}
- ממוצע מחיר למ"ר שחושב מהעסקאות: ${fallbackSummary.averagePricePerSqm}
- טווח מחיר התחלתי שחושב מהעסקאות: ${fallbackSummary.recommendedRange.min} - ${fallbackSummary.recommendedRange.max}
- מחיר ממוצע שנתי אחרון לחדרים דומים בשכונה: ${pageData?.trends?.rooms?.find((room) => room.numRooms === Number(input.rooms))?.summary?.lastYearAvgPrice ?? "לא זמין"}
- שינוי מחירים שנתי באחוזים: ${pageData?.trends?.rooms?.find((room) => room.numRooms === Number(input.rooms))?.summary?.priceDifferencePercentage ?? "לא זמין"}

עסקאות השוואה:
${JSON.stringify(deals, null, 2)}

החזר JSON בדיוק בפורמט:
{
  "marketAnalysis": "3-4 משפטים",
  "recommendedRange": { "min": 0, "max": 0 },
  "averagePricePerSqm": 0,
  "sellerRecommendation": "2-3 משפטים"
}`;
}

function parseCmaAiResponse(raw: string, fallbackSummary: CmaAiSummary) {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return fallbackSummary;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as unknown;
    return cmaAiSummarySchema.parse(parsed);
  } catch {
    return fallbackSummary;
  }
}

function buildFallbackCmaSummary(
  input: z.infer<typeof cmaInputSchema>,
  deals: CmaComparableDeal[],
  pageData: NadlanNeighborhoodPage | null,
): CmaAiSummary {
  const pricePerSqmValues = deals.map((deal) => deal.pricePerSqm).filter((value): value is number => typeof value === "number");
  const avgPricePerSqm = pricePerSqmValues.length
    ? Math.round(pricePerSqmValues.reduce((sum, value) => sum + value, 0) / pricePerSqmValues.length)
    : Math.round(
        pageData?.trends?.indexes?.SquareMeter ??
          deals.reduce((sum, deal) => sum + deal.price, 0) / Math.max(deals.length, 1) / Math.max(parseNumericInput(input.rooms) ?? 1, 1),
      );

  const dealPrices = deals.map((deal) => deal.price).sort((left, right) => left - right);
  const minSqm = parseNumericInput(input.minSqm);
  const maxSqm = parseNumericInput(input.maxSqm);

  const recommendedMin = minSqm
    ? roundCurrency(avgPricePerSqm * minSqm)
    : roundCurrency(dealPrices[0] ?? avgPricePerSqm * 75);
  const recommendedMax = maxSqm
    ? roundCurrency(avgPricePerSqm * maxSqm)
    : roundCurrency(dealPrices[dealPrices.length - 1] ?? avgPricePerSqm * 95);

  const roomTrend = pageData?.trends?.rooms?.find((room) => room.numRooms === Number(input.rooms));
  const annualDelta = roomTrend?.summary?.priceDifferencePercentage;
  const marketAnalysisParts = [
    `בדיקת העסקאות האחרונות ב${input.neighborhood} מצביעה על שוק פעיל בנכסים בני ${input.rooms} חדרים.`,
    pricePerSqmValues.length
      ? `ממוצע העסקאות שנבחרו עומד על כ-${avgPricePerSqm.toLocaleString("he-IL")} ש"ח למ"ר, וזה נותן עוגן תמחורי ברור לשיחה עם המוכר.`
      : `גם בלי סט מלא של מחירי מ"ר, העסקאות הזמינות מספקות בסיס סביר להערכת שווי שמרנית.`,
    typeof annualDelta === "number"
      ? `בחתך השנתי נרשמה תנועה של כ-${annualDelta.toFixed(1)}% במחירי השכונה לחדרים דומים.`
      : `המגמה המקומית דורשת הצגה מדויקת של היתרונות כדי להבליט את הנכס מול ההיצע הפעיל.`,
    input.notes ? `דגשים מקומיים מהסוכן: ${input.notes}.` : "",
  ];

  return {
    marketAnalysis: marketAnalysisParts.join(" "),
    recommendedRange: {
      min: Math.min(recommendedMin, recommendedMax),
      max: Math.max(recommendedMin, recommendedMax),
    },
    averagePricePerSqm: avgPricePerSqm,
    sellerRecommendation:
      "מומלץ לצאת לשוק עם מחיר פתיחה מדויק שמגובה בעסקאות ההשוואה, ולהצליב מול נכסים פעילים ברחובות הדומים כדי לחדד את מיצוב הנכס כבר בתחילת התהליך.",
  };
}

async function fetchNeighborhoodReference(neighborhood: string, city?: string, street?: string) {
  const normalizedNeighborhood = sanitizeNeighborhoodInput(neighborhood.trim().replace(/\s+/g, " "));
  const normalizedCity = sanitizeCityInput((city ?? "").trim().replace(/\s+/g, " "));
  const normalizedStreet = sanitizeStreetInput((street ?? "").trim().replace(/\s+/g, " "));

  const neighborhoodAliases: Record<string, string[]> = {
    "גבעת קנדה": ["גילה"],
    גילה: ["גבעת קנדה"],
  };

  const getNeighborhoodReferenceFromResult = (
    result: GovmapAutocompleteResult,
    searchTerm: string,
  ) => {
    if (!result?.id || !result.shape) {
      return null;
    }

    const parsedNeighborhoodId = Number(String(result.id).split("|").pop());
    const govmapNeighborhoodId = Number.isFinite(parsedNeighborhoodId) ? parsedNeighborhoodId : null;

    let point: { x: number; y: number } | null = null;
    try {
      point = parseGovmapPointShape(result.shape);
    } catch {
      point = null;
    }
    if (!point) return null;

    return {
      label: result.text ?? searchTerm,
      govmapNeighborhoodId,
      point,
    };
  };

  const lookupNeighborhood = async (searchTerm: string) => {
    const response = await fetch("https://www.govmap.gov.il/api/search-service/autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        searchText: searchTerm,
      }),
    });

    if (!response.ok) {
      throw new Error("לא הצלחנו לאתר את השכונה במאגר הממשלתי.");
    }

    const payload = (await response.json()) as GovmapAutocompletePayload;
    const results = payload.results ?? [];
    if (!results.length) {
      return null;
    }

    const normalizedSearch = normalizeHebrewToken(searchTerm);
    const normalizedTargetNeighborhood = normalizeHebrewToken(normalizedNeighborhood);

    const ranked = results
      .map((result) => {
        const text = result.text ?? "";
        const normalizedText = normalizeHebrewToken(text);
        let score = 0;

        if (result.type === "neighborhood") score += 50;
        if (normalizedText.includes(normalizedTargetNeighborhood)) score += 30;
        if (normalizedTargetNeighborhood.includes(normalizedText)) score += 20;
        if (normalizedSearch && normalizedText.includes(normalizedSearch)) score += 10;
        if (normalizedCity && normalizedText.includes(normalizeHebrewToken(normalizedCity))) score += 10;

        return { result, score };
      })
      .sort((left, right) => right.score - left.score);

    for (const item of ranked) {
      const mapped = getNeighborhoodReferenceFromResult(item.result, searchTerm);
      if (mapped) {
        return mapped;
      }
    }

    return null;
  };

  const candidateTerms = new Set<string>();
  const addTerm = (value: string) => {
    const normalized = value.trim().replace(/\s+/g, " ");
    if (normalized) candidateTerms.add(normalized);
  };

  addTerm(normalizedNeighborhood);
  addTerm(`${normalizedNeighborhood} ${normalizedCity}`);
  addTerm(`${normalizedCity} ${normalizedNeighborhood}`);
  addTerm(`${normalizedStreet} ${normalizedNeighborhood} ${normalizedCity}`);
  addTerm(`${normalizedStreet} ${normalizedNeighborhood}`);
  addTerm(`${normalizedNeighborhood} ${CMA_DEFAULT_CITY_NAME}`);

  for (const alias of neighborhoodAliases[normalizedNeighborhood] ?? []) {
    addTerm(`${alias} ${normalizedCity}`);
    addTerm(alias);
  }

  for (const term of Array.from(candidateTerms)) {
    const match = await lookupNeighborhood(term);
    if (match) {
      return match;
    }
  }

  const parts = normalizedNeighborhood.split(" ");
  if (parts.length > 1) {
    const retryResult = await lookupNeighborhood(parts[0]);
    if (retryResult) return retryResult;
  }

  throw new Error("לא נמצאה שכונה תואמת עבור דוח ה-CMA. נסה להוסיף עיר או להשתמש בשם שכונה מלא.");
}

async function getLegacyNeighborhoodId(govmapNeighborhoodId: number) {
  if (!cachedNadlanNeighborhoodIndex || Date.now() - cachedNadlanNeighborhoodIndexFetchedAt > NADLAN_NEIGHBORHOOD_INDEX_TTL_MS) {
    const response = await fetch("https://data.nadlan.gov.il/api/index/neigh.json", {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("לא הצלחנו למשוך את אינדקס השכונות של נדל\"ן Gov.");
    }

    cachedNadlanNeighborhoodIndex = (await response.json()) as Record<string, NadlanNeighborhoodIndexEntry>;
    cachedNadlanNeighborhoodIndexFetchedAt = Date.now();
  }

  const legacyId = cachedNadlanNeighborhoodIndex?.[String(govmapNeighborhoodId)]?.UNIQ_ID_OLD;
  if (!legacyId) {
    throw new Error("לא הצלחנו להתאים את השכונה לנתוני נדל\"ן Gov.");
  }

  return legacyId;
}

async function fetchNadlanNeighborhoodPage(legacyNeighborhoodId: number) {
  const response = await fetch(`https://data.nadlan.gov.il/api/pages/neighborhood/buy/${legacyNeighborhoodId}.json`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("לא הצלחנו לטעון את נתוני השכונה מנדל\"ן Gov.");
  }

  return (await response.json()) as NadlanNeighborhoodPage;
}

async function fetchNeighborhoodDealsPolygonId(point: { x: number; y: number }) {
  const response = await fetch(`https://www.govmap.gov.il/api/real-estate/deals/${point.x},${point.y}/350`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("לא הצלחנו למשוך עסקאות אחרונות מאתר המידע הממשלתי.");
  }

  const results = (await response.json()) as GovmapDealLocator[];
  const candidate =
    results
      .filter((item) => item.polygon_id)
      .sort((left, right) => Number(right.dealscount ?? 0) - Number(left.dealscount ?? 0))
      .find((item) => item.streetNameHeb) ??
    results.find((item) => item.polygon_id);

  if (!candidate?.polygon_id) {
    throw new Error("לא נמצאו עסקאות השוואה באזור המבוקש.");
  }

  return candidate.polygon_id;
}

async function fetchGovmapNeighborhoodDeals(polygonId: string, limit = 80) {
  const response = await fetch(`https://www.govmap.gov.il/api/real-estate/neighborhood-deals/${polygonId}?limit=${limit}&offset=0`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("לא הצלחנו לטעון את רשימת העסקאות מהמאגר הממשלתי.");
  }

  const payload = (await response.json()) as GovmapNeighborhoodDealsPayload;
  return payload.data ?? [];
}

function pickDealsWithinPricePerSqmSpread<T extends { pricePerSqm: number | null; score: number }>(
  entries: T[],
  maxSpread: number,
  limit: number,
) {
  const entriesWithPrice = entries
    .filter((entry): entry is T & { pricePerSqm: number } => typeof entry.pricePerSqm === "number" && Number.isFinite(entry.pricePerSqm))
    .sort((left, right) => left.pricePerSqm - right.pricePerSqm);

  if (!entriesWithPrice.length) {
    return entries.slice(0, limit);
  }

  let left = 0;
  let bestWindow = { start: 0, end: 0 };

  for (let right = 0; right < entriesWithPrice.length; right += 1) {
    while (entriesWithPrice[right].pricePerSqm - entriesWithPrice[left].pricePerSqm > maxSpread && left < right) {
      left += 1;
    }

    const currentWindowSize = right - left + 1;
    const bestWindowSize = bestWindow.end - bestWindow.start + 1;

    if (currentWindowSize > bestWindowSize) {
      bestWindow = { start: left, end: right };
    }
  }

  const windowEntries = entriesWithPrice
    .slice(bestWindow.start, bestWindow.end + 1)
    .sort((leftEntry, rightEntry) => leftEntry.score - rightEntry.score)
    .slice(0, limit);

  return windowEntries.length ? windowEntries : entries.slice(0, limit);
}

function selectComparableDeals(
  deals: NonNullable<GovmapNeighborhoodDealsPayload["data"]>,
  input: z.infer<typeof cmaInputSchema>,
) {
  type StreetRelation = "same" | "near" | "neighborhood";
  type ScoredEntry = {
    deal: NonNullable<GovmapNeighborhoodDealsPayload["data"]>[number];
    score: number;
    isRecent: boolean;
    strictNeighborhoodMatch: boolean;
    pricePerSqm: number | null;
    roomDelta: number | null;
    sqmDeltaPercent: number | null;
    recencyDays: number;
    streetRelation: StreetRelation;
    dataCompleteness: number;
    pricePerSqmSpread: number | null;
  };

  const normalizedNeighborhood = normalizeHebrewToken(input.neighborhood);
  const normalizedStreet = normalizeHebrewToken(input.street);
  const targetRooms = parseNumericInput(input.rooms);
  const minSqm = parseNumericInput(input.minSqm);
  const maxSqm = parseNumericInput(input.maxSqm);
  const targetSqmAnchor =
    minSqm != null && maxSqm != null
      ? (minSqm + maxSqm) / 2
      : (minSqm ?? maxSqm ?? null);
  const fromDate = new Date();
  fromDate.setFullYear(fromDate.getFullYear() - 4);

  const allScoredDeals = deals
    .filter((deal) => typeof deal.dealId === "number" && typeof deal.dealAmount === "number" && Boolean(deal.dealDate))
    .map((deal) => {
      const normalizedDealNeighborhood = normalizeHebrewToken(deal.neighborhood);
      const normalizedDealStreet = normalizeHebrewToken(deal.streetNameHeb);
      const roomDelta = targetRooms == null || deal.assetRoomNum == null ? null : Math.abs(deal.assetRoomNum - targetRooms);
      const sqmPenalty =
        typeof deal.assetArea !== "number"
          ? 0
          : (minSqm != null && deal.assetArea < minSqm ? minSqm - deal.assetArea : 0) +
            (maxSqm != null && deal.assetArea > maxSqm ? deal.assetArea - maxSqm : 0);
      const sqmDeltaPercent =
        targetSqmAnchor != null && typeof deal.assetArea === "number" && targetSqmAnchor > 0
          ? Math.abs(deal.assetArea - targetSqmAnchor) / targetSqmAnchor
          : null;
      const dealDate = new Date(deal.dealDate ?? "");
      const recencyDays = Number.isNaN(dealDate.getTime())
        ? 3650
        : Math.max(0, (Date.now() - dealDate.getTime()) / (1000 * 60 * 60 * 24));
      const neighborhoodMatchScore =
        normalizedNeighborhood &&
        (normalizedDealNeighborhood.includes(normalizedNeighborhood) || normalizedNeighborhood.includes(normalizedDealNeighborhood))
          ? 0
          : 10000;
      const streetRelation: StreetRelation =
        normalizedStreet && normalizedDealStreet
          ? normalizedDealStreet === normalizedStreet
            ? "same"
            : normalizedDealStreet.includes(normalizedStreet) || normalizedStreet.includes(normalizedDealStreet)
              ? "near"
              : "neighborhood"
          : "neighborhood";
      const streetMatchScore =
        streetRelation === "same"
          ? -2000
          : streetRelation === "near"
            ? -1000
            : normalizedStreet
              ? 1200
              : 0;
      const dataPoints = [
        typeof deal.assetRoomNum === "number",
        typeof deal.assetArea === "number" && deal.assetArea > 0,
        typeof deal.floorNo === "string" && deal.floorNo.trim().length > 0,
        typeof deal.streetNameHeb === "string" && deal.streetNameHeb.trim().length > 0,
      ];
      const dataCompleteness = dataPoints.filter(Boolean).length / dataPoints.length;

      return {
        deal,
        score: neighborhoodMatchScore + streetMatchScore + (roomDelta ?? 0) * 1000 + sqmPenalty * 5 + recencyDays,
        isRecent: !Number.isNaN(dealDate.getTime()) && dealDate >= fromDate,
        strictNeighborhoodMatch:
          Boolean(normalizedNeighborhood) &&
          (normalizedDealNeighborhood.includes(normalizedNeighborhood) || normalizedNeighborhood.includes(normalizedDealNeighborhood)),
        pricePerSqm:
          typeof deal.assetArea === "number" && deal.assetArea > 0
            ? Math.round((deal.dealAmount as number) / deal.assetArea)
            : null,
        roomDelta,
        sqmDeltaPercent,
        recencyDays,
        streetRelation,
        dataCompleteness,
        pricePerSqmSpread: null,
      } satisfies ScoredEntry;
    });

  const scoredDeals = allScoredDeals
    .filter((entry) => entry.isRecent && entry.strictNeighborhoodMatch && (entry.deal.dealAmount as number) >= CMA_MIN_DEAL_PRICE)
    .sort((left, right) => left.score - right.score);

  const topRankedForReference = scoredDeals.slice(0, 25);
  const pricePerSqmReferencePool = topRankedForReference
    .map((entry) => entry.pricePerSqm)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
    .sort((left, right) => left - right);

  const referencePricePerSqm = pricePerSqmReferencePool.length
    ? pricePerSqmReferencePool[Math.floor(pricePerSqmReferencePool.length / 2)]
    : null;

  const filteredBySpread = scoredDeals
    .map((entry) => ({
      ...entry,
      pricePerSqmSpread:
        referencePricePerSqm && entry.pricePerSqm
          ? Math.abs(entry.pricePerSqm - referencePricePerSqm)
          : null,
    }))
    .filter((entry) => {
      if (!referencePricePerSqm || !entry.pricePerSqmSpread) return true;
      return entry.pricePerSqmSpread <= CMA_MAX_PRICE_PER_SQM_SPREAD;
    });

  const topSpreadScopedDeals = filteredBySpread.slice(0, 30);
  const tightDeals = pickDealsWithinPricePerSqmSpread(
    topSpreadScopedDeals,
    CMA_MAX_PRICE_PER_SQM_SPREAD,
    5,
  );

  const fallbackScopedDeals: ScoredEntry[] =
    tightDeals.length > 0
      ? tightDeals
      : allScoredDeals
          .filter((entry) => entry.isRecent && (entry.deal.dealAmount as number) >= CMA_MIN_DEAL_PRICE)
          .sort((left, right) => left.score - right.score)
          .slice(0, 8);

  const assessedDeals = fallbackScopedDeals.map((entry) => {
    let matchScore = 0;

    if (entry.streetRelation === "same") matchScore += 40;
    else if (entry.streetRelation === "near") matchScore += 26;
    else matchScore += normalizedStreet ? 12 : 18;

    if (entry.roomDelta == null) matchScore += 7;
    else if (entry.roomDelta === 0) matchScore += 15;
    else if (entry.roomDelta === 1) matchScore += 11;
    else if (entry.roomDelta === 2) matchScore += 5;

    if (entry.sqmDeltaPercent == null) matchScore += 8;
    else if (entry.sqmDeltaPercent <= 0.1) matchScore += 15;
    else if (entry.sqmDeltaPercent <= 0.2) matchScore += 11;
    else if (entry.sqmDeltaPercent <= 0.35) matchScore += 6;
    else matchScore += 2;

    if (entry.recencyDays <= 365) matchScore += 20;
    else if (entry.recencyDays <= 730) matchScore += 15;
    else if (entry.recencyDays <= 1095) matchScore += 10;
    else matchScore += 5;

    matchScore += Math.round(entry.dataCompleteness * 10);

    if (typeof entry.pricePerSqmSpread === "number") {
      if (entry.pricePerSqmSpread > 12000) matchScore -= 8;
      else if (entry.pricePerSqmSpread > 8000) matchScore -= 5;
      else if (entry.pricePerSqmSpread > 5000) matchScore -= 2;
    }

    const boundedScore = Math.max(0, Math.min(100, matchScore));

    const strengths: string[] = [];
    if (entry.streetRelation === "same") strengths.push("רחוב זהה");
    else if (entry.streetRelation === "near") strengths.push("רחוב סמוך");
    else strengths.push("שכונה זהה");

    if (entry.roomDelta === 0) strengths.push("חדרים זהים");
    else if (entry.roomDelta === 1) strengths.push("חדרים דומים");

    if (entry.sqmDeltaPercent != null) {
      if (entry.sqmDeltaPercent <= 0.12) strengths.push("שטח דומה");
      else if (entry.sqmDeltaPercent <= 0.25) strengths.push("שטח קרוב");
    }

    if (entry.recencyDays <= 365) strengths.push("עסקה עדכנית");
    else if (entry.recencyDays <= 730) strengths.push("עסקה מהשנתיים האחרונות");

    const weaknesses: string[] = [];
    if (entry.recencyDays > 730) weaknesses.push("עסקה ישנה יחסית");
    if (entry.dataCompleteness < 0.7) weaknesses.push("נתונים חלקיים");
    if (typeof entry.pricePerSqmSpread === "number" && entry.pricePerSqmSpread > 9000) {
      weaknesses.push("פער מחיר למ\"ר יחסית לקבוצה");
    }
    if (entry.roomDelta != null && entry.roomDelta > 1) weaknesses.push("פער חדרים ביחס לנכס");
    if (entry.sqmDeltaPercent != null && entry.sqmDeltaPercent > 0.25) weaknesses.push("פער שטח מורגש");

    return {
      ...entry,
      matchScore: boundedScore,
      matchReasonBase: strengths.slice(0, 3),
      matchWeaknesses: weaknesses,
    };
  });

  const qualityScopedDeals = assessedDeals
    .filter((entry) => entry.matchScore >= CMA_MATCH_MIN_QUALITY_SCORE)
    .sort((left, right) => right.matchScore - left.matchScore);

  const limitedDeals =
    qualityScopedDeals.length >= 5 && qualityScopedDeals[4].matchScore >= 86
      ? qualityScopedDeals.slice(0, 5)
      : qualityScopedDeals.slice(0, 4);

  const topScore = limitedDeals[0]?.matchScore ?? 0;

  return limitedDeals.map((entry) => {
    const matchLevel: "high" | "medium" | "low" =
      topScore >= 84 && entry.matchScore >= 84 && entry.matchScore >= topScore - 6
        ? "high"
        : entry.matchScore >= 66 && entry.matchScore >= topScore - 20
          ? "medium"
          : "low";
    const matchLabel =
      matchLevel === "high" ? "התאמה גבוהה" : matchLevel === "medium" ? "התאמה בינונית" : "התאמה חלקית";
    const baseReason = entry.matchReasonBase.length ? entry.matchReasonBase.slice(0, 2).join(" + ") : "שכונה דומה";
    const firstWeakness = entry.matchWeaknesses[0];
    const matchReason =
      matchLevel === "low"
        ? firstWeakness
          ? `${baseReason}, אך ${firstWeakness}`
          : "עסקה להשוואת מגמת שוק"
        : firstWeakness
          ? `${baseReason}, אך ${firstWeakness}`
          : baseReason;

    const { deal } = entry;
    return {
    dealId: deal.dealId as number,
    address: buildComparableAddress(deal.streetNameHeb, deal.houseNum),
    street: deal.streetNameHeb ?? "ללא רחוב",
    neighborhood: deal.neighborhood ?? input.neighborhood,
    rooms: deal.assetRoomNum ?? null,
    sqm: deal.assetArea ?? null,
    floor: deal.floorNo ?? null,
    nonBuiltSqm: null,
    price: deal.dealAmount as number,
    pricePerSqm: deal.assetArea ? Math.round((deal.dealAmount as number) / deal.assetArea) : null,
    matchScore: entry.matchScore,
    matchLevel,
    matchLabel,
    matchReason,
    dealDate: formatComparableDealDate(deal.dealDate as string),
    propertyType: deal.propertyTypeDescription ?? deal.dealNatureDescription ?? "דירה",
    };
  });
}

function buildStreetSuggestions(
  deals: CmaComparableDeal[],
  pageData: NadlanNeighborhoodPage | null,
  input: z.infer<typeof cmaInputSchema>,
  cityName: string,
) {
  const allCandidateStreets = Array.from(
    new Set([
      ...deals.map((deal) => deal.street).filter((street) => street && street !== "ללא רחוב"),
      ...(pageData?.otherNeighborhoodStreets ?? [])
        .map((street) => {
          const title = street.title;
          if (typeof title === "string") return title.trim();
          if (typeof title === "number") return String(title).trim();
          return "";
        })
        .filter(Boolean),
    ]),
  );

  const filteredByStreet = allCandidateStreets
    .filter((street) => {
      const normalizedStreet = normalizeHebrewToken(street);
      const normalizedInputStreet = normalizeHebrewToken(input.street);
      if (!normalizedInputStreet) return true;
      return (
        normalizedStreet === normalizedInputStreet ||
        normalizedStreet.includes(normalizedInputStreet) ||
        normalizedInputStreet.includes(normalizedStreet)
      );
    })
    .slice(0, 8);

  const streets = filteredByStreet.length ? filteredByStreet : allCandidateStreets.slice(0, 8);

  return streets.map((street) => ({
    street,
    searchQuery: `${street}, ${input.neighborhood}, ${cityName}, ${input.rooms} חדרים`,
    searchUrl: buildYad2StreetSearchUrl(street, input.neighborhood, input.rooms, cityName),
  })) satisfies CmaStreetSuggestion[];
}

type AnthropicErrorPayload = {
  error?: {
    type?: string;
    message?: string;
  };
};

type AnthropicModelListPayload = {
  data?: Array<{
    id?: string;
  }>;
};

async function fetchAnthropicModelIds(apiKey: string): Promise<string[]> {
  const response = await fetch("https://api.anthropic.com/v1/models", {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as AnthropicModelListPayload;
  return (payload.data ?? [])
    .map((model) => model.id ?? "")
    .filter(Boolean);
}

async function requestAnthropicMarketing(prompt: string, apiKey: string) {
  const preferredModels = [
    "claude-sonnet-4-20250514",
    "claude-sonnet-4-6",
    "claude-sonnet-4-5",
    "claude-3-7-sonnet-latest",
    "claude-3-7-sonnet-20250219",
    "claude-3-5-sonnet-latest",
    "claude-3-5-sonnet-20241022",
  ];
  let availableModels: string[] = [];
  try {
    availableModels = await fetchAnthropicModelIds(apiKey);
  } catch {
    availableModels = [];
  }

  const models = availableModels.length
    ? Array.from(
        new Set([
          ...preferredModels.filter((model) => availableModels.includes(model)),
          ...availableModels.filter((model) => model.includes("sonnet")),
          ...availableModels,
        ]),
      )
    : preferredModels;

  let lastErrorMessage = "שגיאה בקריאה ל-Claude API";

  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as {
        content?: Array<{ text?: string }>;
      };
      return data.content?.[0]?.text ?? "";
    }

    let payload: AnthropicErrorPayload | null = null;
    try {
      payload = (await response.json()) as AnthropicErrorPayload;
    } catch {
      payload = null;
    }

    const errorType = payload?.error?.type ?? "";
    const errorMessage = payload?.error?.message ?? response.statusText;
    lastErrorMessage = errorMessage || "שגיאה בקריאה ל-Claude API";

    const canTryFallback =
      response.status === 404 ||
      errorType === "not_found_error" ||
      errorType === "invalid_request_error" ||
      response.status === 400 ||
      /model|pattern|not found/i.test(lastErrorMessage);

    if (!canTryFallback || index === models.length - 1) {
      throw new Error(lastErrorMessage);
    }
  }

  throw new Error(lastErrorMessage);
}

function decodeBase64File(dataBase64: string) {
  const normalized = dataBase64.includes(",") ? dataBase64.split(",").pop() ?? "" : dataBase64;
  return Buffer.from(normalized, "base64");
}

function slugifyFilename(value: string) {
  const [baseName, extension = ""] = value.replace(/\s+/g, "-").split(/\.(?=[^.]+$)/);
  const safeBase = baseName.replace(/[^a-zA-Z0-9\-_א-ת]/g, "").slice(0, 80) || `image-${Date.now()}`;
  const safeExtension = extension.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return safeExtension ? `${safeBase}.${safeExtension}` : safeBase;
}

async function resolveStoredImage(
  storagePath: string,
  image: z.infer<typeof storedOrUploadedImageSchema>,
  fallbackName: string,
) {
  if (!image) return null;
  if (typeof image === "string") return image;

  const binary = decodeBase64File(image.dataBase64);
  const upload = await storagePut(
    `${storagePath}/${Date.now()}-${slugifyFilename(image.name || fallbackName)}`,
    binary,
    image.mimeType,
  );

  return upload.url;
}

async function uploadImagesForProperty(ownerId: number, images: Array<z.infer<typeof imageInputSchema>>) {
  return Promise.all(
    images.map(async (image, index) => {
      const binary = decodeBase64File(image.dataBase64);
      const upload = await storagePut(
        `team-shay/properties/${ownerId}/${Date.now()}-${index}-${image.name}`,
        binary,
        image.mimeType,
      );

      return {
        imageUrl: upload.url,
        imageKey: upload.key,
        sortOrder: index,
        altText: image.name,
      };
    }),
  );
}

function resolveFeaturedUploadUrl(
  uploadedImages: Awaited<ReturnType<typeof uploadImagesForProperty>>,
  featuredImageIndex?: number | null,
) {
  if (featuredImageIndex == null) {
    return uploadedImages[0]?.imageUrl ?? null;
  }

  return uploadedImages[featuredImageIndex]?.imageUrl ?? uploadedImages[0]?.imageUrl ?? null;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  publicSite: router({
    home: publicProcedure.query(async () => {
      await ensureCmsSeedData();
      return getHomepagePayload();
    }),
    properties: publicProcedure
      .input(
        z
          .object({
            area: z.string().trim().optional(),
            minPrice: z.number().int().positive().optional(),
            maxPrice: z.number().int().positive().optional(),
          })
          .optional(),
      )
      .query(async ({ input }) => listPublishedProperties(input)),
    propertyById: publicProcedure
      .input(z.object({ propertyId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const property = await getPropertyById(input.propertyId);
        if (!property?.isPublished) {
          return null;
        }

        return property;
      }),
    submitLead: publicProcedure.input(leadInputSchema).mutation(async ({ input }) => {
      const leadId = await createLeadSubmission({
        fullName: input.fullName,
        phone: input.phone,
        neighborhood: input.neighborhood,
        rooms: input.rooms,
        sqm: input.sqm,
        notes: input.notes ?? null,
      });

      return {
        success: true,
        leadId,
      } as const;
    }),
  }),
  agent: router({
    me: publicProcedure.query(async ({ ctx }) => {
      await ensureDefaultAgentAccounts();
      return ctx.agentSession;
    }),
    propertyById: agentProcedure
      .input(z.object({ propertyId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        return getAgentPropertyById(ctx.agentSession.id, input.propertyId);
      }),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(1),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const agent = await authenticateAgent(input.email, input.password);
        if (!agent) {
          throw new Error("פרטי ההתחברות אינם תקינים");
        }

        const cookieOptions = getSessionCookieOptions(ctx.req);
        const sessionToken = await createAgentSessionToken(agent.id);

        ctx.res.cookie("team_shay_agent_session", String(agent.id), {
          ...cookieOptions,
          maxAge: 1000 * 60 * 60 * 24 * 14,
        });

        return {
          success: true,
          sessionToken,
          agent: {
            id: agent.id,
            name: agent.name,
            email: agent.email,
            phone: agent.phone,
            accountRole: agent.accountRole,
            roleTitle: agent.roleTitle,
            photoUrl: agent.photoUrl,
          },
        };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie("team_shay_agent_session", { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    listProperties: agentProcedure.query(async ({ ctx }) => {
      return listAgentProperties(ctx.agentSession.id);
    }),
    createProperty: agentProcedure
      .input(propertyInputSchema)
      .mutation(async ({ ctx, input }) => {
        const uploadedImages = await uploadImagesForProperty(ctx.agentSession.id, input.images);
        const featuredImageUrl = resolveFeaturedUploadUrl(uploadedImages, input.featuredImageIndex);

        const propertyId = await createAgentProperty(
          {
            agentId: ctx.agentSession.id,
            title: input.title,
            address: input.address,
            street: input.street ?? null,
            neighborhood: input.neighborhood,
            city: input.city,
            price: input.price,
            rooms: input.rooms,
            sqm: input.sqm,
            builtSqm: input.builtSqm ?? null,
            outdoorSpace: input.outdoorSpace ?? null,
            floor: input.floor ?? null,
            status: input.status,
            description: input.description,
            descriptionHtml: input.descriptionHtml ?? null,
            featuredImageUrl,
            isPublished: input.isPublished,
          },
          uploadedImages,
        );

        return {
          success: true,
          propertyId,
        };
      }),
    updateProperty: agentProcedure
      .input(z.object({ propertyId: z.number().int().positive(), data: propertyInputSchema }))
      .mutation(async ({ ctx, input }) => {
        const uploadedImages = await uploadImagesForProperty(ctx.agentSession.id, input.data.images);
        const existingProperty = await getAgentPropertyById(ctx.agentSession.id, input.propertyId);
        if (!existingProperty) {
          throw new Error("הנכס המבוקש לא נמצא.");
        }
        const featuredImageUrl = uploadedImages.length
          ? resolveFeaturedUploadUrl(uploadedImages, input.data.featuredImageIndex)
          : input.data.featuredImageUrl ?? existingProperty.featuredImageUrl;

        await updateAgentProperty(
          ctx.agentSession.id,
          input.propertyId,
          {
            title: input.data.title,
            address: input.data.address,
            street: input.data.street ?? null,
            neighborhood: input.data.neighborhood,
            city: input.data.city,
            price: input.data.price,
            rooms: input.data.rooms,
            sqm: input.data.sqm,
            builtSqm: input.data.builtSqm ?? null,
            outdoorSpace: input.data.outdoorSpace ?? null,
            floor: input.data.floor ?? null,
            status: input.data.status,
            description: input.data.description,
            descriptionHtml: input.data.descriptionHtml ?? null,
            featuredImageUrl,
            isPublished: input.data.isPublished,
          },
          uploadedImages,
        );

        return { success: true } as const;
      }),
    deleteProperty: agentProcedure
      .input(z.object({ propertyId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await deleteAgentProperty(ctx.agentSession.id, input.propertyId);
        return { success: true } as const;
      }),
    generateMarketing: agentProcedure
      .input(marketingInputSchema)
      .mutation(async ({ input }) => {
        if (!input.neighborhood && !input.street) {
          throw new Error("יש למלא לפחות שכונה או רחוב");
        }

        const apiKey = process.env.VITE_ANTHROPIC_KEY;
        if (!apiKey) {
          throw new Error("מפתח Anthropic לא מוגדר בסביבת השרת.");
        }

        const raw = await requestAnthropicMarketing(buildMarketingPrompt(input), apiKey);

        return {
          facebook: extractMarketingSection(raw, /─── פייסבוק ───\n([\s\S]*?)(?=─── אינסטגרם ───|$)/),
          instagram: extractMarketingSection(raw, /─── אינסטגרם ───\n([\s\S]*?)(?=─── יד2 ───|$)/),
          yad2: extractMarketingSection(raw, /─── יד2 ───\n([\s\S]*?)$/),
        };
      }),
    generateCma: agentProcedure
      .input(cmaInputSchema)
      .mutation(async ({ input }) => {
        const neighborhoodRef = await fetchNeighborhoodReference(input.neighborhood.trim(), input.city.trim(), input.street.trim());
        const polygonId = await fetchNeighborhoodDealsPolygonId(neighborhoodRef.point);

        let pageData: NadlanNeighborhoodPage | null = null;
        if (typeof neighborhoodRef.govmapNeighborhoodId === "number" && Number.isFinite(neighborhoodRef.govmapNeighborhoodId)) {
          try {
            const legacyNeighborhoodId = await getLegacyNeighborhoodId(neighborhoodRef.govmapNeighborhoodId);
            pageData = await fetchNadlanNeighborhoodPage(legacyNeighborhoodId);
          } catch {
            pageData = null;
          }
        }

        const rawDeals = await fetchGovmapNeighborhoodDeals(polygonId, 100);
        const deals = selectComparableDeals(rawDeals, input);
        if (deals.length === 0) {
          throw new Error("לא נמצאו עסקאות השוואה מתאימות עבור השכונה והחדרים שבחרת.");
        }

        const cityName = (pageData?.settlementName ?? input.city.trim() ?? "").trim() || CMA_DEFAULT_CITY_NAME;
        const streetSuggestions = buildStreetSuggestions(deals, pageData, input, cityName);
        const fallbackSummary = buildFallbackCmaSummary(input, deals, pageData);
        const apiKey = process.env.VITE_ANTHROPIC_KEY;

        let aiSummary = fallbackSummary;
        if (apiKey) {
          try {
            const rawSummary = await requestAnthropicMarketing(buildCmaPrompt(input, deals, pageData, cityName, fallbackSummary), apiKey);
            aiSummary = parseCmaAiResponse(rawSummary, fallbackSummary);
          } catch {
            aiSummary = fallbackSummary;
          }
        }

        const broadSearchQuery = `site:yad2.co.il/realestate/forsale ${input.street || ""} ${input.neighborhood} ${cityName} ${input.rooms} חדרים`;

        return {
          neighborhoodLabel: pageData?.neighborhoodName ?? neighborhoodRef.label,
          settlementName: cityName,
          deals,
          streetSuggestions,
          broadSearchUrl: `https://www.google.com/search?q=${encodeURIComponent(broadSearchQuery)}`,
          aiSummary,
          stats: {
            averagePricePerSqm: aiSummary.averagePricePerSqm,
            averageDealPrice: Math.round(deals.reduce((sum, deal) => sum + deal.price, 0) / deals.length),
            matchingDealsCount: deals.length,
          },
        };
      }),
  }),
  admin: router({
    me: publicProcedure.query(({ ctx }) => {
      return ctx.agentSession ?? null;
    }),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(1),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const account = await authenticateAgent(input.email, input.password);
        if (!account) {
          throw new Error("פרטי ההתחברות אינם תקינים");
        }

        const cookieOptions = getSessionCookieOptions(ctx.req);
        const sessionToken = await createAgentSessionToken(account.id);

        ctx.res.cookie("team_shay_agent_session", String(account.id), {
          ...cookieOptions,
          maxAge: 1000 * 60 * 60 * 24 * 14,
        });

        return {
          success: true,
          sessionToken,
          admin: {
            id: account.id,
            name: account.name,
            email: account.email,
            phone: account.phone,
            accountRole: account.accountRole,
            roleTitle: account.roleTitle,
          },
        } as const;
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie("team_shay_agent_session", { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    dashboard: agentProcedure.query(async () => {
      await ensureCmsSeedData();
      const [settings, testimonialsRows, staff, propertiesRows, leads] = await Promise.all([
        getSiteSettings(),
        listAllTestimonials(),
        listStaffAccounts(),
        listAllProperties(),
        listLeadSubmissions(),
      ]);

      return {
        settings,
        testimonials: testimonialsRows,
        staff,
        properties: propertiesRows,
        leads,
      };
    }),
    updateSiteSettings: agentProcedure.input(siteSettingsInputSchema).mutation(async ({ input }) => {
      const resolvedInput = {
        ...input,
        headerLogoUrl: await resolveStoredImage("team-shay/site-settings/header-logo", input.headerLogoUrl, "header-logo"),
        footerLogoUrl: await resolveStoredImage("team-shay/site-settings/footer-logo", input.footerLogoUrl, "footer-logo"),
        landsmanLogoUrl: await resolveStoredImage("team-shay/site-settings/landsman-logo", input.landsmanLogoUrl, "landsman-logo"),
        heroBackgroundUrl: await resolveStoredImage("team-shay/site-settings/hero-background", input.heroBackgroundUrl, "hero-background"),
        shayAboutImageUrl: await resolveStoredImage("team-shay/site-settings/shay-about", input.shayAboutImageUrl, "shay-about"),
      };
      await updateSiteSettings(resolvedInput);
      return { success: true } as const;
    }),
    listStaff: agentProcedure.query(async () => listStaffAccounts()),
    createStaff: agentProcedure.input(staffInputSchema).mutation(async ({ input }) => {
      const normalizedEmail = input.email.toLowerCase();
      const photoUrl = await resolveStoredImage(
        `team-shay/staff/${normalizedEmail}`,
        input.photoUrl,
        `${input.name}-profile`,
      );

      const accountId = await createStaffAccount({
        accountRole: input.accountRole,
        name: input.name,
        email: normalizedEmail,
        phone: input.phone,
        passwordHash: hashAgentPassword(input.password ?? passwordFromAgentEmail(normalizedEmail)),
        roleTitle: input.roleTitle,
        bio: input.bio ?? null,
        photoUrl,
        sortOrder: input.sortOrder,
        isFeaturedOnHomepage: input.isFeaturedOnHomepage,
        isActive: input.isActive,
        managedByAdmin: true,
      });

      return { success: true, accountId } as const;
    }),
    updateStaff: agentProcedure
      .input(z.object({ accountId: z.number().int().positive(), data: staffInputSchema.partial() }))
      .mutation(async ({ input }) => {
        const normalizedEmail = input.data.email?.toLowerCase();
        const nextData = {
          ...input.data,
          email: normalizedEmail,
          passwordHash: input.data.password
            ? hashAgentPassword(input.data.password)
            : normalizedEmail
              ? hashAgentPassword(passwordFromAgentEmail(normalizedEmail))
              : undefined,
          photoUrl: await resolveStoredImage(
            `team-shay/staff/${normalizedEmail ?? input.accountId}`,
            input.data.photoUrl,
            `staff-${input.accountId}`,
          ),
        };
        delete (nextData as { password?: string }).password;

        await updateStaffAccount(input.accountId, nextData);
        return { success: true } as const;
      }),
    deleteStaff: agentProcedure
      .input(z.object({ accountId: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await deleteStaffAccount(input.accountId);
        return { success: true } as const;
      }),
    listTestimonials: agentProcedure.query(async () => listAllTestimonials()),
    createTestimonial: agentProcedure.input(testimonialInputSchema).mutation(async ({ input }) => {
      const testimonialId = await createTestimonial({
        ...input,
        whatsappImageUrl: await resolveStoredImage(
          `team-shay/testimonials/${input.sourceName}`,
          input.whatsappImageUrl,
          `${input.sourceName}-testimonial`,
        ),
      });
      return { success: true, testimonialId } as const;
    }),
    updateTestimonial: agentProcedure
      .input(z.object({ testimonialId: z.number().int().positive(), data: testimonialInputSchema.partial() }))
      .mutation(async ({ input }) => {
        await updateTestimonial(input.testimonialId, {
          ...input.data,
          whatsappImageUrl: await resolveStoredImage(
            `team-shay/testimonials/${input.data.sourceName ?? input.testimonialId}`,
            input.data.whatsappImageUrl,
            `testimonial-${input.testimonialId}`,
          ),
        });
        return { success: true } as const;
      }),
    deleteTestimonial: agentProcedure
      .input(z.object({ testimonialId: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await deleteTestimonial(input.testimonialId);
        return { success: true } as const;
      }),
    listLeads: agentProcedure.query(async () => listLeadSubmissions()),
    listProperties: agentProcedure.query(async () => listAllProperties()),
    propertyById: agentProcedure
      .input(z.object({ propertyId: z.number().int().positive() }))
      .query(async ({ input }) => getPropertyById(input.propertyId)),
    createProperty: agentProcedure
      .input(propertyInputSchema.extend({ agentId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const uploadedImages = await uploadImagesForProperty(ctx.agentSession?.id ?? input.agentId, input.images);
        const featuredImageUrl = resolveFeaturedUploadUrl(uploadedImages, input.featuredImageIndex);
        const propertyId = await createAgentProperty(
          {
            agentId: input.agentId,
            title: input.title,
            address: input.address,
            street: input.street ?? null,
            neighborhood: input.neighborhood,
            city: input.city,
            price: input.price,
            rooms: input.rooms,
            sqm: input.sqm,
            builtSqm: input.builtSqm ?? null,
            outdoorSpace: input.outdoorSpace ?? null,
            floor: input.floor ?? null,
            status: input.status,
            description: input.description,
            descriptionHtml: input.descriptionHtml ?? null,
            featuredImageUrl,
            isPublished: input.isPublished,
          },
          uploadedImages,
        );

        return { success: true, propertyId } as const;
      }),
    updateProperty: agentProcedure
      .input(z.object({ propertyId: z.number().int().positive(), data: propertyInputSchema }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getPropertyById(input.propertyId);
        if (!existing) {
          throw new Error("הנכס המבוקש לא נמצא.");
        }

        const uploadedImages = await uploadImagesForProperty(
          ctx.agentSession?.id ?? existing.agentId,
          input.data.images,
        );
        const featuredImageUrl = uploadedImages.length
          ? resolveFeaturedUploadUrl(uploadedImages, input.data.featuredImageIndex)
          : input.data.featuredImageUrl ?? existing.featuredImageUrl;

        await updatePropertyById(
          input.propertyId,
          {
            agentId: input.data.agentId ?? existing.agentId,
            title: input.data.title,
            address: input.data.address,
            street: input.data.street ?? null,
            neighborhood: input.data.neighborhood,
            city: input.data.city,
            price: input.data.price,
            rooms: input.data.rooms,
            sqm: input.data.sqm,
            builtSqm: input.data.builtSqm ?? null,
            outdoorSpace: input.data.outdoorSpace ?? null,
            floor: input.data.floor ?? null,
            status: input.data.status,
            description: input.data.description,
            descriptionHtml: input.data.descriptionHtml ?? null,
            featuredImageUrl,
            isPublished: input.data.isPublished,
          },
          uploadedImages,
        );

        return { success: true } as const;
      }),
    deleteProperty: agentProcedure
      .input(z.object({ propertyId: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await deletePropertyById(input.propertyId);
        return { success: true } as const;
      }),
  }),

  crm: router({
    list: agentProcedure
      .input(
        z.object({
          search: z.string().optional(),
          agentId: z.number().int().positive().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const isAdmin = ctx.agentSession.accountRole === "admin";
        const filterAgentId = isAdmin ? (input.agentId ?? null) : ctx.agentSession.id;
        return listCrmLeads({ agentId: filterAgentId, search: input.search });
      }),

    getById: agentProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => {
        return getCrmLeadById(input.id);
      }),

    create: agentProcedure
      .input(
        z.object({
          name: z.string().min(1),
          phone: z.string().min(1),
          secondaryPhone: z.string().optional().nullable(),
          email: z.string().email().optional().nullable(),
          neighborhood: z.string().optional().nullable(),
          notes: z.string().optional().nullable(),
          tags: z.string().optional().default(""),
          leadStatus: z.enum(["חדש", "פעיל", "סגור", "לא רלוונטי"]).optional().default("חדש"),
          source: z.string().optional().nullable(),
          agentId: z.number().int().positive().optional().nullable(),
          leadType: z.string().optional().nullable(),
          budgetMin: z.number().optional().nullable(),
          budgetMax: z.number().optional().nullable(),
          desiredBudget: z.string().optional().nullable(),
          processStage: z.string().optional().nullable(),
          lastContact: z.string().optional().nullable(),
          meetingDate: z.string().optional().nullable(),
          meetingTime: z.string().optional().nullable(),
          meetingNotes: z.string().optional().nullable(),
          meetingLocation: z.string().optional().nullable(),
          propertyNeighborhood: z.string().optional().nullable(),
          propertyStreet: z.string().optional().nullable(),
          propertyRooms: z.string().optional().nullable(),
          propertyType: z.string().optional().nullable(),
          currentPropertyPrice: z.number().optional().nullable(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const isAdmin = ctx.agentSession.accountRole === "admin";
        const agentId = isAdmin ? (input.agentId ?? ctx.agentSession.id) : ctx.agentSession.id;
        const id = await createCrmLead({
          agentId,
          name: input.name,
          phone: input.phone,
          secondaryPhone: input.secondaryPhone ?? null,
          email: input.email ?? null,
          neighborhood: input.neighborhood ?? null,
          notes: input.notes ?? null,
          tags: input.tags,
          leadStatus: input.leadStatus,
          source: input.source ?? null,
          leadType: input.leadType ?? null,
          budgetMin: input.budgetMin ?? null,
          budgetMax: input.budgetMax ?? null,
          desiredBudget: input.desiredBudget ?? null,
          processStage: input.processStage ?? null,
          lastContact: input.lastContact ?? null,
          meetingDate: input.meetingDate ?? null,
          meetingTime: input.meetingTime ?? null,
          meetingNotes: input.meetingNotes ?? null,
          meetingLocation: input.meetingLocation ?? null,
          propertyNeighborhood: input.propertyNeighborhood ?? null,
          propertyStreet: input.propertyStreet ?? null,
          propertyRooms: input.propertyRooms ?? null,
          propertyType: input.propertyType ?? null,
          currentPropertyPrice: input.currentPropertyPrice ?? null,
        });
        return { id };
      }),

    update: agentProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          name: z.string().min(1).optional(),
          phone: z.string().min(1).optional(),
          secondaryPhone: z.string().optional().nullable(),
          email: z.string().email().optional().nullable(),
          neighborhood: z.string().optional().nullable(),
          notes: z.string().optional().nullable(),
          tags: z.string().optional(),
          leadStatus: z.enum(["חדש", "פעיל", "סגור", "לא רלוונטי"]).optional(),
          source: z.string().optional().nullable(),
          agentId: z.number().int().positive().optional().nullable(),
          leadType: z.string().optional().nullable(),
          budgetMin: z.number().optional().nullable(),
          budgetMax: z.number().optional().nullable(),
          desiredBudget: z.string().optional().nullable(),
          processStage: z.string().optional().nullable(),
          lastContact: z.string().optional().nullable(),
          meetingDate: z.string().optional().nullable(),
          meetingTime: z.string().optional().nullable(),
          meetingNotes: z.string().optional().nullable(),
          meetingLocation: z.string().optional().nullable(),
          propertyNeighborhood: z.string().optional().nullable(),
          propertyStreet: z.string().optional().nullable(),
          propertyRooms: z.string().optional().nullable(),
          propertyType: z.string().optional().nullable(),
          currentPropertyPrice: z.number().optional().nullable(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const isAdmin = ctx.agentSession.accountRole === "admin";
        const { id, ...data } = input;
        if (!isAdmin) {
          delete (data as { agentId?: unknown }).agentId;
        }
        await updateCrmLead(id, data);
        return { success: true } as const;
      }),

    delete: agentProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const isAdmin = ctx.agentSession.accountRole === "admin";
        if (!isAdmin) {
          const lead = await getCrmLeadById(input.id);
          if (!lead || lead.agentId !== ctx.agentSession.id) {
            throw new Error("אין הרשאה למחוק ליד זה");
          }
        }
        await deleteCrmLead(input.id);
        return { success: true } as const;
      }),

    bulkImport: agentProcedure
      .input(
        z.array(
          z.object({
            name: z.string().min(1),
            phone: z.string().min(1),
            email: z.string().email().optional().nullable(),
            neighborhood: z.string().optional().nullable(),
            notes: z.string().optional().nullable(),
            tags: z.string().optional().default(""),
            leadStatus: z.enum(["חדש", "פעיל", "סגור", "לא רלוונטי"]).optional().default("חדש"),
            source: z.string().optional().nullable(),
            agentId: z.number().int().positive().optional().nullable(),
          })
        )
      )
      .mutation(async ({ ctx, input }) => {
        const isAdmin = ctx.agentSession.accountRole === "admin";
        const leads = input.map((item) => ({
          name: item.name,
          phone: item.phone,
          email: item.email ?? null,
          neighborhood: item.neighborhood ?? null,
          notes: item.notes ?? null,
          tags: item.tags,
          leadStatus: item.leadStatus,
          source: item.source ?? null,
          agentId: isAdmin ? (item.agentId ?? ctx.agentSession.id) : ctx.agentSession.id,
        }));
        const count = await bulkImportCrmLeads(leads);
        return { count };
      }),

    deduplicate: adminProcedure.mutation(async () => {
      return await deduplicateCrmLeads();
    }),
  }),
});

export type AppRouter = typeof appRouter;
