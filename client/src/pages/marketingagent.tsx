import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Building2,
  ChevronLeft,
  CirclePlus,
  Copy,
  Check,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import { TEAM_LOGO } from "@/lib/siteData";
import { toast } from "sonner";

interface PropertyForm {
  neighborhood: string;
  street: string;
  floor: string;
  rooms: string;
  sqm: string;
  balcony: string;
  elevator: boolean;
  parking: boolean;
  storage: boolean;
  renovated: boolean;
  price: string;
  exclusive: boolean;
  notes: string;
}

interface MarketingOutput {
  facebook: string;
  instagram: string;
  yad2: string;
}

const EMPTY_FORM: PropertyForm = {
  neighborhood: "",
  street: "",
  floor: "",
  rooms: "",
  sqm: "",
  balcony: "",
  elevator: false,
  parking: false,
  storage: false,
  renovated: false,
  price: "",
  exclusive: false,
  notes: "",
};

async function generateMarketing(form: PropertyForm): Promise<MarketingOutput> {
  const details = [
    `עיר: ירושלים`,
    form.neighborhood && `שכונה: ${form.neighborhood}`,
    form.street && `רחוב: ${form.street}`,
    form.floor && `קומה: ${form.floor}`,
    form.rooms && `חדרים: ${form.rooms}`,
    form.sqm && `מ"ר בנוי: ${form.sqm}`,
    form.balcony && `מרפסת/גינה: ${form.balcony}`,
    `מעלית: ${form.elevator ? "יש" : "אין"}`,
    `חניה: ${form.parking ? "יש" : "אין"}`,
    `מחסן: ${form.storage ? "יש" : "אין"}`,
    `מצב שיפוץ: ${form.renovated ? "משופץ" : "לא משופץ"}`,
    form.price && `מחיר: ${Number(form.price).toLocaleString()} ₪`,
    `בלעדיות: ${form.exclusive ? "כן" : "לא"}`,
    form.notes && `הערות: ${form.notes}`,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `אתה סוכן שיווק נדל"ן מקצועי של צוות שי, לנדסמן ירושלים.
צור 3 תיאורי שיווק לנכס הבא. עברית בלבד. חדה, אנושית, מוכרת.
כל פוסט מסתיים עם "בלעדיות צוות שי | לנדסמן ירושלים".
אל תמציא פרטים שלא ניתנו. הדגש יתרונות ייחודיים, מיקום, פוטנציאל.

פרטי הנכס:
${details}

פלט נדרש:

─── פייסבוק ───
[פוסט 150-250 מילה, פתיחה חזקה, פרטים, יתרונות, CTA, 5-7 האשטאגים]

─── אינסטגרם ───
[קפשן עד 100 מילה, אימפקטי, CTA לDM, 8-10 האשטאגים]

─── יד2 ───
[תיאור רשמי 100-150 מילה, עובדות, בולטים, ללא האשטאגים]`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_KEY as string,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) throw new Error("שגיאה בקריאה ל-Claude API");
  const data = await res.json();
  const raw: string = data.content[0].text;

  const get = (pattern: RegExp) => {
    const m = raw.match(pattern);
    return m ? m[1].trim() : "";
  };

  return {
    facebook: get(/─── פייסבוק ───\n([\s\S]*?)(?=─── אינסטגרם ───|$)/),
    instagram: get(/─── אינסטגרם ───\n([\s\S]*?)(?=─── יד2 ───|$)/),
    yad2: get(/─── יד2 ───\n([\s\S]*?)$/),
  };
}

