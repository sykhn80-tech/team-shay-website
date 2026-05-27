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
  secondaryPhone: string | null;
  email: string | null;
  neighborhood: string | null;
  notes: string | null;
  tags: string;
  leadStatus: "חדש" | "פעיל" | "סגור" | "לא רלוונטי";
  source: string | null;
  // Extended Airtable fields
  leadType: string | null;         // קונה / מוכר / שכירות / השקעה
  budgetMin: number | null;
  budgetMax: number | null;
  desiredBudget: string | null;    // free-text budget note
  processStage: string | null;     // שלב הליך
  lastContact: string | null;      // ISO date
  meetingDate: string | null;      // ISO date
  meetingTime: string | null;
  meetingNotes: string | null;
  meetingLocation: string | null;
  propertyNeighborhood: string | null;
  propertyStreet: string | null;
  propertyRooms: string | null;
  propertyType: string | null;
  currentPropertyPrice: number | null;
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
