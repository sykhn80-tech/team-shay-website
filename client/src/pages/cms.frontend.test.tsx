import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const queryState = {
  homeData: undefined as any,
  propertiesData: undefined as any,
  publicPropertyData: undefined as any,
  adminMeData: undefined as any,
  adminDashboardData: undefined as any,
  agentMeData: undefined as any,
  agentPropertyData: undefined as any,
};

const mutationStub = {
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
};

vi.mock("wouter", () => ({
  Link: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) =>
    React.createElement("a", { href, className }, children),
  useLocation: () => ["/agent-dashboard/new-property", vi.fn()],
}));

vi.mock("@/components/ui/carousel", () => ({
  Carousel: ({ children }: { children: React.ReactNode }) => React.createElement("div", { "data-testid": "carousel" }, children),
  CarouselContent: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
  CarouselItem: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
  CarouselNext: () => React.createElement("button", { type: "button" }, "next"),
  CarouselPrevious: () => React.createElement("button", { type: "button" }, "prev"),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      admin: {
        dashboard: { invalidate: vi.fn() },
      },
      publicSite: {
        home: { invalidate: vi.fn() },
        properties: { invalidate: vi.fn() },
      },
      agent: {
        listProperties: { invalidate: vi.fn() },
        propertyById: { invalidate: vi.fn() },
      },
    }),
    publicSite: {
      home: {
        useQuery: () => ({
          data: queryState.homeData,
          isLoading: false,
          isFetching: false,
        }),
      },
      properties: {
        useQuery: () => ({
          data: queryState.propertiesData,
          isFetching: false,
        }),
      },
      propertyById: {
        useQuery: () => ({
          data: queryState.publicPropertyData,
          isLoading: false,
          isFetching: false,
        }),
      },
      submitLead: {
        useMutation: () => mutationStub,
      },
    },
    agent: {
      me: {
        useQuery: () => ({
          data: queryState.agentMeData,
          isLoading: false,
          isFetching: false,
        }),
      },
      login: { useMutation: () => mutationStub },
      propertyById: {
        useQuery: () => ({
          data: queryState.agentPropertyData,
          isLoading: false,
        }),
      },
      createProperty: { useMutation: () => mutationStub },
      updateProperty: { useMutation: () => mutationStub },
    },
    admin: {
      dashboard: {
        useQuery: () => ({
          data: queryState.adminDashboardData,
          isLoading: false,
        }),
      },
      login: { useMutation: () => mutationStub },
      updateSiteSettings: { useMutation: () => mutationStub },
      createStaff: { useMutation: () => mutationStub },
      updateStaff: { useMutation: () => mutationStub },
      deleteStaff: { useMutation: () => mutationStub },
      createTestimonial: { useMutation: () => mutationStub },
      updateTestimonial: { useMutation: () => mutationStub },
      deleteTestimonial: { useMutation: () => mutationStub },
      deleteProperty: { useMutation: () => mutationStub },
      updateProperty: { useMutation: () => mutationStub },
    },
  },
}));

import AddProperty from "./AddProperty";
import AdminPanel from "./AdminPanel";
import AgentLogin from "./AgentLogin";
import Home from "./Home";
import PropertyDetails from "./PropertyDetails";
import Properties from "./Properties";

beforeEach(() => {
  queryState.homeData = undefined;
  queryState.propertiesData = undefined;
  queryState.publicPropertyData = undefined;
  queryState.adminMeData = undefined;
  queryState.adminDashboardData = undefined;
  queryState.agentMeData = undefined;
  queryState.agentPropertyData = undefined;
  mutationStub.mutate.mockReset();
  mutationStub.mutateAsync.mockReset();
});

