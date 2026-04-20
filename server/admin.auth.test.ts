import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAdminContext(overrides?: Partial<TrpcContext>): TrpcContext {
  return {
    user: null,
    agentSession: null,
    req: {
      protocol: "https",
      headers: {},
      cookies: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => undefined,
      cookie: () => undefined,
    } as TrpcContext["res"],
    ...overrides,
  };
}

describe("admin auth helpers", () => {
  it("returns null for admin.me when no admin session exists", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    const result = await caller.admin.me();

    expect(result).toBeNull();
  });

  it("returns the admin session from admin.me when the account role is admin", async () => {
    const adminSession = {
      id: 1,
      email: "shay2003ai@gmail.com",
      name: "שי כהן",
      phone: "052-863-6631",
      accountRole: "admin" as const,
      roleTitle: "ראש הצוות",
      photoUrl: null,
    };

    const caller = appRouter.createCaller(
      createAdminContext({
        agentSession: adminSession,
      }),
    );

    const result = await caller.admin.me();

    expect(result).toEqual(adminSession);
  });

  it("requires an authenticated agent session before allowing dashboard access", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    await expect(caller.admin.dashboard()).rejects.toMatchObject({
      message: "Agent login required",
    });
  });
});
