import CrmLayout from "@/components/CrmLayout";
import { Button } from "@/components/ui/button";
import { CrmSearchSelect } from "@/components/CrmSearchSelect";
import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const MARKETING_FIELDS = [
  "יד2",
  "צפיות יד2",
  "מדלן",
  "צפיות מדלן",
  "פייסבוק",
  "אורגני דיגיטל",
  "ממומן דיגיטל",
  "וואטסאפ",
  "שת״פ מתווכים",
  "פליירים",
  "מכתבי שכנים",
  "עיתון מקומי",
  "צילום",
  "שלטים",
  "פניות טלפון",
  "בית פתוח",
  "אחר",
] as const;

type MarketingField = (typeof MARKETING_FIELDS)[number];
type MarketingFieldsState = Record<MarketingField, string>;
type CrmLead = {
  name: string;
  notes: string | null;
  tags: string;
  leadType?: string | null;
  leadStatus: string;
  propertyStreet?: string | null;
  ownerName?: string | null;
};

const emptyMarketingFields = MARKETING_FIELDS.reduce((acc, field) => {
  acc[field] = "";
  return acc;
}, {} as MarketingFieldsState);

function normalizeMatchValue(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/[^A-Za-z0-9\u0590-\u05FF]+/g, "")
    .replace(/^חוזה/, "")
    .toLowerCase();
}

function extractStreetFromNotes(notes?: string | null) {
  return notes?.match(/רחוב\s*:\s*([^\n\r]+)/)?.[1]?.trim() ?? null;
}

function isExclusiveLead(lead: CrmLead) {
  return /exclusive|בלעדי|בלעדיות/i.test(`${lead.tags} ${lead.leadType ?? ""}`);
}

function getCurrentWeekYear() {
  const date = new Date();
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week, year: utc.getUTCFullYear() };
}

