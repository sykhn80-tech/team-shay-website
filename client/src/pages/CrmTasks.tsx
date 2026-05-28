import CrmLayout from "@/components/CrmLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Status = "open" | "in_progress" | "done";

const columns: Array<{ key: Status; label: string }> = [
  { key: "open", label: "פתוח" },
  { key: "in_progress", label: "בביצוע" },
  { key: "done", label: "הושלם" },
];

export default function CrmTasks() {
  const utils = trpc.useUtils();
  const tasksQuery = trpc.crm2.tasks.list.useQuery();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  const createMutation = trpc.crm2.tasks.create.useMutation({
    onSuccess: async () => {
      await utils.crm2.tasks.list.invalidate();
      setTitle("");
      setPriority("medium");
      toast.success("משימה נוספה.");
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = trpc.crm2.tasks.update.useMutation({
    onSuccess: async () => {
      await utils.crm2.tasks.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const grouped = useMemo(() => {
    type TaskItem = NonNullable<typeof tasksQuery.data>[number];
    const map: Record<Status, TaskItem[]> = {
      open: [],
      in_progress: [],
      done: [],
    };
    for (const task of tasksQuery.data ?? []) {
      map[task.status].push(task);
    }
    return map;
  }, [tasksQuery.data]);

  return (
    <CrmLayout title="משימות" subtitle="לוח קנבן פשוט: פתוח, בביצוע, הושלם.">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black text-slate-950">+ משימה חדשה</h2>
        <div className="mt-3 flex flex-col gap-3 md:flex-row">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="כותרת המשימה"
            className="h-11 flex-1 rounded-xl border border-slate-200 px-3"
          />
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as "low" | "medium" | "high")}
            className="h-11 rounded-xl border border-slate-200 px-3"
          >
            <option value="low">נמוכה</option>
            <option value="medium">בינונית</option>
            <option value="high">גבוהה</option>
          </select>
          <Button
            onClick={() => {
              if (!title.trim()) {
                toast.error("צריך כותרת למשימה.");
                return;
              }
              createMutation.mutate({
                title: title.trim(),
                description: null,
                dueDate: null,
                priority,
                status: "open",
                leadId: null,
                propertyId: null,
              });
            }}
            className="h-11 rounded-xl bg-[#d9ae4c] text-black hover:bg-[#c99a31]"
          >
            הוסף
          </Button>
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-3" dir="ltr">
        {columns.map((column) => (
          <article key={column.key} className="rounded-2xl border border-slate-200 bg-white p-4" dir="rtl">
            <h3 className="text-lg font-black text-slate-950">{column.label}</h3>
            <div className="mt-3 space-y-3">
              {grouped[column.key].map((task) => (
                <div key={task.id} className="rounded-xl border border-slate-200 bg-[#faf8f1] p-3">
                  <p className="text-sm font-black text-slate-800">{task.title}</p>
                  <p className="mt-1 text-xs text-slate-500">עדיפות: {task.priority}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {column.key !== "open" ? (
                      <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: task.id, data: { status: "open" } })}>
                        פתוח
                      </Button>
                    ) : null}
                    {column.key !== "in_progress" ? (
                      <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: task.id, data: { status: "in_progress" } })}>
                        בביצוע
                      </Button>
                    ) : null}
                    {column.key !== "done" ? (
                      <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: task.id, data: { status: "done" } })}>
                        הושלם
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
              {!grouped[column.key].length ? <p className="text-sm text-slate-500">אין פריטים.</p> : null}
            </div>
          </article>
        ))}
      </section>
    </CrmLayout>
  );
}
