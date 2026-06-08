import crypto from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { get as blobGet, list as blobList, put as blobPut } from "@vercel/blob";
import path from "node:path";
import { and, asc, desc, eq, like, lte, gte, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  agentAccounts,
  crmLeads,
  type AgentAccount,
  type InsertAgentAccount,
  type InsertCrmLead,
  type InsertLeadSubmission,
  type InsertProperty,
  type Property,
  type InsertPropertyImage,
  type InsertSiteSettings,
  type InsertTestimonial,
  InsertUser,
  leadSubmissions,
  properties,
  propertyImages,
  siteSettings,
  testimonials,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

const defaultStaffAccounts = [
  {
    accountRole: "admin" as const,
    name: "שי כהן",
    email: "shay2003ai@gmail.com",
    phone: "052-863-6631",
    password: "shay2003ai",
    roleTitle: 'ראש הצוות ומומחה לניהול משא ומתן',
    bio: 'מלווה עסקאות מורכבות ומתמחה במקסום שווי נכס.',
    sortOrder: 0,
    isFeaturedOnHomepage: true,
  },
  {
    accountRole: "agent" as const,
    name: "רונן דוידיאן",
    email: "ronend0000@gmail.com",
    phone: "050-900-5161",
    password: "ronend0000",
    roleTitle: "מלווה משקיעים ורוכשים",
    bio: null,
    sortOrder: 1,
    isFeaturedOnHomepage: true,
  },
  {
    accountRole: "agent" as const,
    name: "אביעד ניסים",
    email: "aviad5436@gmail.com",
    phone: "052-533-5251",
    password: "aviad5436",
    roleTitle: "סוכן מוכרים. מומחה לאזור גילה והר חומה",
    bio: null,
    sortOrder: 2,
    isFeaturedOnHomepage: true,
  },
  {
    accountRole: "agent" as const,
    name: "ירדן גמליאל",
    email: "yardeen12@gmail.com",
    phone: "050-253-5095",
    password: "yardeen12",
    roleTitle: "סוכן מוכרים. מומחה לאזור קטמונים, קטמון, סן סימון ורסקו",
    bio: null,
    sortOrder: 3,
    isFeaturedOnHomepage: true,
  },
  {
    accountRole: "agent" as const,
    name: "אליה מרציאנו",
    email: "eliyamarciano1@gmail.com",
    phone: "050-254-0855",
    password: "eliyamarciano1",
    roleTitle: "סוכן מוכרים. מומחה לאזור קריית יובל והסביבה",
    bio: null,
    sortOrder: 4,
    isFeaturedOnHomepage: true,
  },
] as const;

const defaultSiteSettings: InsertSiteSettings = {
  id: 1,
  siteName: "Team Shay",
  heroHeadline: "דואגים למכור לכם את הנכס במחיר המקסימלי ובזמן הקצר ביותר",
  heroTypingText: "צוות מומחי נדל״ן שמביא תוצאות אמיתיות בשטח",
  whatsappLink: "https://wa.me/message/6RX7H74VQ4BPI1",
  officePhone: "052-863-6631",
  aboutTitle: "אמון, תוצאות ומקצוענות שמרגישים כבר מהפגישה הראשונה",
  aboutSubtitle:
    "Team Shay נבנה סביב תפיסה אחת פשוטה: מוכרים נכס רק כשיש אסטרטגיה ברורה, טיפול אנושי וניהול עסקי חכם.",
  landsmanTitle: "רשת חזקה מאחוריכם, צוות ממוקד לצדכם",
  landsmanBody:
    "Team Shay פועל תחת Landsman ירושלים ומחבר בין ידע מקומי, שיטות שיווק חכמות ונגישות לרשת רחבה של אנשי מקצוע, קונים ושיתופי פעולה.",
  footerSlogan: "מתווכים בצד שלך",
};

const defaultTestimonials: InsertTestimonial[] = [
  {
    quote: "שי והצוות ליוו אותנו ברוגע, במהירות ובדיוק עד לחתימה.",
    sourceName: "לקוח 1",
    sourceLabel: "WhatsApp",
    stars: 5,
    displayOrder: 1,
    isPublished: true,
  },
  {
    quote: "קיבלנו חשיפה מדויקת וקונים רציניים כבר בשבוע הראשון.",
    sourceName: "לקוח 2",
    sourceLabel: "WhatsApp",
    stars: 5,
    displayOrder: 2,
    isPublished: true,
  },
  {
    quote: "תהליך מסודר, שקוף ונעים עם תוצאה שחסכה לנו הרבה זמן.",
    sourceName: "לקוח 3",
    sourceLabel: "WhatsApp",
    stars: 5,
    displayOrder: 3,
    isPublished: true,
  },
  {
    quote: "הצוות ידע לחדד את המסרים של הנכס ולשפר את רמת הביקוש.",
    sourceName: "לקוח 4",
    sourceLabel: "WhatsApp",
    stars: 5,
    displayOrder: 4,
    isPublished: true,
  },
  {
    quote: "הרגשנו שיש מי שמנהל עבורנו את המשא ומתן עד הפרט האחרון.",
    sourceName: "לקוח 5",
    sourceLabel: "WhatsApp",
    stars: 5,
    displayOrder: 5,
    isPublished: true,
  },
  {
    quote: "שילוב של יחס אישי, הבנת שוק ויכולת סגירה חזקה מאוד.",
    sourceName: "לקוח 6",
    sourceLabel: "WhatsApp",
    stars: 5,
    displayOrder: 6,
    isPublished: true,
  },
];

export type PropertyListItem = {
  id: number;
  agentId: number;
  title: string;
  address: string;
  street: string | null;
  neighborhood: string;
  city: string;
  price: number;
  rooms: number;
  sqm: number;
  builtSqm: number | null;
  outdoorSpace: string | null;
  floor: number | null;
  status: "חדש" | "בלעדי" | "למכירה" | "נמכר";
  description: string;
  descriptionHtml: string | null;
  featuredImageUrl: string | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  images: Array<{
    id: number;
    imageUrl: string;
    imageKey: string | null;
    altText: string | null;
    sortOrder: number;
  }>;
};

export type HomepagePayload = {
  settings: Awaited<ReturnType<typeof getSiteSettings>>;
  agents: Awaited<ReturnType<typeof listFeaturedAgents>>;
  testimonials: Awaited<ReturnType<typeof listPublishedTestimonials>>;
  properties: Awaited<ReturnType<typeof listPublishedProperties>>;
};

type LocalPropertyImage = {
  id: number;
  propertyId: number;
  imageUrl: string;
  imageKey: string | null;
  altText: string | null;
  sortOrder: number;
  createdAt: Date;
};

type LocalCmsData = {
  nextPropertyId: number;
  nextPropertyImageId: number;
  properties: Property[];
  propertyImages: LocalPropertyImage[];
};

const localCmsDataPath = path.join(process.cwd(), ".local-cms-data", "cms.json");
const blobCmsDataPrefix = "cms/team-shay/cms-";
const blobCmsCurrentPath = "cms/team-shay/current.json";
const blobCmsCacheTtlMs = 30_000;

let cachedBlobCmsData: LocalCmsData | null = null;
let cachedBlobCmsEtag: string | null = null;
let cachedBlobCmsFetchedAt = 0;

function hasBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function canWriteLocalCmsBackup() {
  return !ENV.isProduction;
}

function createEmptyLocalCmsData(): LocalCmsData {
  return {
    nextPropertyId: 1,
    nextPropertyImageId: 1,
    properties: [],
    propertyImages: [],
  };
}

function parseDate(value: unknown) {
  return value ? new Date(String(value)) : new Date();
}

async function streamToText(stream: ReadableStream<Uint8Array>) {
  const response = new Response(stream);
  return response.text();
}

function normalizeLocalCmsData(parsed: Partial<LocalCmsData>): LocalCmsData {
  return {
    nextPropertyId: parsed.nextPropertyId || 1,
    nextPropertyImageId: parsed.nextPropertyImageId || 1,
    properties: (parsed.properties ?? []).map((property) => ({
      ...property,
      createdAt: parseDate(property.createdAt),
      updatedAt: parseDate(property.updatedAt),
    })) as Property[],
    propertyImages: (parsed.propertyImages ?? []).map((image) => ({
      ...image,
      createdAt: parseDate(image.createdAt),
    })) as LocalPropertyImage[],
  };
}

function updateBlobCmsCache(data: LocalCmsData, etag?: string | null) {
  cachedBlobCmsData = data;
  cachedBlobCmsEtag = etag ?? null;
  cachedBlobCmsFetchedAt = Date.now();
}

async function persistLocalCmsBackup(data: LocalCmsData) {
  if (!canWriteLocalCmsBackup()) return false;

  try {
    await mkdir(path.dirname(localCmsDataPath), { recursive: true });
    await writeFile(localCmsDataPath, `${JSON.stringify(data, null, 2)}\n`);
    return true;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "EROFS" || code === "EPERM" || code === "EACCES") {
      console.warn("[CMS] Local backup write skipped: filesystem is not writable in this environment.");
      return false;
    }

    throw error;
  }
}

