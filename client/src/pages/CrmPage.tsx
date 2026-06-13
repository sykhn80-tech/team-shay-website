import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CrmLayout from "@/components/CrmLayout";
import {
  Check,
  Copy,
  Download,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  User,
  UserRoundCog,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { leadLocation, leadNeighborhood, leadStreet } from "@/lib/lead-display";
import { CrmMultiSearchSelect, CrmSearchSelect } from "@/components/CrmSearchSelect";
import {
  LEAD_TYPE_OPTIONS,
  NEIGHBORHOOD_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  ROOM_OPTIONS,
  leadTypeLabel,
  normalizeLeadType,
  type CrmOption,
} from "@/lib/crm-options";

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
  leadStatus: "חדש" | "פעיל" | "ממתין" | "סגור" | "לא רלוונטי";
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
  propertyCity?: string | null;
  propertyRooms?: string | null;
  propertyType?: string | null;
  currentPropertyPrice?: number | null;
  exclusivityStartDate?: string | null;
  exclusivityEndDate?: string | null;
  marketingPrice?: number | null;
  ownerName?: string | null;
  desiredNeighborhoods?: string[];
  desiredRooms?: string | null;
  desiredPropertyType?: string | null;
  askingPrice?: number | null;
  rentalPrice?: number | null;
  dealDate?: string | null;
  finalPrice?: number | null;
  lastTransactionDate?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type FormState = {
  name: string; phone: string; secondaryPhone: string; email: string;
  neighborhood: string; notes: string; tags: string;
  leadStatus: "חדש" | "פעיל" | "ממתין" | "סגור" | "לא רלוונטי";
  source: string; agentId: number | null;
  leadType: string; budgetMin: string; budgetMax: string; desiredBudget: string;
  processStage: string; lastContact: string;
  meetingDate: string; meetingTime: string; meetingNotes: string; meetingLocation: string;
  propertyNeighborhood: string; propertyStreet: string; propertyCity: string;
  propertyRooms: string; propertyType: string; currentPropertyPrice: string;
  exclusivityStartDate: string; exclusivityEndDate: string; marketingPrice: string; ownerName: string;
  desiredNeighborhoods: string[]; desiredRooms: string; desiredPropertyType: string;
  askingPrice: string; rentalPrice: string; dealDate: string; finalPrice: string; lastTransactionDate: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ["חדש", "פעיל", "ממתין", "סגור", "לא רלוונטי"] as const;
const PROCESS_STAGES = ["יצירת קשר ראשוני","פגישת היכרות","בדיקת נכסים","הצעת מחיר","משא ומתן","חתימת חוזה","סגירת עסקה","לא רלוונטי"];
const SOURCE_OPTIONS = ["יד2","הומלי","פייסבוק","אינסטגרם","Organic","ממולץ","Google","אחר"];

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  "חדש":         { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-400" },
  "פעיל":        { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  "ממתין":       { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  "סגור":        { bg: "bg-slate-100",  text: "text-slate-500",   dot: "bg-slate-400" },
  "לא רלוונטי": { bg: "bg-red-50",     text: "text-red-500",     dot: "bg-red-400" },
};

const TYPE_STYLE: Record<string, string> = {
  "בלעדיות": "bg-violet-50 text-violet-700 border-violet-200",
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

function isExclusiveValue(value?: string | null) {
  return /exclusive|בלעדי|בלעדיות/i.test(value ?? "");
}

function displayLeadType(type?: string | null) {
  return leadTypeLabel(type);
}

function leadMatchesTag(lead: Lead, tag: string) {
  if (isExclusiveValue(tag)) return isExclusiveValue(`${lead.tags} ${lead.leadType}`);
  return lead.tags.includes(tag);
}

function leadMatchesType(lead: Lead, type: string) {
  if (isExclusiveValue(type)) return isExclusiveValue(`${lead.tags} ${lead.leadType}`);
  return normalizeLeadType(lead.leadType) === normalizeLeadType(type);
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
    propertyCity:"ירושלים",propertyRooms:"",propertyType:"",currentPropertyPrice:"",
    exclusivityStartDate:"",exclusivityEndDate:"",marketingPrice:"",ownerName:"",
    desiredNeighborhoods:[],desiredRooms:"",desiredPropertyType:"",askingPrice:"",
    rentalPrice:"",dealDate:"",finalPrice:"",lastTransactionDate:"",
  };
}

function cleanImportedNotes(notes?: string | null) {
  return (notes ?? "")
    .split("\n")
    .filter(line => !/^\s*(סוג ליד|רחוב)\s*:/i.test(line))
    .join("\n")
    .trim();
}

function syncLeadTypeTag(tags: string, leadType: string) {
  const retained = tags
    .split(",")
    .map(tag => tag.trim())
    .filter(Boolean)
    .filter(tag => !["בלעדיות", "בלעדי", "exclusive", "קונה", "buyer", "מוכר", "seller", "שכירות"].includes(tag));
  return Array.from(new Set([...retained, ...(leadType ? [leadType] : [])])).join(",");
}

// ─── Small UI components ──────────────────────────────────────────────────────

function SectionCard({ title, icon, children, className = "" }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-[#D4AF37]/35 bg-white p-4 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center gap-2 border-b border-[#D4AF37]/20 pb-3">
        <span className="flex size-8 items-center justify-center rounded-xl bg-[#fff7df] text-[#b98b2f]">{icon}</span>
        <h3 className="text-base font-black text-slate-900">{title}</h3>
      </div>
      {children}
    </section>
  );
}

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
  const label = displayLeadType(type) ?? type;
  const cls = TYPE_STYLE[label] ?? "bg-slate-50 text-slate-600 border-slate-200";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${cls}`}>{label}</span>;
}

// ─── Export CSV ───────────────────────────────────────────────────────────────

function exportCsv(leads: Lead[], agentName: (id: number | null) => string) {
  const headers = ["שם","רחוב","שכונה","טלפון","טלפון נוסף","אימייל","סוג ליד","סטטוס","שלב תהליך","תקציב מינ","תקציב מקס","מקור","סוכן","הערות","תאריך יצירה"];
  const rows = leads.map(l => [
    l.name, leadStreet(l), leadNeighborhood(l), l.phone, l.secondaryPhone ?? "", l.email ?? "",
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

async function exportXlsx(leads: Lead[], agentName: (id: number | null) => string) {
  const XLSX = await import("xlsx");
  const rows = leads.map((lead) => ({
    "שם": lead.name,
    "טלפון": lead.phone,
    "סוג ליד": leadTypeLabel(lead.leadType),
    "סטטוס": lead.leadStatus,
    "בעלים": agentName(lead.agentId),
    "מקור": lead.source ?? "",
    "רחוב": leadStreet(lead),
    "שכונה": leadNeighborhood(lead),
    "עיר": lead.propertyCity ?? "",
    "תאריך יצירה": fmtDate(lead.createdAt),
  }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "לידים");
  XLSX.writeFile(workbook, `team-shay-leads-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ─── Lead modal ───────────────────────────────────────────────────────────────

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
      email: initial.email ?? "", neighborhood: initial.propertyNeighborhood ?? initial.neighborhood ?? "",
      notes: cleanImportedNotes(initial.notes), tags: initial.tags ?? "", leadStatus: initial.leadStatus,
      source: initial.source ?? "", agentId: initial.agentId,
      leadType: normalizeLeadType(initial.leadType),
      budgetMin: initial.budgetMin != null ? String(initial.budgetMin) : "",
      budgetMax: initial.budgetMax != null ? String(initial.budgetMax) : "",
      desiredBudget: initial.desiredBudget ?? "", processStage: initial.processStage ?? "",
      lastContact: initial.lastContact ? String(initial.lastContact).slice(0,10) : "",
      meetingDate: initial.meetingDate ? String(initial.meetingDate).slice(0,10) : "",
      meetingTime: initial.meetingTime ?? "", meetingNotes: initial.meetingNotes ?? "",
      meetingLocation: initial.meetingLocation ?? "",
      propertyNeighborhood: initial.propertyNeighborhood ?? initial.neighborhood ?? "",
      propertyStreet: initial.propertyStreet ?? "",
      propertyCity: initial.propertyCity ?? "ירושלים",
      propertyRooms: initial.propertyRooms ?? "", propertyType: initial.propertyType ?? "",
      currentPropertyPrice: initial.currentPropertyPrice != null ? String(initial.currentPropertyPrice) : "",
      exclusivityStartDate: initial.exclusivityStartDate?.slice(0, 10) ?? "",
      exclusivityEndDate: initial.exclusivityEndDate?.slice(0, 10) ?? "",
      marketingPrice: initial.marketingPrice != null ? String(initial.marketingPrice) : "",
      ownerName: initial.ownerName ?? initial.name,
      desiredNeighborhoods: initial.desiredNeighborhoods ?? [],
      desiredRooms: initial.desiredRooms ?? "",
      desiredPropertyType: initial.desiredPropertyType ?? "",
      askingPrice: initial.askingPrice != null ? String(initial.askingPrice) : "",
      rentalPrice: initial.rentalPrice != null ? String(initial.rentalPrice) : "",
      dealDate: initial.dealDate?.slice(0, 10) ?? "",
      finalPrice: initial.finalPrice != null ? String(initial.finalPrice) : "",
      lastTransactionDate: initial.lastTransactionDate?.slice(0, 10) ?? "",
    } : emptyForm(currentAgentId)
  );

  const f = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const field = (label: string, key: keyof FormState, opts?: { type?: string; dir?: string }) => (
    <div>
      <label className="block text-sm font-black text-slate-700 mb-1.5">{label}</label>
      <Input
        value={form[key] as string}
        onChange={f(key)}
        type={opts?.type ?? "text"}
        dir={opts?.dir}
        className={`h-11 rounded-xl bg-white ${["date", "time"].includes(opts?.type ?? "") && !form[key] ? "crm-empty-temporal" : ""}`}
      />
    </div>
  );

  const select = (label: string, key: keyof FormState, options: CrmOption[], opts?: { creatable?: boolean }) => (
    <div>
      <label className="block text-sm font-black text-slate-700 mb-1.5">{label}</label>
      <CrmSearchSelect
        value={form[key] as string}
        options={options}
        onChange={value => setForm(previous => ({ ...previous, [key]: String(value ?? "") }))}
        placeholder="— לא נבחר —"
        isCreatable={opts?.creatable}
      />
    </div>
  );

  const pillChoice = (label: string, key: "leadType" | "leadStatus", options: readonly (string | CrmOption)[]) => (
    <div>
      <label className="mb-2 block text-sm font-black text-slate-700">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(item => {
          const option = typeof item === "string" ? { value: item, label: item } : item;
          const active = form[key] === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setForm(previous => ({ ...previous, [key]: option.value }))}
              className={`rounded-full border px-3.5 py-2 text-xs font-black transition ${
                active
                  ? "border-[#d9ae4c] bg-[#d9ae4c] text-black shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#d9ae4c]/70 hover:bg-amber-50"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm md:p-6">
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] bg-[#f8f7f3] shadow-2xl" dir="rtl">

        {/* Header */}
        <div className="z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 md:px-7">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#b98b2f]">{initial ? `ליד #${initial.id}` : "רשומה חדשה"}</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">{initial ? `עריכת ${initial.name}` : "יצירת ליד חדש"}</h2>
            <p className="mt-1 text-sm text-slate-500">כל המידע החשוב במסך אחד. שדות ריקים יכולים להישאר ריקים.</p>
          </div>
          <button onClick={onClose} className="rounded-full border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:bg-slate-100"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto p-4 md:p-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="פרטי קשר" icon={<User size={17} />}>
              <div className="grid gap-3 sm:grid-cols-2">
                {field("שם מלא *", "name")}
                {field("טלפון ראשי *", "phone", { dir: "ltr" })}
                {field("טלפון נוסף", "secondaryPhone", { dir: "ltr" })}
                {field("אימייל", "email", { dir: "ltr" })}
              </div>
            </SectionCard>

            <SectionCard title="ניהול הליד" icon={<Check size={17} />}>
              <div className="space-y-4">
                {pillChoice("סוג ליד", "leadType", LEAD_TYPE_OPTIONS)}
                {pillChoice("סטטוס", "leadStatus", STATUS_OPTIONS)}
                <div className="grid gap-3 sm:grid-cols-2">
                {select("שלב תהליך", "processStage", PROCESS_STAGES.map(value => ({ value, label: value })))}
                {select("מקור", "source", SOURCE_OPTIONS.map(value => ({ value, label: value })), { creatable: true })}
                {field("קשר אחרון", "lastContact", { type: "date" })}
                  {isAdmin && (
                    <div>
                      <label className="block text-sm font-black text-slate-700 mb-1.5">סוכן אחראי</label>
                      <CrmSearchSelect
                        value={form.agentId}
                        options={agents.map(agent => ({ value: agent.id, label: agent.name }))}
                        onChange={value => setForm(previous => ({ ...previous, agentId: value == null ? null : Number(value) }))}
                        placeholder="— ללא סוכן —"
                      />
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>

            {form.leadType ? (
              <SectionCard title={`פרטי ${leadTypeLabel(form.leadType)}`} icon={<MapPin size={17} />} className="lg:col-span-2">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {["exclusive", "seller", "rental", "agreement", "buyer_and_seller"].includes(form.leadType) && field("רחוב ומספר", "propertyStreet")}
                  {["exclusive", "seller", "rental", "agreement", "buyer_and_seller"].includes(form.leadType) && field("עיר", "propertyCity")}
                  {["exclusive", "seller", "rental", "agreement", "buyer_and_seller"].includes(form.leadType) && field("שכונה", "propertyNeighborhood")}
                  {["exclusive", "seller", "rental", "buyer_and_seller"].includes(form.leadType) && select("סוג נכס", "propertyType", PROPERTY_TYPE_OPTIONS)}
                  {["exclusive", "seller", "rental", "buyer_and_seller"].includes(form.leadType) && select("מספר חדרים", "propertyRooms", ROOM_OPTIONS)}
                  {form.leadType === "exclusive" && field("תחילת בלעדיות", "exclusivityStartDate", { type: "date" })}
                  {form.leadType === "exclusive" && field("סיום בלעדיות", "exclusivityEndDate", { type: "date" })}
                  {form.leadType === "exclusive" && field("מחיר שיווק (₪)", "marketingPrice", { type: "number", dir: "ltr" })}
                  {form.leadType === "exclusive" && field("שם בעל הנכס", "ownerName")}
                  {["buyer", "buyer_and_seller"].includes(form.leadType) && (
                    <div>
                      <label className="block text-sm font-black text-slate-700 mb-1.5">שכונות רצויות</label>
                      <CrmMultiSearchSelect
                        value={form.desiredNeighborhoods}
                        options={NEIGHBORHOOD_OPTIONS}
                        onChange={value => setForm(previous => ({ ...previous, desiredNeighborhoods: value }))}
                        isCreatable
                      />
                    </div>
                  )}
                  {["buyer", "buyer_and_seller"].includes(form.leadType) && field("תקציב מקסימלי (₪)", "budgetMax", { type: "number", dir: "ltr" })}
                  {["buyer", "buyer_and_seller"].includes(form.leadType) && select("מספר חדרים רצוי", "desiredRooms", ROOM_OPTIONS)}
                  {["buyer", "buyer_and_seller"].includes(form.leadType) && select("סוג נכס רצוי", "desiredPropertyType", PROPERTY_TYPE_OPTIONS)}
                  {["seller", "buyer_and_seller"].includes(form.leadType) && field("מחיר מבוקש (₪)", "askingPrice", { type: "number", dir: "ltr" })}
                  {form.leadType === "rental" && field("מחיר שכירות (₪)", "rentalPrice", { type: "number", dir: "ltr" })}
                  {form.leadType === "agreement" && field("תאריך עסקה", "dealDate", { type: "date" })}
                  {form.leadType === "agreement" && field("מחיר סופי (₪)", "finalPrice", { type: "number", dir: "ltr" })}
                  {form.leadType === "past_client" && field("תאריך עסקה אחרונה", "lastTransactionDate", { type: "date" })}
                </div>
              </SectionCard>
            ) : null}

            <SectionCard title="הערות עבודה" icon={<Pencil size={17} />} className="lg:col-span-2">
              <div>
                  <label className="block text-sm font-black text-slate-700 mb-1.5">הערות כלליות</label>
                  <textarea value={form.notes} onChange={f("notes")} rows={4}
                    className="crm-field w-full resize-none"
                  />
                </div>
            </SectionCard>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 md:px-7">
          <p className="hidden text-xs font-bold text-slate-400 sm:block">השדות נשמרים ישירות ברשומת הליד ובאוטומציות המחוברות.</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="rounded-full font-bold">ביטול</Button>
          <Button
            disabled={isSaving}
            onClick={() => {
              if (!form.name.trim() || !form.phone.trim()) {
                toast.error("שם מלא וטלפון ראשי הם שדות חובה.");
                return;
              }
              onSave(form);
            }}
              className="rounded-full bg-[#d9ae4c] px-6 font-black text-black hover:bg-[#c99a31]"
          >
            <Check size={15} />
            {isSaving ? "שומר..." : initial ? "שמור שינויים" : "הוסף ליד"}
          </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main CRM Page ────────────────────────────────────────────────────────────

type CrmPageProps = {
  initialTag?: string;
  title?: string;
  subtitle?: string;
};

export default function CrmPage({
  initialTag = "",
  title = "ניהול לידים",
  subtitle,
}: CrmPageProps = {}) {
  const { data: agent } = trpc.agent.me.useQuery();
  const isAdmin = agent?.accountRole === "admin";

  const [search, setSearch] = useState("");
  const [filterAgentId, setFilterAgentId] = useState<number | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterNeighborhood, setFilterNeighborhood] = useState("");
  const [filterTag, setFilterTag] = useState(initialTag);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const agentsQuery = trpc.admin.listStaff.useQuery();
  const agents = (agentsQuery.data ?? []) as Array<{ id: number; name: string }>;

  const leadsQuery = trpc.crm.list.useQuery({ search: search || undefined, agentId: undefined });
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
    const neighborhood = form.propertyNeighborhood || null;
    const p = {
      name: form.name, phone: form.phone, secondaryPhone: form.secondaryPhone || null,
      email: form.email || null, neighborhood,
      notes: cleanImportedNotes(form.notes) || null, tags: syncLeadTypeTag(form.tags, form.leadType), leadStatus: form.leadStatus,
      source: form.source || null, agentId: form.agentId,
      leadType: form.leadType || null,
      budgetMin: form.budgetMin ? Number(form.budgetMin) : null,
      budgetMax: form.budgetMax ? Number(form.budgetMax) : null,
      desiredBudget: form.desiredBudget || null, processStage: form.processStage || null,
      lastContact: form.lastContact || null, meetingDate: form.meetingDate || null,
      meetingTime: form.meetingTime || null, meetingNotes: form.meetingNotes || null,
      meetingLocation: form.meetingLocation || null,
      propertyNeighborhood: neighborhood,
      propertyStreet: form.propertyStreet || null, propertyCity: form.propertyCity || null,
      propertyRooms: form.propertyRooms || null,
      propertyType: form.propertyType || null,
      currentPropertyPrice: form.currentPropertyPrice ? Number(form.currentPropertyPrice) : null,
      exclusivityStartDate: form.exclusivityStartDate || null,
      exclusivityEndDate: form.exclusivityEndDate || null,
      marketingPrice: form.marketingPrice ? Number(form.marketingPrice) : null,
      ownerName: form.ownerName || null,
      desiredNeighborhoods: form.desiredNeighborhoods,
      desiredRooms: form.desiredRooms || null,
      desiredPropertyType: form.desiredPropertyType || null,
      askingPrice: form.askingPrice ? Number(form.askingPrice) : null,
      rentalPrice: form.rentalPrice ? Number(form.rentalPrice) : null,
      dealDate: form.dealDate || null,
      finalPrice: form.finalPrice ? Number(form.finalPrice) : null,
      lastTransactionDate: form.lastTransactionDate || null,
    };
    if (editingLead) updateMutation.mutate({ id: editingLead.id, ...p });
    else createMutation.mutate(p);
  }

  function openEdit(lead: Lead) { setEditingLead(lead); setModalOpen(true); }

  const agentName = (id: number | null) => {
    if (!id) return "—";
    return agents.find(a => a.id === id)?.name ?? `#${id}`;
  };

  const filtered = leads.filter(l => {
    if (filterNeighborhood && !leadNeighborhood(l).toLowerCase().includes(filterNeighborhood.toLowerCase())) return false;
    if (filterAgentId && l.agentId !== filterAgentId) return false;
    if (filterStatus && l.leadStatus !== filterStatus) return false;
    if (filterType && !leadMatchesType(l, filterType)) return false;
    if (filterSource && l.source !== filterSource) return false;
    if (filterTag && !leadMatchesTag(l, filterTag)) return false;
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

  const resetFilters = () => {
    setFilterStatus("");
    setFilterType("");
    setFilterSource("");
    setFilterNeighborhood("");
    setFilterTag(initialTag);
  };

  const hasActiveFilters = filterStatus || filterType || filterSource || filterNeighborhood || filterTag !== initialTag;

  return (
    <CrmLayout title={title} subtitle={subtitle ?? "כל לידי הצוות במקום אחד"}>
      <div className="min-h-screen bg-[#f5f3ee] px-3 py-5 md:px-6 md:py-7" dir="rtl">
        <div className="mx-auto max-w-7xl">

          {/* ── Actions ────────────────────────────────────────── */}
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold text-slate-500">
              {stats.total} רשומות · לחיצה על ליד פותחת עריכה ישירה
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={() => void exportXlsx(filtered, agentName)}
                className="rounded-full border-slate-200 text-slate-600 font-bold h-9 px-4 text-sm hover:bg-white"
              >
                <Download size={14} />
                XLSX ({filtered.length})
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
            <div className="mb-3 flex flex-wrap gap-2 border-b border-slate-100 pb-3">
              {[
                { label: "הכל", active: !filterStatus && !filterType && filterTag === initialTag, action: resetFilters },
                { label: "חדשים", active: filterStatus === "חדש", action: () => { resetFilters(); setFilterStatus("חדש"); } },
                { label: "בלעדיות", active: filterType === "exclusive", action: () => { resetFilters(); setFilterType("exclusive"); } },
                { label: "קונים", active: filterType === "buyer", action: () => { resetFilters(); setFilterType("buyer"); } },
                { label: "פוטנציאלי", active: filterStatus === "פעיל", action: () => { resetFilters(); setFilterStatus("פעיל"); } },
              ].map((filter) => (
                <button
                  key={filter.label}
                  type="button"
                  onClick={filter.action}
                  className={`rounded-full px-4 py-2 text-xs font-black transition ${
                    filter.active ? "bg-[#1a1a1a] text-[#d4af37]" : "border border-slate-200 bg-white text-slate-600 hover:border-[#d4af37]"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-40">
                <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  autoComplete="off"
                  placeholder="חיפוש שם, טלפון, שכונה..."
                  className="w-full h-9 pr-8 pl-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-slate-50"
                />
              </div>
              <div className="relative min-w-36">
                <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={filterNeighborhood}
                  onChange={event => setFilterNeighborhood(event.target.value)}
                  autoComplete="off"
                  placeholder="חיפוש שכונה"
                  className="h-11 w-full rounded-lg border-[1.5px] border-[#D4AF37] bg-[#FAFAFA] pr-8 pl-3 text-sm font-bold outline-none focus:shadow-[0_0_0_3px_rgba(212,175,55,0.2)]"
                />
              </div>
              {[
                { val: filterStatus, set: setFilterStatus, opts: STATUS_OPTIONS.map(value => ({ value, label: value })), placeholder: "סטטוס" },
                { val: filterType, set: setFilterType, opts: LEAD_TYPE_OPTIONS, placeholder: "סוג ליד" },
                ...(sourceSet.length ? [{ val: filterSource, set: setFilterSource, opts: sourceSet.map(value => ({ value, label: value })), placeholder: "מקור" }] : []),
              ].map((f, i) => (
                <div key={i} className="min-w-32">
                  <CrmSearchSelect value={f.val} onChange={value => f.set(String(value ?? ""))} options={f.opts} placeholder={f.placeholder} />
                </div>
              ))}
              <div className="min-w-36">
                <CrmSearchSelect
                  value={filterAgentId}
                  onChange={value => setFilterAgentId(value == null ? undefined : Number(value))}
                  options={agents.map(agent => ({ value: agent.id, label: agent.name }))}
                  placeholder="כל הסוכנים"
                />
              </div>
              {hasActiveFilters && (
                <button onClick={resetFilters}
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
                        {["לקוח","יצירת קשר","סוג וסטטוס","בעלים","מקור","תאריך יצירה","פעולות"].map((h,i) => (
                          <th key={i} className={`text-right px-4 py-3 font-black text-slate-400 text-[11px] uppercase tracking-wide ${h === "פעולות" ? "w-24 text-center" : ""}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filtered.map(lead => (
                        <tr key={lead.id}
                          className="hover:bg-[#fffdf8] transition-colors group cursor-pointer"
                          onClick={() => openEdit(lead)}
                        >
                          {/* Name + address */}
                          <td className="px-4 py-3">
                            <p className="font-black text-slate-900 leading-tight">{lead.name}</p>
                            {leadLocation(lead) && (
                              <p className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-600">
                                <MapPin size={11} className="shrink-0 text-[#d9ae4c]" />
                                {leadLocation(lead)}
                              </p>
                            )}
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

                          {/* Type + status */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <TypeBadge type={lead.leadType} />
                              <StatusBadge status={lead.leadStatus} />
                            </div>
                          </td>

                          {/* Agent */}
                          <td className="px-4 py-3">
                            <span className="text-xs font-black text-[#b98b2f]">{agentName(lead.agentId)}</span>
                          </td>

                          {/* Source */}
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-500 font-medium">{lead.source || "—"}</span>
                          </td>

                          {/* Date */}
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-400">{fmtDate(lead.createdAt)}</span>
                            {lead.lastContact && <p className="text-[10px] text-slate-300">קשר: {fmtDate(lead.lastContact)}</p>}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1 transition-opacity">
                              <a href={`https://wa.me/${lead.phone.replace(/\D/g, "").replace(/^0/, "972")}`} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600" title="WhatsApp"><MessageCircle size={13} /></a>
                              <button
                                onClick={() => openEdit(lead)}
                                className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition"
                                title="ערוך"
                              >
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => updateMutation.mutate({ id: lead.id, lastContact: new Date().toISOString().slice(0, 10) })} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600" title="רענן קשר"><RefreshCw size={13} /></button>
                              <button onClick={() => openEdit(lead)} className="p-1.5 rounded-lg text-slate-400 hover:bg-purple-50 hover:text-purple-600" title="העבר לסוכן"><UserRoundCog size={13} /></button>
                              <button onClick={() => createMutation.mutate({
                                name: `${lead.name} - עותק`, phone: lead.phone, secondaryPhone: lead.secondaryPhone ?? null, email: lead.email,
                                neighborhood: lead.neighborhood, notes: lead.notes, tags: lead.tags, leadStatus: lead.leadStatus,
                                source: lead.source, agentId: lead.agentId, leadType: lead.leadType ?? null,
                              })} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="שכפל"><Copy size={13} /></button>
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
                    <div key={lead.id} className="p-4 hover:bg-[#fffdf8] transition" onClick={() => openEdit(lead)}>
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
                          {leadLocation(lead) && (
                            <p className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-600">
                              <MapPin size={11} className="shrink-0 text-[#d9ae4c]" />
                              {leadLocation(lead)}
                            </p>
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
    </CrmLayout>
  );
}
