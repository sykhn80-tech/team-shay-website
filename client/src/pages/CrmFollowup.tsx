import { useMemo, useState } from "react";
import { MapPin, Phone, Plus } from "lucide-react";
import { toast } from "sonner";
import CrmLayout from "@/components/CrmLayout";
import { Button } from "@/components/ui/button";
import { leadLocation } from "@/lib/lead-display";
import { trpc } from "@/lib/trpc";

function taskTiming(dueDate?: string | null) {
  if (!dueDate) return { label: "בזמן", className: "bg-emerald-100 text-emerald-700", order: 2 };
  const difference = new Date(dueDate).getTime() - Date.now();
  if (difference < 0) return { label: "אחור", className: "bg-red-100 text-red-700", order: 0 };
  if (difference < 86_400_000) return { label: "איחור", className: "bg-orange-100 text-orange-700", order: 1 };
  return { label: "בזמן", className: "bg-emerald-100 text-emerald-700", order: 2 };
}

export default function CrmFollowup() {
  const utils = trpc.useUtils();
  const leadsQuery = trpc.crm.list.useQuery({ search: undefined, agentId: undefined });
  const tasksQuery = trpc.crm2.tasks.list.useQuery();
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  const createTask = trpc.crm2.tasks.create.useMutation({
    onSuccess: async () => {
      await utils.crm2.tasks.list.invalidate();
      setDrafts({});
      toast.success("המשימה נוספה לליד.");
    },
  });

  const cards = useMemo(() => {
    const leads = new Map((leadsQuery.data ?? []).map((lead) => [lead.id, lead]));
    return (tasksQuery.data ?? [])
      .filter((task) => task.status !== "done" && task.leadId && leads.has(task.leadId))
      .map((task) => ({ task, lead: leads.get(task.leadId!)!, timing: taskTiming(task.dueDate) }))
      .sort((left, right) => left.timing.order - right.timing.order || String(left.task.dueDate ?? "").localeCompare(String(right.task.dueDate ?? "")));
  }, [leadsQuery.data, tasksQuery.data]);

  return (
    <CrmLayout title="פולאפ" subtitle="לידים עם משימות פתוחות, עבוד על כל ליד ועדכן את הסטטוס.">
      <section className="space-y-4">
        {cards.map(({ task, lead, timing }) => (
          <article key={task.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <a href="/agent-dashboard/crm/leads" className="text-lg font-black text-blue-700 hover:underline">{lead.name}</a>
                <div className="mt-2 flex flex-wrap gap-4 text-sm font-bold text-[#9a7319]">
                  <a href={`tel:${lead.phone}`} className="flex items-center gap-1"><Phone className="size-4" />{lead.phone}</a>
                  {leadLocation(lead) ? <span className="flex items-center gap-1"><MapPin className="size-4" />{leadLocation(lead)}</span> : null}
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${timing.className}`}>{timing.label}</span>
            </div>
            <div className="mt-4 rounded-xl bg-[#F8F8F5] p-4">
              <p className="font-black text-slate-800">{task.title}</p>
              {task.dueDate ? <p className="mt-1 text-xs text-slate-500">{new Date(task.dueDate).toLocaleString("he-IL")}</p> : null}
            </div>
            <div className="mt-4 flex gap-2">
              <input value={drafts[lead.id] ?? ""} onChange={(event) => setDrafts((current) => ({ ...current, [lead.id]: event.target.value }))} placeholder="הוסף משימה חדשה לליד זה..." className="flex-1" />
              <Button size="icon" onClick={() => {
                const text = drafts[lead.id]?.trim();
                if (!text) return;
                createTask.mutate({ title: text, description: null, dueDate: null, priority: "medium", status: "open", leadId: lead.id, propertyId: null });
              }} className="bg-[#D4AF37] text-black"><Plus className="size-4" /></Button>
            </div>
          </article>
        ))}
        {!cards.length ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">אין לידים עם משימות פתוחות כרגע.</div> : null}
      </section>
    </CrmLayout>
  );
}