async function readBlobCmsFile(pathname: string, ifNoneMatch?: string | null): Promise<LocalCmsData | null> {
  const result = await blobGet(pathname, {
    access: "public",
    ifNoneMatch: ifNoneMatch ?? undefined,
  });

  if (!result) return null;
  if (result.statusCode === 304 && cachedBlobCmsData) {
    cachedBlobCmsFetchedAt = Date.now();
    return cachedBlobCmsData;
  }
  if (!result.stream) return null;

  const rawData = await streamToText(result.stream);
  const data = normalizeLocalCmsData(JSON.parse(rawData) as LocalCmsData);
  updateBlobCmsCache(data, result.blob.etag);
  return data;
}

async function readBlobCmsData(): Promise<LocalCmsData | null> {
  if (!hasBlobStorage()) return null;
  if (cachedBlobCmsData && Date.now() - cachedBlobCmsFetchedAt < blobCmsCacheTtlMs) {
    return cachedBlobCmsData;
  }

  try {
    const currentData = await readBlobCmsFile(blobCmsCurrentPath, cachedBlobCmsEtag);
    if (currentData) {
      await persistLocalCmsBackup(currentData);
      return currentData;
    }

    const { blobs } = await blobList({
      prefix: blobCmsDataPrefix,
      limit: 1000,
    });
    const latestBlob = blobs.sort((left, right) => right.uploadedAt.getTime() - left.uploadedAt.getTime())[0];
    if (!latestBlob) return null;

    const result = await blobGet(latestBlob.url, { access: "public" });
    if (!result || result.statusCode !== 200 || !result.stream) return null;

    const rawData = await streamToText(result.stream);
    const data = normalizeLocalCmsData(JSON.parse(rawData) as LocalCmsData);

    await blobPut(blobCmsCurrentPath, `${JSON.stringify(data, null, 2)}\n`, {
      access: "public",
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });

    updateBlobCmsCache(data, result.blob.etag);
    await persistLocalCmsBackup(data);
    return data;
  } catch (error) {
    console.warn("[CMS] Falling back from Blob storage to local CMS data:", error);
    return null;
  }
}

async function writeBlobCmsData(data: LocalCmsData) {
  if (!hasBlobStorage()) return false;

  try {
    await blobPut(blobCmsCurrentPath, `${JSON.stringify(data, null, 2)}\n`, {
      access: "public",
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });

    updateBlobCmsCache(data);
    return true;
  } catch (error) {
    console.warn("[CMS] Blob write unavailable, falling back to local CMS data:", error);
    return false;
  }
}

async function readLocalCmsData(): Promise<LocalCmsData> {
  const blobData = await readBlobCmsData();
  if (blobData) return blobData;

  try {
    const rawData = await readFile(localCmsDataPath, "utf8");
    return normalizeLocalCmsData(JSON.parse(rawData) as LocalCmsData);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return createEmptyLocalCmsData();
    }

    throw error;
  }
}

async function writeLocalCmsData(data: LocalCmsData) {
  const blobSaved = await writeBlobCmsData(data);
  const localSaved = await persistLocalCmsBackup(data);
  if (blobSaved || localSaved) return;

  throw new Error("CMS write failed: Blob is unavailable and local filesystem is read-only.");
}

function sortByNewestProperty(left: Property, right: Property) {
  return right.createdAt.getTime() - left.createdAt.getTime();
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export function hashAgentPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function passwordFromAgentEmail(email: string) {
  return email.trim().toLowerCase().split("@")[0] ?? "";
}

function buildDefaultAgentAccount(account: (typeof defaultStaffAccounts)[number]): InsertAgentAccount {
  return {
    accountRole: account.accountRole,
    name: account.name,
    email: account.email,
    phone: account.phone,
    passwordHash: hashAgentPassword(passwordFromAgentEmail(account.email)),
    roleTitle: account.roleTitle,
    bio: account.bio,
    sortOrder: account.sortOrder,
    isFeaturedOnHomepage: account.isFeaturedOnHomepage,
    isActive: true,
    managedByAdmin: true,
  };
}

function buildFallbackAgentAccount(account: (typeof defaultStaffAccounts)[number], index: number): AgentAccount {
  const now = new Date(0);
  const seedValue = buildDefaultAgentAccount(account);

  return {
    id: index + 1,
    accountRole: account.accountRole,
    name: account.name,
    email: account.email,
    phone: account.phone,
    passwordHash: seedValue.passwordHash,
    roleTitle: account.roleTitle,
    bio: account.bio,
    photoUrl: null,
    sortOrder: account.sortOrder,
    isFeaturedOnHomepage: account.isFeaturedOnHomepage,
    isActive: true,
    managedByAdmin: true,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

function getFallbackAgentAccounts() {
  return defaultStaffAccounts.map(buildFallbackAgentAccount);
}

export async function ensureDefaultAgentAccounts() {
  const db = await getDb();
  if (!db) return;

  for (const account of defaultStaffAccounts) {
    const seedValue = buildDefaultAgentAccount(account);
    const existing = await db
      .select({ id: agentAccounts.id })
      .from(agentAccounts)
      .where(eq(agentAccounts.email, account.email))
      .limit(1);

    if (existing[0]) {
      await db
        .update(agentAccounts)
        .set({
          passwordHash: seedValue.passwordHash,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(agentAccounts.id, existing[0].id));
      continue;
    }

    await db.insert(agentAccounts).values(seedValue);
  }
}

export async function ensureDefaultSiteSettings() {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select({ id: siteSettings.id }).from(siteSettings).limit(1);
  if (existing.length > 0) return;

  await db.insert(siteSettings).values(defaultSiteSettings);
}

export async function ensureDefaultTestimonials() {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select({ id: testimonials.id }).from(testimonials).limit(1);
  if (existing.length > 0) return;

  await db.insert(testimonials).values(defaultTestimonials);
}

export async function ensureCmsSeedData() {
  await ensureDefaultAgentAccounts();
  await ensureDefaultSiteSettings();
  await ensureDefaultTestimonials();
}

export async function authenticateAgent(email: string, password: string) {
  const db = await getDb();
  const normalizedEmail = email.trim().toLowerCase();

  if (!db) {
    const fallbackAgent = getFallbackAgentAccounts().find((agent) => agent.email === normalizedEmail);
    if (!fallbackAgent || password !== passwordFromAgentEmail(normalizedEmail)) {
      return null;
    }

    return fallbackAgent;
  }

  await ensureCmsSeedData();

  const result = await db
    .select()
    .from(agentAccounts)
    .where(eq(agentAccounts.email, normalizedEmail))
    .limit(1);

  const agent = result[0];
  if (!agent || !agent.isActive) {
    return null;
  }

  const passwordHash = hashAgentPassword(password);
  if (agent.passwordHash !== passwordHash && password !== passwordFromAgentEmail(normalizedEmail)) {
    return null;
  }

  await db
    .update(agentAccounts)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(agentAccounts.id, agent.id));

  return agent;
}

export async function getAgentById(agentId: number) {
  const db = await getDb();
  if (!db) return getFallbackAgentAccounts().find((agent) => agent.id === agentId) ?? null;

  const result = await db.select().from(agentAccounts).where(eq(agentAccounts.id, agentId)).limit(1);
  return result[0] ?? null;
}

export async function listStaffAccounts() {
  const db = await getDb();
  if (!db) return getFallbackAgentAccounts();

  await ensureDefaultAgentAccounts();

  return db
    .select()
    .from(agentAccounts)
    .orderBy(asc(agentAccounts.sortOrder), asc(agentAccounts.createdAt));
}

export async function listFeaturedAgents() {
  const db = await getDb();
  if (!db) return [];

  await ensureDefaultAgentAccounts();

  return db
    .select({
      id: agentAccounts.id,
      name: agentAccounts.name,
      roleTitle: agentAccounts.roleTitle,
      bio: agentAccounts.bio,
      phone: agentAccounts.phone,
      email: agentAccounts.email,
      photoUrl: agentAccounts.photoUrl,
      sortOrder: agentAccounts.sortOrder,
    })
    .from(agentAccounts)
    .where(and(eq(agentAccounts.isFeaturedOnHomepage, true), eq(agentAccounts.isActive, true)))
    .orderBy(asc(agentAccounts.sortOrder), asc(agentAccounts.createdAt));
}

export async function createStaffAccount(input: InsertAgentAccount) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const inserted = await db.insert(agentAccounts).values(input);
  return Number(inserted[0].insertId);
}

export async function updateStaffAccount(accountId: number, input: Partial<InsertAgentAccount>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(agentAccounts)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(agentAccounts.id, accountId));
}

export async function deleteStaffAccount(accountId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(agentAccounts).where(eq(agentAccounts.id, accountId));
}

export async function getSiteSettings() {
  const db = await getDb();
  if (!db) return null;

  await ensureDefaultSiteSettings();

  const rows = await db.select().from(siteSettings).limit(1);
  return rows[0] ?? null;
}

export async function updateSiteSettings(input: Partial<InsertSiteSettings>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await ensureDefaultSiteSettings();

  await db
    .update(siteSettings)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(siteSettings.id, 1));
}

