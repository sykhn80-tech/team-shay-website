import CrmLayout from "@/components/CrmLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { leadLabel, leadLocation } from "@/lib/lead-display";
import { CrmSearchSelect } from "@/components/CrmSearchSelect";

export default function CrmMatches() {
  const utils = trpc.useUtils();
  const leadsQuery = trpc.crm.list.useQuery({ search: undefined, agentId: undefined });
  const propertiesQuery = trpc.admin.listProperties.useQuery();
  const matchesQuery = trpc.crm2.matches.list.useQuery();

  const [leadId, setLeadId] = useState<number | null>(null);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<number[]>([]);
  const [message, setMessage] = useState("");

  const selectedLead = useMemo(
    () => (leadsQuery.data ?? []).find((lead) => lead.id === leadId) ?? null,
    [leadId, leadsQuery.data],
  );

  const filteredProperties = useMemo(() => {
    const properties = propertiesQuery.data ?? [];
    if (!selectedLead) return properties;

    const budgetMin = selectedLead.budgetMin ?? null;
    const budgetMax = selectedLead.budgetMax ?? null;

    return properties.filter((property) => {
      if (budgetMin != null && property.price < budgetMin) return false;
      if (budgetMax != null && property.price > budgetMax) return false;
      return property.isPublished;
    });
  }, [propertiesQuery.data, selectedLead]);

  const leadsById = useMemo(
    () => new Map((leadsQuery.data ?? []).map((lead) => [lead.id, lead])),
    [leadsQuery.data],
  );

  const createMutation = trpc.crm2.matches.create.useMutation({
    onSuccess: async () => {
      await utils.crm2.matches.list.invalidate();
      setSelectedPropertyIds([]);
      toast.success("ההתאמות נשמרו בהצלחה.");
    },
    onError: (error) => toast.error(error.message),
  });

  const sendMutation = trpc.crm2.matches.sendViaWhatsApp.useMutation({
    onSuccess: async () => {
      await utils.crm2.matches.list.invalidate();
      toast.success("ההודעה נשלחה ללקוח.");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <CrmLayout title="התאמות נכסים" subtitle="בחרו ליד, סמנו נכסים מתאימים ושלחו ללקוח ישירות ב-WhatsApp.">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <label className="text-sm font-black text-slate-700">בחר ליד</label>
        <CrmSearchSelect value={leadId} onChange={value => setLeadId(value == null ? null : Number(value))} placeholder="בחרו ליד"
          className="mt-2" options={(leadsQuery.data ?? []).map(lead => ({ value: lead.id, label: `${leadLabel(lead)} · ${lead.phone}` }))} />
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-black text-slate-950">נכסים מתאימים לתקציב</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredProperties.map((property) => {
            const checked = selectedPropertyIds.includes(property.id);
            return (
              <button
                key={property.id}
                type="button"
                onClick={() => {
                  setSelectedPropertyIds((prev) =>
                    prev.includes(property.id)
                      ? prev.filter((id) => id !== property.id)
                      : [...prev, property.id],
                  );
                }}
                className={`rounded-2xl border p-4 text-right transition ${
                  checked
                    ? "border-[#d9ae4c] bg-[#fff8e6]"
                    : "border-slate-200 bg-white hover:border-[#d9ae4c]/50"
                }`}
              >
                <p className="text-lg font-black text-slate-950">{property.title}</p>
                <p className="mt-1 text-sm text-slate-600">{property.address}</p>
                <p className="mt-2 text-sm font-bold text-[#b98b2f]">₪{property.price.toLocaleString("he-IL")}</p>
              </button>
            );
          })}
        </div>

        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="הודעה מותאמת לשליחה (אופציונלי)"
          className="mt-4 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm"
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            onClick={() => {
              if (!leadId || !selectedPropertyIds.length) {
                toast.error("יש לבחור ליד ולפחות נכס אחד.");
                return;
              }
              createMutation.mutate({ leadId, propertyIds: selectedPropertyIds, note: null });
            }}
            disabled={createMutation.isPending}
            className="rounded-full bg-[#d9ae4c] text-black hover:bg-[#c99a31]"
          >
            שמור התאמות
          </Button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-black text-slate-950">התאמות קיימות</h2>
        <div className="mt-4 space-y-3">
          {(matchesQuery.data ?? []).map((match) => (
            <div key={match.id} className="rounded-xl border border-slate-200 bg-[#faf8f1] p-3">
              <p className="text-sm font-black text-slate-800">{leadsById.get(match.leadId)?.name ?? `ליד #${match.leadId}`}</p>
              {leadLocation(leadsById.get(match.leadId)) ? (
                <p className="mt-1 text-xs font-bold text-[#b98b2f]">{leadLocation(leadsById.get(match.leadId))}</p>
              ) : null}
              <p className="mt-1 text-xs text-slate-600">נכס #{match.propertyId}</p>
              <p className="mt-1 text-xs text-slate-600">סטטוס: {match.status}</p>
              <div className="mt-2">
                <Button
                  size="sm"
                  onClick={() => sendMutation.mutate({ matchId: match.id, message: message || undefined })}
                  disabled={sendMutation.isPending}
                  className="rounded-full bg-[#d9ae4c] text-black hover:bg-[#c99a31]"
                >
                  שלח ב-WhatsApp
                </Button>
              </div>
            </div>
          ))}
          {!(matchesQuery.data ?? []).length ? <p className="text-sm text-slate-500">אין התאמות שמורות.</p> : null}
        </div>
      </section>
    </CrmLayout>
  );
}
