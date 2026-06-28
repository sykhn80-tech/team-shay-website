import { describe, expect, it } from "vitest";
import {
  agents,
  heroTrustBadges,
  JERUSALEM_HERO,
  maxPropertyPrice,
  minPropertyPrice,
  sampleProperties,
  SHAY_ABOUT_IMAGE,
  TEAM_LOGO,
} from "../client/src/lib/siteData";

describe("siteData content and media mapping", () => {
  it("uses the latest uploaded media assets for hero, branding and about section", () => {
    expect(JERUSALEM_HERO).toContain("Gemini_Generated_Image_aq472haq472haq47");
    expect(SHAY_ABOUT_IMAGE).toContain("tryiton__gray_suit_white_shirt_black_tie_office_plants_198335");
    expect(TEAM_LOGO.startsWith("https://")).toBe(true);
  });

  it("keeps the requested hero badges while testimonials are sourced from the database instead of frontend fixtures", () => {
    expect(heroTrustBadges).toEqual([
      "מאות לקוחות מרוצים",
      "עשרות נכסים שנמכרו",
      "ניסיון מוכח בשוק",
      "בלעדיות ושקיפות מלאה",
    ]);
  });

  it("keeps six team cards with the updated branding copy and requested photo swaps", () => {
    expect(agents).toHaveLength(6);
    expect(agents.map((agent) => agent.id)).toEqual([
      "shay",
      "aviad",
      "ronen",
      "eliya",
      "yarden",
      "hodiya",
    ]);

    expect(agents.map((agent) => agent.name)).toEqual([
      "שי כהן",
      "אביעד ניסים",
      "רונן דוידיאן",
      "אליה מרציאנו",
      "ירדן גמליאל",
      "הודיה מליאח",
    ]);

    expect(agents[0]?.expertise).toContain("משא ומתן");
    expect(agents[1]?.expertise).toContain("גילה והר חומה");
    expect(agents[2]?.expertise).toContain("רסקו וסן סימון");
    expect(agents[3]?.expertise).toContain("משקיעים ורוכשים");
    expect(agents[4]?.expertise).toContain("קטמונים");
    expect(agents[5]?.expertise).toContain("קריית שמואל");

    for (const agent of agents) {
      expect(agent.phone).toBeTruthy();
      expect(agent.image).toBeTruthy();
    }
  });

  it("exposes an advanced catalog dataset with consistent min and max price helpers", () => {
    expect(sampleProperties.length).toBeGreaterThanOrEqual(8);
    expect(minPropertyPrice).toBe(Math.min(...sampleProperties.map((property) => property.price)));
    expect(maxPropertyPrice).toBe(Math.max(...sampleProperties.map((property) => property.price)));
    expect(sampleProperties.some((property) => property.neighborhood === "קטמונים")).toBe(true);
  });
});