export async function listPublishedTestimonials() {
  const db = await getDb();
  if (!db) return [];

  await ensureDefaultTestimonials();

  return db
    .select()
    .from(testimonials)
    .where(eq(testimonials.isPublished, true))
    .orderBy(asc(testimonials.displayOrder), asc(testimonials.id));
}

export async function listAllTestimonials() {
  const db = await getDb();
  if (!db) return [];

  await ensureDefaultTestimonials();

  return db
    .select()
    .from(testimonials)
    .orderBy(asc(testimonials.displayOrder), asc(testimonials.id));
}

export async function createTestimonial(input: InsertTestimonial) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const inserted = await db.insert(testimonials).values(input);
  return Number(inserted[0].insertId);
}

export async function updateTestimonial(testimonialId: number, input: Partial<InsertTestimonial>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(testimonials)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(testimonials.id, testimonialId));
}

export async function deleteTestimonial(testimonialId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(testimonials).where(eq(testimonials.id, testimonialId));
}

export async function createLeadSubmission(input: InsertLeadSubmission) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const inserted = await db.insert(leadSubmissions).values(input);
  return Number(inserted[0].insertId);
}

export async function listLeadSubmissions() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(leadSubmissions).orderBy(desc(leadSubmissions.createdAt));
}

function mapPropertiesWithImages(
  propertyRows: Property[],
  imageRows: Array<Pick<LocalPropertyImage, "id" | "propertyId" | "imageUrl" | "imageKey" | "altText" | "sortOrder">>,
): PropertyListItem[] {
  const imageMap = new Map<number, PropertyListItem["images"]>();

  for (const image of imageRows) {
    if (!imageMap.has(image.propertyId)) {
      imageMap.set(image.propertyId, []);
    }

    imageMap.get(image.propertyId)?.push({
      id: image.id,
      imageUrl: image.imageUrl,
      imageKey: image.imageKey ?? null,
      altText: image.altText ?? null,
      sortOrder: image.sortOrder,
    });
  }

  return propertyRows.map((property: Property) => ({
    id: property.id,
    agentId: property.agentId,
    title: property.title,
    address: property.address,
    street: property.street ?? null,
    neighborhood: property.neighborhood,
    city: property.city,
    price: property.price,
    rooms: property.rooms,
    sqm: property.sqm,
    builtSqm: property.builtSqm ?? null,
    outdoorSpace: property.outdoorSpace ?? null,
    floor: property.floor ?? null,
    status: property.status,
    description: property.description,
    descriptionHtml: property.descriptionHtml ?? null,
    featuredImageUrl: property.featuredImageUrl ?? null,
    isPublished: property.isPublished,
    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
    images: imageMap.get(property.id) ?? [],
  }));
}

async function hydratePropertyRows(propertyRows: Property[]): Promise<PropertyListItem[]> {
  const db = await getDb();
  if (!db || propertyRows.length === 0) {
    return [];
  }

  const imageRows = await db.select().from(propertyImages).orderBy(propertyImages.sortOrder);
  return mapPropertiesWithImages(propertyRows, imageRows);
}

export async function listAgentProperties(agentId: number): Promise<PropertyListItem[]> {
  const db = await getDb();
  if (!db) {
    const data = await readLocalCmsData();
    const propertyRows = data.properties.filter((property) => property.agentId === agentId).sort(sortByNewestProperty);
    return mapPropertiesWithImages(propertyRows, data.propertyImages);
  }

  const propertyRows = await db
    .select()
    .from(properties)
    .where(eq(properties.agentId, agentId))
    .orderBy(desc(properties.createdAt));

  return hydratePropertyRows(propertyRows);
}

export async function listPublishedProperties(filters?: {
  area?: string;
  minPrice?: number;
  maxPrice?: number;
}): Promise<PropertyListItem[]> {
  const db = await getDb();
  if (!db) {
    const data = await readLocalCmsData();
    const propertyRows = data.properties
      .filter((property) => {
        if (!property.isPublished) return false;
        if (filters?.area && !property.neighborhood.includes(filters.area)) return false;
        if (filters?.minPrice && property.price < filters.minPrice) return false;
        if (filters?.maxPrice && property.price > filters.maxPrice) return false;
        return true;
      })
      .sort(sortByNewestProperty);

    return mapPropertiesWithImages(propertyRows, data.propertyImages);
  }

  const conditions = [eq(properties.isPublished, true)];

  if (filters?.area) {
    conditions.push(like(properties.neighborhood, `%${filters.area}%`));
  }
  if (filters?.minPrice) {
    conditions.push(gte(properties.price, filters.minPrice));
  }
  if (filters?.maxPrice) {
    conditions.push(lte(properties.price, filters.maxPrice));
  }

  const propertyRows = await db
    .select()
    .from(properties)
    .where(and(...conditions))
    .orderBy(desc(properties.createdAt));

  return hydratePropertyRows(propertyRows);
}

export async function listAllProperties(): Promise<PropertyListItem[]> {
  const db = await getDb();
  if (!db) {
    const data = await readLocalCmsData();
    return mapPropertiesWithImages(data.properties.sort(sortByNewestProperty), data.propertyImages);
  }

  const propertyRows = await db.select().from(properties).orderBy(desc(properties.createdAt));
  return hydratePropertyRows(propertyRows);
}

export async function createAgentProperty(
  propertyInput: InsertProperty,
  images: Array<Omit<InsertPropertyImage, "propertyId">>,
): Promise<number> {
  const db = await getDb();
  if (!db) {
    const data = await readLocalCmsData();
    const now = new Date();
    const propertyId = data.nextPropertyId++;

    data.properties.push({
      id: propertyId,
      agentId: propertyInput.agentId,
      title: propertyInput.title,
      address: propertyInput.address,
      street: propertyInput.street ?? null,
      neighborhood: propertyInput.neighborhood,
      city: propertyInput.city ?? "ירושלים",
      price: propertyInput.price,
      rooms: propertyInput.rooms,
      sqm: propertyInput.sqm,
      builtSqm: propertyInput.builtSqm ?? null,
      outdoorSpace: propertyInput.outdoorSpace ?? null,
      floor: propertyInput.floor ?? null,
      status: propertyInput.status ?? "חדש",
      description: propertyInput.description,
      descriptionHtml: propertyInput.descriptionHtml ?? null,
      featuredImageUrl: propertyInput.featuredImageUrl ?? images[0]?.imageUrl ?? null,
      isPublished: propertyInput.isPublished ?? true,
      createdAt: now,
      updatedAt: now,
    });

    data.propertyImages.push(
      ...images.map((image, index) => ({
        id: data.nextPropertyImageId++,
        propertyId,
        imageUrl: image.imageUrl,
        imageKey: image.imageKey ?? null,
        altText: image.altText ?? null,
        sortOrder: image.sortOrder ?? index,
        createdAt: now,
      })),
    );

    await writeLocalCmsData(data);
    return propertyId;
  }

  const inserted = await db.insert(properties).values(propertyInput);
  const propertyId = Number(inserted[0].insertId);

  if (images.length > 0) {
    await db.insert(propertyImages).values(
      images.map((image) => ({
        ...image,
        propertyId,
      })),
    );
  }

  return propertyId;
}

export async function getAgentPropertyById(agentId: number, propertyId: number) {
  const db = await getDb();
  if (!db) {
    const data = await readLocalCmsData();
    const property = data.properties.find((item) => item.agentId === agentId && item.id === propertyId);
    if (!property) return null;

    return {
      ...property,
      images: data.propertyImages.filter((image) => image.propertyId === propertyId).sort((a, b) => a.sortOrder - b.sortOrder),
    };
  }

  const propertyRows = await db
    .select()
    .from(properties)
    .where(and(eq(properties.agentId, agentId), eq(properties.id, propertyId)))
    .limit(1);

  const property = propertyRows[0];
  if (!property) return null;

  const images = await db
    .select()
    .from(propertyImages)
    .where(eq(propertyImages.propertyId, propertyId))
    .orderBy(propertyImages.sortOrder);

  return {
    ...property,
    images,
  };
}

