import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AgentLayout from "@/components/AgentLayout";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  MapPin,
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
  secondaryPhone?: string | null;
  email: string | null;
  neighborhood: string | null;
  notes: string | null;
  tags: string;
  leadStatus: "חדש" | "פעיל" | "סגור" | "לא רלוונטי";
  source: string | null;
  // Extended fields
  leadType?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  desiredBudget?: string | null;
  processStage?: string | null;
  lastContact?: string | null;
  meetingDate?: string | null;
  meetingTime?: string | null;
  meetingNotes?: string | null;
  meetingLocation?: string | null;
  propertyNeighborhood?: string | null;
  propertyStreet?: string | null;
  propertyRooms?: string | null;
  propertyType?: string | null;
  currentPropertyPrice?: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type FormState = {
  name: string;
  phone: string;
  secondaryPhone: string;
  email: string;
  neighborhood: string;
  notes: string;
  tags: string;
  leadStatus: "חדש" | "פעיל" | "סגור" | "לא רלוונטי";
  source: string;
  agentId: number | null;
  leadType: string;
  budgetMin: string;
  budgetMax: string;
  desiredBudget: string;
  processStage: string;
  lastContact: string;
  meetingDate: string;
  meetingTime: string;
  meetingNotes: string;
  meetingLocation: string;
  propertyNeighborhood: string;
  propertyStreet: string;
  propertyRooms: string;
  propertyType: string;
  currentPropertyPrice: string;
};

const ALL_TAGS = ["בלעדי", "קונה", "מוכר", "שכירות", "buyer", "seller", "past_client"] as const;
const DISPLAY_TAGS = ["בלעדי", "קונה", "מוכר", "שכירות", "past_client"];

const STATUS_OPTIONS = ["חדש", "פעיל", "סגור", "לא רלוונטי"] as const;

const LEAD_TYPE_OPTIONS = ["קונה", "מוכר", "שוכר", "משכיר", "השקעה", "אחר"];

const PROCESS_STAGE_OPTIONS = [
  "יצירת קשר ראשוני",
  "פגישת היכרות",
  "בדיקת נכסים",
  "הצעת מחיר",
  "משא ומתן",
  "חתימת חוזה",
  "סגירת עסקה",
  "לא רלוונטי",
];

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  "חדש":         { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-400" },
  "פעיל":        { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  "סגור":        { bg: "bg-slate-100",  text: "text-slate-500",   dot: "bg-slate-400" },
  "לא רלוונטי": { bg: "bg-red-50",     text: "text-red-500",     dot: "bg-red-400" },
};

const TAG_STYLE: Record<string, string> = {
  "בלעדי":      "bg-purple-100 text-purple-700",
  "קונה":       "bg-sky-100 text-sky-700",
  "buyer":      "bg-sky-100 text-sky-700",
  "מוכר":       "bg-amber-100 text-amber-700",
  "seller":     "bg-amber-100 text-amber-700",
  "שכירות":     "bg-teal-100 text-teal-700",
  "past_client":"bg-rose-100 text-rose-600",
};

const LEAD_TYPE_STYLE: Record<string, string> = {
  "קונה":    "bg-sky-50 text-sky-700 border-sky-200",
  "מוכר":    "bg-amber-50 text-amber-700 border-amber-200",
  "שוכר":    "bg-teal-50 text-teal-700 border-teal-200",
  "משכיר":   "bg-indigo-50 text-indigo-700 border-indigo-200",
  "השקעה":   "bg-violet-50 text-violet-700 border-violet-200",
};

function emptyForm(currentAgentId: number): FormState {
  return {
    name: "", phone: "", secondaryPhone: "", email: "",
    neighborhood: "", notes: "", tags: "", leadStatus: "חדש",
    source: "", agentId: currentAgentId,
    leadType: "", budgetMin: "", budgetMax: "", desiredBudget: "",
    processStage: "", lastContact: "", meetingDate: "", meetingTime: "",
    meetingNotes: "", meetingLocation: "",
    propertyNeighborhood: "", propertyStreet: "",
    propertyRooms: "", propertyType: "", currentPropertyPrice: "",
  };
}

function formatBudget(min?: number | null, max?: number | null): string {
  if (!min && !max) return "";
  const fmt = (n: number) => `₪${n.toLocaleString("he-IL")}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `מ-${fmt(min)}`;
  return `עד ${fmt(max!)}`;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" });
  } catch {
    return dateStr;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

function LeadTypeBadge({ type }: { type?: string | null }) {
  if (!type) return null;
  const cls = LEAD_TYPE_STYLE[type] ?? "bg-slate-50 text-slate-600 border-slate-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${cls}`}>
      {type}
    </span>
  );
}

function TagSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const selected = value ? value.split(",").map((t) => t.trim()).filter(Boolean) : [];
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
  initial, agents, isAdmin, currentAgentId, onClose, onSave, isSaving,
}: {
  initial?: Lead | null;
  agents: Array<{ id: number; name: string }>;
  isAdmin: boolean;
  currentAgentId: number;
  onClose: () => void;
  onSave: (data: FormState) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<FormState>(() =>
    initial
      ? {
          name: initial.name,
          phone: initial.phone,
          secondaryPhone: initial.secondaryPhone ?? "",
          email: initial.email ?? "",
          neighborhood: initial.neighborhood ?? "",
          notes: initial.notes ?? "",
          tags: initial.tags ?? "",
          leadStatus: initial.leadStatus,
          source: initial.source ?? "",
          agentId: initial.agentId,
          leadType: initial.leadType ?? "",
          budgetMin: initial.budgetMin != null ? String(initial.budgetMin) : "",
          budgetMax: initial.budgetMax != null ? String(initial.budgetMax) : "",
          desiredBudget: initial.desiredBudget ?? "",
          processStage: initial.processStage ?? "",
          lastContact: initial.lastContact ? initial.lastContact.slice(0, 10) : "",
          meetingDate: initial.meetingDate ? initial.meetingDate.slice(0, 10) : "",
          meetingTime: initial.meetingTime ?? "",
          meetingNotes: initial.meetingNotes ?? "",
          meetingLocation: initial.meetingLocation ?? "",
          propertyNeighborhood: initial.propertyNeighborhood ?? "",
          propertyStreet: initial.propertyStreet ?? "",
          propertyRooms: initial.propertyRooms ?? "",
          propertyType: initial.propertyType ?? "",
          currentPropertyPrice: initial.currentPropertyPrice != null ? String(initial.currentPropertyPrice) : "",
        }
      : emptyForm(currentAgentId)
  );

  const [openSection, setOpenSection] = useState<"basic" | "budget" | "property" | "meeting">("basic");

  function field(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function SectionHeader({ id, label, icon }: { id: typeof openSection; label: string; icon: React.ReactNode }) {
    const isOpen = openSection === id;
    return (
      <button
        type="button"
        onClick={() => setOpenSection(isOpen ? "basic" : id)}
        className="flex w-full items-center justify-between px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition text-sm font-bold text-slate-700"
      >
        <span className="flex items-center gap-2">{icon}{label}</span>
        {isOpen ? <ChevronDown size={15} className="text-slate-400" /> : <ChevronRight size={15} className="text-slate-400" />}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-black text-slate-900">{initial ? "עריכת ליד" : "ליד חדש"}</h2>
            {initial && <p className="text-xs text-slate-400 mt-0.5">#{initial.id} · עודכן {formatDate(String(initial.updatedAt))}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* ── Section: Basic ── */}
          <SectionHeader id="basic" label="פרטי ליד בסיסיים" icon={<User size={14} className="text-[#d9ae4c]" />} />
          {openSection === "basic" && (
            <div className="space-y-3 pb-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">שם מלא *</label>
                  <Input value={form.name} onChange={field("name")} placeholder="ישראל ישראלי" className="rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">טלפון ראשי *</label>
                  <Input value={form.phone} onChange={field("phone")} placeholder="05X-XXXXXXX" dir="ltr" className="rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">טלפון נוסף</label>
                  <Input value={form.secondaryPhone} onChange={field("secondaryPhone")} placeholder="05X-XXXXXXX" dir="ltr" className="rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">אימייל</label>
                  <Input value={form.email} onChange={field("email")} placeholder="email@example.com" dir="ltr" className="rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">סוג ליד</label>
                  <select value={form.leadType} onChange={field("leadType")} className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300">
                    <option value="">— לא נבחר —</option>
                    {LEAD_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">שלב תהליך</label>
                  <select value={form.processStage} onChange={field("processStage")} className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300">
                    <option value="">— לא נבחר —</option>
                    {PROCESS_STAGE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">סטטוס</label>
                  <select value={form.leadStatus} onChange={field("leadStatus")} className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300">
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">שכונה</label>
                  <Input value={form.neighborhood} onChange={field("neighborhood")} placeholder="גילה, קטמונים..." className="rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">מקור</label>
                  <Input value={form.source} onChange={field("source")} placeholder="יד2, פייסבוק..." className="rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">קשר אחרון</label>
                  <Input value={form.lastContact} onChange={field("lastContact")} type="date" className="rounded-xl" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">תגיות</label>
                <TagSelector value={form.tags} onChange={(v) => setForm((f) => ({ ...f, tags: v }))} />
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
          )}

          {/* ── Section: Budget ── */}
          <SectionHeader id="budget" label="תקציב ופיננסים" icon={<span className="text-[#d9ae4c] font-black text-xs">₪</span>} />
          {openSection === "budget" && (
            <div className="space-y-3 pb-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">תקציב מינימום (₪)</label>
                  <Input value={form.budgetMin} onChange={field("budgetMin")} type="number" placeholder="1500000" className="rounded-xl" dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">תקציב מקסימום (₪)</label>
                  <Input value={form.budgetMax} onChange={field("budgetMax")} type="number" placeholder="2500000" className="rounded-xl" dir="ltr" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">תקציב רצוי / הערת תקציב</label>
                <Input value={form.desiredBudget} onChange={field("desiredBudget")} placeholder='ל"מ 1.8M, גמיש' className="rounded-xl" />
              </div>
            </div>
          )}

          {/* ── Section: Property ── */}
          <SectionHeader id="property" label="פרטי נכס" icon={<MapPin size={14} className="text-[#d9ae4c]" />} />
          {openSection === "property" && (
            <div className="space-y-3 pb-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">שכונת הנכס</label>
                  <Input value={form.propertyNeighborhood} onChange={field("propertyNeighborhood")} placeholder="גילה, מלחה..." className="rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">רחוב</label>
                  <Input value={form.propertyStreet} onChange={field("propertyStreet")} placeholder="רח׳ הדר 5" className="rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">מספר חדרים</label>
                  <Input value={form.propertyRooms} onChange={field("propertyRooms")} placeholder="4, 4.5..." className="rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">סוג נכס</label>
                  <Input value={form.propertyType} onChange={field("propertyType")} placeholder="דירה, קוטג׳, בית..." className="rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">מחיר נכס נוכחי (₪)</label>
                  <Input value={form.currentPropertyPrice} onChange={field("currentPropertyPrice")} type="number" placeholder="2100000" className="rounded-xl" dir="ltr" />
                </div>
              </div>
            </div>
          )}

          {/* ── Section: Meeting ── */}
          <SectionHeader id="meeting" label="פגישה ותיאום" icon={<Calendar size={14} className="text-[#d9ae4c]" />} />
          {openSection === "meeting" && (
            <div className="space-y-3 pb-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">תאריך פגישה</label>
                  <Input value={form.meetingDate} onChange={field("meetingDate")} type="date" className="rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">שעת פגישה</label>
                  <Input value={form.meetingTime} onChange={field("meetingTime")} type="time" className="rounded-xl" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">מיקום פגישה</label>
                <Input value={form.meetingLocation} onChange={field("meetingLocation")} placeholder="כתובת / Zoom / טלפון" className="rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">הערות פגישה</label>
                <textarea value={form.meetingNotes} onChange={field("meetingNotes")} rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300" placeholder="מה דובר, מה מתוכנן..." />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-4 border-t border-slate-100 justify-end sticky bottom-0 bg-white">
          <Button variant="outline" onClick={onClose} className="rounded-full font-bold">ביטול</Button>
          <Button
            disabled={!form.name.trim() || !form.phone.trim() || isSaving}
            onClick={() => onSave(form)}
            className="rounded-full bg-[#d9ae4c] hover:bg-[#c99a31] text-white font-black"
          >
            <Check size={15} />
            {isSaving ? "שומר..." : initial ? "שמור שינויים" : "הוסף ליד"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Lead Detail Panel ────────────────────────────────────────────────────────

function LeadDetailPanel({ lead, agentName, onEdit, onClose }: {
  lead: Lead;
  agentName: string;
  onEdit: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex" dir="rtl">
      {/* Overlay */}
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className="w-full max-w-md bg-white shadow-2xl overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[#0d0d0d]">
          <div>
            <p className="text-xs font-black text-[#d9ae4c] uppercase tracking-widest">פרטי ליד</p>
            <h3 className="text-lg font-black text-white mt-0.5">{lead.name}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 p-5 space-y-5">
          {/* Status + type row */}
          <div className="flex flex-wrap gap-2 items-center">
            <StatusBadge status={lead.leadStatus} />
            <LeadTypeBadge type={lead.leadType} />
            {lead.processStage && (
              <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{lead.processStage}</span>
            )}
          </div>

          {/* Contact */}
          <div className="rounded-2xl bg-slate-50 p-4 space-y-3">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">יצירת קשר</p>
            <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-[#d9ae4c] font-bold hover:text-[#b98b2f] transition" dir="ltr">
              <Phone size={14} />
              {lead.phone}
            </a>
            {lead.secondaryPhone && (
              <a href={`tel:${lead.secondaryPhone}`} className="flex items-center gap-2 text-slate-600 font-medium hover:text-[#d9ae4c] transition" dir="ltr">
                <Phone size={13} />
                {lead.secondaryPhone}
              </a>
            )}
            {lead.email && <p className="text-sm text-slate-600">{lead.email}</p>}
            {lead.neighborhood && (
              <p className="flex items-center gap-1.5 text-sm text-slate-600">
                <MapPin size={13} className="text-slate-400" />
                {lead.neighborhood}
              </p>
            )}
          </div>

          {/* Budget */}
          {(lead.budgetMin || lead.budgetMax || lead.desiredBudget) && (
            <div className="rounded-2xl bg-[#fffdf5] border border-[#f3dfb0] p-4 space-y-1.5">
              <p className="text-xs font-black uppercase tracking-widest text-[#b98b2f]">תקציב</p>
              {(lead.budgetMin || lead.budgetMax) && (
                <p className="text-lg font-black text-[#d9ae4c]">{formatBudget(lead.budgetMin, lead.budgetMax)}</p>
              )}
              {lead.desiredBudget && <p className="text-sm text-slate-600">{lead.desiredBudget}</p>}
            </div>
          )}

          {/* Property */}
          {(lead.propertyNeighborhood || lead.propertyStreet || lead.propertyRooms || lead.propertyType || lead.currentPropertyPrice) && (
            <div className="rounded-2xl bg-slate-50 p-4 space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">פרטי נכס</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {lead.propertyNeighborhood && <div><span className="text-slate-400 text-xs">שכונה</span><p className="font-bold text-slate-800">{lead.propertyNeighborhood}</p></div>}
                {lead.propertyStreet && <div><span className="text-slate-400 text-xs">רחוב</span><p className="font-bold text-slate-800">{lead.propertyStreet}</p></div>}
                {lead.propertyRooms && <div><span className="text-slate-400 text-xs">חדרים</span><p className="font-bold text-slate-800">{lead.propertyRooms}</p></div>}
                {lead.propertyType && <div><span className="text-slate-400 text-xs">סוג</span><p className="font-bold text-slate-800">{lead.propertyType}</p></div>}
                {lead.currentPropertyPrice && <div className="col-span-2"><span className="text-slate-400 text-xs">מחיר נוכחי</span><p className="font-black text-[#d9ae4c] text-lg">₪{lead.currentPropertyPrice.toLocaleString("he-IL")}</p></div>}
              </div>
            </div>
          )}

          {/* Meeting */}
          {(lead.meetingDate || lead.meetingNotes) && (
            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-blue-400">פגישה</p>
              {lead.meetingDate && (
                <div className="flex items-center gap-2 font-bold text-blue-700">
                  <Calendar size={14} />
                  {formatDate(lead.meetingDate)}
                  {lead.meetingTime && <span>· {lead.meetingTime}</span>}
                </div>
              )}
              {lead.meetingLocation && <p className="text-sm text-blue-700 flex items-center gap-1.5"><MapPin size={12} />{lead.meetingLocation}</p>}
              {lead.meetingNotes && <p className="text-sm text-slate-600 mt-1">{lead.meetingNotes}</p>}
            </div>
          )}

          {/* Tags */}
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">תגיות</p>
            <TagPills tags={lead.tags} />
          </div>

          {/* Notes */}
          {lead.notes && (
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">הערות</p>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{lead.notes}</p>
            </div>
          )}

          {/* Meta */}
          <div className="text-xs text-slate-400 space-y-1 pt-2 border-t border-slate-100">
            {lead.source && <p>מקור: {lead.source}</p>}
            {lead.lastContact && <p>קשר אחרון: {formatDate(lead.lastContact)}</p>}
            <p>סוכן: {agentName}</p>
            <p>נוצר: {formatDate(String(lead.createdAt))}</p>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100">
          <Button onClick={onEdit} className="w-full rounded-full bg-[#d9ae4c] hover:bg-[#c99a31] text-white font-black">
            <Pencil size={14} />
            עריכת ליד
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
  const [filterType, setFilterType] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
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
    onSuccess: () => { utils.crm.list.invalidate(); setModalOpen(false); toast.success("ליד נוסף בהצלחה"); },
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
    const payload = {
      name: form.name,
      phone: form.phone,
      secondaryPhone: form.secondaryPhone || null,
      email: form.email || null,
      neighborhood: form.neighborhood || null,
      notes: form.notes || null,
      tags: form.tags,
      leadStatus: form.leadStatus,
      source: form.source || null,
      agentId: form.agentId,
      leadType: form.leadType || null,
      budgetMin: form.budgetMin ? Number(form.budgetMin) : null,
      budgetMax: form.budgetMax ? Number(form.budgetMax) : null,
      desiredBudget: form.desiredBudget || null,
      processStage: form.processStage || null,
      lastContact: form.lastContact || null,
      meetingDate: form.meetingDate || null,
      meetingTime: form.meetingTime || null,
      meetingNotes: form.meetingNotes || null,
      meetingLocation: form.meetingLocation || null,
      propertyNeighborhood: form.propertyNeighborhood || null,
      propertyStreet: form.propertyStreet || null,
      propertyRooms: form.propertyRooms || null,
      propertyType: form.propertyType || null,
      currentPropertyPrice: form.currentPropertyPrice ? Number(form.currentPropertyPrice) : null,
    };
    if (editingLead) updateMutation.mutate({ id: editingLead.id, ...payload });
    else createMutation.mutate(payload);
  }

  const filtered = leads.filter((lead) => {
    if (filterTag && !lead.tags.includes(filterTag)) return false;
    if (filterStatus && lead.leadStatus !== filterStatus) return false;
    if (filterType && lead.leadType !== filterType) return false;
    return true;
  });

  const total      = filtered.length;
  const countNew   = filtered.filter((l) => l.leadStatus === "חדש").length;
  const countActive = filtered.filter((l) => l.leadStatus === "פעיל").length;
  const countClosed = filtered.filter((l) => l.leadStatus === "סגור").length;

  const agentName = (id: number | null) => {
    if (!id) return "—";
    return agents.find((a) => a.id === id)?.name ?? `#${id}`;
  };

  function openEdit(lead: Lead) {
    setEditingLead(lead);
    setViewingLead(null);
    setModalOpen(true);
  }

  return (
    <AgentLayout>
      <div className="min-h-screen bg-[#f8f6f0] px-4 py-6 md:px-8 md:py-8" dir="rtl">
        <div className="mx-auto max-w-7xl">

          {/* ── Header ──────────────────────────────────────────── */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#d9ae4c]">CRM מערכת</p>
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
              { label: "סה״כ",    value: total,        color: "text-slate-800",    bg: "bg-white" },
              { label: "חדשים",   value: countNew,     color: "text-blue-600",     bg: "bg-blue-50" },
              { label: "פעילים",  value: countActive,  color: "text-emerald-600",  bg: "bg-emerald-50" },
              { label: "סגורים",  value: countClosed,  color: "text-slate-500",    bg: "bg-slate-100" },
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
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300">
                <option value="">כל הסטטוסים</option>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300">
                <option value="">כל הסוגים</option>
                {LEAD_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300">
                <option value="">כל התגיות</option>
                {ALL_TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {isAdmin && (
                <select value={filterAgentId ?? ""} onChange={(e) => setFilterAgentId(e.target.value ? Number(e.target.value) : undefined)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300">
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
                        <th className="text-right px-4 py-3.5 font-black text-slate-500 text-xs uppercase tracking-wide">טלפון</th>
                        <th className="text-right px-4 py-3.5 font-black text-slate-500 text-xs uppercase tracking-wide">סוג</th>
                        <th className="text-right px-4 py-3.5 font-black text-slate-500 text-xs uppercase tracking-wide">שלב</th>
                        <th className="text-right px-4 py-3.5 font-black text-slate-500 text-xs uppercase tracking-wide">תקציב</th>
                        <th className="text-right px-4 py-3.5 font-black text-slate-500 text-xs uppercase tracking-wide">תגיות</th>
                        <th className="text-right px-4 py-3.5 font-black text-slate-500 text-xs uppercase tracking-wide">סטטוס</th>
                        {isAdmin && <th className="text-right px-4 py-3.5 font-black text-slate-500 text-xs uppercase tracking-wide">סוכן</th>}
                        <th className="px-4 py-3.5 w-24" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filtered.map((lead) => (
                        <tr
                          key={lead.id}
                          className="hover:bg-[#fffdf8] transition-colors group cursor-pointer"
                          onClick={() => setViewingLead(lead)}
                        >
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-slate-900">{lead.name}</p>
                            {lead.neighborhood && <p className="text-xs text-slate-400 mt-0.5">{lead.neighborhood}</p>}
                          </td>
                          <td className="px-4 py-3.5">
                            <a
                              href={`tel:${lead.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 font-bold text-[#d9ae4c] hover:text-[#b98b2f] transition-colors"
                              dir="ltr"
                            >
                              <Phone size={13} />
                              {lead.phone}
                            </a>
                            {lead.secondaryPhone && (
                              <a
                                href={`tel:${lead.secondaryPhone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="block text-xs text-slate-400 mt-0.5 hover:text-[#d9ae4c]"
                                dir="ltr"
                              >
                                {lead.secondaryPhone}
                              </a>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <LeadTypeBadge type={lead.leadType} />
                          </td>
                          <td className="px-4 py-3.5">
                            {lead.processStage ? (
                              <span className="text-xs text-slate-600 font-medium">{lead.processStage}</span>
                            ) : <span className="text-slate-300 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3.5">
                            {formatBudget(lead.budgetMin, lead.budgetMax) ? (
                              <span className="text-xs font-bold text-[#d9ae4c]">{formatBudget(lead.budgetMin, lead.budgetMax)}</span>
                            ) : <span className="text-slate-300 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3.5">
                            <TagPills tags={lead.tags} />
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={lead.leadStatus} />
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-3.5 text-slate-500 text-xs font-medium">{agentName(lead.agentId)}</td>
                          )}
                          <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                              <button
                                onClick={() => openEdit(lead)}
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
                    <div key={lead.id} className="p-4 hover:bg-[#fffdf8] transition-colors" onClick={() => setViewingLead(lead)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-black text-slate-900 text-base">{lead.name}</p>
                            <LeadTypeBadge type={lead.leadType} />
                          </div>
                          <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-[#d9ae4c] font-bold text-sm mt-0.5" dir="ltr">
                            <Phone size={12} />
                            {lead.phone}
                          </a>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <StatusBadge status={lead.leadStatus} />
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => openEdit(lead)} className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => setDeletingId(lead.id)} className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 items-center">
                        {lead.neighborhood && (
                          <span className="text-xs text-slate-500 bg-slate-100 rounded-lg px-2 py-0.5">{lead.neighborhood}</span>
                        )}
                        {formatBudget(lead.budgetMin, lead.budgetMax) && (
                          <span className="text-xs font-bold text-[#d9ae4c]">{formatBudget(lead.budgetMin, lead.budgetMax)}</span>
                        )}
                        <TagPills tags={lead.tags} />
                      </div>
                      {lead.processStage && (
                        <p className="mt-1.5 text-xs text-slate-500">{lead.processStage}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {filtered.length > 0 && (
            <p className="mt-3 text-center text-xs text-slate-400">{filtered.length} לידים מוצגים</p>
          )}
        </div>
      </div>

      {/* ── Detail panel ─────────────────────────────────────────── */}
      {viewingLead && !modalOpen && (
        <LeadDetailPanel
          lead={viewingLead}
          agentName={agentName(viewingLead.agentId)}
          onEdit={() => openEdit(viewingLead)}
          onClose={() => setViewingLead(null)}
        />
      )}

      {/* ── Add/Edit modal ──────────────────────────────────────── */}
      {modalOpen && (
        <LeadModal
          initial={editingLead}
          agents={agents.map((a) => ({ id: a.id, name: a.name }))}
          isAdmin={isAdmin ?? false}
          currentAgentId={agent?.id ?? 0}
          onClose={() => { setModalOpen(false); setEditingLead(null); }}
          onSave={handleSave}
          isSaving={createMutation.isPending || updateMutation.isPending}
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
