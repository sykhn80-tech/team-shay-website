/**
 * import-leads.ts
 * ---------------
 * Imports all leads from leads_import.json into the CRM.
 * Maps owner email → agentId by querying the agentAccounts table.
 *
 * Usage (from project root):
 *   npx tsx scripts/import-leads.ts [path/to/leads_import.json]
 *
 * Environment: requires DATABASE_URL (or falls back to local CRM file).
 */

import "dotenv/config";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { bulkImportCrmLeads, getDb } from "../server/db";
import { agentAccounts } from "../drizzle/schema";
import { eq } from "drizzle-orm";

type RawLead = {
  name: string;
  phone: string;
  email: string | null;
  neighborhood: string | null;
  notes: string | null;
  tags: string;
  leadStatus: "חדש" | "פעיל" | "סגור" | "לא רלוונטי";
  source: string | null;
  ownerEmail: string;
};

// Fallback IDs if DB is not available (matches defaultStaffAccounts order)
const FALLBACK_EMAIL_TO_ID: Record<string, number> = {
  "shay2003ai@gmail.com": 1,
  "ronend0000@gmail.com": 2,
};

async function resolveAgentIds(emails: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const db = await getDb();

  if (!db) {
    console.warn("[import] No DB available, using fallback agent IDs.");
    for (const email of emails) {
      const id = FALLBACK_EMAIL_TO_ID[email];
      if (id) map.set(email, id);
      else console.warn(`[import] No fallback ID for ${email}`);
    }
    return map;
  }

  for (const email of emails) {
    const rows = await db
      .select({ id: agentAccounts.id })
      .from(agentAccounts)
      .where(eq(agentAccounts.email, email))
      .limit(1);

    if (rows[0]) {
      map.set(email, rows[0].id);
    } else {
      console.warn(`[import] Agent not found for email: ${email}`);
    }
  }

  return map;
}

async function main() {
  const jsonPath =
    process.argv[2] ?? path.join(process.cwd(), "scripts", "leads_import.json");

  console.log(`[import] Reading leads from: ${jsonPath}`);
  const raw = await readFile(jsonPath, "utf8");
  const leads: RawLead[] = JSON.parse(raw);
  console.log(`[import] Total leads to import: ${leads.length}`);

  // Collect unique owner emails
  const ownerEmails = [...new Set(leads.map((l) => l.ownerEmail))];
  console.log(`[import] Resolving agent IDs for: ${ownerEmails.join(", ")}`);

  const agentIdMap = await resolveAgentIds(ownerEmails);
  console.log("[import] Agent ID map:", Object.fromEntries(agentIdMap));

  // Map to CRM format
  const crmLeads = leads.map((l) => ({
    name: l.name,
    phone: l.phone,
    email: l.email,
    neighborhood: l.neighborhood,
    notes: l.notes,
    tags: l.tags,
    leadStatus: l.leadStatus,
    source: l.source,
    agentId: agentIdMap.get(l.ownerEmail) ?? null,
  }));

  // Check for leads without agentId
  const missing = crmLeads.filter((l) => l.agentId === null);
  if (missing.length > 0) {
    console.warn(`[import] ${missing.length} leads will have agentId=null (visible only to admin)`);
  }

  console.log("[import] Starting bulk import...");
  const count = await bulkImportCrmLeads(crmLeads);
  console.log(`[import] ✓ Successfully imported ${count} leads!`);

  // Summary by agent
  const byAgent: Record<string, number> = {};
  for (const l of crmLeads) {
    const key = l.agentId ? `agentId=${l.agentId}` : "no-agent";
    byAgent[key] = (byAgent[key] ?? 0) + 1;
  }
  console.log("[import] Breakdown:", byAgent);
}

main().catch((err) => {
  console.error("[import] Failed:", err);
  process.exit(1);
});
