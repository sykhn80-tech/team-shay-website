import { getDb, ensureCmsSeedData } from "../server/db.ts";
import { agentAccounts, testimonials } from "../drizzle/schema.ts";
import { eq, desc, count } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error(JSON.stringify({ ok: false, error: "DATABASE_UNAVAILABLE" }, null, 2));
    process.exit(1);
  }

  await ensureCmsSeedData();

  const email = "shay2003ai@gmail.com";
  const [agent] = await db.select().from(agentAccounts).where(eq(agentAccounts.email, email)).limit(1);
  const [testimonialCountRow] = await db.select({ total: count() }).from(testimonials);
  const latestTestimonials = await db
    .select({ id: testimonials.id, quote: testimonials.quote, isPublished: testimonials.isPublished, createdAt: testimonials.createdAt })
    .from(testimonials)
    .orderBy(desc(testimonials.createdAt), desc(testimonials.id))
    .limit(6);

  console.log(
    JSON.stringify(
      {
        ok: true,
        agentExists: Boolean(agent),
        agent: agent
          ? {
              id: agent.id,
              email: agent.email,
              isActive: agent.isActive,
              accountRole: agent.accountRole,
            }
          : null,
        testimonialCount: Number(testimonialCountRow?.total ?? 0),
        latestTestimonials,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
