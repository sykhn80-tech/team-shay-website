import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { agents as fallbackAgents, LANDSMAN_LOGO, TEAM_LOGO } from "@/lib/siteData";
import {
  BarChart2,
  CirclePlus,
  ExternalLink,
  FileDown,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import AgentLayout from "@/components/AgentLayout";
import { toast } from "sonner";

interface CmaFormState {
  city: string;
  neighborhood: string;
  street: string;
  rooms: string;
  minSqm: string;
  maxSqm: string;
  notes: string;
}

interface CmaDeal {
  dealId: number;
  address: string;
  street: string;
  neighborhood: string;
  rooms: number | null;
  sqm: number | null;
  floor: string | null;
  nonBuiltSqm: number | null;
  price: number;
  pricePerSqm: number | null;
  matchScore: number;
  matchLevel: "high" | "medium" | "low";
  matchLabel: string;
  matchReason: string;
  dealDate: string;
  propertyType: string;
}

interface CmaStreetSuggestion {
  street: string;
  searchUrl: string;
  searchQuery: string;
}

interface CmaSummary {
  marketAnalysis: string;
  recommendedRange: {
    min: number;
    max: number;
  };
  averagePricePerSqm: number;
  sellerRecommendation: string;
}

interface CmaResult {
  neighborhoodLabel: string;
  settlementName: string;
  deals: CmaDeal[];
  streetSuggestions: CmaStreetSuggestion[];
  broadSearchUrl: string;
  aiSummary: CmaSummary;
  stats: {
    averagePricePerSqm: number;
    averageDealPrice: number;
    matchingDealsCount: number;
  };
}

const EMPTY_FORM: CmaFormState = {
  city: "",
  neighborhood: "",
  street: "",
  rooms: "",
  minSqm: "",
  maxSqm: "",
  notes: "",
};

type ManualCompetitor = {
  address: string;
  rooms: string;
  floor: string;
  sqm: string;
  nonBuiltSqm: string;
  price: string;
};

const EMPTY_COMPETITORS: ManualCompetitor[] = Array.from({ length: 5 }).map(() => ({
  address: "",
  rooms: "",
  floor: "",
  sqm: "",
  nonBuiltSqm: "",
  price: "",
}));

function normalizeAgentEmail(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function getAgentFallback(email?: string | null, name?: string | null) {
  const normalizedEmail = normalizeAgentEmail(email);
  const normalizedName = name?.trim() ?? "";
  return fallbackAgents.find((item) => normalizeAgentEmail(item.email) === normalizedEmail) ??
    fallbackAgents.find((item) => item.name === normalizedName);
}

export default function CmaAgent() {
  const { data: agent } = trpc.agent.me.useQuery();
  const generateCmaMutation = trpc.agent.generateCma.useMutation();
  const [form, setForm] = useState<CmaFormState>(EMPTY_FORM);
  const [report, setReport] = useState<CmaResult | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [manualCompetitors, setManualCompetitors] = useState<ManualCompetitor[]>(EMPTY_COMPETITORS);
  const agentFallback = getAgentFallback(agent?.email, agent?.name);
  const agentPhotoUrl = agent?.photoUrl || agentFallback?.image || "";
  const agentDisplayName = agent?.name ?? agentFallback?.name ?? "Team Shay";
  const agentPhone = agent?.phone || agentFallback?.phone || "052-863-6631";
  const agentEmail = agent?.email || agentFallback?.email || "";

  const reportStats = useMemo(() => {
    if (!report) return null;

    const averageDealPrice = report.deals.length
      ? Math.round(report.deals.reduce((sum, deal) => sum + deal.price, 0) / report.deals.length)
      : 0;

    const pricePerSqmValues = report.deals
      .map((deal) => deal.pricePerSqm)
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

    const averagePricePerSqm = pricePerSqmValues.length
      ? Math.round(pricePerSqmValues.reduce((sum, value) => sum + value, 0) / pricePerSqmValues.length)
      : report.aiSummary.averagePricePerSqm;

    return {
      averageDealPrice,
      averagePricePerSqm,
      matchingDealsCount: report.deals.length,
    };
  }, [report]);

  const whatsappText = useMemo(() => {
    if (!report || !reportStats) return "";

    return [
      `דוח CMA עבור ${report.neighborhoodLabel}, ${report.settlementName}`,
      `ממוצע למ"ר: ₪${reportStats.averagePricePerSqm.toLocaleString("he-IL")}`,
      `טווח מומלץ: ₪${report.aiSummary.recommendedRange.min.toLocaleString("he-IL")} - ₪${report.aiSummary.recommendedRange.max.toLocaleString("he-IL")}`,
      report.aiSummary.marketAnalysis,
      report.aiSummary.sellerRecommendation,
      `יד2: ${report.broadSearchUrl}`,
    ].join("\n");
  }, [report, reportStats]);

  const setField = (key: keyof CmaFormState, value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const setManualCompetitorField = (index: number, key: keyof ManualCompetitor, value: string) => {
    setManualCompetitors((previous) =>
      previous.map((item, currentIndex) => (currentIndex === index ? { ...item, [key]: value } : item)),
    );
  };

  const setReportDealField = (index: number, key: keyof CmaDeal, value: string) => {
    setReport((previous) => {
      if (!previous) return previous;
      const nextDeals = previous.deals.map((deal, currentIndex) => {
        if (currentIndex !== index) return deal;

        if (key === "price" || key === "rooms" || key === "sqm" || key === "nonBuiltSqm" || key === "pricePerSqm") {
          const parsed = value === "" ? null : Number(value);
          return {
            ...deal,
            [key]: parsed,
          } as CmaDeal;
        }

        return {
          ...deal,
          [key]: value,
        };
      });

      return {
        ...previous,
        deals: nextDeals,
      };
    });
  };

  const setReportSummaryField = (key: "marketAnalysis" | "sellerRecommendation", value: string) => {
    setReport((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        aiSummary: {
          ...previous.aiSummary,
          [key]: value,
        },
      };
    });
  };

  const setRecommendedRangeField = (key: "min" | "max", value: string) => {
    setReport((previous) => {
      if (!previous) return previous;
      const parsed = Number(value);
      return {
        ...previous,
        aiSummary: {
          ...previous.aiSummary,
          recommendedRange: {
            ...previous.aiSummary.recommendedRange,
            [key]: Number.isFinite(parsed) ? parsed : previous.aiSummary.recommendedRange[key],
          },
        },
      };
    });
  };

  const setStreetSuggestionField = (index: number, key: keyof CmaStreetSuggestion, value: string) => {
    setReport((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        streetSuggestions: previous.streetSuggestions.map((item, currentIndex) =>
          currentIndex === index
            ? {
                ...item,
                [key]: value,
              }
            : item,
        ),
      };
    });
  };

  const addStreetSuggestion = () => {
    setReport((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        streetSuggestions: [
          ...previous.streetSuggestions,
          {
            street: "",
            searchQuery: "",
            searchUrl: "",
          },
        ],
      };
    });
  };

  const removeStreetSuggestion = (index: number) => {
    setReport((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        streetSuggestions: previous.streetSuggestions.filter((_, currentIndex) => currentIndex !== index),
      };
    });
  };

  async function handleGenerate() {
    if (!form.neighborhood.trim() || !form.rooms.trim()) {
      toast.error("יש למלא שכונה וכמות חדרים כדי להפיק דוח CMA.");
      return;
    }

    try {
      const nextResult = await generateCmaMutation.mutateAsync(form);
      setReport(nextResult);
      setIsEditMode(false);
      setManualCompetitors(EMPTY_COMPETITORS);
      toast.success("דוח ה-CMA מוכן.");
    } catch (error: any) {
      toast.error(error.message || "הפקת דוח ה-CMA נכשלה.");
    }
  }

  function handleOpenWhatsapp() {
    if (!whatsappText) return;

    window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, "_blank", "noopener,noreferrer");
  }

  function handleDownloadPdf() {
    window.print();
  }

  function parseNumberLike(value: string) {
    const normalized = value.replace(/[^\d.]/g, "");
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function getManualPricePerSqm(item: ManualCompetitor) {
    const price = parseNumberLike(item.price);
    const builtSqm = parseNumberLike(item.sqm);
    if (!price || !builtSqm) return null;
    return Math.round(price / builtSqm);
  }

  return (
    <AgentLayout>
      <div className="min-h-screen overflow-x-hidden bg-[#fff8e6] text-black print:bg-white" dir="rtl">
        <main className="overflow-x-hidden px-4 py-6 md:px-8 md:py-8 print:px-0 print:py-0">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.08em] text-[#d9ae4c]">CMA</p>
                <h2 className="mt-3 text-3xl font-black text-black md:text-4xl">הערכת שווי CMA</h2>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  מזינים עיר, שכונה, רחוב, חדרים וטווח מ"ר, ומקבלים דוח שאפשר לערוך ידנית לפני שליחה ללקוח.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-[#fff4d8] px-4 py-2 text-sm font-bold text-[#d9ae4c]">
                <CirclePlus className="size-4" />
                {agent?.email ?? "סוכן מחובר"}
              </div>
            </div>

            <div className={`mt-8 ${report ? "space-y-6" : "grid gap-6 xl:grid-cols-[380px_1fr]"}`}>
              <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] print:hidden">
                <div className="flex items-center gap-3">
                  <BarChart2 className="size-5 text-[#d9ae4c]" />
                  <div>
                    <h3 className="text-xl font-black text-black">פרטי החיפוש</h3>
                    <p className="mt-1 text-sm text-slate-500">עדיפות אוטומטית ניתנת לאותו הרחוב המדויק כאשר הוא מוזן.</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-700">עיר (רשות)</span>
                    <input
                      value={form.city}
                      onChange={(event) => setField("city", event.target.value)}
                      placeholder="למשל: ירושלים"
                      className="h-12 rounded-2xl border border-slate-200 bg-[#fafafa] px-4 text-sm outline-none transition focus:border-[#d9ae4c] focus:ring-4 focus:ring-[#d9ae4c]/10"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-700">שכונה</span>
                    <input
                      value={form.neighborhood}
                      onChange={(event) => setField("neighborhood", event.target.value)}
                      placeholder="למשל: קטמונים"
                      className="h-12 rounded-2xl border border-slate-200 bg-[#fafafa] px-4 text-sm outline-none transition focus:border-[#d9ae4c] focus:ring-4 focus:ring-[#d9ae4c]/10"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-700">רחוב (רשות)</span>
                    <input
                      value={form.street}
                      onChange={(event) => setField("street", event.target.value)}
                      placeholder="למשל: מקור חיים"
                      className="h-12 rounded-2xl border border-slate-200 bg-[#fafafa] px-4 text-sm outline-none transition focus:border-[#d9ae4c] focus:ring-4 focus:ring-[#d9ae4c]/10"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-700">מספר חדרים</span>
                    <input
                      value={form.rooms}
                      onChange={(event) => setField("rooms", event.target.value)}
                      placeholder="למשל: 4"
                      className="h-12 rounded-2xl border border-slate-200 bg-[#fafafa] px-4 text-sm outline-none transition focus:border-[#d9ae4c] focus:ring-4 focus:ring-[#d9ae4c]/10"
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-slate-700">מ"ר מינימום</span>
                      <input
                        value={form.minSqm}
                        onChange={(event) => setField("minSqm", event.target.value)}
                        placeholder="80"
                        className="h-12 rounded-2xl border border-slate-200 bg-[#fafafa] px-4 text-sm outline-none transition focus:border-[#d9ae4c] focus:ring-4 focus:ring-[#d9ae4c]/10"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-slate-700">מ"ר מקסימום</span>
                      <input
                        value={form.maxSqm}
                        onChange={(event) => setField("maxSqm", event.target.value)}
                        placeholder="120"
                        className="h-12 rounded-2xl border border-slate-200 bg-[#fafafa] px-4 text-sm outline-none transition focus:border-[#d9ae4c] focus:ring-4 focus:ring-[#d9ae4c]/10"
                      />
                    </label>
                  </div>

                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-700">דגשים מקומיים (פינוי בינוי, יתרון רחוב וכו')</span>
                    <textarea
                      value={form.notes}
                      onChange={(event) => setField("notes", event.target.value)}
                      rows={3}
                      placeholder="לדוגמה: רחוב עם ביקוש גבוה, תכנית פינוי-בינוי פעילה, קרבה לצירים מרכזיים"
                      className="rounded-2xl border border-slate-200 bg-[#fafafa] px-4 py-3 text-sm outline-none transition focus:border-[#d9ae4c] focus:ring-4 focus:ring-[#d9ae4c]/10"
                    />
                  </label>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={generateCmaMutation.isPending}
                  className="mt-6 h-12 w-full rounded-full bg-[#d9ae4c] text-base font-black text-white hover:bg-[#c99a31] disabled:opacity-60"
                >
                  {generateCmaMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      מפיקים דוח CMA...
                    </>
                  ) : (
                    <>
                      <BarChart2 className="size-4" />
                      הפק דוח CMA
                    </>
                  )}
                </Button>

                <div className="mt-4 rounded-[24px] bg-[#fff8e6] p-4 text-sm leading-7 text-slate-600">
                  אחרי ההפקה אפשר לערוך הכל ידנית: עסקאות, סיכום, טווח מחיר וקישורי יד2.
                </div>
              </section>

              <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] print:rounded-none print:border-0 print:shadow-none">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-center gap-3">
                    <img src={TEAM_LOGO} alt="Team Shay" className="team-shay-logo h-14 w-auto object-contain" />
                    <span className="h-10 w-px bg-slate-200" aria-hidden="true" />
                    <img src={LANDSMAN_LOGO} alt="Landsman ירושלים" className="h-12 w-auto object-contain print:h-14" />
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.08em] text-[#d9ae4c]">Team Shay | Landsman Jerusalem</p>
                      <h3 className="mt-1 text-2xl font-black text-slate-950">דוח CMA מקצועי</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-[24px] border border-[#d9ae4c]/30 bg-[#fff8e6] px-4 py-3 text-right print:border-slate-200 print:bg-white">
                    {agentPhotoUrl ? (
                      <img
                        src={agentPhotoUrl}
                        alt={agentDisplayName}
                        className="size-14 rounded-full border-2 border-[#d9ae4c] bg-white object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="grid size-14 place-items-center rounded-full border-2 border-[#d9ae4c] bg-white text-lg font-black text-[#1A1A1A]">
                        {agentDisplayName.slice(0, 1)}
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-black text-slate-950">{agentDisplayName}</p>
                      <p className="mt-1 text-xs font-bold text-[#b98b2f]">{agentPhone}</p>
                      {agentEmail ? <p className="mt-0.5 text-xs font-semibold text-slate-500">{agentEmail}</p> : null}
                    </div>
                  </div>

                  {report ? (
                    <div className="flex flex-wrap gap-2 print:hidden">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditMode((previous) => !previous)}
                        className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-50"
                      >
                        {isEditMode ? <Save className="size-4" /> : <Pencil className="size-4" />}
                        {isEditMode ? "סיום עריכה" : "עריכת הדוח"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.open(report.broadSearchUrl, "_blank", "noopener,noreferrer")}
                        className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-50"
                      >
                        <ExternalLink className="size-4" />
                        פתח נכסים פעילים ביד2
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleOpenWhatsapp}
                        className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-50"
                      >
                        <MessageCircle className="size-4" />
                        שלח בוואטסאפ
                      </Button>
                      <Button type="button" onClick={handleDownloadPdf} className="rounded-full bg-[#d9ae4c] text-white hover:bg-[#c99a31]">
                        <FileDown className="size-4" />
                        הורד PDF
                      </Button>
                    </div>
                  ) : null}
                </div>

                {!report && !generateCmaMutation.isPending ? (
                  <div className="mt-10 rounded-[28px] bg-[#fff8e6] p-10 text-center">
                    <BarChart2 className="mx-auto size-14 text-[#d9ae4c] opacity-40" />
                    <p className="mt-4 text-lg font-black text-slate-700">ממתינים לנתוני שכונה כדי לבנות את הדוח</p>
                    <p className="mt-2 text-sm leading-7 text-slate-500">לאחר לחיצה על "הפק דוח CMA" יופיעו כאן העסקאות, הסיכום והרחובות להשוואה.</p>
                  </div>
                ) : null}

                {generateCmaMutation.isPending ? (
                  <div className="mt-10 rounded-[28px] bg-[#fff8e6] p-10 text-center">
                    <Loader2 className="mx-auto size-14 animate-spin text-[#d9ae4c]" />
                    <p className="mt-4 text-lg font-black text-slate-700">מושכים עסקאות אחרונות ומרכיבים דוח...</p>
                  </div>
                ) : null}

                {report && reportStats ? (
                  <div className="mt-8 space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                      {[
                        {
                          label: "ממוצע למ\"ר",
                          value: `₪${reportStats.averagePricePerSqm.toLocaleString("he-IL")}`,
                        },
                        {
                          label: "מחיר עסקה ממוצע",
                          value: `₪${reportStats.averageDealPrice.toLocaleString("he-IL")}`,
                        },
                        {
                          label: "עסקאות השוואה",
                          value: String(reportStats.matchingDealsCount),
                        },
                      ].map((item) => (
                        <article key={item.label} className="rounded-[24px] bg-[#fff8e6] p-4">
                          <p className="text-sm font-bold text-slate-500">{item.label}</p>
                          <p className="mt-2 text-2xl font-black text-slate-950">{item.value}</p>
                        </article>
                      ))}
                    </div>

                    <section className="rounded-[28px] border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-black uppercase tracking-[0.08em] text-[#d9ae4c]">Recent Deals</p>
                          <h4 className="mt-1 text-xl font-black text-slate-950">{report.deals.length} עסקאות אחרונות להשוואה</h4>
                        </div>
                        <div className="rounded-full bg-[#fff4d8] px-4 py-2 text-sm font-bold text-[#b98b2f]">
                          {report.neighborhoodLabel}, {report.settlementName}
                        </div>
                      </div>

                      <div className="mt-4 overflow-hidden">
                        <table className="w-full table-fixed text-right text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                              <th className="px-2 py-3 font-bold">כתובת</th>
                              <th className="px-2 py-3 font-bold">תאריך</th>
                              <th className="px-2 py-3 font-bold">חדרים</th>
                              <th className="px-2 py-3 font-bold">קומה</th>
                              <th className="px-2 py-3 font-bold">מ"ר בנוי</th>
                              <th className="px-2 py-3 font-bold">מ"ר לא בנוי</th>
                              <th className="px-2 py-3 font-bold">מחיר</th>
                              <th className="px-2 py-3 font-bold">מחיר למ"ר</th>
                              <th className="px-2 py-3 font-bold">התאמה</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.deals.map((deal, index) => (
                              <tr key={deal.dealId} className="border-b border-slate-100 last:border-b-0">
                                <td className="px-2 py-3 align-top">
                                  {isEditMode ? (
                                    <input
                                      value={deal.address}
                                      onChange={(event) => setReportDealField(index, "address", event.target.value)}
                                      className="h-10 w-full min-w-0 rounded-xl border border-slate-200 px-3 text-sm"
                                    />
                                  ) : (
                                    <span className="block break-words font-bold leading-6 text-slate-800">{deal.address}</span>
                                  )}
                                </td>
                                <td className="px-2 py-3 align-top">
                                  {isEditMode ? (
                                    <input
                                      value={deal.dealDate ?? ""}
                                      onChange={(event) => setReportDealField(index, "dealDate", event.target.value)}
                                      className="h-10 w-full min-w-0 rounded-xl border border-slate-200 px-2 text-sm"
                                      placeholder="01/2024"
                                    />
                                  ) : (
                                    <span className="text-slate-600 text-xs">{deal.dealDate ?? "—"}</span>
                                  )}
                                </td>
                                <td className="px-2 py-3 align-top">
                                  {isEditMode ? (
                                    <input
                                      value={deal.rooms ?? ""}
                                      onChange={(event) => setReportDealField(index, "rooms", event.target.value)}
                                      className="h-10 w-full min-w-0 rounded-xl border border-slate-200 px-2 text-sm"
                                    />
                                  ) : (
                                    <span className="text-slate-600">{deal.rooms ?? "—"}</span>
                                  )}
                                </td>
                                <td className="px-2 py-3 align-top">
                                  {isEditMode ? (
                                    <input
                                      value={deal.floor ?? ""}
                                      onChange={(event) => setReportDealField(index, "floor", event.target.value)}
                                      className="h-10 w-full min-w-0 rounded-xl border border-slate-200 px-2 text-sm"
                                    />
                                  ) : (
                                    <span className="text-slate-600">{deal.floor ?? "—"}</span>
                                  )}
                                </td>
                                <td className="px-2 py-3 align-top">
                                  {isEditMode ? (
                                    <input
                                      value={deal.sqm ?? ""}
                                      onChange={(event) => setReportDealField(index, "sqm", event.target.value)}
                                      className="h-10 w-full min-w-0 rounded-xl border border-slate-200 px-2 text-sm"
                                    />
                                  ) : (
                                    <span className="text-slate-600">{deal.sqm ?? "—"}</span>
                                  )}
                                </td>
                                <td className="px-2 py-3 align-top">
                                  {isEditMode ? (
                                    <input
                                      value={deal.nonBuiltSqm ?? ""}
                                      onChange={(event) => setReportDealField(index, "nonBuiltSqm", event.target.value)}
                                      className="h-10 w-full min-w-0 rounded-xl border border-slate-200 px-2 text-sm"
                                    />
                                  ) : (
                                    <span className="text-slate-600">{deal.nonBuiltSqm ?? "—"}</span>
                                  )}
                                </td>
                                <td className="px-2 py-3 align-top">
                                  {isEditMode ? (
                                    <input
                                      value={deal.price}
                                      onChange={(event) => setReportDealField(index, "price", event.target.value)}
                                      className="h-10 w-full min-w-0 rounded-xl border border-slate-200 px-2 text-sm"
                                    />
                                  ) : (
                                    <span className="block break-words text-slate-950">₪{deal.price.toLocaleString("he-IL")}</span>
                                  )}
                                </td>
                                <td className="px-2 py-3 align-top">
                                  {isEditMode ? (
                                    <input
                                      value={deal.pricePerSqm ?? ""}
                                      onChange={(event) => setReportDealField(index, "pricePerSqm", event.target.value)}
                                      className="h-10 w-full min-w-0 rounded-xl border border-slate-200 px-2 text-sm"
                                    />
                                  ) : (
                                    <span className="block break-words text-slate-600">
                                      {deal.pricePerSqm ? `₪${deal.pricePerSqm.toLocaleString("he-IL")}` : "—"}
                                    </span>
                                  )}
                                </td>
                                <td className="px-2 py-3 align-top">
                                  <div className="max-w-full">
                                    <p className="text-sm font-bold text-slate-800">{deal.matchLabel}</p>
                                    <p className="mt-1 break-words text-xs leading-6 text-slate-500">{deal.matchReason}</p>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>

                    <section className="rounded-[28px] bg-[#fff8e6] p-5">
                      <p className="text-sm font-black uppercase tracking-[0.08em] text-[#d9ae4c]">AI Summary</p>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <label className="grid gap-2">
                          <span className="text-xs font-bold text-slate-600">טווח מינימום</span>
                          <input
                            value={report.aiSummary.recommendedRange.min}
                            onChange={(event) => setRecommendedRangeField("min", event.target.value)}
                            className={`h-11 rounded-xl border border-slate-200 px-3 text-sm ${isEditMode ? "bg-white" : "bg-slate-100"}`}
                            disabled={!isEditMode}
                          />
                        </label>
                        <label className="grid gap-2">
                          <span className="text-xs font-bold text-slate-600">טווח מקסימום</span>
                          <input
                            value={report.aiSummary.recommendedRange.max}
                            onChange={(event) => setRecommendedRangeField("max", event.target.value)}
                            className={`h-11 rounded-xl border border-slate-200 px-3 text-sm ${isEditMode ? "bg-white" : "bg-slate-100"}`}
                            disabled={!isEditMode}
                          />
                        </label>
                      </div>
                      <textarea
                        value={report.aiSummary.marketAnalysis}
                        onChange={(event) => setReportSummaryField("marketAnalysis", event.target.value)}
                        disabled={!isEditMode}
                        rows={4}
                        className={`mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-7 ${
                          isEditMode ? "bg-white" : "bg-slate-100"
                        }`}
                      />
                      <textarea
                        value={report.aiSummary.sellerRecommendation}
                        onChange={(event) => setReportSummaryField("sellerRecommendation", event.target.value)}
                        disabled={!isEditMode}
                        rows={3}
                        className={`mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-7 ${
                          isEditMode ? "bg-white" : "bg-slate-100"
                        }`}
                      />
                    </section>

                    <section className="rounded-[28px] border border-slate-200 p-5 print:hidden">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-black uppercase tracking-[0.08em] text-[#d9ae4c]">Yad2 Comparables</p>
                          <h4 className="mt-1 text-xl font-black text-slate-950">רחובות להשוואה ועדכון ידני</h4>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.open(report.broadSearchUrl, "_blank", "noopener,noreferrer")}
                            className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-50"
                          >
                            <ExternalLink className="size-4" />
                            פתח חיפוש ראשי
                          </Button>
                          {isEditMode ? (
                            <Button type="button" variant="outline" onClick={addStreetSuggestion} className="rounded-full border-slate-200">
                              <Plus className="size-4" />
                              הוסף רחוב
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      {isEditMode ? (
                        <div className="mt-3">
                          <label className="grid gap-2">
                            <span className="text-xs font-bold text-slate-600">קישור חיפוש ראשי ליד2</span>
                            <input
                              value={report.broadSearchUrl}
                              onChange={(event) =>
                                setReport((previous) =>
                                  previous
                                    ? {
                                        ...previous,
                                        broadSearchUrl: event.target.value,
                                      }
                                    : previous,
                                )
                              }
                              className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                            />
                          </label>
                        </div>
                      ) : null}

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {report.streetSuggestions.map((street, index) => (
                          <article key={`${street.street}-${index}`} className="rounded-[24px] bg-[#fcfeff] p-4">
                            {isEditMode ? (
                              <>
                                <input
                                  value={street.street}
                                  onChange={(event) => setStreetSuggestionField(index, "street", event.target.value)}
                                  placeholder="רחוב"
                                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                />
                                <input
                                  value={street.searchQuery}
                                  onChange={(event) => setStreetSuggestionField(index, "searchQuery", event.target.value)}
                                  placeholder="שאילתת חיפוש"
                                  className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                />
                                <input
                                  value={street.searchUrl}
                                  onChange={(event) => setStreetSuggestionField(index, "searchUrl", event.target.value)}
                                  placeholder="קישור חיפוש"
                                  className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => removeStreetSuggestion(index)}
                                  className="mt-3 w-full rounded-full border-red-200 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="size-4" />
                                  הסר רחוב
                                </Button>
                              </>
                            ) : (
                              <>
                                <p className="text-lg font-black text-slate-950">{street.street}</p>
                                <p className="mt-2 text-sm text-slate-500">{street.searchQuery}</p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => window.open(street.searchUrl, "_blank", "noopener,noreferrer")}
                                  className="mt-4 w-full rounded-full border-slate-200 text-slate-700 hover:bg-slate-50"
                                >
                                  <ExternalLink className="size-4" />
                                  פתח חיפוש ליד2
                                </Button>
                              </>
                            )}
                          </article>
                        ))}
                      </div>
                    </section>

                    <section className="rounded-[28px] border border-slate-200 p-5">
                      {/* כותרת — מוסתרת בהדפסה */}
                      <div className="flex items-center justify-between print:hidden">
                        <div>
                          <p className="text-sm font-black uppercase tracking-[0.08em] text-[#d9ae4c]">Manual Competitors</p>
                          <h4 className="mt-1 text-xl font-black text-slate-950">5 נכסים מתחרים (הזנה ידנית)</h4>
                        </div>
                      </div>

                      {/* גרסת הדפסה — קריאה בלבד, מוצגת רק ב-PDF */}
                      <div className="hidden print:block mt-4">
                        <h4 className="text-xl font-black text-slate-950 mb-3">נכסים מתחרים</h4>
                        <table className="w-full table-fixed text-right text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                              <th className="px-2 py-3 font-bold">כתובת</th>
                              <th className="px-2 py-3 font-bold">חדרים</th>
                              <th className="px-2 py-3 font-bold">קומה</th>
                              <th className="px-2 py-3 font-bold">מ"ר בנוי</th>
                              <th className="px-2 py-3 font-bold">מ"ר לא בנוי</th>
                              <th className="px-2 py-3 font-bold">מחיר</th>
                              <th className="px-2 py-3 font-bold">מחיר למ"ר</th>
                            </tr>
                          </thead>
                          <tbody>
                            {manualCompetitors.filter(item => item.address || item.price).map((item, index) => (
                              <tr key={`print-competitor-${index}`} className="border-b border-slate-100 last:border-b-0">
                                <td className="px-2 py-3 font-bold text-slate-800">{item.address || "—"}</td>
                                <td className="px-2 py-3 text-slate-600">{item.rooms || "—"}</td>
                                <td className="px-2 py-3 text-slate-600">{item.floor || "—"}</td>
                                <td className="px-2 py-3 text-slate-600">{item.sqm || "—"}</td>
                                <td className="px-2 py-3 text-slate-600">{item.nonBuiltSqm || "—"}</td>
                                <td className="px-2 py-3 text-slate-950">
                                  {item.price ? `₪${parseNumberLike(item.price)?.toLocaleString("he-IL")}` : "—"}
                                </td>
                                <td className="px-2 py-3 font-bold text-slate-700">
                                  {getManualPricePerSqm(item) ? `₪${getManualPricePerSqm(item)?.toLocaleString("he-IL")}` : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* גרסת מסך — שדות עריכה, מוסתרת בהדפסה */}
                      <div className="mt-4 overflow-hidden print:hidden">
                        <table className="w-full table-fixed text-right text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                              <th className="px-2 py-3 font-bold">כתובת</th>
                              <th className="px-2 py-3 font-bold">חדרים</th>
                              <th className="px-2 py-3 font-bold">קומה</th>
                              <th className="px-2 py-3 font-bold">מ"ר בנוי</th>
                              <th className="px-2 py-3 font-bold">מ"ר לא בנוי</th>
                              <th className="px-2 py-3 font-bold">מחיר</th>
                              <th className="px-2 py-3 font-bold">מחיר למ"ר</th>
                            </tr>
                          </thead>
                          <tbody>
                            {manualCompetitors.map((item, index) => (
                              <tr key={`manual-competitor-${index}`} className="border-b border-slate-100 last:border-b-0">
                                <td className="px-2 py-2 align-top">
                                  <input value={item.address} onChange={(event) => setManualCompetitorField(index, "address", event.target.value)} className="h-10 w-full min-w-0 rounded-xl border border-slate-200 px-2 text-sm" placeholder="רחוב ומספר" />
                                </td>
                                <td className="px-2 py-2 align-top">
                                  <input value={item.rooms} onChange={(event) => setManualCompetitorField(index, "rooms", event.target.value)} className="h-10 w-full min-w-0 rounded-xl border border-slate-200 px-2 text-sm" placeholder="4" />
                                </td>
                                <td className="px-2 py-2 align-top">
                                  <input value={item.floor} onChange={(event) => setManualCompetitorField(index, "floor", event.target.value)} className="h-10 w-full min-w-0 rounded-xl border border-slate-200 px-2 text-sm" placeholder="2" />
                                </td>
                                <td className="px-2 py-2 align-top">
                                  <input value={item.sqm} onChange={(event) => setManualCompetitorField(index, "sqm", event.target.value)} className="h-10 w-full min-w-0 rounded-xl border border-slate-200 px-2 text-sm" placeholder="95" />
                                </td>
                                <td className="px-2 py-2 align-top">
                                  <input value={item.nonBuiltSqm} onChange={(event) => setManualCompetitorField(index, "nonBuiltSqm", event.target.value)} className="h-10 w-full min-w-0 rounded-xl border border-slate-200 px-2 text-sm" placeholder="12" />
                                </td>
                                <td className="px-2 py-2 align-top">
                                  <input value={item.price} onChange={(event) => setManualCompetitorField(index, "price", event.target.value)} className="h-10 w-full min-w-0 rounded-xl border border-slate-200 px-2 text-sm" placeholder="2,800,000" />
                                </td>
                                <td className="px-2 py-2 align-top">
                                  <span className="block break-words font-bold text-slate-700">
                                    {getManualPricePerSqm(item) ? `₪${getManualPricePerSqm(item)?.toLocaleString("he-IL")}` : "—"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  </div>
                ) : null}
              </section>
            </div>
          </div>
        </main>
      </div>
    </AgentLayout>
  );
}
