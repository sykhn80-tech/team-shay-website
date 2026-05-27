import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { TEAM_LOGO } from "@/lib/siteData";
import {
  BarChart2,
  Building2,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Upload,
  UserCircle2,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const NAV_ITEMS = [
  { label: "לוח בקרה", icon: LayoutDashboard, href: "/agent-dashboard", exact: true },
  { label: "הנכסים שלי", icon: Building2, href: "/agent-dashboard", exact: true },
  { label: "CRM לידים", icon: Users, href: "/agent-dashboard/crm", exact: false, highlight: true },
  { label: "שיווק נכסים", icon: Megaphone, href: "/agent-dashboard/marketing", exact: false },
  { label: "הערכת שווי CMA", icon: BarChart2, href: "/agent-dashboard/cma", exact: false },
  { label: "פרופיל סוכן", icon: UserCircle2, href: "/agent-dashboard", exact: true },
];

interface Props {
  children: React.ReactNode;
}

export default function AgentLayout({ children }: Props) {
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: agent } = trpc.agent.me.useQuery();

  const logoutMutation = trpc.agent.logout.useMutation({
    onSuccess: async () => {
      await utils.agent.me.invalidate();
      toast.success("התנתקת בהצלחה.");
      navigate("/agent-login");
    },
  });

  function isActive(item: typeof NAV_ITEMS[0]) {
    if (item.exact) return location === item.href;
    return location === item.href || location.startsWith(item.href + "/");
  }

  const SidebarInner = ({ onNav }: { onNav?: () => void }) => (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Logo */}
      <div className="flex items-center justify-between gap-3">
        <img src={TEAM_LOGO} alt="Team Shay" className="h-14 w-auto object-contain" />
        <Link href="/" onClick={onNav}>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-[#d9ae4c] hover:text-[#b98b2f]">
            <ChevronLeft className="size-4" />
            לאתר
          </span>
        </Link>
      </div>

      {/* Agent card */}
      <div className="mt-6 rounded-[22px] bg-gradient-to-br from-[#d9ae4c] to-[#c99a31] p-5 text-white shadow-lg shadow-amber-200/40">
        <p className="text-xs font-bold uppercase tracking-widest text-white/70">אזור סוכנים</p>
        <p className="mt-1 text-xl font-black">{agent?.name ?? "סוכן"}</p>
        {agent?.roleTitle && (
          <p className="mt-0.5 text-xs text-white/75 leading-5">{agent.roleTitle}</p>
        )}
        {agent?.accountRole === "admin" && (
          <span className="mt-2 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
            Admin
          </span>
        )}
      </div>

      {/* CRM shortcut for admin — prominent banner */}
      {agent?.accountRole === "admin" && (
        <Link href="/agent-dashboard/crm" onClick={onNav}>
          <div className={`mt-5 rounded-[18px] border-2 p-3.5 transition cursor-pointer ${
            location.startsWith("/agent-dashboard/crm")
              ? "border-[#d9ae4c] bg-[#d9ae4c] shadow-lg shadow-amber-200/40"
              : "border-[#f3dfb0] bg-[#fffdf5] hover:border-[#d9ae4c] hover:bg-[#fff8e0]"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${location.startsWith("/agent-dashboard/crm") ? "bg-white/20" : "bg-[#fff4d8]"}`}>
                <Users className={`size-5 ${location.startsWith("/agent-dashboard/crm") ? "text-white" : "text-[#d9ae4c]"}`} />
              </div>
              <div>
                <p className={`text-base font-black ${location.startsWith("/agent-dashboard/crm") ? "text-white" : "text-[#8a6a1a]"}`}>
                  CRM לידים
                </p>
                <p className={`text-xs font-medium ${location.startsWith("/agent-dashboard/crm") ? "text-white/80" : "text-[#b98b2f]"}`}>
                  כל הלידים של הצוות
                </p>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Nav */}
      <nav className="mt-5 space-y-1">
        {NAV_ITEMS.filter((item) => item.href !== "/agent-dashboard/crm").map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link key={item.label} href={item.href} onClick={onNav}>
              <span
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-right text-[15px] font-bold transition-all ${
                  active
                    ? "bg-[#fff4d8] text-[#b98b2f] shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`size-5 ${active ? "text-[#d9ae4c]" : "text-slate-400"}`} />
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* CRM — for non-admin */}
        {agent?.accountRole !== "admin" && (
          <Link href="/agent-dashboard/crm" onClick={onNav}>
            <span
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-right text-[15px] font-bold transition-all ${
                location.startsWith("/agent-dashboard/crm")
                  ? "bg-[#d9ae4c] text-white shadow-lg shadow-amber-200/40"
                  : "bg-[#fff4d8] text-[#b98b2f] hover:bg-[#ffedb0]"
              }`}
            >
              <Users className="size-5" />
              CRM לידים
            </span>
          </Link>
        )}

        {/* Admin: ייבוא לידים */}
        {agent?.accountRole === "admin" && (
          <Link href="/crm-import" onClick={onNav}>
            <span
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-right text-sm font-bold transition-all ${
                location === "/crm-import"
                  ? "bg-slate-100 text-slate-800"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              }`}
            >
              <Upload className="size-4" />
              ייבוא לידים
            </span>
          </Link>
        )}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Logout */}
      <Button
        variant="outline"
        onClick={() => logoutMutation.mutate()}
        disabled={logoutMutation.isPending}
        className="mt-6 w-full rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
      >
        <LogOut className="size-4" />
        {logoutMutation.isPending ? "מתנתקים..." : "התנתקות"}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fff8e6]" dir="rtl">

      {/* ── Mobile top bar ──────────────────────────────────────── */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-[#f3dfb0] bg-white px-4 py-3 shadow-sm">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="פתח תפריט"
          className="flex flex-col gap-1.5 rounded-xl p-2.5 bg-[#fff4d8] text-[#b98b2f] hover:bg-[#ffedb0] transition"
        >
          <span className="block h-0.5 w-5 bg-current rounded-full" />
          <span className="block h-0.5 w-5 bg-current rounded-full" />
          <span className="block h-0.5 w-5 bg-current rounded-full" />
        </button>
        <img src={TEAM_LOGO} alt="Team Shay" className="h-10 w-auto object-contain" />
        <Link href="/agent-dashboard/crm">
          <span className="flex items-center gap-1.5 rounded-xl bg-[#d9ae4c] px-3 py-2 text-xs font-black text-white shadow-sm shadow-amber-200/50">
            <Users className="size-3.5" />
            CRM
          </span>
        </Link>
      </div>

      {/* ── Mobile overlay ──────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile sidebar drawer (slides from right) ───────────── */}
      <div
        className={`lg:hidden fixed top-0 right-0 z-50 h-full w-[290px] overflow-y-auto bg-white px-5 py-6 shadow-2xl transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-start mb-4" dir="ltr">
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            aria-label="סגור תפריט"
          >
            <X className="size-5" />
          </button>
        </div>
        <SidebarInner onNav={() => setMobileOpen(false)} />
      </div>

      {/* ── Desktop sidebar (fixed right) ───────────────────────── */}
      <aside className="hidden lg:flex lg:fixed lg:right-0 lg:top-0 lg:z-30 lg:h-screen lg:w-[280px] lg:flex-col lg:overflow-y-auto border-l border-[#f3dfb0] bg-white px-5 py-6 shadow-[0_0_40px_rgba(0,0,0,0.06)]">
        <SidebarInner />
      </aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="lg:mr-[280px]">
        {children}
      </main>
    </div>
  );
}
