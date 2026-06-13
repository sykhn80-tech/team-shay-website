import { useMemo, useState } from "react";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import CrmLayout from "@/components/CrmLayout";
import { Button } from "@/components/ui/button";
import { CrmSearchSelect } from "@/components/CrmSearchSelect";
import { leadLabel } from "@/lib/lead-display";
import { trpc } from "@/lib/trpc";

function statusBadge(task: { status: string; dueDate: string | null }) {
  if (task.status === "done") return { label: "הושלם", style: "bg-slate-100 text-slate-600" };
  if (task.dueDate && new Date(task.dueDate).getTime() < Date.now()) return { label: "אחור", style: "bg-red-100 text-red-700" };
  return { label: "בזמן", style: "bg-emerald-100 text-emerald-700" };
}

export default function CrmTasks() {
  const utils = trpc.useUtils();
  const tasksQuery = trpc.crm2.tasks.list.useQuery();
  const leadsQuery = trpc.crm.list.useQuery({ search: undefined, agentId: undefined });
  const [filter, setFilter] = useState<"open" | "done" | "all">("open");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [leadId, setLeadId] = useState<number | null>(null);

  const createMutation = trpc.crm2.tasks.create.useMutation({
    onSuccess: async () => { await utils.crm2.tasks.list.invalidate(); setTitle(""); setDueDate(""); setLeadId(null); setShowForm(false); toast.success("המשימה נוספה."); },
  });
  const updateMutation = trpc.crm2.tasks.update.useMutation({ onSuccess: () => utils.crm2.tasks.list.invalidate() });
  const deleteMutation = trpc.crm2.tasks.delete.useMutation({ onSuccess: () => utils.crm2.tasks.list.invalidate() });

  const leads = useMemo(() => new Map((leadsQuery.data ?? []).map((lead) => [lead.id, lead])), [leadsQuery.data]);
  const tasks = (tasksQuery.data ?? []).filter((task) => filter === "all" || (filter === "done" ? task.status === "done" : task.status !== "done"));

  return (
    <CrmLayout title="ניהול משימות" subtitle="כל המשימות שלך במקום אחד">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <CrmSearchSelect value={filter} onChange={(value) => setFilter((value ?? "open") as typeof filter)} isClearable={false} options={[{ value: "open", label: "פתוחות" }, { value: "done", label: "הושלמו" }, { value: "all", label: "הכל" }]} />
        <Button onClick={() => setShowForm((current) => !current)} className="rounded-full bg-[#D4AF37] text-black"><Plus className="size-4" />משימה חדשה</Button>
      </div>

      {showForm ? (
        <section className="mb-5 rounded-2xl border border-[#D4AF37]/40 bg-white p-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="תיאור המשימה" />
            <input type="datetime-local" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            <CrmSearchSelect value={leadId} onChange={(value) => setLeadId(value == null ? null : Number(value))} placeholder="שיוך לליד" options={(leadsQuery.data ?? []).map((lead) => ({ value: lead.id, label: leadLabel(lead) }))} />
            <CrmSearchSelect value={priority} onChange={(value) => setPriority((value ?? "medium") as typeof priority)} isClearable={false} options={[{ value: "low", label: "נמוכה" }, { value: "medium", label: "בינונית" }, { value: "high", label: "גבוהה" }]} />
          </div>
          <Button onClick={() => title.trim() && createMutation.mutate({ title: title.trim(), description: null, dueDate: dueDate ? new Date(dueDate).toISOString() : null, priority, status: "open", leadId, propertyId: null })} className="mt-4 bg-[#D4AF37] text-black">שמור משימה</Button>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {tasks.map((task) => {
          const badge = statusBadge(task);
          return (
            <div key={task.id} className="flex flex-wrap items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-0">
              <button type="button" onClick={() => updateMutation.mutate({ id: task.id, data: { status: task.status === "done" ? "open" : "done" } })} className={`flex size-6 items-center justify-center rounded-md border ${task.status === "done" ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300"}`}>{task.status === "done" ? <Check className="size-4" /> : null}</button>
              <button type="button" className="min-w-56 flex-1 text-right font-black text-slate-800">{task.title}</button>
              {task.leadId ? <span className="rounded-full bg-[#fff4d8] px-3 py-1 text-xs font-black text-[#9a7319]">{leadLabel(leads.get(task.leadId))}</span> : null}
              <span className={`rounded-full px-3 py-1 text-xs font-black ${badge.style}`}>{badge.label}</span>
              <span className="text-xs text-slate-400">{task.dueDate ? new Date(task.dueDate).toLocaleString("he-IL") : "ללא תאריך"}</span>
              <button type="button" onClick={() => setShowForm(true)} className="text-slate-400 hover:text-[#9a7319]"><Pencil className="size-4" /></button>
              <button type="button" onClick={() => deleteMutation.mutate({ id: task.id })} className="text-red-400 hover:text-red-600"><Trash2 className="size-4" /></button>
            </div>
          );
        })}
        {!tasks.length ? <p className="p-10 text-center text-slate-500">אין משימות להצגה.</p> : null}
      </section>
    </CrmLayout>
  );
}