export async function getPropertyById(propertyId: number) {
  const db = await getDb();
  if (!db) {
    const data = await readLocalCmsData();
    const property = data.properties.find((item) => item.id === propertyId);
    if (!property) return null;

    return {
      ...property,
      images: data.propertyImages.filter((image) => image.propertyId === propertyId).sort((a, b) => a.sortOrder - b.sortOrder),
    };
  }

  const rows = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
  const property = rows[0];
  if (!property) return null;

  const images = await db
    .select()
    .from(propertyImages)
    .where(eq(propertyImages.propertyId, propertyId))
    .orderBy(propertyImages.sortOrder);

  return {
    ...property,
    images,
  };
}

export async function updateAgentProperty(
  agentId: number,
  propertyId: number,
  propertyInput: Partial<InsertProperty>,
  images: Array<Omit<InsertPropertyImage, "propertyId">>,
) {
  const db = await getDb();
  if (!db) {
    const data = await readLocalCmsData();
    const propertyIndex = data.properties.findIndex((property) => property.id === propertyId && property.agentId === agentId);
    if (propertyIndex === -1) return;

    data.properties[propertyIndex] = {
      ...data.properties[propertyIndex],
      ...propertyInput,
      street: propertyInput.street ?? data.properties[propertyIndex].street,
      builtSqm: propertyInput.builtSqm ?? data.properties[propertyIndex].builtSqm,
      outdoorSpace: propertyInput.outdoorSpace ?? data.properties[propertyIndex].outdoorSpace,
      floor: propertyInput.floor ?? data.properties[propertyIndex].floor,
      descriptionHtml: propertyInput.descriptionHtml ?? data.properties[propertyIndex].descriptionHtml,
      featuredImageUrl: propertyInput.featuredImageUrl ?? data.properties[propertyIndex].featuredImageUrl,
      updatedAt: new Date(),
    };

    if (images.length > 0) {
      data.propertyImages = data.propertyImages.filter((image) => image.propertyId !== propertyId);
      data.propertyImages.push(
        ...images.map((image, index) => ({
          id: data.nextPropertyImageId++,
          propertyId,
          imageUrl: image.imageUrl,
          imageKey: image.imageKey ?? null,
          altText: image.altText ?? null,
          sortOrder: image.sortOrder ?? index,
          createdAt: new Date(),
        })),
      );
    }

    await writeLocalCmsData(data);
    return;
  }

  await db
    .update(properties)
    .set({
      ...propertyInput,
      updatedAt: new Date(),
    })
    .where(and(eq(properties.id, propertyId), eq(properties.agentId, agentId)));

  if (images.length > 0) {
    await db.delete(propertyImages).where(eq(propertyImages.propertyId, propertyId));
    await db.insert(propertyImages).values(
      images.map((image) => ({
        ...image,
        propertyId,
      })),
    );
  }
}

export async function updatePropertyById(
  propertyId: number,
  propertyInput: Partial<InsertProperty>,
  images: Array<Omit<InsertPropertyImage, "propertyId">>,
) {
  const db = await getDb();
  if (!db) {
    const data = await readLocalCmsData();
    const propertyIndex = data.properties.findIndex((property) => property.id === propertyId);
    if (propertyIndex === -1) return;

    data.properties[propertyIndex] = {
      ...data.properties[propertyIndex],
      ...propertyInput,
      street: propertyInput.street ?? data.properties[propertyIndex].street,
      builtSqm: propertyInput.builtSqm ?? data.properties[propertyIndex].builtSqm,
      outdoorSpace: propertyInput.outdoorSpace ?? data.properties[propertyIndex].outdoorSpace,
      floor: propertyInput.floor ?? data.properties[propertyIndex].floor,
      descriptionHtml: propertyInput.descriptionHtml ?? data.properties[propertyIndex].descriptionHtml,
      featuredImageUrl: propertyInput.featuredImageUrl ?? data.properties[propertyIndex].featuredImageUrl,
      updatedAt: new Date(),
    };

    if (images.length > 0) {
      data.propertyImages = data.propertyImages.filter((image) => image.propertyId !== propertyId);
      data.propertyImages.push(
        ...images.map((image, index) => ({
          id: data.nextPropertyImageId++,
          propertyId,
          imageUrl: image.imageUrl,
          imageKey: image.imageKey ?? null,
          altText: image.altText ?? null,
          sortOrder: image.sortOrder ?? index,
          createdAt: new Date(),
        })),
      );
    }

    await writeLocalCmsData(data);
    return;
  }

  await db
    .update(properties)
    .set({
      ...propertyInput,
      updatedAt: new Date(),
    })
    .where(eq(properties.id, propertyId));

  if (images.length > 0) {
    await db.delete(propertyImages).where(eq(propertyImages.propertyId, propertyId));
    await db.insert(propertyImages).values(
      images.map((image) => ({
        ...image,
        propertyId,
      })),
    );
  }
}

export async function deleteAgentProperty(agentId: number, propertyId: number) {
  const db = await getDb();
  if (!db) {
    const data = await readLocalCmsData();
    data.properties = data.properties.filter((property) => property.id !== propertyId || property.agentId !== agentId);
    data.propertyImages = data.propertyImages.filter((image) => image.propertyId !== propertyId);
    await writeLocalCmsData(data);
    return;
  }

  await db.delete(properties).where(and(eq(properties.id, propertyId), eq(properties.agentId, agentId)));
}

export async function deletePropertyById(propertyId: number) {
  const db = await getDb();
  if (!db) {
    const data = await readLocalCmsData();
    data.properties = data.properties.filter((property) => property.id !== propertyId);
    data.propertyImages = data.propertyImages.filter((image) => image.propertyId !== propertyId);
    await writeLocalCmsData(data);
    return;
  }

  await db.delete(properties).where(eq(properties.id, propertyId));
}

