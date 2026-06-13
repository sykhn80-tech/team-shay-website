import { useMemo } from "react";
import { CalendarDays, Phone, UserPlus, Users, Waypoints } from "lucide-react";
import CrmLayout from "@/components/CrmLayout";
import { trpc } from "@/lib/trpc";

const activities = [
  { key: "meetings", label: "פגישות", icon: CalendarDays, color: "bg-blue-100 text-blue-700" },
  { key: "buyer_tours", label: "סיורי קונים", icon: Users, color: "bg-emerald-100 text-emerald-700" },
  { key: "calls", label: "שיחות", icon: Phone, color: "bg-purple-100 text-purple-700" },
  { key: "followups", label: "פולאפים", icon: Waypoints, color: "bg-orange-100 text-orange-700" },
  { key: "recruitments", label: "גיוסים", icon: UserPlus, color: "bg-pink-100 text-pink-700" },
] as const;

function localDate(date = new Date()) {
  return date.toLocaleDateString("en-CA");
}

export default function CrmGoals() {
  const utils = trpc.useUtils();
  const activityQuery = trpc.crm2.activity.list.useQuery();
  const adjustMutation = trpc.crm2.activity.adjust.useMutation({
    onSuccess: () => utils.crm2.activity.list.invalidate(),
  });

  const totals = useMemo(() => {
    const now = new Date();
    const today = localDate(now);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const monthStart = `${today.slice(0, 7)}-01`;

    return new Map(activities.map((activity) => {
      const rows = (activityQuery.data ?? []).filter((item) => item.activityType === activity.key);
      return [activity.key, {
        today: rows.filter((item) => item.date === today).reduce((sum, item) => sum + item.count, 0),
        week: rows.filter((item) => item.date >= localDate(weekStart) && item.date <= today).reduce((sum, item) => sum + item.count, 0),
        month: rows.filter((item) => item.date >= monthStart && item.date <= today).reduce((sum, item) => sum + item.count, 0),
      }];
    }));
  }, [activityQuery.data]);

  return (
    <CrmLayout
      title="סדנת יעדים"
      subtitle={`${new Date().toLocaleDateString("he-IL")} · הנתונים מצטברים אוטומטית בחצות כל יום ולשבוע ולחודש הנוכחי.`}
    >
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.4fr_repeat(3,1fr)] border-b border-slate-200 bg-slate-50 px-5 py-4 text-sm font-black text-slate-500">
          <span>פעילות</span><span className="text-center">היום</span><span className="text-center">השבוע</span><span className="text-center">החודש</span>
        </div>
        {activities.map(({ key, label, icon: Icon, color }) => {
          const activity = totals.get(key) ?? { today: 0, week: 0, month: 0 };
          return (
            <div key={key} className="grid grid-cols-[1.4fr_repeat(3,1fr)] items-center border-b border-slate-100 px-5 py-5 last:border-0">
              <div className="flex items-center gap-3">
                <span className={`flex size-11 items-center justify-center rounded-xl ${color}`}><Icon className="size-5" /></span>
                <span className="font-black text-slate-900">{label}</span>
              </div>
              {(["today", "week", "month"] as const).map((period) => (
                <div key={period} className="text-center">
                  <p className="text-3xl font-black text-slate-950">{activity[period]}</p>
                  <p className="text-[11px] font-bold text-slate-400">מצטבר</p>
                  {period === "today" ? (
                    <div className="mt-2 flex justify-center gap-2">
                      {[-1, 1].map((delta) => (
                        <button
                          key={delta}
                          type="button"
                          onClick={() => adjustMutation.mutate({ activityType: key, date: localDate(), delta })}
                          className="flex size-7 items-center justify-center rounded-full border border-[#D4AF37] text-sm font-black text-[#9a7319] hover:bg-[#D4AF37] hover:text-black"
                        >
                          {delta > 0 ? "+" : "−"}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          );
        })}
      </section>
      <p className="mt-4 text-center text-sm font-bold text-slate-500">הספירה היומית מתאפסת אוטומטית בחצות כל יום.</p>
    </CrmLayout>
  );
}
