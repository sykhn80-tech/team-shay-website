import { ensureCmsSeedData, listStaffAccounts } from "../server/db.ts";

const email = "shay2003ai@gmail.com";

await ensureCmsSeedData();
const accounts = await listStaffAccounts();
const match = accounts.find((account) => account.email.toLowerCase() === email.toLowerCase());

console.log(JSON.stringify({ found: Boolean(match), account: match ?? null }, null, 2));
