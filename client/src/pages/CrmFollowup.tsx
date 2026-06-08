import CrmLayout from "@/components/CrmLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { leadLabel, leadLocation } from "@/lib/lead-display";
import { CrmSearchSelect } from "@/components/CrmSearchSelect";

const typeOptions = [
  { value: "call", label: "שיחה" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "פגישה" },
] as const;

export default function CrmFollowup() {
  const utils = trpc.useUtils();
  const leadsQuery = trpc.crm.list.useQuery({ search: undefined, agentId: undefined });
  const followupsQuery = trpc.crm2.followups.list.useQuery();

  const [leadId, setLeadId] = useState<number | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [type, setType] = useState<(typeof typeOptions)[number]["value"]>("call");
  const [note, setNote] = useState("");

  const createMutation = trpc.crm2.followups.create.useMutation({
    onSuccess: async () => {
      await utils.crm2.followups.list.invalidate();
      setLeadId(null);
      setScheduledDate("");
      setType("call");
      setNote("");
      toast.success("פולואפ נוסף.");
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = trpc.crm2.followups.update.useMutation({
    onSuccess: async () => {
      await utils.crm2.followups.list.invalidate();
      toast.success("סטטוס עודכן.");
    },
    onError: (error) => toast.error(error.message),
  });

  const groupedByDate = useMemo(() => {
    type FollowUpItem = NonNullable<typeof followupsQuery.data>[number];
    const map = new Map<string, FollowUpItem[]>();
    for (const item of followupsQuery.data ?? []) {
      const key = new Date(item.scheduledDate).toLocaleDateString("he-IL");
      const bucket = map.get(key) ?? [];
      bucket.push(item);
      map.set(key, bucket);
    }
    return Array.from(map.entries());
  }, [followupsQuery.data]);

  const leadsById = useMemo(
    () => new Map((leadsQuery.data ?? []).map((lead) => [lead.id, lead])),
    [leadsQuery.data],
  );

  return (
    <CrmLayout title="פולואפ" subtitle="ניהול פולואפים שבועי לפי לידים: שיחות, וואטסאפ, אימייל ופגישות.">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black text-slate-950">+ פולואפ חדש</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <CrmSearchSelect value={leadId} onChange={value => setLeadId(value == null ? null : Number(value))} placeholder="בחר ליד"
            options={(leadsQuery.data ?? []).map(lead => ({ value: lead.id, label: leadLabel(lead) }))} />

          <input
            type="datetime-local"
            value={scheduledDate}
            onChange={(event) => setScheduledDate(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 px-3"
          />

          <CrmSearchSelect value={type} onChange={value => setType((value ?? "call") as (typeof typeOptions)[number]["value"])}
            options={[...typeOptions]} isClearable={false} />

          <Button
            onClick={() => {
              if (!leadId || !scheduledDate) {
                toast.error("יש לבחור ליד ותאריך.");
                return;
              }
              createMutation.mutate({
                leadId,
                scheduledDate: new Date(scheduledDate).toISOString(),
                type,
                note: note || null,
                status: "pending",
              });
            }}
            disabled={createMutation.isPending}
            className="h-11 rounded-xl bg-[#d9ae4c] text-black hover:bg-[#c99a31]"
          >
            הוסף פולואפ
          </Button>
        </div>

        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="הערה לפולואפ (אופציונלי)"
          className="mt-3 min-h-20 w-full rounded-xl border border-slate-200 p-3 text-sm"
        />
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black text-slate-950">פולואפים ממתינים</h2>
        <div className="mt-4 space-y-4">
          {groupedByDate.map(([date, items]) => (
            <div key={date}>
              <p className="text-sm font-black text-[#b98b2f]">{date}</p>
              <div className="mt-2 space-y-2">
                {items?.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 bg-[#faf8f1] p-3">
                    <p className="text-sm font-black text-slate-800">{leadsById.get(item.leadId)?.name ?? `ליד #${item.leadId}`}</p>
                    {leadLocation(leadsById.get(item.leadId)) ? (
                      <p className="mt-1 text-xs font-bold text-[#b98b2f]">{leadLocation(leadsById.get(item.leadId))}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-slate-500">{item.type}</p>
                    {item.note ? <p className="mt-1 text-sm text-slate-600">{item.note}</p> : null}
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateMutation.mutate({ id: item.id, data: { status: "done" } })}
                      >
                        בוצע
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateMutation.mutate({ id: item.id, data: { status: "cancelled" } })}
                      >
                        ביטול
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!groupedByDate.length ? <p className="text-sm text-slate-500">אין פולואפים כרגע.</p> : null}
        </div>
      </section>
    </CrmLayout>
  );
}
