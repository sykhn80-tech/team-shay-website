import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { hashAgentPassword } from "./db";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

function createAgentContext(overrides?: Partial<TrpcContext>) {
  const clearedCookies: CookieCall[] = [];

  const ctx: TrpcContext = {
    user: null,
    agentSession: null,
    req: {
      protocol: "https",
      headers: {},
      cookies: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
      cookie: () => undefined,
    } as TrpcContext["res"],
    ...overrides,
  };

  return { ctx, clearedCookies };
}

describe("agent auth helpers", () => {
  it("hashes the same password deterministically", () => {
    const password = "TeamShay2026!";

    expect(hashAgentPassword(password)).toBe(hashAgentPassword(password));
    expect(hashAgentPassword(password)).not.toBe(password);
  });

  it("blocks listProperties when no agent session exists", async () => {
    const { ctx } = createAgentContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.agent.listProperties()).rejects.toThrow("Agent login required");
  });

  it("clears the dedicated agent cookie on logout", async () => {
    const { ctx, clearedCookies } = createAgentContext({
      agentSession: {
        id: 7,
        email: "shay@teamshay.co.il",
        name: "שי כהן",
        phone: "052-863-6631",
      },
    });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.agent.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe("team_shay_agent_session");
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });
  });
});