export async function getHomepagePayload(): Promise<HomepagePayload> {
  await ensureCmsSeedData();

  const [settings, agents, testimonialsRows, propertyRows] = await Promise.all([
    getSiteSettings(),
    listFeaturedAgents(),
    listPublishedTestimonials(),
    listPublishedProperties(),
  ]);

  return {
    settings,
    agents,
    testimonials: testimonialsRows,
    properties: propertyRows,
  };
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAgentDemoCredentials(): Promise<Pick<AgentAccount, "email" | "name">[]> {
  await ensureDefaultAgentAccounts();
  return defaultStaffAccounts
    .filter((account) => account.accountRole === "agent")
    .map((account) => ({ email: account.email, name: account.name }));
}

// ─── CRM Leads (Blob Storage) ─────────────────────────────────────────────────

export type CrmLeadData = {
  id: number;
  agentId: number | null;
  name: string;
  phone: string;
  secondaryPhone?: string | null;
  email: string | null;
  neighborhood: string | null;
  notes: string | null;
  tags: string;
  leadStatus: "חדש" | "פעיל" | "סגור" | "לא רלוונטי";
  source: string | null;
  // Extended CRM/import fields (optional for backwards compat with existing blob data)
  leadType?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  desiredBudget?: string | null;
  processStage?: string | null;
  lastContact?: string | null;
  meetingDate?: string | null;
  meetingTime?: string | null;
  meetingNotes?: string | null;
  meetingLocation?: string | null;
  propertyNeighborhood?: string | null;
  propertyStreet?: string | null;
  propertyCity?: string | null;
  propertyRooms?: string | null;
  propertyType?: string | null;
  currentPropertyPrice?: number | null;
  exclusivityStartDate?: string | null;
  exclusivityEndDate?: string | null;
  marketingPrice?: number | null;
  ownerName?: string | null;
  desiredNeighborhoods?: string[];
  desiredRooms?: string | null;
  desiredPropertyType?: string | null;
  askingPrice?: number | null;
  rentalPrice?: number | null;
  dealDate?: string | null;
  finalPrice?: number | null;
  lastTransactionDate?: string | null;
  createdAt: string;
  updatedAt: string;
};

type CrmBlobData = {
  nextId: number;
  leads: CrmLeadData[];
};

const blobCrmPath = "crm/team-shay/leads.json";
const localCrmPath = path.join(process.cwd(), ".local-cms-data", "crm.json");

let cachedCrmData: CrmBlobData | null = null;
let cachedCrmEtag: string | null = null;
let cachedCrmFetchedAt = 0;
const crmCacheTtlMs = 15_000;

function createEmptyCrmData(): CrmBlobData {
  return { nextId: 1, leads: [] };
}

async function readCrmData(): Promise<CrmBlobData> {
  if (hasBlobStorage()) {
    if (cachedCrmData && Date.now() - cachedCrmFetchedAt < crmCacheTtlMs) {
      return cachedCrmData;
    }
    try {
      const result = await blobGet(blobCrmPath, {
        access: "public",
        ifNoneMatch: cachedCrmEtag ?? undefined,
      });
      if (result?.statusCode === 304 && cachedCrmData) {
        cachedCrmFetchedAt = Date.now();
        return cachedCrmData;
      }
      if (result?.stream) {
        const raw = await streamToText(result.stream);
        const data = JSON.parse(raw) as CrmBlobData;
        cachedCrmData = data;
        cachedCrmEtag = result.blob.etag ?? null;
        cachedCrmFetchedAt = Date.now();
        return data;
      }
    } catch {
      // fall through to local
    }
  }

  try {
    const raw = await readFile(localCrmPath, "utf8");
    return JSON.parse(raw) as CrmBlobData;
  } catch {
    return createEmptyCrmData();
  }
}

async function writeCrmData(data: CrmBlobData): Promise<void> {
  const json = `${JSON.stringify(data, null, 2)}\n`;
  if (hasBlobStorage()) {
    await blobPut(blobCrmPath, json, {
      access: "public",
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: "application/json",
      cacheControlMaxAge: 0,
    });
    cachedCrmData = data;
    cachedCrmFetchedAt = Date.now();
    return;
  }
  await mkdir(path.dirname(localCrmPath), { recursive: true });
  await writeFile(localCrmPath, json);
}

export async function listCrmLeads(options?: {
  agentId?: number | null;
  search?: string;
}): Promise<CrmLeadData[]> {
  const data = await readCrmData();
  let leads = [...data.leads].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (options?.agentId != null) {
    leads = leads.filter((l) => l.agentId === options.agentId);
  }

  if (options?.search) {
    const term = options.search.toLowerCase();
    leads = leads.filter(
      (l) =>
        l.name.toLowerCase().includes(term) ||
        l.phone.includes(term) ||
        (l.neighborhood ?? "").toLowerCase().includes(term)
    );
  }

  return leads;
}

export async function getCrmLeadById(leadId: number): Promise<CrmLeadData | null> {
  const data = await readCrmData();
  return data.leads.find((l) => l.id === leadId) ?? null;
}

export async function createCrmLead(input: Omit<CrmLeadData, "id" | "createdAt" | "updatedAt">): Promise<number> {
  const data = await readCrmData();
  const now = new Date().toISOString();
  const id = data.nextId++;
  data.leads.push({ ...input, id, createdAt: now, updatedAt: now });
  await writeCrmData(data);
  return id;
}

export async function updateCrmLead(leadId: number, input: Partial<Omit<CrmLeadData, "id" | "createdAt">>): Promise<void> {
  const data = await readCrmData();
  const index = data.leads.findIndex((l) => l.id === leadId);
  if (index === -1) return;
  data.leads[index] = { ...data.leads[index], ...input, updatedAt: new Date().toISOString() };
  await writeCrmData(data);
}

export async function deleteCrmLead(leadId: number): Promise<void> {
  const data = await readCrmData();
  data.leads = data.leads.filter((l) => l.id !== leadId);
  await writeCrmData(data);
}

export async function bulkImportCrmLeads(leads: Omit<CrmLeadData, "id" | "createdAt" | "updatedAt">[]): Promise<number> {
  const data = await readCrmData();
  const now = new Date().toISOString();
  for (const lead of leads) {
    data.leads.push({ ...lead, id: data.nextId++, createdAt: now, updatedAt: now });
  }
  await writeCrmData(data);
  return leads.length;
}

export async function replaceCrmLeads(leads: Omit<CrmLeadData, "id" | "createdAt" | "updatedAt">[]): Promise<number> {
  const now = new Date().toISOString();
  await writeCrmData({
    nextId: leads.length + 1,
    leads: leads.map((lead, index) => ({
      ...lead,
      id: index + 1,
      createdAt: now,
      updatedAt: now,
    })),
  });
  return leads.length;
}

export async function deduplicateCrmLeads(): Promise<{ removed: number; remaining: number }> {
  const data = await readCrmData();
  const seen = new Set<string>();
  const unique: CrmLeadData[] = [];
  // Sort by id ascending so we keep the earliest import
  const sorted = [...data.leads].sort((a, b) => a.id - b.id);
  for (const lead of sorted) {
    const key = (lead.phone ?? "").trim().replace(/[\s\-]/g, "");
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    unique.push(lead);
  }
  const removed = data.leads.length - unique.length;
  data.leads = unique;
  await writeCrmData(data);
  return { removed, remaining: unique.length };
}

// ─── CRM v2 Modules (Blob Storage) ───────────────────────────────────────────

// פולואפ
export type FollowUp = {
  id: number;
  agentId: number;
  leadId: number;
  scheduledDate: string;
  type: "call" | "whatsapp" | "email" | "meeting";
  note: string | null;
  status: "pending" | "done" | "cancelled";
  createdAt: string;
  updatedAt: string;
};

// משימה
export type Task = {
  id: number;
  agentId: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "done";
  leadId: number | null;
  propertyId: number | null;
  createdAt: string;
  updatedAt: string;
};

// התאמה — נכס ↔ ליד
export type PropertyMatch = {
  id: number;
  agentId: number;
  leadId: number;
  propertyId: number;
  note: string | null;
  status: "pending" | "sent" | "interested" | "rejected";
  sentAt: string | null;
  createdAt: string;
};

// פעולת שיווק — לנכס בלעדי
export type MarketingAction = {
  id: number;
  agentId: number;
  propertyId: number;
  weekNumber: number;
  year: number;
  templateId: number | null;
  customMessage: string | null;
  marketingFields?: Record<string, string>;
  targetAudience: "all" | "buyers" | "sellers" | "investors";
  sentAt: string | null;
  recipientCount: number;
  status: "draft" | "scheduled" | "sent";
  createdAt: string;
};

// תבנית הודעה
export type MessageTemplate = {
  id: number;
  name: string;
  type: "shabbat" | "exclusivity" | "followup" | "general";
  content: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// הכנסה/הוצאה
export type FinanceEntry = {
  id: number;
  agentId: number;
  type: "income" | "expense";
  category: string;
  amount: number;
  date: string;
  description: string | null;
  propertyId: number | null;
  leadId: number | null;
  createdAt: string;
};

// מסמך
export type Document = {
  id: number;
  agentId: number;
  name: string;
  type: "contract" | "appraisal" | "id" | "power_of_attorney" | "other";
  url: string;
  leadId: number | null;
  propertyId: number | null;
  notes: string | null;
  uploadedAt: string;
};

// נתיבי Blob
const FOLLOWUPS_KEY = "crm/team-shay/followups.json";
const TASKS_KEY = "crm/team-shay/tasks.json";
const MATCHES_KEY = "crm/team-shay/matches.json";
const MARKETING_KEY = "crm/team-shay/marketing.json";
const TEMPLATES_KEY = "crm/team-shay/templates.json";
const FINANCE_KEY = "crm/team-shay/finance.json";
const DOCUMENTS_KEY = "crm/team-shay/documents.json";

type IdCollection<T> = {
  nextId: number;
  items: T[];
};

type CollectionCache<T> = {
  data: IdCollection<T> | null;
  etag: string | null;
  fetchedAt: number;
};

const crm2CacheTtlMs = 15_000;
const crm2LocalRoot = path.join(process.cwd(), ".local-cms-data");

function createCollectionCache<T>(): CollectionCache<T> {
  return { data: null, etag: null, fetchedAt: 0 };
}

function createEmptyCollection<T>(): IdCollection<T> {
  return { nextId: 1, items: [] };
}

function normalizeCollection<T>(value: unknown): IdCollection<T> {
  const parsed = value as Partial<IdCollection<T>> | null;
  return {
    nextId: Number(parsed?.nextId) > 0 ? Number(parsed?.nextId) : 1,
    items: Array.isArray(parsed?.items) ? parsed.items : [],
  };
}

async function readCollection<T>(
  blobKey: string,
  localPath: string,
  cache: CollectionCache<T>,
): Promise<IdCollection<T>> {
  if (hasBlobStorage()) {
    if (cache.data && Date.now() - cache.fetchedAt < crm2CacheTtlMs) {
      return cache.data;
    }

    try {
      const result = await blobGet(blobKey, {
        access: "public",
        ifNoneMatch: cache.etag ?? undefined,
      });

      if (result?.statusCode === 304 && cache.data) {
        cache.fetchedAt = Date.now();
        return cache.data;
      }

      if (result?.stream) {
        const raw = await streamToText(result.stream);
        const data = normalizeCollection<T>(JSON.parse(raw) as IdCollection<T>);
        cache.data = data;
        cache.etag = result.blob.etag ?? null;
        cache.fetchedAt = Date.now();
        return data;
      }
    } catch {
      // fall through to local fallback
    }
  }

  try {
    const raw = await readFile(localPath, "utf8");
    const data = normalizeCollection<T>(JSON.parse(raw) as IdCollection<T>);
    cache.data = data;
    cache.fetchedAt = Date.now();
    return data;
  } catch {
    const empty = createEmptyCollection<T>();
    cache.data = empty;
    cache.fetchedAt = Date.now();
    return empty;
  }
}

async function writeCollection<T>(
  blobKey: string,
  localPath: string,
  cache: CollectionCache<T>,
  data: IdCollection<T>,
): Promise<void> {
  const json = `${JSON.stringify(data, null, 2)}\n`;

  if (hasBlobStorage()) {
    await blobPut(blobKey, json, {
      access: "public",
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: "application/json",
      cacheControlMaxAge: 0,
    });

    cache.data = data;
    cache.fetchedAt = Date.now();
    return;
  }

  await mkdir(path.dirname(localPath), { recursive: true });
  await writeFile(localPath, json);
  cache.data = data;
  cache.fetchedAt = Date.now();
}

function nowIso() {
  return new Date().toISOString();
}

function getIsoWeekAndYear(date = new Date()) {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { weekNumber: weekNo, year: utcDate.getUTCFullYear() };
}

const followupsCache = createCollectionCache<FollowUp>();
const tasksCache = createCollectionCache<Task>();
const matchesCache = createCollectionCache<PropertyMatch>();
const marketingCache = createCollectionCache<MarketingAction>();
const templatesCache = createCollectionCache<MessageTemplate>();
const financeCache = createCollectionCache<FinanceEntry>();
const documentsCache = createCollectionCache<Document>();

const followupsLocalPath = path.join(crm2LocalRoot, "crm-followups.json");
const tasksLocalPath = path.join(crm2LocalRoot, "crm-tasks.json");
const matchesLocalPath = path.join(crm2LocalRoot, "crm-matches.json");
const marketingLocalPath = path.join(crm2LocalRoot, "crm-marketing.json");
const templatesLocalPath = path.join(crm2LocalRoot, "crm-templates.json");
const financeLocalPath = path.join(crm2LocalRoot, "crm-finance.json");
const documentsLocalPath = path.join(crm2LocalRoot, "crm-documents.json");

async function readFollowups() {
  return readCollection<FollowUp>(FOLLOWUPS_KEY, followupsLocalPath, followupsCache);
}
async function saveFollowups(data: IdCollection<FollowUp>) {
  return writeCollection<FollowUp>(FOLLOWUPS_KEY, followupsLocalPath, followupsCache, data);
}

export async function listFollowUps(agentId: number): Promise<FollowUp[]> {
  const data = await readFollowups();
  return data.items
    .filter((item) => item.agentId === agentId)
    .sort((left, right) => new Date(left.scheduledDate).getTime() - new Date(right.scheduledDate).getTime());
}

export async function getFollowUpById(id: number) {
  const data = await readFollowups();
  return data.items.find((item) => item.id === id) ?? null;
}

export async function createFollowUp(input: Omit<FollowUp, "id" | "createdAt" | "updatedAt">) {
  const data = await readFollowups();
  const timestamp = nowIso();
  const next: FollowUp = { ...input, id: data.nextId++, createdAt: timestamp, updatedAt: timestamp };
  data.items.push(next);
  await saveFollowups(data);
  return next;
}

export async function updateFollowUp(id: number, input: Partial<Omit<FollowUp, "id" | "createdAt">>) {
  const data = await readFollowups();
  const index = data.items.findIndex((item) => item.id === id);
  if (index < 0) return null;
  data.items[index] = { ...data.items[index], ...input, updatedAt: nowIso() };
  await saveFollowups(data);
  return data.items[index];
}

export async function deleteFollowUp(id: number) {
  const data = await readFollowups();
  data.items = data.items.filter((item) => item.id !== id);
  await saveFollowups(data);
}

async function readTasks() {
  return readCollection<Task>(TASKS_KEY, tasksLocalPath, tasksCache);
}
async function saveTasks(data: IdCollection<Task>) {
  return writeCollection<Task>(TASKS_KEY, tasksLocalPath, tasksCache, data);
}

export async function listTasks(agentId: number): Promise<Task[]> {
  const data = await readTasks();
  return data.items
    .filter((item) => item.agentId === agentId)
    .sort((left, right) => {
      const leftDate = left.dueDate ? new Date(left.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const rightDate = right.dueDate ? new Date(right.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return leftDate - rightDate;
    });
}

export async function getTaskById(id: number) {
  const data = await readTasks();
  return data.items.find((item) => item.id === id) ?? null;
}

export async function createTask(input: Omit<Task, "id" | "createdAt" | "updatedAt">) {
  const data = await readTasks();
  const timestamp = nowIso();
  const next: Task = { ...input, id: data.nextId++, createdAt: timestamp, updatedAt: timestamp };
  data.items.push(next);
  await saveTasks(data);
  return next;
}

export async function updateTask(id: number, input: Partial<Omit<Task, "id" | "createdAt">>) {
  const data = await readTasks();
  const index = data.items.findIndex((item) => item.id === id);
  if (index < 0) return null;
  data.items[index] = { ...data.items[index], ...input, updatedAt: nowIso() };
  await saveTasks(data);
  return data.items[index];
}

export async function deleteTask(id: number) {
  const data = await readTasks();
  data.items = data.items.filter((item) => item.id !== id);
  await saveTasks(data);
}

async function readMatches() {
  return readCollection<PropertyMatch>(MATCHES_KEY, matchesLocalPath, matchesCache);
}
async function saveMatches(data: IdCollection<PropertyMatch>) {
  return writeCollection<PropertyMatch>(MATCHES_KEY, matchesLocalPath, matchesCache, data);
}

export async function listPropertyMatches(agentId: number) {
  const data = await readMatches();
  return data.items
    .filter((item) => item.agentId === agentId)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export async function getPropertyMatchById(id: number) {
  const data = await readMatches();
  return data.items.find((item) => item.id === id) ?? null;
}

export async function createPropertyMatch(input: Omit<PropertyMatch, "id" | "createdAt" | "sentAt" | "status"> & {
  note?: string | null;
  status?: PropertyMatch["status"];
  sentAt?: string | null;
}) {
  const data = await readMatches();
  const timestamp = nowIso();
  const next: PropertyMatch = {
    id: data.nextId++,
    agentId: input.agentId,
    leadId: input.leadId,
    propertyId: input.propertyId,
    note: input.note ?? null,
    status: input.status ?? "pending",
    sentAt: input.sentAt ?? null,
    createdAt: timestamp,
  };
  data.items.push(next);
  await saveMatches(data);
  return next;
}

export async function updatePropertyMatch(id: number, input: Partial<Omit<PropertyMatch, "id" | "createdAt">>) {
  const data = await readMatches();
  const index = data.items.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const current = data.items[index];
  const nextStatus = input.status ?? current.status;
  data.items[index] = {
    ...current,
    ...input,
    status: nextStatus,
    sentAt: nextStatus === "sent" ? (input.sentAt ?? current.sentAt ?? nowIso()) : (input.sentAt ?? current.sentAt),
  };
  await saveMatches(data);
  return data.items[index];
}

export async function deletePropertyMatch(id: number) {
  const data = await readMatches();
  data.items = data.items.filter((item) => item.id !== id);
  await saveMatches(data);
}

const defaultTemplatesSeed: Array<Omit<MessageTemplate, "id" | "createdAt" | "updatedAt">> = [
  {
    name: "שבת שלום",
    type: "shabbat",
    content: "שבת שלום {name}, מאחלים לך ולמשפחה סוף שבוע רגוע ומבורך מצוות Team Shay.",
    imageUrl: null,
    isActive: true,
  },
  {
    name: "בלעדיות שבועית",
    type: "exclusivity",
    content: `שלום {שם הלקוח}, כמו בכל שבוע
מצורף עדכון שבועי לנכס ב{כתובת הנכס}:

📢 פלטפורמות פרסום פעילות:

יד2: {יד2}
צפיות יד2: {צפיות יד2}

מדלן: {מדלן}
צפיות מדלן: {צפיות מדלן}

פייסבוק: {פייסבוק}

אורגני דיגיטל: {אורגני דיגיטל}

ממומן דיגיטל: {ממומן דיגיטל}

וואטסאפ: {וואטסאפ}

שת"פ מתווכים: {שת״פ מתווכים}

פליירים: {פליירים}

מכתבי שכנים: {מכתבי שכנים}

עיתון מקומי: {עיתון מקומי}

צילום: {צילום}

שלטים: {שלטים}

פניות טלפון: {פניות טלפון}

בית פתוח: {בית פתוח}

פעילות נוספת: {אחר}

המשך שבוע מצוין לכולנו (:`,
    imageUrl: null,
    isActive: true,
  },
];

async function readTemplates() {
  return readCollection<MessageTemplate>(TEMPLATES_KEY, templatesLocalPath, templatesCache);
}
async function saveTemplates(data: IdCollection<MessageTemplate>) {
  return writeCollection<MessageTemplate>(TEMPLATES_KEY, templatesLocalPath, templatesCache, data);
}

async function ensureDefaultTemplates() {
  const data = await readTemplates();
  if (data.items.length > 0) return data;
  const timestamp = nowIso();
  for (const template of defaultTemplatesSeed) {
    data.items.push({
      id: data.nextId++,
      ...template,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }
  await saveTemplates(data);
  return data;
}

export async function listMessageTemplates() {
  const data = await ensureDefaultTemplates();
  return [...data.items].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
}

export async function getMessageTemplateById(id: number) {
  const data = await ensureDefaultTemplates();
  return data.items.find((item) => item.id === id) ?? null;
}

export async function getActiveMessageTemplate(type: MessageTemplate["type"]) {
  const data = await ensureDefaultTemplates();
  return data.items.find((item) => item.type === type && item.isActive) ?? null;
}

export async function createMessageTemplate(input: Omit<MessageTemplate, "id" | "createdAt" | "updatedAt">) {
  const data = await readTemplates();
  const timestamp = nowIso();
  const next: MessageTemplate = { ...input, id: data.nextId++, createdAt: timestamp, updatedAt: timestamp };
  data.items.push(next);
  await saveTemplates(data);
  return next;
}

export async function updateMessageTemplate(id: number, input: Partial<Omit<MessageTemplate, "id" | "createdAt">>) {
  const data = await readTemplates();
  const index = data.items.findIndex((item) => item.id === id);
  if (index < 0) return null;
  data.items[index] = { ...data.items[index], ...input, updatedAt: nowIso() };
  await saveTemplates(data);
  return data.items[index];
}

export async function deleteMessageTemplate(id: number) {
  const data = await readTemplates();
  data.items = data.items.filter((item) => item.id !== id);
  await saveTemplates(data);
}

async function readMarketing() {
  return readCollection<MarketingAction>(MARKETING_KEY, marketingLocalPath, marketingCache);
}
async function saveMarketing(data: IdCollection<MarketingAction>) {
  return writeCollection<MarketingAction>(MARKETING_KEY, marketingLocalPath, marketingCache, data);
}

export async function listMarketingActions(agentId: number) {
  const data = await readMarketing();
  return data.items
    .filter((item) => item.agentId === agentId)
    .sort((left, right) => {
      if (left.year !== right.year) return right.year - left.year;
      return right.weekNumber - left.weekNumber;
    });
}

export async function getMarketingActionById(id: number) {
  const data = await readMarketing();
  return data.items.find((item) => item.id === id) ?? null;
}

export async function createMarketingAction(input: Omit<MarketingAction, "id" | "createdAt" | "recipientCount" | "sentAt"> & {
  recipientCount?: number;
  sentAt?: string | null;
}) {
  const data = await readMarketing();
  const next: MarketingAction = {
    id: data.nextId++,
    ...input,
    marketingFields: input.marketingFields ?? {},
    sentAt: input.sentAt ?? null,
    recipientCount: input.recipientCount ?? 0,
    createdAt: nowIso(),
  };
  data.items.push(next);
  await saveMarketing(data);
  return next;
}

export async function updateMarketingAction(id: number, input: Partial<Omit<MarketingAction, "id" | "createdAt">>) {
  const data = await readMarketing();
  const index = data.items.findIndex((item) => item.id === id);
  if (index < 0) return null;
  data.items[index] = { ...data.items[index], ...input };
  await saveMarketing(data);
  return data.items[index];
}

export async function markMarketingActionSent(marketingActionId: number, recipientCount: number) {
  const data = await readMarketing();
  const index = data.items.findIndex((item) => item.id === marketingActionId);
  if (index < 0) return null;
  data.items[index] = {
    ...data.items[index],
    status: "sent",
    recipientCount,
    sentAt: nowIso(),
  };
  await saveMarketing(data);
  return data.items[index];
}

async function readFinance() {
  return readCollection<FinanceEntry>(FINANCE_KEY, financeLocalPath, financeCache);
}
async function saveFinance(data: IdCollection<FinanceEntry>) {
  return writeCollection<FinanceEntry>(FINANCE_KEY, financeLocalPath, financeCache, data);
}

export async function listFinanceEntries(agentId: number) {
  const data = await readFinance();
  return data.items
    .filter((item) => item.agentId === agentId)
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
}

export async function getFinanceEntryById(id: number) {
  const data = await readFinance();
  return data.items.find((item) => item.id === id) ?? null;
}

export async function createFinanceEntry(input: Omit<FinanceEntry, "id" | "createdAt">) {
  const data = await readFinance();
  const next: FinanceEntry = { ...input, id: data.nextId++, createdAt: nowIso() };
  data.items.push(next);
  await saveFinance(data);
  return next;
}

export async function updateFinanceEntry(id: number, input: Partial<Omit<FinanceEntry, "id" | "createdAt">>) {
  const data = await readFinance();
  const index = data.items.findIndex((item) => item.id === id);
  if (index < 0) return null;
  data.items[index] = { ...data.items[index], ...input };
  await saveFinance(data);
  return data.items[index];
}

export async function deleteFinanceEntry(id: number) {
  const data = await readFinance();
  data.items = data.items.filter((item) => item.id !== id);
  await saveFinance(data);
}

export async function summarizeFinanceEntries(agentId: number, month?: number, year?: number) {
  const entries = await listFinanceEntries(agentId);
  const now = new Date();
  const targetMonth = month ?? (now.getMonth() + 1);
  const targetYear = year ?? now.getFullYear();

  const relevant = entries.filter((entry) => {
    const date = new Date(entry.date);
    return date.getFullYear() === targetYear && (date.getMonth() + 1) === targetMonth;
  });

  const income = relevant
    .filter((entry) => entry.type === "income")
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const expense = relevant
    .filter((entry) => entry.type === "expense")
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

  const monthlyMap = new Map<string, { income: number; expense: number }>();
  for (const entry of entries) {
    const date = new Date(entry.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = monthlyMap.get(key) ?? { income: 0, expense: 0 };
    if (entry.type === "income") bucket.income += Number(entry.amount || 0);
    else bucket.expense += Number(entry.amount || 0);
    monthlyMap.set(key, bucket);
  }

  const byMonth = Array.from(monthlyMap.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .slice(-12)
    .map(([key, value]) => ({
      month: key,
      income: value.income,
      expense: value.expense,
      profit: value.income - value.expense,
    }));

  return {
    month: targetMonth,
    year: targetYear,
    income,
    expense,
    profit: income - expense,
    byMonth,
  };
}

async function readDocuments() {
  return readCollection<Document>(DOCUMENTS_KEY, documentsLocalPath, documentsCache);
}
async function saveDocuments(data: IdCollection<Document>) {
  return writeCollection<Document>(DOCUMENTS_KEY, documentsLocalPath, documentsCache, data);
}

export async function listDocuments(agentId: number) {
  const data = await readDocuments();
  return data.items
    .filter((item) => item.agentId === agentId)
    .sort((left, right) => new Date(right.uploadedAt).getTime() - new Date(left.uploadedAt).getTime());
}

export async function getDocumentById(id: number) {
  const data = await readDocuments();
  return data.items.find((item) => item.id === id) ?? null;
}

export async function createDocument(input: Omit<Document, "id" | "uploadedAt">) {
  const data = await readDocuments();
  const next: Document = { ...input, id: data.nextId++, uploadedAt: nowIso() };
  data.items.push(next);
  await saveDocuments(data);
  return next;
}

export async function deleteDocument(id: number) {
  const data = await readDocuments();
  data.items = data.items.filter((item) => item.id !== id);
  await saveDocuments(data);
}

function filterLeadsForAudience(
  leads: CrmLeadData[],
  audience: MarketingAction["targetAudience"],
) {
  if (audience === "all") return leads;
  if (audience === "buyers") {
    return leads.filter((lead) =>
      /buyer|קונה|השקעה/i.test(`${lead.tags ?? ""} ${lead.leadType ?? ""}`),
    );
  }
  if (audience === "sellers") {
    return leads.filter((lead) =>
      /seller|מוכר|בלעדי/i.test(`${lead.tags ?? ""} ${lead.leadType ?? ""}`),
    );
  }
  if (audience === "investors") {
    return leads.filter((lead) =>
      /השקעה|invest/i.test(`${lead.tags ?? ""} ${lead.leadType ?? ""}`),
    );
  }
  return leads;
}

function normalizeCrmSearchValue(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/[^A-Za-z0-9\u0590-\u05FF]+/g, "")
    .toLowerCase();
}

function isExclusiveCrmLead(lead: CrmLeadData) {
  return /בלעדי|exclusive/i.test(`${lead.tags ?? ""} ${lead.leadType ?? ""}`);
}

function isOpenCrmLead(lead: CrmLeadData) {
  return lead.leadStatus !== "לא רלוונטי" && lead.leadStatus !== "סגור";
}

function getPropertyDisplayAddress(property: PropertyListItem) {
  return property.address || [property.street, property.neighborhood, property.city].filter(Boolean).join(", ");
}

function extractStreetFromLeadNotes(notes: string | null | undefined) {
  const match = (notes ?? "").match(/רחוב\s*:\s*([^\n\r]+)/);
  return match?.[1]?.trim() ?? null;
}

function leadMatchesExclusiveProperty(lead: CrmLeadData, property: PropertyListItem) {
  const leadStreet = normalizeCrmSearchValue(lead.propertyStreet ?? extractStreetFromLeadNotes(lead.notes));
  const leadNeighborhood = normalizeCrmSearchValue(lead.propertyNeighborhood ?? lead.neighborhood);
  const propertyStreet = normalizeCrmSearchValue(property.street ?? property.address);
  const propertyAddress = normalizeCrmSearchValue(property.address);
  const propertyNeighborhood = normalizeCrmSearchValue(property.neighborhood);

  const streetMatches =
    Boolean(leadStreet && propertyStreet && (leadStreet.includes(propertyStreet) || propertyStreet.includes(leadStreet))) ||
    Boolean(leadStreet && propertyAddress && (leadStreet.includes(propertyAddress) || propertyAddress.includes(leadStreet)));

  const neighborhoodMatches =
    Boolean(leadNeighborhood && propertyNeighborhood && (leadNeighborhood.includes(propertyNeighborhood) || propertyNeighborhood.includes(leadNeighborhood)));

  return streetMatches || (streetMatches && neighborhoodMatches);
}

function renderMarketingTemplate(
  template: string,
  lead: CrmLeadData,
  property: PropertyListItem,
  marketingFields: Record<string, string> = {},
) {
  const address = getPropertyDisplayAddress(property);
  const values: Record<string, string> = {
    name: lead.name,
    "שם הלקוח": lead.name,
    phone: lead.phone,
    address,
    "כתובת הנכס": address,
    street: property.street ?? property.address,
    neighborhood: property.neighborhood,
    city: property.city,
    price: property.price ? `${property.price.toLocaleString("he-IL")} ₪` : "",
    rooms: String(property.rooms ?? ""),
    sqm: String(property.sqm ?? ""),
    url: `/properties/${property.id}`,
    propertyTitle: property.title,
    ...marketingFields,
  };
  if (marketingFields["שת״פ מתווכים"] && !values["שת\"פ מתווכים"]) {
    values["שת\"פ מתווכים"] = marketingFields["שת״פ מתווכים"];
  }
  if (marketingFields["שת\"פ מתווכים"] && !values["שת״פ מתווכים"]) {
    values["שת״פ מתווכים"] = marketingFields["שת\"פ מתווכים"];
  }
  if (marketingFields["יד2"] && !values["יד 2"]) {
    values["יד 2"] = marketingFields["יד2"];
  }
  if (marketingFields["יד 2"] && !values["יד2"]) {
    values["יד2"] = marketingFields["יד 2"];
  }
  const yad2ViewsFromActivity = (marketingFields["יד2"] ?? marketingFields["יד 2"] ?? "").match(/^\s*(\d[\d,.\s]*)\s*(?:צפיות|צפייה)\s*$/)?.[1]?.trim();
  const yad2Views = marketingFields["צפיות יד2"] ?? marketingFields["צפיות יד 2"] ?? marketingFields["יד2 צפיות"] ?? marketingFields["יד 2 צפיות"] ?? marketingFields["כמות צפיות יד2"] ?? yad2ViewsFromActivity;
  if (yad2Views) {
    values["צפיות יד2"] = yad2Views;
    values["צפיות יד 2"] = yad2Views;
    values["יד2 צפיות"] = yad2Views;
    values["יד 2 צפיות"] = yad2Views;
    values["כמות צפיות יד2"] = yad2Views;
    if (yad2ViewsFromActivity && !marketingFields["צפיות יד2"] && !marketingFields["צפיות יד 2"]) {
      values["יד2"] = "פעיל";
      values["יד 2"] = "פעיל";
    }
  }
  const madlanViews = marketingFields["צפיות מדלן"] ?? marketingFields["מדלן צפיות"] ?? marketingFields["כמות צפיות מדלן"];
  if (madlanViews) {
    values["צפיות מדלן"] = madlanViews;
    values["מדלן צפיות"] = madlanViews;
    values["כמות צפיות מדלן"] = madlanViews;
  }

  return cleanupRenderedMarketingMessage(
    template.replace(/\{([^}]+)\}/g, (_match, key: string) => values[key.trim()] ?? ""),
  );
}

const optionalMarketingLineLabels = [
  "יד2",
  "יד 2",
  "צפיות יד2",
  "צפיות יד 2",
  "מדלן",
  "צפיות מדלן",
  "פייסבוק",
  "אורגני דיגיטל",
  "ממומן דיגיטל",
  "וואטסאפ",
  "שת\"פ מתווכים",
  "שת״פ מתווכים",
  "פליירים",
  "מכתבי שכנים",
  "עיתון מקומי",
  "צילום",
  "שלטים",
  "פניות טלפון",
  "בית פתוח",
  "פעילות נוספת",
  "אחר",
];

function cleanupRenderedMarketingMessage(message: string) {
  const emptyLabelPatterns = optionalMarketingLineLabels.map((label) =>
    new RegExp(`^(?:•\\s*)?${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*$`),
  );

  return message
    .split(/\r?\n/)
    .filter((line) => !emptyLabelPatterns.some((pattern) => pattern.test(line.trim())))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function getWeeklyMarketingPayload(weekNumber?: number, year?: number) {
  const iso = getIsoWeekAndYear();
  const targetWeek = weekNumber ?? iso.weekNumber;
  const targetYear = year ?? iso.year;
  const actions = (await readMarketing()).items.filter(
    (item) =>
      item.weekNumber === targetWeek &&
      item.year === targetYear &&
      (item.status === "scheduled" || item.status === "draft"),
  );

  const allLeads = await listCrmLeads();
  const propertiesData = await listAllProperties();
  const templates = await listMessageTemplates();

  const enriched = actions.map((action) => {
    const property = propertiesData.find((item) => item.id === action.propertyId) ?? null;
    const template = action.templateId
      ? templates.find((item) => item.id === action.templateId) ?? null
      : null;
    const isExclusiveProperty = property?.status === "בלעדי";
    const relevantLeads = property && isExclusiveProperty
      ? filterLeadsForAudience(allLeads, action.targetAudience).filter(
          (lead) => isOpenCrmLead(lead) && isExclusiveCrmLead(lead) && leadMatchesExclusiveProperty(lead, property),
        )
      : [];

    const message =
      action.customMessage ??
      template?.content ??
      "היי {name}, מצורף נכס בלעדי השבוע: {address} במחיר {price}.";

    const recipients = property && isExclusiveProperty
      ? relevantLeads.map((lead) => ({
          leadId: lead.id,
          name: lead.name,
          phone: lead.phone,
          chatId: `${lead.phone.replace(/\D/g, "").startsWith("972") ? lead.phone.replace(/\D/g, "") : `972${lead.phone.replace(/\D/g, "").replace(/^0/, "")}`}@c.us`,
          message: renderMarketingTemplate(message, lead, property, action.marketingFields ?? {}),
          imageUrl: property.featuredImageUrl ?? template?.imageUrl ?? null,
        }))
      : [];

    return {
      marketingActionId: action.id,
      property,
      template,
      message,
      leads: relevantLeads,
      recipients,
      targetAudience: action.targetAudience,
      weekNumber: action.weekNumber,
      year: action.year,
    };
  });

  return {
    weekNumber: targetWeek,
    year: targetYear,
    actions: enriched,
  };
}
