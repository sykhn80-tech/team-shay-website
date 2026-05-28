import CrmLayout from "@/components/CrmLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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
  const templatesQuery = trpc.crm2.templates.list.useQuery();
  const marketingQuery = trpc.crm2.marketing.list.useQuery();

  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [targetAudience, setTargetAudience] = useState<"all" | "buyers" | "sellers" | "investors">("all");
  const [customMessage, setCustomMessage] = useState("");
  const [status, setStatus] = useState<"draft" | "scheduled">("draft");

  const selectedProperty = useMemo(
    () => (propertiesQuery.data ?? []).find((item) => item.id === propertyId) ?? null,
    [propertiesQuery.data, propertyId],
  );

  const createMutation = trpc.crm2.marketing.create.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.crm2.marketing.list.invalidate(),
        utils.crm2.marketing.getWeeklyData.invalidate(),
      ]);
      setCustomMessage("");
      toast.success("פעולת השיווק נשמרה.");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <CrmLayout title="פעולות שיווק" subtitle="מרכז השליטה השבועי לשליחת בלעדיות דרך Make + Green API.">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-black text-slate-950">שבוע נוכחי: {weekly.week}/{weekly.year}</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select
            value={propertyId ?? ""}
            onChange={(event) => {
              const value = Number(event.target.value);
              setPropertyId(Number.isFinite(value) && value > 0 ? value : null);
            }}
            className="h-11 rounded-xl border border-slate-200 px-3"
          >
            <option value="">בחר נכס בלעדי</option>
            {(propertiesQuery.data ?? []).filter((item) => item.status === "בלעדי").map((property) => (
              <option key={property.id} value={property.id}>
                {property.title}
              </option>
            ))}
          </select>

          <select
            value={templateId ?? ""}
            onChange={(event) => {
              const value = Number(event.target.value);
              setTemplateId(Number.isFinite(value) && value > 0 ? value : null);
            }}
            className="h-11 rounded-xl border border-slate-200 px-3"
          >
            <option value="">בחר תבנית</option>
            {(templatesQuery.data ?? []).filter((item) => item.type === "exclusivity").map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>

          <select
            value={targetAudience}
            onChange={(event) => setTargetAudience(event.target.value as "all" | "buyers" | "sellers" | "investors")}
            className="h-11 rounded-xl border border-slate-200 px-3"
          >
            <option value="all">כולם</option>
            <option value="buyers">קונים</option>
            <option value="sellers">מוכרים</option>
            <option value="investors">משקיעים</option>
          </select>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as "draft" | "scheduled")}
            className="h-11 rounded-xl border border-slate-200 px-3"
          >
            <option value="draft">טיוטה</option>
            <option value="scheduled">מתוזמן</option>
          </select>
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
