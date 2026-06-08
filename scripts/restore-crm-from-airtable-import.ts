import "dotenv/config";
import dotenv from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  createMessageTemplate,
  listCrmLeads,
  listMessageTemplates,
  replaceCrmLeads,
  updateMessageTemplate,
  type CrmLeadData,
} from "../server/db";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

type RawLead = {
  name: string;
  phone: string;
  email: string | null;
  neighborhood: string | null;
  notes: string | null;
  tags: string;
  leadStatus: "חדש" | "פעיל" | "סגור" | "לא רלוונטי";
  source: string | null;
  agentId: number | null;
  ownerEmail: string;
};

const OWNER_EMAIL_TO_AGENT_ID: Record<string, number> = {
  "shay2003ai@gmail.com": 1,
  "ronend0000@gmail.com": 2,
  "aviad5436@gmail.com": 3,
  "yardeen12@gmail.com": 4,
  "eliyamarciano1@gmail.com": 5,
};

const EXCLUSIVITY_TEMPLATE = `שלום {שם הלקוח}, כמו בכל שבוע
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

המשך שבוע מצוין לכולנו (:`;

function extractLeadsJson(source: string) {
  const match = source.match(/const LEADS: LeadRow\[\] = (\[[\s\S]*?\]);\n\nexport default/);
  if (!match) {
    throw new Error("Could not find LEADS array in CrmImport.tsx");
  }
  return JSON.parse(match[1]) as RawLead[];
}

function extractNoteField(notes: string | null, label: string) {
  const match = (notes ?? "").match(new RegExp(`${label}\\\\s*:\\\\s*([^\\n\\r]+)`));
  return match?.[1]?.trim() ?? null;
}

function parsePrice(value: string | null) {
  if (!value) return null;
  const numeric = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function normalizeLeadType(lead: RawLead) {
  return extractNoteField(lead.notes, "סוג ליד") ?? lead.tags ?? null;
}

function mapLead(lead: RawLead): Omit<CrmLeadData, "id" | "createdAt" | "updatedAt"> {
  const leadType = normalizeLeadType(lead);
  const propertyStreet = extractNoteField(lead.notes, "רחוב");
  const propertyRooms = extractNoteField(lead.notes, "חדרים");
  const currentPropertyPrice = parsePrice(extractNoteField(lead.notes, "מחיר"));

  return {
    agentId: OWNER_EMAIL_TO_AGENT_ID[lead.ownerEmail] ?? lead.agentId ?? null,
    name: lead.name,
    phone: lead.phone,
    secondaryPhone: null,
    email: lead.email,
    neighborhood: lead.neighborhood,
    notes: lead.notes,
    tags: lead.tags,
    leadStatus: lead.leadStatus,
    source: lead.source,
    leadType,
    budgetMin: null,
    budgetMax: null,
    desiredBudget: null,
    processStage: null,
    lastContact: null,
    meetingDate: null,
    meetingTime: null,
    meetingNotes: null,
    meetingLocation: null,
    propertyNeighborhood: lead.neighborhood,
    propertyStreet,
    propertyRooms,
    propertyType: null,
    currentPropertyPrice,
  };
}

async function ensureExclusivityTemplate() {
  const templates = await listMessageTemplates();
  const current = templates.find((template) => template.type === "exclusivity" && template.isActive)
    ?? templates.find((template) => template.type === "exclusivity");

  if (current) {
    await updateMessageTemplate(current.id, {
      name: "בלעדיות שבועית",
      type: "exclusivity",
      content: EXCLUSIVITY_TEMPLATE,
      isActive: true,
    });
    return current.id;
  }

  const created = await createMessageTemplate({
    name: "בלעדיות שבועית",
    type: "exclusivity",
    content: EXCLUSIVITY_TEMPLATE,
    imageUrl: null,
    isActive: true,
  });
  return created.id;
}

async function main() {
  const importPath = path.join(process.cwd(), "client/src/pages/CrmImport.tsx");
  const source = await readFile(importPath, "utf8");
  const rawLeads = extractLeadsJson(source);
  const mappedLeads = rawLeads.map(mapLead);

  const importedCount = await replaceCrmLeads(mappedLeads);
  const templateId = await ensureExclusivityTemplate();
  const storedLeads = await listCrmLeads();

  const byAgent = new Map<string, number>();
  for (const lead of storedLeads) {
    const key = lead.agentId ? `agentId=${lead.agentId}` : "unassigned";
    byAgent.set(key, (byAgent.get(key) ?? 0) + 1);
  }

  console.log(JSON.stringify({
    importedCount,
    storedCount: storedLeads.length,
    templateId,
    byAgent: Object.fromEntries(byAgent),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
