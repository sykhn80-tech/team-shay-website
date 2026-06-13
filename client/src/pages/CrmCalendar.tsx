import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { toast } from "sonner";
import CrmLayout from "@/components/CrmLayout";
import { Button } from "@/components/ui/button";
import { CrmSearchSelect } from "@/components/CrmSearchSelect";
import { leadLabel } from "@/lib/lead-display";
import { trpc } from "@/lib/trpc";

const DAYS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

function dateKey(date: Date) {
  return date.toLocaleDateString("en-CA");
}

export default function CrmCalendar() {
  const utils = trpc.useUtils();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [newMeeting, setNewMeeting] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [leadId, setLeadId] = useState<number | null>(null);

  const meetingsQuery = trpc.crm2.meetings.list.useQuery();
  const tasksQuery = trpc.crm2.tasks.list.useQuery();
  const leadsQuery = trpc.crm.list.useQuery({ search: undefined, agentId: undefined });
  const createMeeting = trpc.crm2.meetings.create.useMutation({
    onSuccess: async () => {
      await utils.crm2.meetings.list.invalidate();
      setTitle(""); setTime(""); setNotes(""); setLeadId(null); setNewMeeting(false);
      toast.success("הפגישה נשמרה ביומן.");
    },
  });

  const cells = useMemo(() => {
    const firstDay = month.getDay();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array.from({ length: firstDay }, () => null), ...Array.from({ length: daysInMonth }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1))];
  }, [month]);

  const events = useMemo(() => [
    ...(meetingsQuery.data ?? []).map((item) => ({ id: `meeting-${item.id}`, date: item.date, title: item.title, type: "פגישה", time: item.time })),
    ...(tasksQuery.data ?? []).filter((item) => item.dueDate).map((item) => ({ id: `task-${item.id}`, date: String(item.dueDate).slice(0, 10), title: item.title, type: "משימה", time: null })),
  ], [meetingsQuery.data, tasksQuery.data]);

  const selectedEvents = events.filter((event) => event.date === selectedDate);

  return (
    <CrmLayout title="לוח שנה" subtitle="פגישות ומשימות במקום אחד, בתצוגת חודש מלאה.">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-xl border p-2"><ChevronRight className="size-4" /></button>
          <h2 className="min-w-44 text-center text-xl font-black">{month.toLocaleDateString("he-IL", { month: "long", year: "numeric" })}</h2>
          <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-xl border p-2"><ChevronLeft className="size-4" /></button>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setNewMeeting(true)} className="rounded-full bg-[#D4AF37] text-black"><Plus className="size-4" />פגישה חדשה</Button>
          <Button asChild variant="outline" className="rounded-full"><a href="/agent-dashboard/crm/tasks"><Plus className="size-4" />משימה חדשה</a></Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_330px]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-7 bg-slate-50">{DAYS.map((day) => <div key={day} className="p-3 text-center text-xs font-black text-slate-500">{day}</div>)}</div>
          <div className="grid grid-cols-7">
            {cells.map((date, index) => {
              const key = date ? dateKey(date) : `empty-${index}`;
              const dayEvents = date ? events.filter((event) => event.date === key) : [];
              return (
                <button key={key} type="button" disabled={!date} onClick={() => date && setSelectedDate(key)}
                  className={`min-h-28 border-l border-t border-slate-100 p-2 text-right transition ${selectedDate === key ? "bg-[#fff8e6]" : "hover:bg-slate-50"}`}>
                  {date ? <><span className="font-black text-slate-800">{date.getDate()}</span><div className="mt-3 flex flex-wrap gap-1">{dayEvents.map((event) => <span key={event.id} className={`size-2 rounded-full ${event.type === "פגישה" ? "bg-[#D4AF37]" : "bg-blue-500"}`} />)}</div></> : null}
                </button>
              );
            })}
          </div>
        </section>
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black">אירועים ל־{new Date(selectedDate).toLocaleDateString("he-IL")}</h3>
          <div className="mt-4 space-y-3">
            {selectedEvents.map((event) => <div key={event.id} className="rounded-xl border border-[#D4AF37]/30 bg-[#fffdf8] p-3"><p className="text-xs font-black text-[#9a7319]">{event.type}{event.time ? ` · ${event.time}` : ""}</p><p className="mt-1 font-bold">{event.title}</p></div>)}
            {!selectedEvents.length ? <p className="text-sm text-slate-500">אין אירועים ביום זה.</p> : null}
          </div>
        </aside>
      </div>

      {newMeeting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6" dir="rtl">
            <div className="flex items-center justify-between"><h2 className="text-xl font-black">פגישה חדשה</h2><button onClick={() => setNewMeeting(false)}><X /></button></div>
            <div className="mt-5 grid gap-3">
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="כותרת הפגישה" />
              <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
              <input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
              <CrmSearchSelect value={leadId} onChange={(value) => setLeadId(value == null ? null : Number(value))} placeholder="שיוך לליד" options={(leadsQuery.data ?? []).map((lead) => ({ value: lead.id, label: leadLabel(lead) }))} />
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="הערות" rows={3} />
              <Button onClick={() => title.trim() && createMeeting.mutate({ title: title.trim(), date: selectedDate, time: time || null, notes: notes || null, leadId })} className="bg-[#D4AF37] text-black">שמור פגישה</Button>
            </div>
          </div>
        </div>
      ) : null}
    </CrmLayout>
  );
}
