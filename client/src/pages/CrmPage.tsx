import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AgentLayout from "@/components/AgentLayout";
import {
  Check,
  Phone,
  Plus,
  Pencil,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type Lead = {
  id: number;
  agentId: number | null;
  name: string;
  phone: string;
  email: string | null;
  neighborhood: string | null;
  notes: string | null;
  tags: string;
  leadStatus: "חדש" | "פעיל" | "סגור" | "לא רלוונטי";
  source: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type FormState = {
  name: string;
  phone: string;
  email: string;
  neighborhood: string;
  notes: string;
  tags: string;
  leadStatus: "חדש" | "פעיל" | "סגור" | "לא רלוונטי";
  source: string;
  agentId: number | null;
};

const ALL_TAGS = ["בלעדי", "קונה", "מוכר", "שכירות", "buyer", "seller", "past_client"] as const;

const STATUS_OPTIONS = ["חדש", "פעיל", "סגור", "לא רלוונטי"] as const;

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  "חדש":         { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-400" },
  "פעיל":        { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  "סגור":        { bg: "bg-slate-100",  text: "text-slate-500",   dot: "bg-slate-400" },
  "לא רלוונטי": { bg: "bg-red-50",    text: "text-red-500",     dot: "bg-red-400" },
};

const TAG_STYLE: Record<string, string> = {
  "בלעדי":     "bg-purple-100 text-purple-700",
  "קונה":      "bg-sky-100 text-sky-700",
  "buyer":     "bg-sky-100 text-sky-700",
  "מוכר":      "bg-amber-100 text-amber-700",
  "seller":    "bg-amber-100 text-amber-700",
  "שכירות":    "bg-teal-100 text-teal-700",
  "past_client": "bg-rose-100 text-rose-600",
};

function emptyForm(currentAgentId: number): FormState {
  return { name: "", phone: "", email: "", neighborhood: "", notes: "", tags: "", leadStatus: "חדש", source: "", agentId: currentAgentId };
}

// ─── Tag pills ────────────────────────────────────────────────────────────────

function TagPills({ tags }: { tags: string }) {
  const list = tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
  if (!list.length) return <span className="text-slate-300 text-xs">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {list.slice(0, 3).map((tag) => (
        <span key={tag} className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${TAG_STYLE[tag] ?? "bg-slate-100 text-slate-600"}`}>
          {tag}
        </span>
      ))}
      {list.length > 3 && <span className="text-[11px] text-slate-400">+{list.length - 3}</span>}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

// ─── Tag selector ─────────────────────────────────────────────────────────────

function TagSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const selected = value ? value.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const DISPLAY_TAGS = ["בלעדי", "קונה", "מוכר", "שכירות"];
  function toggle(tag: string) {
    const next = selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag];
    onChange(next.join(","));
  }
  return (
    <div className="flex flex-wrap gap-2">
      {DISPLAY_TAGS.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => toggle(tag)}
          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            selected.includes(tag) ? `${TAG_STYLE[tag] ?? "bg-slate-100 text-slate-600"} border-transparent` : "border-slate-200 text-slate-500 hover:border-slate-400"
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

// ─── Lead modal ───────────────────────────────────────────────────────────────

function LeadModal({
  initial, agents, isAdmin, currentAgentId, onClose, onSave,
}: {
  initial?: Lead | null;
  agents: Array<{ id: number; name: string }>;
  isAdmin: boolean;
  currentAgentId: number;
  onClose: () => void;
  onSave: (data: FormState) => void;
}) {
  const [form, setForm] = useState<FormState>(() =>
    initial
      ? { name: initial.name, phone: initial.phone, email: initial.email ?? "", neighborhood: initial.neighborhood ?? "", notes: initial.notes ?? "", tags: initial.tags ?? "", leadStatus: initial.leadStatus, source: initial.source ?? "", agentId: initial.agentId }
      : emptyForm(currentAgentId)
  );

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">{initial ? "עריכת ליד" : "ליד חדש"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">שם מלא *</label>
              <Input value={form.name} onChange={field("name")} placeholder="ישראל ישראלי" className="rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">טלפון *</label>
              <Input value={form.phone} onChange={field("phone")} placeholder="05X-XXXXXXX" dir="ltr" className="rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">אימייל</label>
              <Input value={form.email} onChange={field("email")} placeholder="email@example.com" dir="ltr" className="rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">שכונה</label>
              <Input value={form.neighborhood} onChange={field("neighborhood")} placeholder="גילה, קטמונים..." className="rounded-xl" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">תגיות</label>
            <TagSelector value={form.tags} onChange={(v) => setForm((f) => ({ ...f, tags: v }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">סטטוס</label>
              <select value={form.leadStatus} onChange={field("leadStatus")} className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300">
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">מקור</label>
              <Input value={form.source} onChange={field("source")} placeholder="יד2, פייסבוק..." className="rounded-xl" />
            </div>
          </div>
          {isAdmin && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">סוכן אחראי</label>
              <select value={form.agentId ?? ""} onChange={(e) => setForm((f) => ({ ...f, agentId: e.target.value ? Number(e.target.value) : null }))} className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300">
                <option value="">— ללא סוכן —</option>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">הערות</label>
            <textarea value={form.notes} onChange={field("notes")} rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300" placeholder="פרטים נוספים על הליד..." />
          </div>
        </div>

        <div className="flex gap-2 px-6 py-4 border-t border-slate-100 justify-end">
          <Button variant="outline" onClick={onClose} className="rounded-full font-bold">ביטול</Button>
          <Button
            disabled={!form.name.trim() || !form.phone.trim()}
            onClick={() => onSave(form)}
            className="rounded-full bg-[#d9ae4c] hover:bg-[#c99a31] text-white font-black"
          >
            <Check size={15} />
            {initial ? "שמור שינויים" : "הוסף ליד"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main CRM Page ────────────────────────────────────────────────────────────

export default function CrmPage() {
  const { data: agent } = trpc.agent.me.useQuery();
  const isAdmin = agent?.accountRole === "admin";

  const [search, setSearch] = useState("");
  const [filterAgentId, setFilterAgentId] = useState<number | undefined>(undefined);
  const [filterTag, setFilterTag] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const agentsQuery = trpc.admin.listStaff.useQuery(undefined, { enabled: !!isAdmin });
  const agents = (agentsQuery.data ?? []) as Array<{ id: number; name: string; accountRole: string }>;

  const leadsQuery = trpc.crm.list.useQuery({
    search: search || undefined,
    agentId: isAdmin ? filterAgentId : undefined,
  });
  const leads = (leadsQuery.data ?? []) as Lead[];

  const utils = trpc.useUtils();

  const createMutation = trpc.crm.create.useMutation({
    onSuccess: () => { utils.crm.list.invalidate(); setModalOpen(false); toast.success("ליד נוסף"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.crm.update.useMutation({
    onSuccess: () => { utils.crm.list.invalidate(); setEditingLead(null); setModalOpen(false); toast.success("ליד עודכן"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.crm.delete.useMutation({
    onSuccess: () => { utils.crm.list.invalidate(); setDeletingId(null); toast.success("ליד נמחק"); },
    onError: (e) => toast.error(e.message),
  });

  function handleSave(form: FormState) {
    const payload = { name: form.name, phone: form.phone, email: form.email || null, neighborhood: form.neighborhood || null, notes: form.notes || null, tags: form.tags, leadStatus: form.leadStatus, source: form.source || null, agentId: form.agentId };
    if (editingLead) updateMutation.mutate({ id: editingLead.id, ...payload });
    else createMutation.mutate(payload);
  }

  const filtered = leads.filter((lead) => {
    if (filterTag && !lead.tags.includes(filterTag)) return false;
    if (filterStatus && lead.leadStatus !== filterStatus) return false;
    return true;
  });

  // Stats
  const total = filtered.length;
  const countNew    = filtered.filter((l) => l.leadStatus === "חדש").length;
  const countActive = filtered.filter((l) => l.leadStatus === "פעיל").length;
  const countClosed = filtered.filter((l) => l.leadStatus === "סגור").length;

  const agentName = (id: number | null) => {
    if (!id) return "—";
    return agents.find((a) => a.id === id)?.name ?? `#${id}`;
  };

  return (
    <AgentLayout>
      <div className="min-h-screen bg-[#f8f6f0] px-4 py-6 md:px-8 md:py-8" dir="rtl">
        <div className="mx-auto max-w-7xl">

          {/* ── Header ──────────────────────────────────────────── */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#d9ae4c]">CRM</p>
              <h1 className="mt-1 text-3xl font-black text-slate-900">לידים</h1>
              <p className="mt-1 text-sm text-slate-500">
                {isAdmin ? "כל לידי הצוות" : "הלידים שלי"} — {total} רשומות
              </p>
            </div>
            <Button
              onClick={() => { setEditingLead(null); setModalOpen(true); }}
              className="rounded-full bg-[#d9ae4c] hover:bg-[#c99a31] text-white font-black h-11 px-6 shadow-md shadow-amber-200/50"
            >
              <Plus size={16} />
              ליד חדש
            </Button>
          </div>

          {/* ── Stats ───────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: "סה״כ",   value: total,       color: "text-slate-800", bg: "bg-white" },
              { label: "חדשים",  value: countNew,    color: "text-blue-600",  bg: "bg-blue-50" },
              { label: "פעילים", value: countActive, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "סגורים", value: countClosed, color: "text-slate-500",  bg: "bg-slate-100" },
            ].map((s) => (
              <div key={s.label} className={`rounded-2xl ${s.bg} border border-white/80 p-4 shadow-sm`}>
                <p className="text-xs font-bold text-slate-500">{s.label}</p>
                <p className={`text-3xl font-black mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* ── Filters ─────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-44">
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="חיפוש לפי שם, טלפון, שכונה..."
                  className="w-full h-10 pr-9 pl-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-slate-50"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
              >
                <option value="">כל הסטטוסים</option>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
              >
                <option value="">כל התגיות</option>
                {ALL_TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {isAdmin && (
                <select
                  value={filterAgentId ?? ""}
                  onChange={(e) => setFilterAgentId(e.target.value ? Number(e.target.value) : undefined)}
                  className="h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  <option value="">כל הסוכנים</option>
                  {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* ── Table ───────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {leadsQuery.isLoading ? (
              <div className="p-16 text-center text-slate-400">
                <div className="inline-block size-8 rounded-full border-2 border-[#d9ae4c] border-t-transparent animate-spin mb-3" />
                <p className="text-sm font-medium">טוען לידים...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-16 text-center text-slate-400">
                <User size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-bold text-slate-600">אין לידים להצגה</p>
                <button
                  onClick={() => { setEditingLead(null); setModalOpen(true); }}
                  className="mt-3 text-sm text-[#d9ae4c] font-bold hover:underline"
                >
                  הוסף ליד ראשון +
                </button>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-right px-5 py-3.5 font-black text-slate-500 text-xs uppercase tracking-wide">שם</th>
                        <th className="text-right px-5 py-3.5 font-black text-slate-500 text-xs uppercase tracking-wide">טלפון</th>
                        <th className="text-right px-5 py-3.5 font-black text-slate-500 text-xs uppercase tracking-wide">שכונה</th>
                        <th className="text-right px-5 py-3.5 font-black text-slate-500 text-xs uppercase tracking-wide">תגיות</th>
                        <th className="text-right px-5 py-3.5 font-black text-slate-500 text-xs uppercase tracking-wide">סטטוס</th>
                        {isAdmin && <th className="text-right px-5 py-3.5 font-black text-slate-500 text-xs uppercase tracking-wide">סוכן</th>}
                        <th className="text-right px-5 py-3.5 font-black text-slate-500 text-xs uppercase tracking-wide">הערות</th>
                        <th className="px-5 py-3.5 w-20" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filtered.map((lead) => (
                        <tr key={lead.id} className="hover:bg-[#fffdf8] transition-colors group">
                          <td className="px-5 py-4 font-bold text-slate-900">{lead.name}</td>
                          <td className="px-5 py-4">
                            <a
                              href={`tel:${lead.phone}`}
                              className="inline-flex items-center gap-1.5 font-bold text-[#d9ae4c] hover:text-[#b98b2f] transition-colors"
                              dir="ltr"
                            >
                              <Phone size={13} />
                              {lead.phone}
                            </a>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {lead.neighborhood || <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-5 py-4">
                            <TagPills tags={lead.tags} />
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={lead.leadStatus} />
                          </td>
                          {isAdmin && (
                            <td className="px-5 py-4 text-slate-500 text-xs font-medium">{agentName(lead.agentId)}</td>
                          )}
                          <td className="px-5 py-4 text-slate-500 max-w-[180px]">
                            <p className="truncate text-xs">{lead.notes || "—"}</p>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                              <button
                                onClick={() => { setEditingLead(lead); setModalOpen(true); }}
                                className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
                                title="ערוך"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => setDeletingId(lead.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                title="מחק"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-slate-50">
                  {filtered.map((lead) => (
                    <div key={lead.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-900 text-base truncate">{lead.name}</p>
                          <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1 text-[#d9ae4c] font-bold text-sm mt-0.5" dir="ltr">
                            <Phone size={12} />
                            {lead.phone}
                          </a>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <StatusBadge status={lead.leadStatus} />
                          <div className="flex gap-1">
                            <button onClick={() => { setEditingLead(lead); setModalOpen(true); }} className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => setDeletingId(lead.id)} className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-2 items-center">
                        {lead.neighborhood && (
                          <span className="text-xs text-slate-500 bg-slate-100 rounded-lg px-2 py-0.5">{lead.neighborhood}</span>
                        )}
                        <TagPills tags={lead.tags} />
                        {isAdmin && lead.agentId && (
                          <span className="text-xs text-slate-400 bg-slate-50 rounded-lg px-2 py-0.5">
                            {agentName(lead.agentId)}
                          </span>
                        )}
                      </div>
                      {lead.notes && (
                        <p className="mt-2 text-xs text-slate-400 truncate">{lead.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer count */}
          {filtered.length > 0 && (
            <p className="mt-3 text-center text-xs text-slate-400">{filtered.length} לידים מוצגים</p>
          )}
        </div>
      </div>

      {/* ── Add/Edit modal ──────────────────────────────────────── */}
      {modalOpen && (
        <LeadModal
          initial={editingLead}
          agents={agents.map((a) => ({ id: a.id, name: a.name }))}
          isAdmin={isAdmin ?? false}
          currentAgentId={agent?.id ?? 0}
          onClose={() => { setModalOpen(false); setEditingLead(null); }}
          onSave={handleSave}
        />
      )}

      {/* ── Delete confirmation ─────────────────────────────────── */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center" dir="rtl">
            <div className="size-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-400" />
            </div>
            <h3 className="font-black text-lg text-slate-900 mb-1">למחוק את הליד?</h3>
            <p className="text-slate-500 text-sm mb-6">פעולה זו אינה ניתנת לביטול.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setDeletingId(null)} className="rounded-full font-bold">ביטול</Button>
              <Button
                className="rounded-full bg-red-500 text-white hover:bg-red-600 font-black"
                onClick={() => deleteMutation.mutate({ id: deletingId })}
                disabled={deleteMutation.isPending}
              >
                כן, מחק
              </Button>
            </div>
          </div>
        </div>
      )}
    </AgentLayout>
  );
}
