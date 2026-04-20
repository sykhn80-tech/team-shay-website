import {
  createStaffAccount,
  ensureCmsSeedData,
  hashAgentPassword,
  listStaffAccounts,
  updateStaffAccount,
} from "../server/db.ts";

const email = "shay2003ai@gmail.com";
const password = "shaycohen2003";

await ensureCmsSeedData();

const accounts = await listStaffAccounts();
const existing = accounts.find((account) => account.email.toLowerCase() === email.toLowerCase());

const payload = {
  accountRole: "admin",
  name: existing?.name ?? "שי כהן",
  email: email.toLowerCase(),
  phone: existing?.phone ?? "052-863-6631",
  passwordHash: hashAgentPassword(password),
  roleTitle: existing?.roleTitle ?? "ראש הצוות",
  bio: existing?.bio ?? null,
  photoUrl: existing?.photoUrl ?? null,
  sortOrder: existing?.sortOrder ?? 0,
  isFeaturedOnHomepage: existing?.isFeaturedOnHomepage ?? true,
  isActive: true,
  managedByAdmin: true,
};

if (existing) {
  await updateStaffAccount(existing.id, payload);
  console.log(JSON.stringify({ action: "updated", id: existing.id, email: payload.email }, null, 2));
} else {
  const id = await createStaffAccount(payload);
  console.log(JSON.stringify({ action: "created", id, email: payload.email }, null, 2));
}
