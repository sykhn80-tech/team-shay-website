import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  authenticateAgent: vi.fn(),
  createAgentProperty: vi.fn(),
  createLeadSubmission: vi.fn(),
  createStaffAccount: vi.fn(),
  createTestimonial: vi.fn(),
  deleteAgentProperty: vi.fn(),
  deletePropertyById: vi.fn(),
  deleteStaffAccount: vi.fn(),
  deleteTestimonial: vi.fn(),
  ensureCmsSeedData: vi.fn(),
  ensureDefaultAgentAccounts: vi.fn(),
  getAgentPropertyById: vi.fn(),
  getHomepagePayload: vi.fn(),
  getPropertyById: vi.fn(),
  getSiteSettings: vi.fn(),
  listAgentProperties: vi.fn(),
  listAllProperties: vi.fn(),
  listAllTestimonials: vi.fn(),
  listLeadSubmissions: vi.fn(),
  listPublishedProperties: vi.fn(),
  listStaffAccounts: vi.fn(),
  updateAgentProperty: vi.fn(),
  updatePropertyById: vi.fn(),
  updateSiteSettings: vi.fn(),
  updateStaffAccount: vi.fn(),
  updateTestimonial: vi.fn(),
  hashAgentPassword: vi.fn((value: string) => `hashed:${value}`),
}));

vi.mock("./db", () => dbMocks);
vi.mock("./storage", () => ({
  storagePut: vi.fn(),
}));

import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function createContext(overrides?: Partial<TrpcContext>): TrpcContext {
  return {
    user: null,
    agentSession: null,
    req: {
      protocol: "https",
      headers: {},
      cookies: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
    ...overrides,
  };
}

describe("CMS routers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns public homepage payload from the CMS source", async () => {
    const homepagePayload = {
      settings: { siteName: "Team Shay", footerSlogan: "מתווכים בצד שלך" },
      agents: [{ id: 1, name: "שי כהן" }],
      testimonials: [{ id: 1, quote: "מעולה" }],
      properties: [{ id: 1, title: "דירה בירושלים" }],
    };

    dbMocks.getHomepagePayload.mockResolvedValue(homepagePayload);

    const caller = appRouter.createCaller(createContext());
    const result = await caller.publicSite.home();

    expect(dbMocks.ensureCmsSeedData).toHaveBeenCalledTimes(1);
    expect(result).toEqual(homepagePayload);
  });

  it("stores lead submissions through the CMS mutation", async () => {
    dbMocks.createLeadSubmission.mockResolvedValue(42);

    const caller = appRouter.createCaller(createContext());
    const result = await caller.publicSite.submitLead({
      fullName: "ישראל ישראלי",
      phone: "0501234567",
      neighborhood: "קטמון",
      rooms: 4,
      sqm: 110,
      notes: "מבקש שיחה בשעות הערב",
    });

    expect(dbMocks.createLeadSubmission).toHaveBeenCalledWith({
      fullName: "ישראל ישראלי",
      phone: "0501234567",
      neighborhood: "קטמון",
      rooms: 4,
      sqm: 110,
      notes: "מבקש שיחה בשעות הערב",
    });
    expect(result).toEqual({ success: true, leadId: 42 });
  });

  it("authenticates an agent only when the submitted email and password match a stored agent record", async () => {
    dbMocks.authenticateAgent.mockResolvedValue({
      id: 3,
      email: "agent@teamshay.co.il",
      name: "סוכן בדיקה",
      phone: "052-000-0000",
      accountRole: "agent",
      roleTitle: "יועץ",
      photoUrl: null,
    });

    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.agent.login({
      email: "agent@teamshay.co.il",
      password: "ExactPassword123",
    });

    expect(dbMocks.authenticateAgent).toHaveBeenCalledWith("agent@teamshay.co.il", "ExactPassword123");
    expect(ctx.res.cookie).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      success: true,
      agent: {
        id: 3,
        email: "agent@teamshay.co.il",
        name: "סוכן בדיקה",
        phone: "052-000-0000",
        accountRole: "agent",
        roleTitle: "יועץ",
        photoUrl: null,
      },
    });
    expect(result.sessionToken).toEqual(expect.any(String));
  });

  it("rejects agent login when the submitted credentials do not match the stored agent record", async () => {
    dbMocks.authenticateAgent.mockResolvedValue(null);

    const caller = appRouter.createCaller(createContext());

    await expect(
      caller.agent.login({
        email: "agent@teamshay.co.il",
        password: "WrongPassword123",
      }),
    ).rejects.toThrow("פרטי ההתחברות אינם תקינים");
  });

  it("denies admin dashboard access when there is no authenticated agent session", async () => {
    const caller = appRouter.createCaller(createContext());

    await expect(caller.admin.dashboard()).rejects.toMatchObject({
      message: "Agent login required",
    });
  });

  it("allows admin dashboard access when the staff session is admin", async () => {
    dbMocks.getSiteSettings.mockResolvedValue({ id: 1, siteName: "Team Shay" });
    dbMocks.listAllTestimonials.mockResolvedValue([{ id: 1, quote: "מעולה" }]);
    dbMocks.listStaffAccounts.mockResolvedValue([{ id: 1, name: "שי כהן" }]);
    dbMocks.listAllProperties.mockResolvedValue([{ id: 1, title: "פנטהאוז" }]);
    dbMocks.listLeadSubmissions.mockResolvedValue([{ id: 9, fullName: "דני כהן" }]);

    const caller = appRouter.createCaller(
      createContext({
        agentSession: {
          id: 1,
          email: "shay2003ai@gmail.com",
          name: "שי כהן",
          phone: "052-863-6631",
          accountRole: "admin",
          roleTitle: "ראש הצוות",
          photoUrl: null,
        },
      }),
    );

    const result = await caller.admin.dashboard();

    expect(result.settings).toEqual({ id: 1, siteName: "Team Shay" });
    expect(result.testimonials).toHaveLength(1);
    expect(result.staff).toHaveLength(1);
    expect(result.properties).toHaveLength(1);
    expect(result.leads).toHaveLength(1);
  });
});
