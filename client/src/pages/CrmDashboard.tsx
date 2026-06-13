import { Link } from "wouter";
import { AlertTriangle, ArrowDown, ArrowUp, Clock3, Handshake, Home, KeyRound, Receipt, UserCheck, UserPlus, Users } from "lucide-react";
import CrmLayout from "@/components/CrmLayout";
import { trpc } from "@/lib/trpc";
import { leadLocation } from "@/lib/lead-display";
import { leadTypeLabel, normalizeLeadType } from "@/lib/crm-options";

const DAY = 86_400_000;

function relativeTime(value: Date | string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / DAY));
  if (days === 0) return "היום";
  if (days === 1) return "אתמול";
  if (days < 7) return `לפני ${days} ימים`;
  return `לפני ${Math.max(1, Math.round(days / 7))} שבועות`;
}

function StatCard({
  label,
  value,
  icon: Icon,
  change,
  color = "bg-[#fff8e6] text-[#b98b2f]",
}: {
  label: string;
  value: string | number;
  icon: typeof Users;
  change?: number;
  color?: string;
}) {
  const positive = (change ?? 0) >= 0;
  return (
    <article className="rounded-[24px] border border-[#d4af37]/25 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <span className={`flex size-11 items-center justify-center rounded-2xl ${color}`}><Icon className="size-5" /></span>
        {change !== undefined ? (
          <span className={`inline-flex items-center gap-1 text-xs font-black ${positive ? "text-emerald-600" : "text-red-600"}`}>
            {positive ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
            {Math.abs(change)}%
          </span>
        ) : null}
      </div>
      <p className="mt-5 text-sm font-black text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
    </article>
  );
}

export default function CrmDashboard() {
  const agentQuery = trpc.agent.me.useQuery();
  const leadsQuery = trpc.crm.list.useQuery({ search: undefined, agentId: undefined });
  const tasksQuery = trpc.crm2.tasks.list.useQuery();
  const followupsQuery = trpc.crm2.followups.list.useQuery();
  const financeSummaryQuery = trpc.crm2.finance.summary.useQuery();

  const leads = leadsQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];
  const followups = followupsQuery.data ?? [];
  const financeSummary = financeSummaryQuery.data;
  const now = new Date();
  const startThisWeek = new Date(now.getTime() - 7 * DAY);
  const startLastWeek = new Date(now.getTime() - 14 * DAY);
  const weekFromNow = new Date(now.getTime() + 7 * DAY);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * DAY);

  const newThisWeek = leads.filter((lead) => new Date(lead.createdAt) >= startThisWeek).length;
  const newLastWeek = leads.filter((lead) => {
    const created = new Date(lead.createdAt);
    return created >= startLastWeek && created < startThisWeek;
  }).length;
  const weeklyChange = newLastWeek ? Math.round(((newThisWeek - newLastWeek) / newLastWeek) * 100) : newThisWeek ? 100 : 0;
  const activeExclusivities = leads.filter((lead) => normalizeLeadType(lead.leadType) === "exclusive" && lead.leadStatus !== "סגור").length;
  const buyers = leads.filter((lead) => ["buyer", "buyer_and_seller"].includes(normalizeLeadType(lead.leadType))).length;
  const sellers = leads.filter((lead) => ["seller", "buyer_and_seller"].includes(normalizeLeadType(lead.leadType))).length;
  const agreements = leads.filter((lead) => normalizeLeadType(lead.leadType) === "agreement").length;
  const rentals = leads.filter((lead) => normalizeLeadType(lead.leadType) === "rental").length;
  const pastClients = leads.filter((lead) => normalizeLeadType(lead.leadType) === "past_client").length;
  const referrals = leads.filter((lead) => /הפניה|referral/i.test(lead.source ?? "")).length;
  const potentialCommission = leads.reduce((sum, lead) => sum + Math.round(Number(lead.marketingPrice ?? lead.askingPrice ?? 0) * 0.02), 0);
  const waitingForCare = leads.filter((lead) => lead.leadStatus === "חדש" && Date.now() - new Date(lead.createdAt).getTime() > 3 * DAY).length;
  const upcomingExpirations = leads
    .filter((lead) => {
      if (normalizeLeadType(lead.leadType) !== "exclusive" || !lead.exclusivityEndDate) return false;
      const expiration = new Date(lead.exclusivityEndDate);
      return expiration >= now && expiration <= thirtyDaysFromNow;
    })
    .sort((left, right) => new Date(left.exclusivityEndDate!).getTime() - new Date(right.exclusivityEndDate!).getTime());

  const leadsById = new Map(leads.map((lead) => [lead.id, lead]));
  const followupsThisWeek = followups.filter((item) => {
    const date = new Date(item.scheduledDate);
    return date >= now && date <= weekFromNow && item.status === "pending";
  });
  const urgentTasks = tasks.filter((item) => item.status !== "done" && item.priority === "high");
  const bars = (financeSummary?.byMonth ?? []).slice(-6);
  const maxValue = Math.max(1, ...bars.map((item) => Math.max(item.income, item.expense)));

  return (
    <CrmLayout title={`שלום ${agentQuery.data?.name ?? "סוכן"}${agentQuery.data?.accountRole === "admin" ? " (ראש צוות)" : ""}`} subtitle="תמונת מצב חיה של כל פעילות הצוות.">
      <div className="mb-5 flex justify-end">
        <Link href="/agent-dashboard/crm/leads" className="rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-black text-black shadow-sm">ליד חדש +</Link>
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label={'סה"כ לידים'} value={leads.length} icon={Users} color="bg-slate-100 text-slate-700" />
        <StatCard label="קונים" value={buyers} icon={UserCheck} color="bg-blue-100 text-blue-700" />
        <StatCard label="מוכרים" value={sellers} icon={Home} color="bg-purple-100 text-purple-700" />
        <StatCard label="לקוחות בבלעדיות" value={activeExclusivities} icon={KeyRound} color="bg-orange-100 text-orange-700" />
        <StatCard label="הסכמה" value={agreements} icon={Handshake} color="bg-teal-100 text-teal-700" />
        <StatCard label="שכירויות" value={rentals} icon={Home} color="bg-cyan-100 text-cyan-700" />
        <StatCard label="שימור לקוחות" value={pastClients} icon={UserPlus} color="bg-pink-100 text-pink-700" />
        <StatCard label="פוטנציאל עמלות" value={`₪${potentialCommission.toLocaleString("he-IL")}`} icon={Receipt} color="bg-emerald-100 text-emerald-700" />
        <StatCard label="הפניות" value={referrals} icon={Users} color="bg-amber-100 text-amber-700" />
      </section>

      <section className="mt-6 rounded-[24px] border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between"><h2 className="text-xl font-black">משימות פתוחות</h2><Link href="/agent-dashboard/crm/tasks" className="text-sm font-black text-[#9a7319]">כל המשימות</Link></div>
        <div className="mt-4 divide-y divide-slate-100">
          {tasks.filter((task) => task.status !== "done").slice(0, 7).map((task) => (
            <div key={task.id} className="flex items-center justify-between gap-4 py-3">
              <div><p className="font-black text-slate-800">{task.title}</p><p className="mt-1 text-xs font-bold text-[#9a7319]">{task.leadId ? leadsById.get(task.leadId)?.name ?? `ליד #${task.leadId}` : "משימה כללית"}</p></div>
              <span className="text-xs font-bold text-slate-400">{task.dueDate ? new Date(task.dueDate).toLocaleDateString("he-IL") : "ללא תאריך"}</span>
            </div>
          ))}
          {!tasks.some((task) => task.status !== "done") ? <p className="py-4 text-sm text-slate-500">אין משימות פתוחות.</p> : null}
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[24px] border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-orange-500" />
            <h2 className="text-xl font-black text-slate-950">בלעדיות שמסתיימות בקרוב</h2>
          </div>
          <div className="mt-4 space-y-3">
            {upcomingExpirations.map((lead) => {
              const days = Math.max(0, Math.ceil((new Date(lead.exclusivityEndDate!).getTime() - Date.now()) / DAY));
              const color = days < 7 ? "border-red-200 bg-red-50 text-red-700" : days < 14 ? "border-orange-200 bg-orange-50 text-orange-700" : "border-yellow-200 bg-yellow-50 text-yellow-700";
              return (
                <Link key={lead.id} href="/crm" className={`block rounded-2xl border p-4 transition hover:-translate-y-0.5 ${color}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-black">{lead.ownerName || lead.name}</p>
                      <p className="mt-1 text-xs font-bold opacity-75">{lead.propertyStreet || leadLocation(lead) || "ללא רחוב"}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black">{days} ימים נותרו</p>
                      <p className="mt-1 text-xs font-bold opacity-70">{new Date(lead.exclusivityEndDate!).toLocaleDateString("he-IL")}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
            {!upcomingExpirations.length ? <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">אין בלעדיות שמסתיימות ב-30 הימים הקרובים.</p> : null}
          </div>
        </article>

        <article className="rounded-[24px] border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-black text-slate-950">פעילות אחרונה</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {leads.slice(0, 5).map((lead) => (
              <Link key={lead.id} href="/crm" className="flex items-center justify-between gap-4 py-3 transition hover:text-[#b98b2f]">
                <div>
                  <p className="text-sm font-black">{lead.name}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{leadTypeLabel(lead.leadType)} · {leadLocation(lead) || "ללא כתובת"}</p>
                </div>
                <span className="text-xs font-bold text-slate-400">{relativeTime(lead.createdAt)}</span>
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <article className="rounded-[24px] border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-black text-slate-950">פולואפים לשבוע הקרוב</h2>
          <div className="mt-4 space-y-3">
            {followupsThisWeek.slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-[#faf8f1] p-3">
                <p className="text-sm font-black text-slate-800">{leadsById.get(item.leadId)?.name ?? `ליד #${item.leadId}`}</p>
                <p className="mt-1 text-xs text-slate-500">{new Date(item.scheduledDate).toLocaleString("he-IL")}</p>
              </div>
            ))}
            {!followupsThisWeek.length ? <p className="text-sm text-slate-500">אין פולואפים פתוחים לשבוע הקרוב.</p> : null}
          </div>
        </article>
        <article className="rounded-[24px] border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-black text-slate-950">משימות דחופות</h2>
          <div className="mt-4 space-y-3">
            {urgentTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="rounded-xl border border-red-100 bg-red-50 p-3">
                <p className="text-sm font-black text-red-700">{task.title}</p>
                <p className="mt-1 text-sm text-red-600">{task.dueDate ? new Date(task.dueDate).toLocaleDateString("he-IL") : "ללא תאריך יעד"}</p>
              </div>
            ))}
            {!urgentTasks.length ? <p className="text-sm text-slate-500">אין משימות בעדיפות גבוהה כרגע.</p> : null}
          </div>
        </article>
      </section>

      <section className="mt-6 rounded-[24px] border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-black text-slate-950">גרף הכנסות חודשי</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-6">
          {bars.map((item) => (
            <div key={item.month} className="rounded-xl bg-[#f8f6f1] p-3">
              <p className="text-xs font-black text-slate-500">{item.month}</p>
              <div className="mt-2 flex h-24 items-end rounded-lg bg-white p-2">
                <div className="w-full rounded bg-[#d9ae4c]" style={{ height: `${Math.max(6, (item.income / maxValue) * 80)}px` }} />
              </div>
              <p className="mt-2 text-xs font-bold text-slate-600">₪{item.income.toLocaleString("he-IL")}</p>
            </div>
          ))}
        </div>
      </section>
    </CrmLayout>
  );
}
