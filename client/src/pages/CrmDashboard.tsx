import CrmLayout from "@/components/CrmLayout";
import { trpc } from "@/lib/trpc";
import { leadLocation } from "@/lib/lead-display";

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <p className="text-sm font-black text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-black text-slate-950">{value}</p>
    </article>
  );
}

export default function CrmDashboard() {
  const leadsQuery = trpc.crm.list.useQuery({ search: undefined, agentId: undefined });
  const tasksQuery = trpc.crm2.tasks.list.useQuery();
  const followupsQuery = trpc.crm2.followups.list.useQuery();
  const financeSummaryQuery = trpc.crm2.finance.summary.useQuery();

  const leads = leadsQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];
  const followups = followupsQuery.data ?? [];
  const financeSummary = financeSummaryQuery.data;
  const leadsById = new Map(leads.map((lead) => [lead.id, lead]));

  const now = new Date();
  const weekFromNow = new Date();
  weekFromNow.setDate(now.getDate() + 7);

  const followupsThisWeek = followups.filter((item) => {
    const date = new Date(item.scheduledDate);
    return date >= now && date <= weekFromNow && item.status === "pending";
  });

  const openTasks = tasks.filter((item) => item.status !== "done");
  const urgentTasks = openTasks.filter((item) => item.priority === "high");

  const bars = (financeSummary?.byMonth ?? []).slice(-6);
  const maxValue = Math.max(1, ...bars.map((item) => Math.max(item.income, item.expense)));

  return (
    <CrmLayout
      title="דשבורד CRM"
      subtitle="מעקב מהיר אחרי לידים, פולואפים, משימות והביצועים הכספיים של החודש."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card label="לידים פעילים" value={leads.filter((item) => item.leadStatus === "פעיל").length} />
        <Card label="משימות פתוחות" value={openTasks.length} />
        <Card label="פולואפים השבוע" value={followupsThisWeek.length} />
        <Card label="הכנסות החודש" value={`₪${(financeSummary?.income ?? 0).toLocaleString("he-IL")}`} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-black text-slate-950">פולואפים להיום/לקרוב</h2>
          <div className="mt-4 space-y-3">
            {followupsThisWeek.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-[#faf8f1] p-3">
                <p className="text-sm font-black text-slate-800">{leadsById.get(item.leadId)?.name ?? `ליד #${item.leadId}`}</p>
                {leadLocation(leadsById.get(item.leadId)) ? (
                  <p className="mt-1 text-xs font-bold text-[#b98b2f]">{leadLocation(leadsById.get(item.leadId))}</p>
                ) : null}
                <p className="mt-1 text-xs text-slate-500">{item.type.toUpperCase()}</p>
                <p className="mt-1 text-sm text-slate-600">{new Date(item.scheduledDate).toLocaleString("he-IL")}</p>
                {item.note ? <p className="mt-1 text-sm text-slate-600">{item.note}</p> : null}
              </div>
            ))}
            {!followupsThisWeek.length ? <p className="text-sm text-slate-500">אין פולואפים פתוחים לשבוע הקרוב.</p> : null}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-black text-slate-950">משימות דחופות</h2>
          <div className="mt-4 space-y-3">
            {urgentTasks.slice(0, 6).map((task) => (
              <div key={task.id} className="rounded-xl border border-red-100 bg-red-50 p-3">
                <p className="text-sm font-black text-red-700">{task.title}</p>
                <p className="mt-1 text-sm text-red-600">{task.dueDate ? new Date(task.dueDate).toLocaleDateString("he-IL") : "ללא תאריך יעד"}</p>
              </div>
            ))}
            {!urgentTasks.length ? <p className="text-sm text-slate-500">אין משימות בעדיפות גבוהה כרגע.</p> : null}
          </div>
        </article>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-black text-slate-950">גרף הכנסות חודשי</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-6">
          {bars.map((item) => (
            <div key={item.month} className="rounded-xl bg-[#f8f6f1] p-3">
              <p className="text-xs font-black text-slate-500">{item.month}</p>
              <div className="mt-2 h-24 rounded-lg bg-white p-2">
                <div
                  className="w-full rounded bg-[#d9ae4c]"
                  style={{ height: `${Math.max(6, (item.income / maxValue) * 80)}px` }}
                />
              </div>
              <p className="mt-2 text-xs font-bold text-slate-600">₪{item.income.toLocaleString("he-IL")}</p>
            </div>
          ))}
          {!bars.length ? <p className="text-sm text-slate-500">אין עדיין נתונים להצגת גרף.</p> : null}
        </div>
      </section>
    </CrmLayout>
  );
}