export default function CrmMarketing() {
  const utils = trpc.useUtils();
  const weekly = getCurrentWeekYear();
  const propertiesQuery = trpc.admin.listProperties.useQuery();
  const leadsQuery = trpc.crm.list.useQuery({ search: undefined, agentId: undefined });
  const templatesQuery = trpc.crm2.templates.list.useQuery();
  const marketingQuery = trpc.crm2.marketing.list.useQuery();

  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [targetAudience, setTargetAudience] = useState<"all" | "buyers" | "sellers" | "investors">("all");
  const [customMessage, setCustomMessage] = useState("");
  const [marketingFields, setMarketingFields] = useState<MarketingFieldsState>(emptyMarketingFields);
  const [status, setStatus] = useState<"draft" | "scheduled">("draft");

  const selectedProperty = useMemo(
    () => (propertiesQuery.data ?? []).find((item) => item.id === propertyId) ?? null,
    [propertiesQuery.data, propertyId],
  );

  const exclusiveOwnerNames = useMemo(() => {
    const leads = (leadsQuery.data ?? []) as CrmLead[];
    const namesByProperty = new Map<number, string[]>();

    for (const property of propertiesQuery.data ?? []) {
      if (property.status !== "בלעדי") continue;
      const propertyValues = [property.street, property.address]
        .map(normalizeMatchValue)
        .filter(Boolean);
      const names = leads
        .filter((lead) => lead.leadStatus !== "לא רלוונטי" && lead.leadStatus !== "סגור" && isExclusiveLead(lead))
        .filter((lead) => {
          const leadStreet = normalizeMatchValue(lead.propertyStreet ?? extractStreetFromNotes(lead.notes));
          return Boolean(leadStreet && propertyValues.some((value) => value.includes(leadStreet) || leadStreet.includes(value)));
        })
        .map((lead) => (lead.ownerName || lead.name).trim())
        .filter(Boolean);

      namesByProperty.set(property.id, Array.from(new Set(names)));
    }

    return namesByProperty;
  }, [leadsQuery.data, propertiesQuery.data]);

  const createMutation = trpc.crm2.marketing.create.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.crm2.marketing.list.invalidate(),
        utils.crm2.marketing.getWeeklyData.invalidate(),
      ]);
      setCustomMessage("");
      setMarketingFields({ ...emptyMarketingFields });
      toast.success("פעולת השיווק נשמרה.");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <CrmLayout title="פעולות שיווק" subtitle="מרכז השליטה השבועי לשליחת בלעדיות דרך Make + Green API.">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-black text-slate-950">שבוע נוכחי: {weekly.week}/{weekly.year}</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <CrmSearchSelect
            value={propertyId}
            onChange={value => setPropertyId(value == null ? null : Number(value))}
            placeholder="בחר נכס בלעדי"
            options={(propertiesQuery.data ?? []).filter(item => item.status === "בלעדי").map(property => ({
              value: property.id,
              label: `${exclusiveOwnerNames.get(property.id)?.join(" / ") || "ללא שם בעלים"} — ${property.address || property.street || property.title}`,
            }))}
          />

          <CrmSearchSelect
            value={templateId}
            onChange={value => setTemplateId(value == null ? null : Number(value))}
            placeholder="בחר תבנית"
            options={(templatesQuery.data ?? []).filter(item => item.type === "exclusivity").map(template => ({ value: template.id, label: template.name }))}
          />

          <CrmSearchSelect
            value={targetAudience}
            onChange={value => setTargetAudience((value ?? "all") as "all" | "buyers" | "sellers" | "investors")}
            isClearable={false}
            options={[
              { value: "all", label: "כולם" }, { value: "buyers", label: "קונים" },
              { value: "sellers", label: "מוכרים" }, { value: "investors", label: "משקיעים" },
            ]}
          />

          <CrmSearchSelect
            value={status}
            onChange={value => setStatus((value ?? "draft") as "draft" | "scheduled")}
            isClearable={false}
            options={[{ value: "draft", label: "טיוטה" }, { value: "scheduled", label: "מתוזמן" }]}
          />
        </div>

        <textarea
          value={customMessage}
          onChange={(event) => setCustomMessage(event.target.value)}
          placeholder="טקסט הודעה (אם ריק, יילקח מהתבנית)"
          className="mt-3 min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm"
        />

        {selectedProperty ? (
          <p className="mt-3 text-sm text-slate-600">
            תמונת נכס תישלח אוטומטית אם קיימת: {selectedProperty.featuredImageUrl ? "כן" : "לא"}
          </p>
        ) : null}

        <div className="mt-5 rounded-2xl border border-slate-200 bg-[#faf8f1] p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-950">ערכים דינמיים לפעולות השיווק</h3>
              <p className="mt-1 text-sm text-slate-600">
                כל שדה כאן יחליף את הסוגריים בתבנית, למשל {"{יד2}"}, {"{צפיות יד2}"} או {"{וואטסאפ}"}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMarketingFields({ ...emptyMarketingFields })}
              className="text-sm font-black text-[#b98b2f] hover:text-[#8a641d]"
            >
              איפוס שדות
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {MARKETING_FIELDS.map((field) => (
              <label key={field} className="block">
                <span className="text-xs font-black text-slate-600">{field}</span>
                <input
                  value={marketingFields[field]}
                  onChange={(event) =>
                    setMarketingFields((current) => ({
                      ...current,
                      [field]: event.target.value,
                    }))
                  }
                  placeholder={field.includes("צפיות") ? `כמה צפיות ב${field.replace("צפיות ", "")}` : `מה בוצע ב${field}`}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <Button
            onClick={() => {
              if (!propertyId) {
                toast.error("יש לבחור נכס.");
                return;
              }
              createMutation.mutate({
                propertyId,
                weekNumber: weekly.week,
                year: weekly.year,
                templateId,
                customMessage: customMessage || null,
                marketingFields,
                targetAudience,
                status,
              });
            }}
            disabled={createMutation.isPending}
            className="rounded-full bg-[#d9ae4c] text-black hover:bg-[#c99a31]"
          >
            {status === "scheduled" ? "תזמן לשליחה שישי 10:00" : "שמור טיוטה"}
          </Button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-black text-slate-950">היסטוריית שיווק</h2>
        <div className="mt-4 space-y-3">
          {(marketingQuery.data ?? []).map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-[#faf8f1] p-3">
              <p className="text-sm font-black text-slate-800">
                שבוע {item.weekNumber}/{item.year} · נכס #{item.propertyId}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {item.recipientCount} נמענים · סטטוס: {item.status}
              </p>
            </div>
          ))}
          {!(marketingQuery.data ?? []).length ? <p className="text-sm text-slate-500">אין פעולות שיווק עדיין.</p> : null}
        </div>
      </section>
    </CrmLayout>
  );
}
