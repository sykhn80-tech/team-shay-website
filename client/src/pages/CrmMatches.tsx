import { useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import CrmLayout from "@/components/CrmLayout";
import { CrmSearchSelect } from "@/components/CrmSearchSelect";
import { leadLocation } from "@/lib/lead-display";
import { normalizeLeadType } from "@/lib/crm-options";
import { trpc } from "@/lib/trpc";

export default function CrmMatches() {
  const leadsQuery = trpc.crm.list.useQuery({ search: undefined, agentId: undefined });
  const [sellerId, setSellerId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const leads = leadsQuery.data ?? [];
  const sellers = leads.filter((lead) => ["seller", "exclusive", "buyer_and_seller"].includes(normalizeLeadType(lead.leadType)));
  const selectedSeller = sellers.find((lead) => lead.id === sellerId) ?? null;

  const matches = useMemo(() => {
    if (!selectedSeller) return [];
    const price = Number(selectedSeller.askingPrice ?? selectedSeller.marketingPrice ?? selectedSeller.currentPropertyPrice ?? 0);
    const neighborhood = selectedSeller.propertyNeighborhood ?? selectedSeller.neighborhood ?? "";
    return leads
      .filter((lead) => ["buyer", "buyer_and_seller"].includes(normalizeLeadType(lead.leadType)))
      .map((buyer) => {
        const budget = Number(buyer.budgetMax ?? 0);
        const budgetMatch = Boolean(price && budget >= price * 0.85);
        const areaMatch = Boolean(neighborhood && (buyer.desiredNeighborhoods ?? []).some((area) => area.includes(neighborhood) || neighborhood.includes(area)));
        return { buyer, budgetMatch, areaMatch, score: Number(budgetMatch) + Number(areaMatch) };
      })
      .filter((item) => item.budgetMatch)
      .filter((item) => `${item.buyer.name} ${item.buyer.phone} ${item.buyer.desiredNeighborhoods?.join(" ")}`.toLowerCase().includes(search.toLowerCase()))
      .sort((left, right) => right.score - left.score);
  }, [leads, search, selectedSeller]);

  return (
    <CrmLayout title="התאמות ✨" subtitle="מצא קונים מתאימים לנכסים של מוכרים">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black">חיפוש מוכרים וקונים</h2>
        <p className="mt-1 text-sm text-slate-500">חפש לפי שם, כתובת או שכונה — המערכת תמצא את ההתאמות האוטומטיות</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <CrmSearchSelect value={sellerId} onChange={(value) => setSellerId(value == null ? null : Number(value))} placeholder="בחר מוכר או נכס בבלעדיות" options={sellers.map((lead) => ({ value: lead.id, label: `${lead.ownerName || lead.name} — ${leadLocation(lead) || "ללא כתובת"}` }))} />
          <div className="relative"><Search className="absolute right-3 top-3.5 size-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="חיפוש קונה..." className="w-full pr-9" /></div>
        </div>
      </section>

      {selectedSeller ? (
        <>
          <section className="mt-5 rounded-2xl border border-[#D4AF37]/40 bg-white p-5 shadow-sm">
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-700">מוכר</span>
            <h2 className="mt-3 text-3xl font-black">{selectedSeller.ownerName || selectedSeller.name}</h2>
            <p className="mt-2 font-bold text-slate-500">{leadLocation(selectedSeller) || "ללא כתובת"}</p>
            <p className="mt-3 text-2xl font-black text-[#9a7319]">₪{Number(selectedSeller.askingPrice ?? selectedSeller.marketingPrice ?? selectedSeller.currentPropertyPrice ?? 0).toLocaleString("he-IL")}</p>
            <p className="mt-3 flex items-center gap-2 font-black"><Sparkles className="size-4 text-[#D4AF37]" />{matches.length} קונים מתאימים</p>
          </section>
          <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-500"><tr>{["שם הקונה", "טלפון", "תקציב", "אזור מבוקש", "התאמה"].map((title) => <th key={title} className="px-4 py-3 font-black">{title}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {matches.map(({ buyer, areaMatch }) => <tr key={buyer.id}><td className="px-4 py-4 font-black text-blue-700">{buyer.name}</td><td className="px-4 py-4">{buyer.phone}</td><td className="px-4 py-4 font-black">₪{Number(buyer.budgetMax ?? 0).toLocaleString("he-IL")}</td><td className="px-4 py-4">{buyer.desiredNeighborhoods?.join(", ") || "לא הוזן"}</td><td className="px-4 py-4"><div className="flex gap-2"><span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-black text-blue-700">תקציב מתאים</span>{areaMatch ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-700">אזור תואם</span> : null}</div></td></tr>)}
              </tbody>
            </table>
          </section>
        </>
      ) : null}
    </CrmLayout>
  );
}
