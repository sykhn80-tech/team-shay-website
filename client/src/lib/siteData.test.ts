import { describe, expect, it } from "vitest";

import { agents, heroTrustBadges, JERUSALEM_HERO, SHAY_ABOUT_IMAGE } from "./siteData";

describe("siteData", () => {
  it("uses the latest uploaded media assets for the hero and about section", () => {
    expect(JERUSALEM_HERO).toContain("Gemini_Generated_Image_aq472haq472haq47");
    expect(SHAY_ABOUT_IMAGE).toContain("tryiton__gray_suit_white_shirt_black_tie_office_plants_198335");
  });

  it("keeps the team cards in the required order with the requested image assignments", () => {
    expect(agents.map((agent) => agent.id)).toEqual([
      "shay",
      "aviad",
      "ronen",
      "eliya",
      "yarden",
    ]);

    const shay = agents.find((agent) => agent.id === "shay");
    const yarden = agents.find((agent) => agent.id === "yarden");
    const aviad = agents.find((agent) => agent.id === "aviad");

    expect(shay?.image).toContain("tryiton__gray_suit_white_shirt_black_tie_office_plants_198335");
    expect(yarden?.image).toContain("WhatsAppImage2026-04-13at17.31.35");
    expect(aviad?.imagePosition).toBe("center 34%");
  });

  it("keeps the verified hero trust badges while testimonials are sourced from the database only", () => {
    expect(heroTrustBadges).toEqual([
      "מאות לקוחות מרוצים",
      "עשרות נכסים שנמכרו",
      "ניסיון מוכח בשוק",
      "בלעדיות ושקיפות מלאה",
    ]);
  });
});
