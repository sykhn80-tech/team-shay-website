import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Check,
  Phone,
  User,
  MapPin,
  Tag,
  StickyNote,
  ChevronDown,
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

const ALL_TAGS = ["בלעדי", "קונה", "מוכר", "שכירות"] as const;
const STATUS_OPTIONS = ["חדש", "פעיל", "סגור", "לא רלוונטי"] as const;

const STATUS_COLORS: Record<string, string> = {
  "חדש": "bg-blue-100 text-blue-700",
  "פעיל": "bg-green-100 text-green-700",
  "סגור": "bg-slate-100 text-slate-600",
  "לא רלוונטי": "bg-red-100 text-red-500",
};

const TAG_COLORS: Record<string, string> = {
  "בלעדי": "bg-purple-100 text-purple-700",
  "קונה": "bg-sky-100 text-sky-700",
  "מוכר": "bg-amber-100 text-amber-700",
  "שכירות": "bg-teal-100 text-teal-700",
};

// ─── Empty form ───────────────────────────────────────────────────────────────

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

function emptyForm(): FormState {
  return {
    name: "",
    phone: "",
    email: "",
    neighborhood: "",
    notes: "",
    tags: "",
    leadStatus: "חדש",
    source: "",
    agentId: null,
  };
}

// ─── Tag pills ────────────────────────────────────────────────────────────────

