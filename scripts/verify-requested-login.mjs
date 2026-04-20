import { authenticateAgent, ensureCmsSeedData } from "../server/db.ts";

const email = "shay2003ai@gmail.com";
const password = "shaycohen2003";

await ensureCmsSeedData();
const account = await authenticateAgent(email, password);

if (!account) {
  console.error(JSON.stringify({ ok: false, email }));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      id: account.id,
      email: account.email,
      name: account.name,
      accountRole: account.accountRole,
      isActive: account.isActive,
    },
    null,
    2,
  ),
);
