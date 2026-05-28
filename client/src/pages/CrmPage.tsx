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
  Download,
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
  name: string; phone: string; secondaryPhone: string; email: string;
  neighborhood: string; notes: string; tags: string;
  leadStatus: "חדש" | "פעיל" | "סגור" | "לא רלוונטי";
  source: string; agentId: number | null;
  leadType: string; budgetMin: string; budgetMax: string; desiredBudget: string;
  processStage: string; lastContact: string;
  meetingDate: string; meetingTime: string; meetingNotes: string; meetingLocation: string;
  propertyNeighborhood: string; propertyStreet: string;
  propertyRooms: string; propertyType: string; currentPropertyPrice: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ["חדש", "פעיל", "סגור", "לא רלוונטי"] as const;
const LEAD_TYPE_OPTIONS = ["קונה", "מוכר", "שוכר", "משכיר", "השקעה", "אחר"];
const PROCESS_STAGES = ["יצירת קשר ראשוני","פגישת היכרות","בדיקת נכסים","הצעת מחיר","משא ומתן","חתימת חוזה","סגירת עסקה","לא רלוונטי"];
const DISPLAY_TAGS = ["בלעדי", "קונה", "מוכר", "שכירות", "past_client"];
const ALL_TAGS = ["בלעדי","קונה","מוכר","שכירות","buyer","seller","past_client"];
const SOURCE_OPTIONS = ["יד2","הומלי","פייסבוק","אינסטגרם","Organic","ממולץ","Google","אחר"];

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  "חדש":         { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-400" },
  "פעיל":        { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  "סגור":        { bg: "bg-slate-100",  text: "text-slate-500",   dot: "bg-slate-400" },
  "לא רלוונטי": { bg: "bg-red-50",     text: "text-red-500",     dot: "bg-red-400" },
};

const TAG_STYLE: Record<string, string> = {
  "בלעדי":      "bg-violet-100 text-violet-700",
  "קונה":       "bg-sky-100 text-sky-700",
  "buyer":      "bg-sky-100 text-sky-700",
  "מוכר":       "bg-amber-100 text-amber-700",
  "seller":     "bg-amber-100 text-amber-700",
  "שכירות":     "bg-teal-100 text-teal-700",
  "past_client":"bg-rose-100 text-rose-600",
};

const TYPE_STYLE: Record<string, string> = {
  "קונה":  "bg-sky-50 text-sky-700 border-sky-200",
  "מוכר":  "bg-amber-50 text-amber-700 border-amber-200",
  "שוכר":  "bg-teal-50 text-teal-700 border-teal-200",
  "משכיר": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "השקעה": "bg-violet-50 text-violet-700 border-violet-200",
};

// ─── Utils ────────────────────────────────────────────────────────────────────

function fmtBudget(min?: number | null, max?: number | null) {
  if (!min && !max) return null;
  const f = (n: number) => `₪${(n / 1_000_000).toFixed(1)}M`;
  if (min && max) return `${f(min)}–${f(max)}`;
  if (min) return `מ-${f(min)}`;
  return `עד ${f(max!)}`;
}

function fmtDate(d?: string | Date | null) {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" }); }
  catch { return String(d).slice(0, 10); }
}

function emptyForm(agentId: number): FormState {
  return {
    name:"",phone:"",secondaryPhone:"",email:"",neighborhood:"",notes:"",tags:"",
    leadStatus:"חדש",source:"",agentId,leadType:"",budgetMin:"",budgetMax:"",
    desiredBudget:"",processStage:"",lastContact:"",meetingDate:"",meetingTime:"",
    meetingNotes:"",meetingLocation:"",propertyNeighborhood:"",propertyStreet:"",
    propertyRooms:"",propertyType:"",currentPropertyPrice:"",
  };
}

// ─── Small UI components ──────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { bg:"bg-slate-100", text:"text-slate-600", dot:"bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type?: string | null }) {
  if (!type) return null;
  const cls = TYPE_STYLE[type] ?? "bg-slate-50 text-slate-600 border-slate-200";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${cls}`}>{type}</span>;
}

function TagPills({ tags }: { tags: string }) {
  const list = tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [];
  if (!list.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {list.slice(0, 2).map(tag => (
        <span key={tag} className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${TAG_STYLE[tag] ?? "bg-slate-100 text-slate-600"}`}>{tag}</span>
      ))}
      {list.length > 2 && <span className="text-[10px] text-slate-400">+{list.length - 2}</span>}
    </div>
  );
}

function TagSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const selected = value ? value.split(",").map(t => t.trim()).filter(Boolean) : [];
  const toggle = (tag: string) => {
    const next = selected.includes(tag) ? selected.filter(t => t !== tag) : [...selected, tag];
    onChange(next.join(","));
  };
  return (
    <div className="flex flex-wrap gap-2">
      {DISPLAY_TAGS.map(tag => (
        <button key={tag} type="button" onClick={() => toggle(tag)}
          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            selected.includes(tag) ? `${TAG_STYLE[tag] ?? "bg-slate-100"} border-transparent` : "border-slate-200 text-slate-500 hover:border-slate-400"
          }`}
        >{tag}</button>
      ))}
    </div>
  );
}

// ─── Export CSV ───────────────────────────────────────────────────────────────

function exportCsv(leads: Lead[], agentName: (id: number | null) => string) {
  const headers = ["שם","טלפון","טלפון נוסף","אימייל","שכונה","סוג ליד","סטטוס","שלב תהליך","תקציב מינ","תקציב מקס","מקור","סוכן","הערות","תאריך יצירה"];
  const rows = leads.map(l => [
    l.name, l.phone, l.secondaryPhone ?? "", l.email ?? "", l.neighborhood ?? "",
    l.leadType ?? "", l.leadStatus, l.processStage ?? "",
    l.budgetMin ?? "", l.budgetMax ?? "", l.source ?? "",
    agentName(l.agentId), (l.notes ?? "").replace(/,/g,""), fmtDate(l.createdAt),
  ]);
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `crm-leads-${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// ─── Lead modal (4 collapsible sections) ─────────────────────────────────────

function LeadModal({ initial, agents, isAdmin, currentAgentId, onClose, onSave, isSaving }: {
  initial?: Lead | null;
  agents: Array<{ id: number; name: string }>;
  isAdmin: boolean; currentAgentId: number;
  onClose: () => void;
  onSave: (f: FormState) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<FormState>(() =>
    initial ? {
      name: initial.name, phone: initial.phone, secondaryPhone: initial.secondaryPhone ?? "",
      email: initial.email ?? "", neighborhood: initial.neighborhood ?? "",
      notes: initial.notes ?? "", tags: initial.tags ?? "", leadStatus: initial.leadStatus,
      source: initial.source ?? "", agentId: initial.agentId,
      leadType: initial.leadType ?? "",
      budgetMin: initial.budgetMin != null ? String(initial.budgetMin) : "",
      budgetMax: initial.budgetMax != null ? String(initial.budgetMax) : "",
      desiredBudget: initial.desiredBudget ?? "", processStage: initial.processStage ?? "",
      lastContact: initial.lastContact ? String(initial.lastContact).slice(0,10) : "",
      meetingDate: initial.meetingDate ? String(initial.meetingDate).slice(0,10) : "",
      meetingTime: initial.meetingTime ?? "", meetingNotes: initial.meetingNotes ?? "",
      meetingLocation: initial.meetingLocation ?? "",
      propertyNeighborhood: initial.propertyNeighborhood ?? "",
      propertyStreet: initial.propertyStreet ?? "",
      propertyRooms: initial.propertyRooms ?? "", propertyType: initial.propertyType ?? "",
      currentPropertyPrice: initial.currentPropertyPrice != null ? String(initial.currentPropertyPrice) : "",
    } : emptyForm(currentAgentId)
  );

  const [section, setSection] = useState<"basic"|"budget"|"property"|"meeting">("basic");
  const f = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const SectionBtn = ({ id, label, icon }: { id: typeof section; label: string; icon: React.ReactNode }) => (
    <button type="button" onClick={() => setSection(section === id ? "basic" : id)}
      className="flex w-full items-center justify-between px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition text-sm font-bold text-slate-700"
    >
      <span className="flex items-center gap-2">{icon}{label}</span>
      {section === id ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
    </button>
  );

  const field = (label: string, key: keyof FormState, opts?: { type?: string; placeholder?: string; dir?: string }) => (
    <div>
      <label className="block text-xs font-bold text-slate-600 mb-1.5">{label}</label>
      <Input value={form[key] as string} onChange={f(key)} type={opts?.type ?? "text"} placeholder={opts?.placeholder} dir={opts?.dir} className="rounded-xl" />
    </div>
  );

  const select = (label: string, key: keyof FormState, options: string[]) => (
    <div>
      <label className="block text-xs font-bold text-slate-600 mb-1.5">{label}</label>
      <select value={form[key] as string} onChange={f(key)}
        className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
      >
        <option value="">— לא נבחר —</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto" dir="rtl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-black text-slate-900">{initial ? "עריכת ליד" : "ליד חדש"}</h2>
            {initial && <p className="text-xs text-slate-400 mt-0.5">#{initial.id} · {fmtDate(initial.updatedAt)}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition"><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-3">

          {/* Basic */}
          <SectionBtn id="basic" label="פרטי ליד" icon={<User size={14} className="text-[#d9ae4c]" />} />
          {section === "basic" && (
            <div className="space-y-3 pb-1">
              <div className="grid grid-cols-2 gap-3">
                {field("שם מלא *", "name", { placeholder: "ישראל ישראלי" })}
                {field("טלפון ראשי *", "phone", { placeholder: "05X-XXXXXXX", dir: "ltr" })}
                {field("טלפון נוסף", "secondaryPhone", { placeholder: "05X-XXXXXXX", dir: "ltr" })}
                {field("אימייל", "email", { placeholder: "email@example.com", dir: "ltr" })}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {select("סוג ליד", "leadType", LEAD_TYPE_OPTIONS)}
                {select("שלב תהליך", "processStage", PROCESS_STAGES)}
                {select("סטטוס", "leadStatus", [...STATUS_OPTIONS])}
                {field("שכונה", "neighborhood", { placeholder: "גילה, קטמונים..." })}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {select("מקור", "source", SOURCE_OPTIONS)}
                {field("קשר אחרון", "lastContact", { type: "date" })}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">תגיות</label>
                <TagSelector value={form.tags} onChange={v => setForm(p => ({ ...p, tags: v }))} />
              </div>
              {isAdmin && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">סוכן אחראי</label>
                  <select value={form.agentId ?? ""} onChange={e => setForm(p => ({ ...p, agentId: e.target.value ? Number(e.target.value) : null }))}
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                  >
                    <option value="">— ללא סוכן —</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">הערות</label>
                <textarea value={form.notes} onChange={f("notes")} rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="פרטים נוספים..."
                />
              </div>
            </div>
          )}

          {/* Budget */}
          <SectionBtn id="budget" label="תקציב ופיננסים" icon={<span className="text-[#d9ae4c] font-black text-xs leading-none">₪</span>} />
          {section === "budget" && (
            <div className="grid grid-cols-2 gap-3 pb-1">
              {field("תקציב מינימום (₪)", "budgetMin", { type: "number", placeholder: "1500000", dir: "ltr" })}
              {field("תקציב מקסימום (₪)", "budgetMax", { type: "number", placeholder: "2500000", dir: "ltr" })}
              <div className="col-span-2">{field("הערת תקציב", "desiredBudget", { placeholder: "גמיש, ₪1.8M ל״מ" })}</div>
            </div>
          )}

          {/* Property */}
          <SectionBtn id="property" label="פרטי נכס" icon={<MapPin size={14} className="text-[#d9ae4c]" />} />
          {section === "property" && (
            <div className="grid grid-cols-2 gap-3 pb-1">
              {field("שכונת הנכס", "propertyNeighborhood", { placeholder: "גילה, מלחה..." })}
              {field("רחוב", "propertyStreet", { placeholder: "רח׳ הדר 5" })}
              {field("מספר חדרים", "propertyRooms", { placeholder: "4, 4.5..." })}
              {field("סוג נכס", "propertyType", { placeholder: "דירה, קוטג׳..." })}
              <div className="col-span-2">{field("מחיר נכס נוכחי (₪)", "currentPropertyPrice", { type: "number", dir: "ltr" })}</div>
            </div>
          )}

          {/* Meeting */}
          <SectionBtn id="meeting" label="פגישה ותיאום" icon={<Calendar size={14} className="text-[#d9ae4c]" />} />
          {section === "meeting" && (
            <div className="space-y-3 pb-1">
              <div className="grid grid-cols-2 gap-3">
                {field("תאריך פגישה", "meetingDate", { type: "date" })}
                {field("שעת פגישה", "meetingTime", { type: "time" })}
                <div className="col-span-2">{field("מיקום פגישה", "meetingLocation", { placeholder: "כתובת / Zoom / טלפון" })}</div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">הערות פגישה</label>
                <textarea value={form.meetingNotes} onChange={f("meetingNotes")} rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="מה דובר, מה מתוכנן..."
                />
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

// ─── Lead Detail Side Panel ───────────────────────────────────────────────────

function LeadPanel({ lead, agentName, onEdit, onClose }: {
  lead: Lead; agentName: string; onEdit: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex" dir="rtl">
      <div className="flex-1" style={{ background: "rgba(0,0,0,0.3)" }} onClick={onClose} />
      <div className="w-full max-w-[420px] bg-white shadow-2xl flex flex-col overflow-y-auto">

        {/* Header */}
        <div className="px-5 py-4 border-b" style={{ background: "#0d0d0d" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#d9ae4c]">פרטי ליד #{lead.id}</p>
              <h3 className="text-xl font-black text-white mt-0.5">{lead.name}</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition">
              <X size={18} />
            </button>
          </div>
          {/* Status + type row */}
          <div className="flex flex-wrap gap-2 mt-3">
            <StatusBadge status={lead.leadStatus} />
            <TypeBadge type={lead.leadType} />
            {lead.processStage && (
              <span className="text-xs font-bold bg-white/10 text-white/80 px-2.5 py-1 rounded-full">{lead.processStage}</span>
            )}
          </div>
        </div>

        <div className="flex-1 p-5 space-y-4">

          {/* Contact */}
          <div className="rounded-2xl bg-slate-50 p-4 space-y-2.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">יצירת קשר</p>
            <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-[#d9ae4c] font-black hover:text-[#b98b2f] transition text-base" dir="ltr">
              <Phone size={15} />
              {lead.phone}
            </a>
            {lead.secondaryPhone && (
              <a href={`tel:${lead.secondaryPhone}`} className="flex items-center gap-2 text-slate-500 font-medium hover:text-[#d9ae4c] transition text-sm" dir="ltr">
                <Phone size={13} />
                {lead.secondaryPhone}
              </a>
            )}
            {lead.email && <p className="text-sm text-slate-600">{lead.email}</p>}
            {lead.neighborhood && (
              <p className="flex items-center gap-1.5 text-sm text-slate-600">
                <MapPin size={13} className="text-slate-400 shrink-0" />{lead.neighborhood}
              </p>
            )}
          </div>

          {/* Budget */}
          {(lead.budgetMin || lead.budgetMax || lead.desiredBudget) && (
            <div className="rounded-2xl bg-[#fffdf5] border border-[#f3dfb0] p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#b98b2f] mb-2">תקציב</p>
              {fmtBudget(lead.budgetMin, lead.budgetMax) && (
                <p className="text-2xl font-black text-[#d9ae4c]">{fmtBudget(lead.budgetMin, lead.budgetMax)}</p>
              )}
              {lead.desiredBudget && <p className="text-sm text-slate-600 mt-1">{lead.desiredBudget}</p>}
            </div>
          )}

          {/* Property */}
          {(lead.propertyNeighborhood || lead.propertyStreet || lead.propertyRooms || lead.currentPropertyPrice) && (
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">פרטי נכס</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {lead.propertyNeighborhood && <div><p className="text-xs text-slate-400">שכונה</p><p className="font-bold">{lead.propertyNeighborhood}</p></div>}
                {lead.propertyStreet && <div><p className="text-xs text-slate-400">רחוב</p><p className="font-bold">{lead.propertyStreet}</p></div>}
                {lead.propertyRooms && <div><p className="text-xs text-slate-400">חדרים</p><p className="font-bold">{lead.propertyRooms}</p></div>}
                {lead.propertyType && <div><p className="text-xs text-slate-400">סוג</p><p className="font-bold">{lead.propertyType}</p></div>}
              </div>
              {lead.currentPropertyPrice && (
                <p className="mt-2 text-xl font-black text-[#d9ae4c]">₪{lead.currentPropertyPrice.toLocaleString("he-IL")}</p>
              )}
            </div>
          )}

          {/* Meeting */}
          {(lead.meetingDate || lead.meetingNotes) && (
            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">פגישה</p>
              {lead.meetingDate && (
                <div className="flex items-center gap-2 font-bold text-blue-700 text-sm">
                  <Calendar size={13} />
                  {fmtDate(lead.meetingDate)}{lead.meetingTime && ` · ${lead.meetingTime}`}
                </div>
              )}
              {lead.meetingLocation && <p className="text-sm text-blue-600 mt-1 flex items-center gap-1.5"><MapPin size={12} />{lead.meetingLocation}</p>}
              {lead.meetingNotes && <p className="text-sm text-slate-600 mt-2">{lead.meetingNotes}</p>}
            </div>
          )}

          {/* Tags */}
          {lead.tags && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">תגיות</p>
              <div className="flex flex-wrap gap-1.5">
                {lead.tags.split(",").map(t => t.trim()).filter(Boolean).map(tag => (
                  <span key={tag} className={`px-2.5 py-1 rounded-full text-xs font-bold ${TAG_STYLE[tag] ?? "bg-slate-100 text-slate-600"}`}>{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {lead.notes && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">הערות</p>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{lead.notes}</p>
            </div>
          )}

          {/* Meta */}
          <div className="text-xs text-slate-400 space-y-1 pt-2 border-t border-slate-100">
            {lead.source && <p>מקור: <span className="font-bold text-slate-600">{lead.source}</span></p>}
            {lead.lastContact && <p>קשר אחרון: <span className="font-bold text-slate-600">{fmtDate(lead.lastContact)}</span></p>}
            <p>סוכן: <span className="font-bold text-slate-600">{agentName}</span></p>
            <p>נוצר: <span className="font-bold text-slate-600">{fmtDate(lead.createdAt)}</span></p>
          </div>
        </div>

        <div className="px-5 py-4 border-t bg-white">
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
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const agentsQuery = trpc.admin.listStaff.useQuery(undefined, { enabled: !!isAdmin });
  const agents = (agentsQuery.data ?? []) as Array<{ id: number; name: string }>;

  const leadsQuery = trpc.crm.list.useQuery({ search: search || undefined, agentId: isAdmin ? filterAgentId : undefined });
  const leads = (leadsQuery.data ?? []) as Lead[];
  const utils = trpc.useUtils();

  const createMutation = trpc.crm.create.useMutation({
    onSuccess: () => { utils.crm.list.invalidate(); setModalOpen(false); toast.success("ליד נוסף"); },
    onError: e => toast.error(e.message),
  });
  const updateMutation = trpc.crm.update.useMutation({
    onSuccess: () => { utils.crm.list.invalidate(); setEditingLead(null); setModalOpen(false); toast.success("ליד עודכן"); },
    onError: e => toast.error(e.message),
  });
  const deleteMutation = trpc.crm.delete.useMutation({
    onSuccess: () => { utils.crm.list.invalidate(); setDeletingId(null); toast.success("ליד נמחק"); },
    onError: e => toast.error(e.message),
  });

  function handleSave(form: FormState) {
    const p = {
      name: form.name, phone: form.phone, secondaryPhone: form.secondaryPhone || null,
      email: form.email || null, neighborhood: form.neighborhood || null,
      notes: form.notes || null, tags: form.tags, leadStatus: form.leadStatus,
      source: form.source || null, agentId: form.agentId,
      leadType: form.leadType || null,
      budgetMin: form.budgetMin ? Number(form.budgetMin) : null,
      budgetMax: form.budgetMax ? Number(form.budgetMax) : null,
      desiredBudget: form.desiredBudget || null, processStage: form.processStage || null,
      lastContact: form.lastContact || null, meetingDate: form.meetingDate || null,
      meetingTime: form.meetingTime || null, meetingNotes: form.meetingNotes || null,
      meetingLocation: form.meetingLocation || null,
      propertyNeighborhood: form.propertyNeighborhood || null,
      propertyStreet: form.propertyStreet || null, propertyRooms: form.propertyRooms || null,
      propertyType: form.propertyType || null,
      currentPropertyPrice: form.currentPropertyPrice ? Number(form.currentPropertyPrice) : null,
    };
    if (editingLead) updateMutation.mutate({ id: editingLead.id, ...p });
    else createMutation.mutate(p);
  }

  function openEdit(lead: Lead) { setEditingLead(lead); setViewingLead(null); setModalOpen(true); }

  const agentName = (id: number | null) => {
    if (!id) return "—";
    return agents.find(a => a.id === id)?.name ?? `#${id}`;
  };

  const filtered = leads.filter(l => {
    if (filterStatus && l.leadStatus !== filterStatus) return false;
    if (filterType && l.leadType !== filterType) return false;
    if (filterSource && l.source !== filterSource) return false;
    if (filterTag && !l.tags.includes(filterTag)) return false;
    return true;
  });

  const stats = {
    total: filtered.length,
    new: filtered.filter(l => l.leadStatus === "חדש").length,
    active: filtered.filter(l => l.leadStatus === "פעיל").length,
    closed: filtered.filter(l => l.leadStatus === "סגור").length,
  };

  // Unique sources for filter
  const sourceSet = Array.from(new Set(leads.map(l => l.source).filter(Boolean))) as string[];

  return (
    <AgentLayout>
      <div className="min-h-screen bg-[#f5f3ee] px-3 py-5 md:px-6 md:py-7" dir="rtl">
        <div className="mx-auto max-w-7xl">

          {/* ── Header ─────────────────────────────────────────── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#d9ae4c]">CRM מערכת</p>
              <h1 className="mt-1 text-2xl font-black text-slate-900">ניהול לידים</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {isAdmin ? "כל לידי הצוות" : "הלידים שלי"} — {stats.total} רשומות
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={() => exportCsv(filtered, agentName)}
                className="rounded-full border-slate-200 text-slate-600 font-bold h-9 px-4 text-sm hover:bg-white"
              >
                <Download size={14} />
                ייצוא CSV
              </Button>
              <Button
                onClick={() => { setEditingLead(null); setModalOpen(true); }}
                className="rounded-full bg-[#d9ae4c] hover:bg-[#c99a31] text-black font-black h-9 px-5 shadow-md shadow-amber-200/60"
              >
                <Plus size={15} />
                ליד חדש
              </Button>
            </div>
          </div>

          {/* ── Stats ──────────────────────────────────────────── */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: "סה״כ",   value: stats.total,   color: "#1e293b", bg: "#fff" },
              { label: "חדשים",  value: stats.new,     color: "#1d4ed8", bg: "#eff6ff" },
              { label: "פעילים", value: stats.active,  color: "#047857", bg: "#ecfdf5" },
              { label: "סגורים", value: stats.closed,  color: "#64748b", bg: "#f1f5f9" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-3 text-center shadow-sm border border-white/60" style={{ background: s.bg }}>
                <p className="text-xs font-bold text-slate-500">{s.label}</p>
                <p className="text-2xl font-black mt-0.5" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* ── Filters ────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 mb-4">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-40">
                <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="חיפוש שם, טלפון, שכונה..."
                  className="w-full h-9 pr-8 pl-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-slate-50"
                />
              </div>
              {[
                { val: filterStatus, set: setFilterStatus, opts: STATUS_OPTIONS, placeholder: "סטטוס" },
                { val: filterType,   set: setFilterType,   opts: LEAD_TYPE_OPTIONS, placeholder: "סוג ליד" },
                { val: filterTag,    set: setFilterTag,    opts: ALL_TAGS, placeholder: "תגית" },
                ...(sourceSet.length ? [{ val: filterSource, set: setFilterSource, opts: sourceSet, placeholder: "מקור" }] : []),
              ].map((f, i) => (
                <select key={i} value={f.val} onChange={e => f.set(e.target.value)}
                  className="h-9 rounded-xl border border-slate-200 px-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  <option value="">{f.placeholder}</option>
                  {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ))}
              {isAdmin && (
                <select value={filterAgentId ?? ""} onChange={e => setFilterAgentId(e.target.value ? Number(e.target.value) : undefined)}
                  className="h-9 rounded-xl border border-slate-200 px-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  <option value="">כל הסוכנים</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              )}
              {(filterStatus || filterType || filterSource || filterTag) && (
                <button onClick={() => { setFilterStatus(""); setFilterType(""); setFilterSource(""); setFilterTag(""); }}
                  className="h-9 px-3 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 border border-slate-200 transition"
                >
                  נקה
                </button>
              )}
            </div>
          </div>

          {/* ── Table ──────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {leadsQuery.isLoading ? (
              <div className="p-14 text-center">
                <div className="inline-block size-7 rounded-full border-2 border-[#d9ae4c] border-t-transparent animate-spin mb-3" />
                <p className="text-sm text-slate-400">טוען לידים...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-14 text-center text-slate-400">
                <User size={40} className="mx-auto mb-3 opacity-20" />
                <p className="font-bold text-slate-600">אין לידים להצגה</p>
                <button onClick={() => setModalOpen(true)} className="mt-2 text-sm text-[#d9ae4c] font-bold hover:underline">
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
                        {["שם ופרטים","טלפון","סוג / שלב","תקציב","סטטוס","מקור","תאריך","סוכן","פעולות"].map((h,i) => (
                          <th key={i} className={`text-right px-4 py-3 font-black text-slate-400 text-[11px] uppercase tracking-wide ${h === "פעולות" ? "w-24 text-center" : ""}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filtered.map(lead => (
                        <tr key={lead.id}
                          className="hover:bg-[#fffdf8] transition-colors group cursor-pointer"
                          onClick={() => setViewingLead(lead)}
                        >
                          {/* Name + address */}
                          <td className="px-4 py-3">
                            <p className="font-black text-slate-900 leading-tight">{lead.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{lead.neighborhood || lead.propertyNeighborhood || ""}</p>
                            <TagPills tags={lead.tags} />
                          </td>

                          {/* Phone */}
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <a href={`tel:${lead.phone}`}
                              className="inline-flex items-center gap-1.5 font-bold text-[#d9ae4c] hover:text-[#b98b2f] transition text-xs"
                              dir="ltr"
                            >
                              <Phone size={12} />{lead.phone}
                            </a>
                            {lead.secondaryPhone && (
                              <a href={`tel:${lead.secondaryPhone}`} className="block text-xs text-slate-400 mt-0.5 hover:text-[#d9ae4c]" dir="ltr">
                                {lead.secondaryPhone}
                              </a>
                            )}
                          </td>

                          {/* Type + stage */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <TypeBadge type={lead.leadType} />
                              {lead.processStage && (
                                <span className="text-[10px] text-slate-500 font-medium leading-tight">{lead.processStage}</span>
                              )}
                            </div>
                          </td>

                          {/* Budget */}
                          <td className="px-4 py-3">
                            {fmtBudget(lead.budgetMin, lead.budgetMax)
                              ? <span className="text-xs font-black text-[#d9ae4c]">{fmtBudget(lead.budgetMin, lead.budgetMax)}</span>
                              : <span className="text-slate-300 text-xs">—</span>}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3"><StatusBadge status={lead.leadStatus} /></td>

                          {/* Source */}
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-500 font-medium">{lead.source || "—"}</span>
                          </td>

                          {/* Date */}
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-400">{fmtDate(lead.createdAt)}</span>
                            {lead.lastContact && <p className="text-[10px] text-slate-300">קשר: {fmtDate(lead.lastContact)}</p>}
                          </td>

                          {/* Agent */}
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-500 font-bold">{agentName(lead.agentId)}</span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <a href={`tel:${lead.phone}`}
                                className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition"
                                title="התקשר"
                              >
                                <Phone size={13} />
                              </a>
                              <button
                                onClick={() => openEdit(lead)}
                                className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition"
                                title="ערוך"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => setDeletingId(lead.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                                title="מחק"
                              >
                                <Trash2 size={13} />
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
                  {filtered.map(lead => (
                    <div key={lead.id} className="p-4 hover:bg-[#fffdf8] transition" onClick={() => setViewingLead(lead)}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-black text-slate-900">{lead.name}</p>
                            <TypeBadge type={lead.leadType} />
                          </div>
                          <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[#d9ae4c] font-bold text-sm mt-0.5" dir="ltr"
                          >
                            <Phone size={11} />{lead.phone}
                          </a>
                          {lead.neighborhood && (
                            <p className="text-xs text-slate-400 mt-0.5">{lead.neighborhood}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <StatusBadge status={lead.leadStatus} />
                          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            <button onClick={() => openEdit(lead)} className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition">
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => setDeletingId(lead.id)} className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                        {fmtBudget(lead.budgetMin, lead.budgetMax) && (
                          <span className="text-xs font-black text-[#d9ae4c]">{fmtBudget(lead.budgetMin, lead.budgetMax)}</span>
                        )}
                        {lead.processStage && <span className="text-xs text-slate-500">{lead.processStage}</span>}
                        <TagPills tags={lead.tags} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {filtered.length > 0 && (
            <p className="mt-2 text-center text-xs text-slate-400">{filtered.length} לידים מוצגים</p>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {viewingLead && !modalOpen && (
        <LeadPanel
          lead={viewingLead}
          agentName={agentName(viewingLead.agentId)}
          onEdit={() => openEdit(viewingLead)}
          onClose={() => setViewingLead(null)}
        />
      )}

      {/* Modal */}
      {modalOpen && (
        <LeadModal
          initial={editingLead}
          agents={agents}
          isAdmin={isAdmin ?? false}
          currentAgentId={agent?.id ?? 0}
          onClose={() => { setModalOpen(false); setEditingLead(null); }}
          onSave={handleSave}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Delete confirm */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center" dir="rtl">
            <div className="size-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={22} className="text-red-400" />
            </div>
            <h3 className="font-black text-lg text-slate-900 mb-1">למחוק את הליד?</h3>
            <p className="text-slate-500 text-sm mb-5">פעולה זו אינה ניתנת לביטול.</p>
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
