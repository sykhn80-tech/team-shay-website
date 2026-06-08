import CrmLayout from "@/components/CrmLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { leadLabel } from "@/lib/lead-display";
import { CrmSearchSelect } from "@/components/CrmSearchSelect";

export default function CrmFinance() {
  const utils = trpc.useUtils();
  const entriesQuery = trpc.crm2.finance.list.useQuery();
  const summaryQuery = trpc.crm2.finance.summary.useQuery();
  const leadsQuery = trpc.crm.list.useQuery({ search: undefined, agentId: undefined });

  const [type, setType] = useState<"income" | "expense">("income");
  const [category, setCategory] = useState("עמלה");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [leadId, setLeadId] = useState<number | null>(null);

  const createMutation = trpc.crm2.finance.create.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.crm2.finance.list.invalidate(),
        utils.crm2.finance.summary.invalidate(),
      ]);
      setAmount("");
      setDescription("");
      setLeadId(null);
      toast.success("רשומה נשמרה.");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <CrmLayout title="הכנסות והוצאות" subtitle="ניהול פיננסי לסוכן: עמלות, פרסום, נסיעות והוצאות תפעול.">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-black text-slate-950">סיכום</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-[#f8f6f1] p-3">
            <p className="text-sm font-black text-slate-600">הכנסות החודש</p>
            <p className="mt-1 text-2xl font-black text-slate-950">₪{(summaryQuery.data?.income ?? 0).toLocaleString("he-IL")}</p>
          </div>
          <div className="rounded-xl bg-[#f8f6f1] p-3">
            <p className="text-sm font-black text-slate-600">הוצאות החודש</p>
            <p className="mt-1 text-2xl font-black text-slate-950">₪{(summaryQuery.data?.expense ?? 0).toLocaleString("he-IL")}</p>
          </div>
          <div className="rounded-xl bg-[#f8f6f1] p-3">
            <p className="text-sm font-black text-slate-600">רווח</p>
            <p className="mt-1 text-2xl font-black text-[#b98b2f]">₪{(summaryQuery.data?.profit ?? 0).toLocaleString("he-IL")}</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-black text-slate-950">+ הוסף רשומה</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <CrmSearchSelect value={type} onChange={value => setType((value ?? "income") as "income" | "expense")} isClearable={false}
            options={[{ value: "income", label: "הכנסה" }, { value: "expense", label: "הוצאה" }]} />
          <input value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-xl border border-slate-200 px-3" />
          <input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="סכום" className="h-11 rounded-xl border border-slate-200 px-3" />
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-11 rounded-xl border border-slate-200 px-3" />
          <CrmSearchSelect value={leadId} onChange={value => setLeadId(value == null ? null : Number(value))} placeholder="ללא שיוך ללקוח"
            options={(leadsQuery.data ?? []).map(lead => ({ value: lead.id, label: leadLabel(lead) }))} />
          <Button
            onClick={() => {
              const numericAmount = Number(amount);
              if (!category.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
                toast.error("יש להזין קטגוריה וסכום תקין.");
                return;
              }
              createMutation.mutate({
                type,
                category: category.trim(),
                amount: numericAmount,
                date,
                description: description || null,
                propertyId: null,
                leadId,
              });
            }}
            className="h-11 rounded-xl bg-[#d9ae4c] text-black hover:bg-[#c99a31]"
          >
            שמור
          </Button>
        </div>
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="תיאור (אופציונלי)"
          className="mt-3 h-11 w-full rounded-xl border border-slate-200 px-3"
        />
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-black text-slate-950">טבלת פעולות</h2>
        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-right">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-slate-500">
                <th className="px-3 py-2">תאריך</th>
                <th className="px-3 py-2">סוג</th>
                <th className="px-3 py-2">קטגוריה</th>
                <th className="px-3 py-2">סכום</th>
                <th className="px-3 py-2">תיאור</th>
                <th className="px-3 py-2">לקוח / רחוב</th>
              </tr>
            </thead>
            <tbody>
              {(entriesQuery.data ?? []).map((entry) => (
                <tr key={entry.id} className="border-b border-slate-100 text-sm">
                  <td className="px-3 py-2">{new Date(entry.date).toLocaleDateString("he-IL")}</td>
                  <td className="px-3 py-2">{entry.type === "income" ? "הכנסה" : "הוצאה"}</td>
                  <td className="px-3 py-2">{entry.category}</td>
                  <td className="px-3 py-2 font-black">₪{entry.amount.toLocaleString("he-IL")}</td>
                  <td className="px-3 py-2">{entry.description ?? "-"}</td>
                  <td className="px-3 py-2 font-bold text-[#b98b2f]">{entry.leadId ? leadLabel((leadsQuery.data ?? []).find((lead) => lead.id === entry.leadId)) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!(entriesQuery.data ?? []).length ? <p className="mt-4 text-sm text-slate-500">אין רשומות להצגה.</p> : null}
        </div>
      </section>
    </CrmLayout>
  );
}
