import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import CrmLayout from "@/components/CrmLayout";
import { Button } from "@/components/ui/button";
import { CrmSearchSelect } from "@/components/CrmSearchSelect";
import { leadLocation } from "@/lib/lead-display";
import { normalizeLeadType } from "@/lib/crm-options";
import { trpc } from "@/lib/trpc";

const channels = ["יד2", "מדלן", "אורגני דיגיטל", "ממומן דיגיטל", "פייסבוק", "שת״פ מתווכים", "וואטסאפ", "פליירים", "מכתבי שכנים", "צילום", "עיתון מקומי", "בית פתוח", "פניות טלפון"] as const;

function isoWeek() {
  const now = new Date();
  const first = new Date(now.getFullYear(), 0, 1);
  return Math.ceil((((now.getTime() - first.getTime()) / 86_400_000) + first.getDay() + 1) / 7);
}

export default function CrmMarketing() {
  const utils = trpc.useUtils();
  const propertiesQuery = trpc.admin.listProperties.useQuery();
  const leadsQuery = trpc.crm.list.useQuery({ search: undefined, agentId: undefined });
  const marketingQuery = trpc.crm2.marketing.list.useQuery();
  const [leadId, setLeadId] = useState<number | null>(null);
  const [actionDate, setActionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [channelData, setChannelData] = useState<Record<string, string>>({});
  const [maxOffer, setMaxOffer] = useState("");
  const [visitorsCount, setVisitorsCount] = useState("");

  const exclusiveProperties = (propertiesQuery.data ?? []).filter((property) => property.status === "בלעדי");
  const exclusiveLeads = useMemo(
    () => (leadsQuery.data ?? []).filter((lead) => normalizeLeadType(`${lead.leadType ?? ""} ${lead.tags ?? ""}`) === "exclusive"),
    [leadsQuery.data],
  );
  const selectedLead = exclusiveLeads.find((lead) => lead.id === leadId) ?? null;
  const propertyForLead = useMemo(() => {
    if (!selectedLead?.propertyStreet) return null;
    const street = selectedLead.propertyStreet.replace(/\s/g, "");
    return exclusiveProperties.find((property) => `${property.street ?? ""}${property.address ?? ""}`.replace(/\s/g, "").includes(street)) ?? null;
  }, [exclusiveProperties, selectedLead]);

  const createMutation = trpc.crm2.marketing.create.useMutation({
    onSuccess: async () => { await utils.crm2.marketing.list.invalidate(); toast.success("פעולות השיווק נשמרו."); },
    onError: (error) => toast.error(error.message),
  });

  return (
    <CrmLayout title="ניהול פעולות שיווק" subtitle="בחירת לקוח בבלעדיות והזנת כל פעולות השיווק שלו במקום אחד">
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">פעילות אחרונה</h2>
          <div className="mt-4 space-y-3">
            {(marketingQuery.data ?? []).slice(0, 12).map((action) => {
              const lead = exclusiveLeads.find((item) => item.id === action.leadId);
              return <div key={action.id} className="flex items-center justify-between rounded-xl bg-[#F8F8F5] p-3"><div><p className="font-black">{lead?.ownerName || lead?.name || "לקוח בבלעדיות"}</p><p className="mt-1 text-xs text-slate-500">{action.actionDate ?? `שבוע ${action.weekNumber}/${action.year}`}</p></div><Pencil className="size-4 text-[#9a7319]" /></div>;
            })}
            {!(marketingQuery.data ?? []).length ? <p className="text-sm text-slate-500">אין פעילות קודמת.</p> : null}
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">ערכת פעולות שיווק</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <span className="mb-1 block text-sm font-black">לקוח בבלעדיות</span>
              <CrmSearchSelect
                value={leadId}
                onChange={(value) => setLeadId(value == null ? null : Number(value))}
                placeholder="בחר לקוח בבלעדיות"
                options={exclusiveLeads.map((lead) => ({ value: lead.id, label: lead.ownerName || lead.name }))}
              />
              {selectedLead ? <p className="mt-2 text-xs font-bold text-slate-500">{leadLocation(selectedLead) || "לא הוזנה כתובת לנכס"}</p> : null}
            </div>
            <label><span className="mb-1 block text-sm font-black">תאריך הזנת הנתונים</span><input type="date" value={actionDate} onChange={(event) => setActionDate(event.target.value)} className="w-full" /></label>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {channels.map((channel) => <div key={channel} className="rounded-xl border border-[#D4AF37]/30 bg-[#fffdf8] p-4"><p className="font-black">{channel}</p><input value={channelData[channel] ?? ""} onChange={(event) => setChannelData((current) => ({ ...current, [channel]: event.target.value }))} placeholder="בוצע / בוצע X פעמים" className="mt-3 w-full" />{["יד2", "מדלן", "פייסבוק"].includes(channel) ? <input value={channelData[`צפיות ${channel}`] ?? ""} onChange={(event) => setChannelData((current) => ({ ...current, [`צפיות ${channel}`]: event.target.value }))} placeholder="כמות צפיות" className="mt-2 w-full" /> : null}</div>)}
          </div>
          <div className="mt-6 rounded-xl bg-[#F8F8F5] p-4">
            <h3 className="font-black">נתוני הצעות ומתעניינים</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2"><input type="number" value={maxOffer} onChange={(event) => setMaxOffer(event.target.value)} placeholder="הצעת מחיר מקסימלית ₪" /><input type="number" value={visitorsCount} onChange={(event) => setVisitorsCount(event.target.value)} placeholder="כמה קונים היו בדירה סה״כ" /></div>
          </div>
          <Button disabled={!leadId} onClick={() => leadId && createMutation.mutate({ propertyId: propertyForLead?.id ?? null, weekNumber: isoWeek(), year: new Date().getFullYear(), templateId: null, customMessage: null, marketingFields: channelData, leadId, actionDate, maxOffer: maxOffer ? Number(maxOffer) : null, visitorsCount: visitorsCount ? Number(visitorsCount) : null, targetAudience: "sellers", status: "draft" })} className="mt-5 rounded-full bg-[#D4AF37] px-6 text-black">שמור פעולות שיווק</Button>
        </section>
      </div>
    </CrmLayout>
  );
}