export default function MarketingAgent() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: agent } = trpc.agent.me.useQuery();
  const logoutMutation = trpc.agent.logout.useMutation({
    onSuccess: async () => {
      await utils.agent.me.invalidate();
      toast.success("התנתקת בהצלחה.");
      navigate("/agent-login");
    },
  });

  const [form, setForm] = useState<PropertyForm>(EMPTY_FORM);
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<MarketingOutput | null>(null);
  const [activeTab, setActiveTab] = useState<"facebook" | "instagram" | "yad2">("facebook");
  const [copied, setCopied] = useState("");

  const set = (key: keyof PropertyForm, val: string | boolean) =>
    setForm((f) => ({ ...f, [key]: val }));

  async function handleGenerate() {
    if (!form.neighborhood && !form.street) {
      toast.error("יש למלא לפחות שכונה או רחוב");
      return;
    }
    setGenerating(true);
    setOutput(null);
    try {
      const result = await generateMarketing(form);
      setOutput(result);
      setActiveTab("facebook");
      toast.success("התוכן השיווקי מוכן!");
    } catch (e: any) {
      toast.error(e.message || "שגיאה בייצור תוכן");
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
    toast.success("הטקסט הועתק ללוח");
  }

  const sidebarItems = [
    { label: "סקירה כללית", icon: LayoutDashboard, href: "/agent-dashboard", active: false },
    { label: "הנכסים שלי", icon: Building2, href: "/agent-dashboard", active: false },
    { label: "שיווק נכסים", icon: Megaphone, href: "/agent-dashboard/marketing", active: true },
    { label: "פרופיל סוכן", icon: UserCircle2, href: "/agent-dashboard", active: false },
  ];

  const tabs = [
    { key: "facebook" as const, label: "פייסבוק" },
    { key: "instagram" as const, label: "אינסטגרם" },
    { key: "yad2" as const, label: "יד2" },
  ];

  return (
    <div className="min-h-screen bg-[#fff8e6] text-black" dir="rtl">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">

        <aside className="border-l border-[#f3dfb0] bg-white px-5 py-6 shadow-[0_20px_50px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between gap-3">
            <img src={TEAM_LOGO} alt="Team Shay" className="h-14 w-auto object-contain" />
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#d9ae4c]">
              <ChevronLeft className="size-4" />
              לאתר
            </Link>
          </div>

          <div className="mt-8 rounded-[28px] bg-[#d9ae4c] p-5 text-white">
            <p className="text-sm font-bold text-white/80">שלום {agent?.name ?? "סוכן"}</p>
            <h1 className="mt-2 text-2xl font-black">אזור הסוכנים</h1>
            <p className="mt-3 text-sm leading-7 text-white/85">
              ייצור תוכן שיווקי אוטומטי לכל הפלטפורמות בלחיצה אחת.
            </p>
          </div>

          <nav className="mt-8 space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.label} href={item.href}>
                  <button
                    type="button"
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-right text-sm font-bold transition ${
                      item.active
                        ? "bg-[#fff4d8] text-[#b98b2f] shadow-[0_12px_24px_rgba(217,174,76,0.14)]"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </button>
                </Link>
              );
            })}
          </nav>

          <Button
            variant="outline"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="mt-6 w-full rounded-full border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="size-4" />
            {logoutMutation.isPending ? "מתנתקים..." : "התנתקות"}
          </Button>
        </aside>

        <main className="px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.08em] text-[#d9ae4c]">Marketing Agent</p>
                <h2 className="mt-3 text-3xl font-black text-black md:text-4xl">שיווק נכסים</h2>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  הזן פרטי נכס ← קבל תוכן שיווקי מוכן לפייסבוק, אינסטגרם ויד2.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#fff4d8] px-4 py-2 text-sm font-bold text-[#d9ae4c]">
                <CirclePlus className="size-4" />
                {agent?.email ?? "סוכן מחובר"}
              </div>
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_480px]">

              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
                <h3 className="text-xl font-black text-black">פרטי הנכס</h3>
                <p className="mt-1 text-sm text-slate-500">מלא את הפרטים — ככל שיש יותר, התוצאה טובה יותר</p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">שכונה *</label>
                    <input
                      value={form.neighborhood}
                      onChange={(e) => set("neighborhood", e.target.value)}
                      placeholder="למשל: קטמונים"
                      className="w-full rounded-2xl border border-slate-200 bg-[#fafafa] px-4 py-2.5 text-sm outline-none focus:border-[#d9ae4c] focus:ring-1 focus:ring-[#d9ae4c] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">רחוב ומספר</label>
                    <input
                      value={form.street}
                      onChange={(e) => set("street", e.target.value)}
                      placeholder="למשל: סן מרטין 9"
                      className="w-full rounded-2xl border border-slate-200 bg-[#fafafa] px-4 py-2.5 text-sm outline-none focus:border-[#d9ae4c] focus:ring-1 focus:ring-[#d9ae4c] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">קומה</label>
                    <input
                      value={form.floor}
                      onChange={(e) => set("floor", e.target.value)}
                      placeholder="למשל: 3 מתוך 5"
                      className="w-full rounded-2xl border border-slate-200 bg-[#fafafa] px-4 py-2.5 text-sm outline-none focus:border-[#d9ae4c] focus:ring-1 focus:ring-[#d9ae4c] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">חדרים</label>
                    <input
                      value={form.rooms}
                      onChange={(e) => set("rooms", e.target.value)}
                      placeholder="למשל: 3"
                      className="w-full rounded-2xl border border-slate-200 bg-[#fafafa] px-4 py-2.5 text-sm outline-none focus:border-[#d9ae4c] focus:ring-1 focus:ring-[#d9ae4c] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">מ״ר בנוי</label>
                    <input
                      value={form.sqm}
                      onChange={(e) => set("sqm", e.target.value)}
                      placeholder="למשל: 84"
                      className="w-full rounded-2xl border border-slate-200 bg-[#fafafa] px-4 py-2.5 text-sm outline-none focus:border-[#d9ae4c] focus:ring-1 focus:ring-[#d9ae4c] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">מרפסת / גינה</label>
                    <input
                      value={form.balcony}
                      onChange={(e) => set("balcony", e.target.value)}
                      placeholder="למשל: גינה 6 מ״ר"
                      className="w-full rounded-2xl border border-slate-200 bg-[#fafafa] px-4 py-2.5 text-sm outline-none focus:border-[#d9ae4c] focus:ring-1 focus:ring-[#d9ae4c] transition"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">מחיר מבוקש (₪)</label>
                    <input
                      value={form.price}
                      onChange={(e) => set("price", e.target.value)}
                      placeholder="למשל: 2600000"
                      type="number"
                      className="w-full rounded-2xl border border-slate-200 bg-[#fafafa] px-4 py-2.5 text-sm outline-none focus:border-[#d9ae4c] focus:ring-1 focus:ring-[#d9ae4c] transition"
                    />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {[
                    { key: "elevator" as const, label: "מעלית" },
                    { key: "parking" as const, label: "חניה" },
                    { key: "storage" as const, label: "מחסן" },
                    { key: "renovated" as const, label: "משופץ" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => set(key, !form[key])}
                        className={`h-5 w-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition ${
                          form[key] ? "bg-[#d9ae4c] border-[#d9ae4c]" : "border-slate-300 bg-white"
                        }`}
                      >
                        {form[key] && <Check className="size-3 text-white" />}
                      </div>
                      <span className="text-sm font-bold text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>

                <div className="mt-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => set("exclusive", !form.exclusive)}
                      className={`h-5 w-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition ${
                        form.exclusive ? "bg-[#d9ae4c] border-[#d9ae4c]" : "border-slate-300 bg-white"
                      }`}
                    >
                      {form.exclusive && <Check className="size-3 text-white" />}
                    </div>
                    <span className="text-sm font-bold text-slate-700">נכס בבלעדיות</span>
                  </label>
                </div>

                <div className="mt-5">
                  <label className="block text-sm font-bold text-slate-700 mb-1">פרטים נוספים / הערות</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    placeholder="כיווני אוויר, נוף, שכנים, קרבה לתחבורה, כל יתרון שרוצים להדגיש..."
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 bg-[#fafafa] px-4 py-2.5 text-sm outline-none focus:border-[#d9ae4c] focus:ring-1 focus:ring-[#d9ae4c] transition resize-none"
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="mt-6 h-12 w-full rounded-full bg-[#d9ae4c] text-base font-black text-white hover:bg-[#c99a31] disabled:opacity-60"
                >
                  {generating ? <>מייצר תוכן שיווקי...</> : <><Sparkles className="size-4" /> ייצר תוכן שיווקי</>}
                </Button>
              </div>

              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
                <h3 className="text-xl font-black text-black">תוצאות</h3>
                <p className="mt-1 text-sm text-slate-500">התוכן מוכן להעתקה ישירה לכל פלטפורמה</p>

                {!output && !generating && (
                  <div className="mt-8 rounded-[24px] bg-[#fff8e6] p-8 text-center">
                    <Megaphone className="mx-auto size-12 text-[#d9ae4c] opacity-40" />
                    <p className="mt-4 text-sm font-bold text-slate-500">מלא את פרטי הנכס ולחץ על ייצר תוכן</p>
                  </div>
                )}

                {generating && (
                  <div className="mt-8 rounded-[24px] bg-[#fff8e6] p-8 text-center">
                    <Sparkles className="mx-auto size-12 text-[#d9ae4c] animate-pulse" />
                    <p className="mt-4 text-sm font-bold text-slate-500">הסוכן מייצר תוכן שיווקי...</p>
                  </div>
                )}

                {output && (
                  <div className="mt-5">
                    <div className="flex rounded-2xl bg-[#fff8e6] p-1 gap-1">
                      {tabs.map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => setActiveTab(key)}
                          className={`flex-1 rounded-xl py-2 text-sm font-black transition ${
                            activeTab === key ? "bg-[#d9ae4c] text-white shadow-sm" : "text-slate-600 hover:text-[#d9ae4c]"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 rounded-[24px] bg-[#fafafa] border border-slate-100 p-4 text-sm leading-7 text-slate-700 whitespace-pre-wrap min-h-[260px]" dir="rtl">
                      {output[activeTab]}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => handleCopy(output[activeTab], activeTab)}
                      className={`mt-3 w-full rounded-full transition ${
                        copied === activeTab ? "border-green-300 bg-green-50 text-green-700" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {copied === activeTab ? <><Check className="size-4" /> הועתק!</> : <><Copy className="size-4" /> העתק טקסט</>}
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => { setOutput(null); setForm(EMPTY_FORM); }}
                      className="mt-2 w-full rounded-full text-slate-400 hover:text-slate-600 text-sm"
                    >
                      נקה והתחל מחדש
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