describe("frontend CMS rendering", () => {
  it("renders the updated homepage shell with the white header, gold accents, WhatsApp CTA, icon-based About cards, black network/footer sections, and only eight featured properties", () => {
    queryState.homeData = {
      settings: {
        siteName: "Team Shay CMS",
        headerLogoUrl: "https://cdn.example.com/header.png",
        footerLogoUrl: "https://cdn.example.com/footer.png",
        landsmanLogoUrl: "https://cdn.example.com/landsman.png",
        heroBackgroundUrl: "https://cdn.example.com/hero.png",
        shayAboutImageUrl: "https://cdn.example.com/about.png",
        heroHeadline: "כותרת דינמית מה-CMS",
        heroTypingText: "טקסט דינמי מה-CMS",
        whatsappLink: "https://wa.me/972500000000",
        officePhone: "052-000-0000",
        aboutTitle: "אודות דינמי",
        aboutSubtitle: "טקסט אודות דינמי",
        landsmanTitle: "כותרת Landsman דינמית",
        landsmanBody: "טקסט Landsman דינמי",
        footerSlogan: "סלוגן דינמי מה-CMS",
      },
      agents: [
        {
          id: 11,
          name: "שי כהן",
          roleTitle: "ראש צוות",
          bio: "מנהל משא ומתן ושיווק פרויקטים",
          phone: "052-000-0000",
          email: "shay@teamshay.co.il",
          photoUrl: "https://cdn.example.com/agent-shay.png",
          sortOrder: 0,
        },
      ],
      testimonials: [
        {
          id: 1,
          quote: "המלצה חיה 3",
          sourceName: "לקוח אמיתי 3",
          sourceLabel: "WhatsApp",
          stars: 4,
          displayOrder: 3,
          whatsappImageUrl: "https://cdn.example.com/testimonial-3.png",
        },
        {
          id: 2,
          quote: "המלצה חיה 1",
          sourceName: "לקוח אמיתי 1",
          sourceLabel: "WhatsApp",
          stars: 5,
          displayOrder: 1,
          whatsappImageUrl: "https://cdn.example.com/testimonial-1.png",
        },
        {
          id: 3,
          quote: "המלצה חיה 6",
          sourceName: "לקוח אמיתי 6",
          sourceLabel: "Google",
          stars: 5,
          displayOrder: 6,
          whatsappImageUrl: null,
        },
        {
          id: 4,
          quote: "המלצה חיה 2",
          sourceName: "לקוח אמיתי 2",
          sourceLabel: "Google",
          stars: 5,
          displayOrder: 2,
          whatsappImageUrl: null,
        },
        {
          id: 5,
          quote: "המלצה חיה 5",
          sourceName: "לקוח אמיתי 5",
          sourceLabel: "WhatsApp",
          stars: 5,
          displayOrder: 5,
          whatsappImageUrl: null,
        },
        {
          id: 6,
          quote: "המלצה חיה 4",
          sourceName: "לקוח אמיתי 4",
          sourceLabel: "Google",
          stars: 5,
          displayOrder: 4,
          whatsappImageUrl: null,
        },
        {
          id: 7,
          quote: "המלצה חיה 7",
          sourceName: "לקוח אמיתי 7",
          sourceLabel: "Google",
          stars: 5,
          displayOrder: 7,
          whatsappImageUrl: null,
        },
      ],
      properties: Array.from({ length: 9 }, (_, index) => ({
        id: index + 1,
        title: `נכס ${index + 1}`,
        address: `רחוב דוגמה ${index + 1}`,
        neighborhood: "קטמון",
        city: "ירושלים",
        price: 2000000 + index * 100000,
        rooms: 4,
        sqm: 100 + index,
        status: "למכירה",
        description: `תיאור נכס ${index + 1}`,
        featuredImageUrl: `https://cdn.example.com/property-${index + 1}.png`,
        images: [],
      })),
    };

    const markup = renderToStaticMarkup(React.createElement(Home));

    expect(markup).toContain("כותרת דינמית מה-CMS");
    expect(markup).toContain("סלוגן דינמי מה-CMS");
    expect(markup).toContain("/media/hero-animation.mp4");
    expect(markup).toContain("https://d2xsxph8kpxj0f.cloudfront.net/310519663549770333/Skk9h57YxdLJzA5wF6rzPk/teamshay-logo-new_6990c286.png");
    expect(markup).toContain("https://cdn.example.com/landsman.png");
    expect(markup).toContain("bg-[#010101]");
    expect(markup).toContain("mr-auto flex items-center justify-end gap-3 lg:mr-0");
    expect(markup).toContain("h-14 w-auto md:h-16");
    expect(markup).toContain("text-white lg:flex");
    expect(markup).toContain("שלחו הודעה עכשיו");
    expect(markup).toContain("shay2003ai@gmail.com");
    expect(markup.indexOf("shay2003ai@gmail.com")).toBeLessThan(markup.indexOf("052-863-6631"));
    expect(markup).toContain("קיר המלצות חי");
    expect(markup).toContain("המלצה חיה 1");
    expect(markup).toContain("המלצה חיה 2");
    expect(markup).toContain("המלצה חיה 3");
    expect(markup).toContain("המלצה חיה 4");
    expect(markup).toContain("המלצה חיה 5");
    expect(markup).toContain("המלצה חיה 6");
    expect(markup).toContain("המלצה חיה 7");
    expect(markup.indexOf("המלצה חיה 1")).toBeLessThan(markup.indexOf("המלצה חיה 2"));
    expect(markup.indexOf("המלצה חיה 2")).toBeLessThan(markup.indexOf("המלצה חיה 3"));
    expect(markup.indexOf("המלצה חיה 3")).toBeLessThan(markup.indexOf("המלצה חיה 4"));
    expect(markup.indexOf("המלצה חיה 4")).toBeLessThan(markup.indexOf("המלצה חיה 5"));
    expect(markup.indexOf("המלצה חיה 5")).toBeLessThan(markup.indexOf("המלצה חיה 6"));
    expect(markup.indexOf("המלצה חיה 6")).toBeLessThan(markup.indexOf("המלצה חיה 7"));
    expect(markup).toContain("https://cdn.example.com/testimonial-1.png");
    expect(markup).toContain("h-40 overflow-hidden rounded-[24px] bg-slate-950");
    expect(markup).toContain("h-full w-full object-cover object-top");
    expect(markup).toContain("size-5 fill-current");
    expect(markup).toContain("tracking-[0.03em]");
    expect(markup).toContain("text-[#d9ae4c]");
    expect(markup).toContain("bg-[#d9ae4c] px-4 py-2 text-sm font-black text-white");
    expect(markup).toContain("bg-[#d9ae4c] px-3 py-1 text-xs font-black text-white");
    expect(markup).toContain("flex flex-col items-center rounded-[24px]");
    expect(markup).toContain("lucide-bed-double");
    expect(markup).toContain("lucide-ruler");
    expect(markup).toContain("חדרים</span>");
    expect(markup).toContain("מ״ר</span>");
    expect(markup).toContain("bg-[#010101]");
    expect(markup).toContain("האומן 25 , תלפיות");
    expect(markup).toContain("bg-[#010101] px-[5%] py-14 text-white");
    expect(markup).toContain("ליצירת קשר");
    expect(markup).toContain("״סלוגן דינמי מה-CMS״");
    expect(markup).toContain('style="font-size:30px"');
    expect(markup).toContain("dir=\"rtl\"");
    expect(markup).toContain("relative flex w-full flex-col items-end gap-12 text-right md:flex-row md:items-start md:justify-between md:text-right");
    expect(markup).toContain("md:absolute md:left-1/2 md:top-0 md:w-fit md:-translate-x-1/2 md:items-center md:text-center");
    expect(markup).toContain("h-24 w-auto object-contain md:h-32");
    expect(markup).toContain("md:max-w-[28%]");
    expect(markup).toContain("flex flex-row-reverse items-center justify-start gap-2 self-end text-right");
    expect(markup).not.toContain("max-w-[1440px] flex-col gap-12 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]");
    expect(markup).not.toContain("mx-auto flex w-full");
    expect(markup).not.toContain("md:justify-self-center");
    expect(markup).not.toContain("md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]");
    expect(markup).toContain("fixed bottom-6 right-6");
    expect(markup).toContain("animate-ping");
    expect(markup).toContain("ניווט");
    expect(markup).toContain("יצירת קשר");
    expect(markup.indexOf("יצירת קשר")).toBeLessThan(markup.indexOf("ניווט"));
    expect(markup).toContain("bg-transparent px-4 py-2 md:px-6 md:py-3");
    expect(markup).not.toContain("rounded-[28px] bg-white px-6 py-5");
    expect(markup).not.toContain("קרוסלת המלצות חיה");
    expect(markup).not.toContain("cms-marquee-track-slow");
    expect(markup).toContain("נכס 8");
    expect(markup).not.toContain("נכס 9");
    expect(markup).toContain("/properties/8");
  });

  it("renders the public properties catalog from CMS property data", () => {
    queryState.homeData = {
      settings: {
        siteName: "Team Shay CMS",
        headerLogoUrl: "https://cdn.example.com/header.png",
        footerLogoUrl: "https://cdn.example.com/footer.png",
        landsmanLogoUrl: "https://cdn.example.com/landsman.png",
        heroBackgroundUrl: "https://cdn.example.com/hero.png",
        shayAboutImageUrl: "https://cdn.example.com/about.png",
        heroHeadline: "כותרת",
        heroTypingText: "טקסט",
        whatsappLink: "https://wa.me/972500000000",
        officePhone: "052-000-0000",
        aboutTitle: "אודות",
        aboutSubtitle: "טקסט",
        landsmanTitle: "Landsman",
        landsmanBody: "טקסט",
        footerSlogan: "סלוגן",
      },
      properties: [
        {
          id: 12,
          title: "פנטהאוז דינמי",
          address: "רחוב הדגמה 12",
          neighborhood: "ארנונה",
          city: "ירושלים",
          price: 4850000,
          rooms: 5,
          sqm: 168,
          status: "בלעדי",
          description: "נכס יוקרתי מתוך ה-CMS",
          featuredImageUrl: "https://cdn.example.com/penthouse.png",
          images: [],
        },
      ],
    };
    queryState.propertiesData = queryState.homeData.properties;

    const markup = renderToStaticMarkup(React.createElement(Properties));

    expect(markup).toContain("פנטהאוז דינמי");
    expect(markup).toContain("נכס יוקרתי מתוך ה-CMS");
    expect(markup).toContain("https://cdn.example.com/penthouse.png");
    expect(markup).toContain("/properties/12");
    expect(markup).not.toContain("אזור סוכנים");
  });

  it("renders a dedicated public property page with the full gallery and property facts", () => {
    queryState.homeData = {
      settings: {
        siteName: "Team Shay CMS",
        headerLogoUrl: "https://cdn.example.com/header.png",
        whatsappLink: "https://wa.me/972500000000",
      },
    };
    queryState.publicPropertyData = {
      id: 55,
      title: "וילה יוקרתית לדוגמה",
      address: "רחוב הדוגמה 55",
      street: "הדוגמה",
      neighborhood: "ארנונה",
      city: "ירושלים",
      price: 7200000,
      rooms: 7,
      sqm: 260,
      builtSqm: 220,
      outdoorSpace: "גינה 140 מ״ר",
      floor: 1,
      status: "בלעדי",
      description: "תיאור מלא של הנכס בעמוד הייעודי.",
      descriptionHtml: null,
      featuredImageUrl: "https://cdn.example.com/villa-cover.png",
      images: [
        { imageUrl: "https://cdn.example.com/villa-cover.png" },
        { imageUrl: "https://cdn.example.com/villa-2.png" },
      ],
    };

    const markup = renderToStaticMarkup(React.createElement(PropertyDetails, { params: { propertyId: "55" } }));

    expect(markup).toContain("וילה יוקרתית לדוגמה");
    expect(markup).toContain("רחוב הדוגמה 55");
    expect(markup).toContain("גינה 140 מ״ר");
    expect(markup).toContain("תיאור מלא של הנכס בעמוד הייעודי.");
    expect(markup).toContain("https://cdn.example.com/villa-cover.png");
    expect(markup).toContain("https://cdn.example.com/villa-2.png");
  });

  it("renders the secured admin dashboard for an authenticated agent and exposes direct image upload fields", () => {
    queryState.agentMeData = {
      id: 99,
      name: "סוכן מורשה",
      email: "agent@teamshay.co.il",
      accountRole: "admin",
    };
    queryState.adminDashboardData = {
      settings: {
        siteName: "Team Shay CMS",
        headerLogoUrl: "https://cdn.example.com/header.png",
        footerLogoUrl: "https://cdn.example.com/footer.png",
        landsmanLogoUrl: "https://cdn.example.com/landsman.png",
        heroBackgroundUrl: "https://cdn.example.com/hero.png",
        shayAboutImageUrl: "https://cdn.example.com/about.png",
        heroHeadline: "כותרת",
        heroTypingText: "טקסט",
        whatsappLink: "https://wa.me/972500000000",
        officePhone: "052-000-0000",
        aboutTitle: "אודות",
        aboutSubtitle: "טקסט",
        landsmanTitle: "Landsman",
      landsmanBody: "טקסט",
      footerSlogan: "סלוגן",
    },
    testimonials: [
      {
        id: 901,
        sourceName: "מאי אוחיון",
        quote: "המלצה לדוגמה",
        sourceLabel: "google",
        stars: 5,
        displayOrder: 1,
        whatsappImageUrl: null,
        isPublished: true,
      },
    ],
    staff: [],
    properties: [
      {
        id: 31,
          agentId: 4,
          title: "נכס אדמין",
          address: "רחוב ההדגמה 4",
          street: "ההדגמה",
          neighborhood: "קטמון",
          city: "ירושלים",
          price: 2800000,
          rooms: 4,
          sqm: 108,
          builtSqm: 96,
          outdoorSpace: "מרפסת 12 מ״ר",
          floor: 2,
          status: "למכירה",
          description: "נכס שמנוהל ישירות מתוך פאנל האדמין.",
          descriptionHtml: null,
          isPublished: true,
          featuredImageUrl: "https://cdn.example.com/admin-property-cover.png",
          images: [
            { imageUrl: "https://cdn.example.com/admin-property-1.png" },
            { imageUrl: "https://cdn.example.com/admin-property-2.png" },
          ],
        },
      ],
      leads: [],
    };

    const markup = renderToStaticMarkup(React.createElement(AdminPanel));

    expect(markup).toContain('dir="rtl"');
    expect(markup).toContain("ניהול האתר, הסוכנים, ההמלצות והלידים");
    expect(markup).toContain("הגישה לפאנל הניהול נעולה לסוכנים מורשים בלבד");
    expect(markup).toContain("מחובר כעת: סוכן מורשה · agent@teamshay.co.il");
    expect(markup).toContain("הגדרות אתר גלובליות");
    expect(markup).toContain("לידים אחרונים");
    expect(markup).toContain("ניהול סוכנים ואדמינים");
    expect(markup).toContain("ניהול המלצות וקרוסלה");
    expect(markup).toContain("ניהול נכסים");
    expect(markup).toContain("לוגו Header");
    expect(markup).toContain("תמונת סוכן");
    expect(markup).toContain("צילום WhatsApp / מקור");
    expect(markup).toContain("מיקום בתצוגה");
    expect(markup).toContain("מיקום 1");
    expect(markup).toContain("בחירת קובץ מהמחשב");
    expect(markup).toContain("בחירת תמונות לגלריה");
    expect(markup).toContain("שמירת גלריה לאתר");
    expect(markup).toContain("תמונה ראשית");
  });

  it("renders the expanded property editor with full fields, direct uploads, and live publish controls in RTL", () => {
    queryState.agentMeData = {
      id: 7,
      name: "סוכן מערכת",
      accountRole: "agent",
    };
    queryState.agentPropertyData = {
      id: 21,
      title: "דירת גן מעודכנת",
      address: "רחוב הדגמה 8",
      street: "הדגמה",
      neighborhood: "בקעה",
      city: "ירושלים",
      price: 3450000,
      sqm: 124,
      builtSqm: 112,
      rooms: 5,
      floor: 1,
      outdoorSpace: "גינה 65 מ״ר",
      status: "למכירה",
      description: "נכס רחב ידיים עם חצר פרטית ושדרוגים.",
      isPublished: true,
      images: [{ imageUrl: "https://cdn.example.com/garden-home.png" }],
    };

    const markup = renderToStaticMarkup(React.createElement(AddProperty));

    expect(markup).toContain('dir="rtl"');
    expect(markup).toContain("רחוב (אופציונלי)");
    expect(markup).toContain("שכונה");
    expect(markup).toContain("מ״ר בנוי");
    expect(markup).toContain("מ״ר עיקרי (אופציונלי)");
    expect(markup).toContain("מספר חדרים");
    expect(markup).toContain("קומה (אופציונלי)");
    expect(markup).toContain("מרפסת / חוץ");
    expect(markup).toContain("תיאור הנכס");
    expect(markup).toContain("type=\"file\"");
    expect(markup).toContain("multiple");
    expect(markup).toContain("accept=\"image/jpeg,image/png,image/webp\"");
    expect(markup).toContain("לפרסם את הנכס באתר הציבורי מיד לאחר השמירה");
    expect(markup).toContain("בחירת תמונות לגלריה");
    expect(markup).toContain("תמונה ראשית");
  });

  it("renders the secured admin property manager in card/grid style with edit entry points and Hebrew property fields", () => {
    queryState.agentMeData = {
      id: 12,
      name: "סוכן מנהל",
      email: "manager@teamshay.co.il",
      accountRole: "admin",
    };
    queryState.adminDashboardData = {
      settings: {
        siteName: "Team Shay CMS",
        headerLogoUrl: "https://cdn.example.com/header.png",
        footerLogoUrl: "https://cdn.example.com/footer.png",
        landsmanLogoUrl: "https://cdn.example.com/landsman.png",
        heroBackgroundUrl: "https://cdn.example.com/hero.png",
        shayAboutImageUrl: "https://cdn.example.com/about.png",
        heroHeadline: "כותרת",
        heroTypingText: "טקסט",
        whatsappLink: "https://wa.me/972500000000",
        officePhone: "052-000-0000",
        aboutTitle: "אודות",
        aboutSubtitle: "טקסט",
        landsmanTitle: "Landsman",
        landsmanBody: "טקסט",
        footerSlogan: "סלוגן",
      },
      testimonials: [],
      staff: [],
      properties: [
        {
          id: 44,
          agentId: 2,
          title: "פנטהאוז לניהול",
          address: "רחוב הפלמ\"ח 10",
          street: "הפלמ\"ח",
          neighborhood: "בקעה",
          city: "ירושלים",
          price: 5100000,
          rooms: 5,
          sqm: 174,
          builtSqm: 160,
          outdoorSpace: "מרפסת 18 מ\"ר",
          floor: 6,
          status: "בלעדי",
          description: "תיאור הנכס מתוך כרטיס הניהול.",
          descriptionHtml: null,
          isPublished: true,
          featuredImageUrl: "https://cdn.example.com/property-grid.png",
          images: [{ imageUrl: "https://cdn.example.com/property-grid-1.png" }],
        },
      ],
      leads: [],
    };

    const markup = renderToStaticMarkup(React.createElement(AdminPanel));

    expect(markup).toContain("פנטהאוז לניהול");
    expect(markup).toContain("בקעה");
    expect(markup).toContain("174 מ״ר");
    expect(markup).toContain("ניהול נכסים");
    expect(markup).toContain("/agent-dashboard/new-property?id=44");
  });

  it("renders the agent login page in RTL with a secure path back to the locked admin panel", () => {
    const markup = renderToStaticMarkup(React.createElement(AgentLogin));

    expect(markup).toContain('dir="rtl"');
    expect(markup).toContain("התחברות סוכן");
    expect(markup).toContain("פרטי ההתחברות נמסרים לסוכנים מורשים בלבד");
    expect(markup).toContain("פאנל הניהול המאובטח");
    expect(markup).toContain('/admin');
  });
});
