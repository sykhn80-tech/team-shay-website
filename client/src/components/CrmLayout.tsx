import { useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  Calendar,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquareText,
  PanelRight,
  Receipt,
  Star,
  Target,
  UserRoundCog,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { LANDSMAN_LOGO } from "@/lib/siteData";

type CrmLayoutProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

const navItems: Array<{ label: string; href: string; icon: typeof LayoutDashboard; adminOnly?: boolean }> = [
  { label: "דשבורד", href: "/agent-dashboard/crm", icon: LayoutDashboard },
  { label: "לידים", href: "/agent-dashboard/crm/leads", icon: Users },
  { label: "צוות וזכיינים", href: "/admin", icon: UserRoundCog, adminOnly: true },
  { label: "התאמות", href: "/agent-dashboard/crm/matching", icon: Star },
  { label: "פולאפ", href: "/agent-dashboard/crm/followup", icon: CalendarCheck },
  { label: "סדנת יעדים", href: "/agent-dashboard/crm/goals", icon: Target },
  { label: "לוח שנה", href: "/agent-dashboard/crm/calendar", icon: Calendar },
  { label: "משימות", href: "/agent-dashboard/crm/tasks", icon: ClipboardCheck },
  { label: "פעולות שיווק", href: "/agent-dashboard/crm/marketing", icon: Megaphone },
  { label: "הכנסות והוצאות", href: "/agent-dashboard/crm/finance", icon: Receipt },
  { label: "תבניות הודעות", href: "/agent-dashboard/crm/templates", icon: MessageSquareText },
  { label: "מסמכים", href: "/agent-dashboard/crm/documents", icon: FileText },
];

function isActive(pathname: string, href: string) {
  if (href === "/agent-dashboard/crm") return pathname === href || pathname === "/crm/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function CrmLayout({ title, subtitle, children }: CrmLayoutProps) {
  const [location, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: agent } = trpc.agent.me.useQuery();

  const activeHref = useMemo(
    () => navItems.find((item) => isActive(location, item.href))?.href ?? "/agent-dashboard/crm",
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
      <aside className="fixed right-0 top-0 z-30 hidden h-screen w-[288px] flex-col overflow-y-auto border-l border-[#d9ae4c]/20 bg-[#0d0d0d] px-5 py-6 text-white shadow-2xl shadow-black/20 lg:flex">
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
          {navItems.filter((item) => !item.adminOnly || agent?.accountRole === "admin").map((item) => {
            const Icon = item.icon;
            const active = activeHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-black transition ${
                  active
                    ? "bg-[#d9ae4c] text-white shadow-lg shadow-[#d9ae4c]/20"
                    : "text-white/62 hover:bg-white/8 hover:text-white"
                }`}
              >
                <Icon className={`size-4 shrink-0 ${active ? "text-white" : "text-[#d9ae4c]"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-4">
          <div className="mb-3 flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2">
            <div>
              <p className="text-xs font-black text-white">{agent?.name ?? "סוכן"}</p>
              <p className="mt-0.5 text-[10px] text-white/45">{agent?.roleTitle ?? "Team Shay"}</p>
            </div>
            <img src={LANDSMAN_LOGO} alt="Landsman" className="h-7 w-auto object-contain brightness-0 invert" />
          </div>
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

      <main className="min-h-screen px-3 py-4 sm:px-6 sm:py-6 lg:mr-[288px]">
        <div className="mx-auto max-w-[1440px]">
          <nav className="mb-4 flex gap-2 overflow-x-auto rounded-2xl bg-[#1A1A1A] p-2 lg:hidden">
            {navItems.filter((item) => !item.adminOnly || agent?.accountRole === "admin").map((item) => {
              const Icon = item.icon;
              const active = activeHref === item.href;
              return <Link key={item.href} href={item.href} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-black ${active ? "bg-[#D4AF37] text-white" : "text-white/65"}`}><Icon className="size-4" />{item.label}</Link>;
            })}
          </nav>
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