function TagPills({ tags }: { tags: string }) {
  const list = tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
  if (list.length === 0) return <span className="text-slate-400 text-xs">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {list.map((tag) => (
        <span
          key={tag}
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${TAG_COLORS[tag] ?? "bg-slate-100 text-slate-600"}`}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

// ─── Tag selector ─────────────────────────────────────────────────────────────

function TagSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const selected = value ? value.split(",").map((t) => t.trim()).filter(Boolean) : [];

  function toggle(tag: string) {
    const next = selected.includes(tag)
      ? selected.filter((t) => t !== tag)
      : [...selected, tag];
    onChange(next.join(","));
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_TAGS.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => toggle(tag)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
            selected.includes(tag)
              ? `${TAG_COLORS[tag]} border-transparent`
              : "border-slate-200 text-slate-500 hover:border-slate-400"
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

// ─── Lead form modal ──────────────────────────────────────────────────────────

function LeadModal({
  initial,
  agents,
  isAdmin,
  currentAgentId,
  onClose,
  onSave,
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
      ? {
          name: initial.name,
          phone: initial.phone,
          email: initial.email ?? "",
          neighborhood: initial.neighborhood ?? "",
          notes: initial.notes ?? "",
          tags: initial.tags ?? "",
          leadStatus: initial.leadStatus,
          source: initial.source ?? "",
          agentId: initial.agentId,
        }
      : { ...emptyForm(), agentId: currentAgentId }
  );

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-lg">{initial ? "עריכת ליד" : "ליד חדש"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Name + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">שם מלא *</label>
              <Input value={form.name} onChange={field("name")} placeholder="ישראל ישראלי" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">טלפון *</label>
              <Input value={form.phone} onChange={field("phone")} placeholder="05X-XXXXXXX" dir="ltr" />
            </div>
          </div>

          {/* Email + Neighborhood */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">אימייל</label>
              <Input value={form.email} onChange={field("email")} placeholder="email@example.com" dir="ltr" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">שכונה</label>
              <Input value={form.neighborhood} onChange={field("neighborhood")} placeholder="גילה, קטמונים..." />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-2 block">תגיות</label>
            <TagSelector value={form.tags} onChange={(v) => setForm((f) => ({ ...f, tags: v }))} />
          </div>

          {/* Status + Source */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">סטטוס</label>
              <select
                value={form.leadStatus}
                onChange={field("leadStatus")}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">מקור</label>
              <Input value={form.source} onChange={field("source")} placeholder="יד2, פייסבוק..." />
            </div>
          </div>

          {/* Agent (admin only) */}
          {isAdmin && (
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">סוכן אחראי</label>
              <select
                value={form.agentId ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, agentId: e.target.value ? Number(e.target.value) : null }))}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white"
              >
                <option value="">— ללא סוכן —</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">הערות</label>
            <textarea
              value={form.notes}
              onChange={field("notes")}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="פרטים נוספים על הליד..."
            />
          </div>
        </div>

        <div className="flex gap-2 p-5 border-t justify-end">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button
            disabled={!form.name.trim() || !form.phone.trim()}
            onClick={() => onSave(form)}
            className="bg-slate-900 text-white hover:bg-slate-700"
          >
            <Check size={16} className="ml-1" />
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
  const [filterTag, setFilterTag] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const agentsQuery = trpc.admin.listStaff.useQuery(undefined, { enabled: !!isAdmin });
  const agents: Array<{ id: number; name: string; accountRole: string }> = (agentsQuery.data ?? []) as Array<{ id: number; name: string; accountRole: string }>;

  const leadsQuery = trpc.crm.list.useQuery({
    search: search || undefined,
    agentId: isAdmin ? filterAgentId : undefined,
  });

  const leads: Lead[] = (leadsQuery.data ?? []) as Lead[];

  const utils = trpc.useUtils();

  const createMutation = trpc.crm.create.useMutation({
    onSuccess: () => {
      utils.crm.list.invalidate();
      setModalOpen(false);
      toast.success("ליד נוסף בהצלחה");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.crm.update.useMutation({
    onSuccess: () => {
      utils.crm.list.invalidate();
      setEditingLead(null);
      toast.success("ליד עודכן");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.crm.delete.useMutation({
    onSuccess: () => {
      utils.crm.list.invalidate();
      setDeletingId(null);
      toast.success("ליד נמחק");
    },
    onError: (e) => toast.error(e.message),
  });

  function handleSave(form: FormState) {
    const payload = {
      name: form.name,
      phone: form.phone,
      email: form.email || null,
      neighborhood: form.neighborhood || null,
      notes: form.notes || null,
      tags: form.tags,
      leadStatus: form.leadStatus,
      source: form.source || null,
      agentId: form.agentId,
    };

    if (editingLead) {
      updateMutation.mutate({ id: editingLead.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  // Client-side filter by tag / status
  const filtered = leads.filter((lead) => {
    if (filterTag && !lead.tags.includes(filterTag)) return false;
    if (filterStatus && lead.leadStatus !== filterStatus) return false;
    return true;
  });

  const agentName = (id: number | null) => {
    if (!id) return "—";
    return agents.find((a) => a.id === id)?.name ?? `#${id}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir="rtl">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CRM לידים</h1>
          <p className="text-slate-500 text-sm mt-1">
            {filtered.length} לידים {!isAdmin && "שלי"}
          </p>
        </div>
        <Button
          onClick={() => { setEditingLead(null); setModalOpen(true); }}
          className="bg-slate-900 text-white hover:bg-slate-700 gap-2"
        >
          <Plus size={16} />
          ליד חדש
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-5 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם, טלפון, שכונה..."
            className="w-full h-9 pr-9 pl-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        {/* Tag filter */}
        <select
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          className="h-9 rounded-xl border border-slate-200 px-3 text-sm bg-white"
        >
          <option value="">כל התגיות</option>
          {ALL_TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-9 rounded-xl border border-slate-200 px-3 text-sm bg-white"
        >
          <option value="">כל הסטטוסים</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Agent filter (admin only) */}
        {isAdmin && (
          <select
            value={filterAgentId ?? ""}
            onChange={(e) => setFilterAgentId(e.target.value ? Number(e.target.value) : undefined)}
            className="h-9 rounded-xl border border-slate-200 px-3 text-sm bg-white"
          >
            <option value="">כל הסוכנים</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {leadsQuery.isLoading ? (
          <div className="p-12 text-center text-slate-400">טוען לידים...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <User size={40} className="mx-auto mb-3 opacity-30" />
            <p>אין לידים עדיין</p>
            <button
              onClick={() => { setEditingLead(null); setModalOpen(true); }}
              className="mt-3 text-sm text-slate-600 underline hover:text-slate-900"
            >
              הוסף ליד ראשון
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">שם</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">טלפון</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">שכונה</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">תגיות</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">סטטוס</th>
                  {isAdmin && (
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">סוכן</th>
                  )}
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">הערות</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{lead.name}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`tel:${lead.phone}`}
                        className="text-blue-600 hover:underline flex items-center gap-1"
                        dir="ltr"
                      >
                        <Phone size={12} />
                        {lead.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {lead.neighborhood || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <TagPills tags={lead.tags} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.leadStatus] ?? ""}`}
                      >
                        {lead.leadStatus}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-slate-500 text-xs">{agentName(lead.agentId)}</td>
                    )}
                    <td className="px-4 py-3 text-slate-500 max-w-[200px]">
                      <p className="truncate">{lead.notes || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => { setEditingLead(lead); setModalOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
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
        )}
      </div>

      {/* Add/Edit modal */}
      {modalOpen && (
        <LeadModal
          initial={editingLead}
          agents={agents.map((a: { id: number; name: string }) => ({ id: a.id, name: a.name }))}
          isAdmin={isAdmin ?? false}
          currentAgentId={agent?.id ?? 0}
          onClose={() => { setModalOpen(false); setEditingLead(null); }}
          onSave={handleSave}
        />
      )}

      {/* Delete confirmation */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center" dir="rtl">
            <Trash2 size={32} className="mx-auto mb-3 text-red-400" />
            <h3 className="font-bold text-lg mb-1">למחוק את הליד?</h3>
            <p className="text-slate-500 text-sm mb-5">פעולה זו אינה ניתנת לביטול.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setDeletingId(null)}>ביטול</Button>
              <Button
                className="bg-red-500 text-white hover:bg-red-600"
                onClick={() => deleteMutation.mutate({ id: deletingId })}
                disabled={deleteMutation.isPending}
              >
                כן, מחק
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
