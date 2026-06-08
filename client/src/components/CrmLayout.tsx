import { useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  Handshake,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquareText,
  PanelRight,
  Receipt,
  Users,
} from "lucide-react";
import { toast } from "sonner";

type CrmLayoutProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

const navItems = [
  { label: "דשבורד", href: "/crm/dashboard", icon: LayoutDashboard },
  { label: "לידים", href: "/crm", icon: Users },
  { label: "בלעדויות", href: "/crm/exclusivities", icon: KeyRound },
  { label: "התאמות", href: "/crm/matches", icon: Handshake },
  { label: "פולואפ", href: "/crm/followup", icon: CalendarCheck },
  { label: "משימות", href: "/crm/tasks", icon: ClipboardCheck },
  { label: "פעולות שיווק", href: "/crm/marketing", icon: Megaphone },
  { label: "הכנסות והוצאות", href: "/crm/finance", icon: Receipt },
  { label: "תבניות הודעה", href: "/crm/templates", icon: MessageSquareText },
  { label: "מסמכים", href: "/crm/documents", icon: FileText },
];

function isActive(pathname: string, href: string) {
  const normalizedPath = pathname.replace(/^\/agent-dashboard\/crm/, "/crm");
  if (href === "/crm") return normalizedPath === href;
  return normalizedPath === href || normalizedPath.startsWith(`${href}/`);
}

export default function CrmLayout({ title, subtitle, children }: CrmLayoutProps) {
  const [location, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: agent } = trpc.agent.me.useQuery();

  const activeHref = useMemo(
    () => navItems.find((item) => isActive(location, item.href))?.href ?? "/crm",
    [location],
  );

  useEffect(() => {
    const suppressBrowserSuggestions = () => {
      const fields = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(".crm-shell input, .crm-shell textarea");
      fields.forEach((field) => {
        field.setAttribute("autocomplete", "off");
        field.setAttribute("data-lpignore", "true");
        field.setAttribute("data-form-type", "other");
      });
    };

    suppressBrowserSuggestions();
    const observer = new MutationObserver(suppressBrowserSuggestions);
    const shell = document.querySelector(".crm-shell");
    if (shell) observer.observe(shell, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [location]);

  const logoutMutation = trpc.agent.logout.useMutation({
    onSuccess: async () => {
      await utils.agent.me.invalidate();
      toast.success("התנתקת בהצלחה.");
      navigate("/agent-login");
    },
  });

  return (
    <div className="crm-shell min-h-screen bg-[#f5f3ee]" dir="rtl">
      <aside className="fixed right-0 top-0 z-30 flex h-screen w-[288px] flex-col overflow-y-auto border-l border-[#d9ae4c]/20 bg-[#0d0d0d] px-5 py-6 text-white shadow-2xl shadow-black/20">
        <div className="border-b border-white/10 pb-5">
          <Link href="/">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#d9ae4c]">Team Shay</span>
          </Link>
          <div className="mt-3 flex items-start gap-3">
            <div className="rounded-2xl bg-[#d9ae4c] p-3 text-black">
              <PanelRight className="size-6" />
            </div>
            <div>
              <p className="text-2xl font-black leading-tight">CRM</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-white/55">
                מערכת ניהול עצמאית לנכסים, לידים, תבניות ואוטומציות.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-gradient-to-br from-[#d9ae4c] to-[#b98b2f] p-4 text-black">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-black/50">מחובר כ</p>
          <p className="mt-1 text-lg font-black">{agent?.name ?? "סוכן"}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-black/65">
            {agent?.accountRole === "admin" ? "גישה מלאה לכל הצוות" : "גישה לניהול CRM"}
          </p>
        </div>

        <nav className="mt-5 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-black transition ${
                  active
                    ? "bg-[#d9ae4c] text-black shadow-lg shadow-[#d9ae4c]/20"
                    : "text-white/62 hover:bg-white/8 hover:text-white"
                }`}
              >
                <Icon className={`size-4 shrink-0 ${active ? "text-black" : "text-[#d9ae4c]"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-4">
          <Link href="/agent-dashboard">
            <span className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-bold text-white/55 transition hover:bg-white/8 hover:text-white">
              <BarChart3 className="size-4 text-[#d9ae4c]" />
              חזרה לדשבורד סוכן
            </span>
          </Link>
          <button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-bold text-white/45 transition hover:bg-white/8 hover:text-white disabled:opacity-60"
          >
            <LogOut className="size-4" />
            {logoutMutation.isPending ? "מתנתקים..." : "התנתקות"}
          </button>
        </div>
      </aside>

      <main className="mr-[288px] min-h-screen px-6 py-6">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-5 rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.07)]">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#b98b2f]">CRM Team Shay</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950 md:text-5xl">{title}</h1>
            {subtitle ? <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{subtitle}</p> : null}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
