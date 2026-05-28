import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  BarChart2,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

const WHITE_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663549770333/Skk9h57YxdLJzA5wF6rzPk/teamshay-logo-new_6990c286.png";

const NAV_ITEMS = [
  { label: "לוח בקרה",       icon: LayoutDashboard, href: "/agent-dashboard",           exact: true },
  { label: "שיווק נכסים",    icon: Megaphone,       href: "/agent-dashboard/marketing", exact: false },
  { label: "הערכת שווי CMA", icon: BarChart2,       href: "/agent-dashboard/cma",       exact: false },
];

interface Props { children: React.ReactNode }

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

  function isActive(href: string, exact: boolean) {
    if (exact) return location === href;
    return location === href || location.startsWith(href + "/");
  }

  const crmActive = location === "/agent-dashboard/crm" || location.startsWith("/agent-dashboard/crm/");

  /* ──────────────────────────────────────────────────────── */
  const SidebarInner = ({ onNav }: { onNav?: () => void }) => (
    <div className="flex flex-col h-full" dir="rtl">

      {/* Logo */}
      <div className="flex items-center justify-between gap-2 pb-5 border-b border-white/10">
        <img
          src={WHITE_LOGO}
          alt="Team Shay"
          className="h-20 w-auto object-contain"
          style={{ filter: "brightness(10)" }}
        />
        <Link href="/" onClick={onNav}>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#d9ae4c] hover:text-[#f0c84e] transition whitespace-nowrap">
            <ChevronLeft className="size-3" />
            לאתר
          </span>
        </Link>
      </div>

      {/* Agent card */}
      <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#d9ae4c] to-[#b98b2f] p-4 shadow-lg shadow-black/40">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/60">אזור סוכנים</p>
        <p className="mt-0.5 text-[17px] font-black text-white">{agent?.name ?? "סוכן"}</p>
        {agent?.roleTitle && (
          <p className="text-[11px] text-white/70 leading-4 mt-0.5">{agent.roleTitle}</p>
        )}
        {agent?.accountRole === "admin" && (
          <span className="mt-2 inline-block rounded-full bg-black/30 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white/90">
            Admin
          </span>
        )}
      </div>

      {/* CRM — gold block */}
      <Link href="/agent-dashboard/crm" onClick={onNav}>
        <div className={`mt-4 rounded-2xl p-3.5 transition-all cursor-pointer border ${
          crmActive
            ? "bg-[#d9ae4c] border-[#d9ae4c] shadow-lg shadow-[#d9ae4c]/20"
            : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#d9ae4c]/60"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`rounded-xl p-2 ${crmActive ? "bg-black/20" : "bg-[#d9ae4c]/20"}`}>
              <Users className={`size-5 ${crmActive ? "text-black" : "text-[#d9ae4c]"}`} />
            </div>
            <div>
              <p className={`text-sm font-black ${crmActive ? "text-black" : "text-white"}`}>CRM לידים</p>
              <p className={`text-[11px] font-medium ${crmActive ? "text-black/70" : "text-white/50"}`}>
                {agent?.accountRole === "admin" ? "כל לידי הצוות" : "הלידים שלי"}
              </p>
            </div>
          </div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="mt-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          return (
            <Link key={item.label} href={item.href} onClick={onNav}>
              <span className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-right text-[14px] font-bold transition-all ${
                active ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white"
              }`}>
                <Icon className={`size-4 shrink-0 ${active ? "text-[#d9ae4c]" : "text-white/30"}`} />
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="border-t border-white/10 mt-4 pt-4">
        <button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-bold text-white/40 hover:bg-white/5 hover:text-white/70 transition-all"
        >
          <LogOut className="size-4 shrink-0" />
          {logoutMutation.isPending ? "מתנתקים..." : "התנתקות"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f3ee]" dir="rtl">

      {/* ── Mobile top bar ──────────────────────────────── */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between gap-3 bg-[#0d0d0d] px-4 py-2.5 shadow-lg shadow-black/20">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="פתח תפריט"
          className="flex flex-col gap-[5px] p-2"
        >
          <span className="block h-0.5 w-5 rounded-full bg-[#d9ae4c]" />
          <span className="block h-0.5 w-5 rounded-full bg-[#d9ae4c]" />
          <span className="block h-0.5 w-5 rounded-full bg-[#d9ae4c]" />
        </button>
        <img
          src={WHITE_LOGO}
          alt="Team Shay"
          className="h-14 w-auto object-contain"
          style={{ filter: "brightness(10)" }}
        />
        <Link href="/agent-dashboard/crm">
          <span className="flex items-center gap-1.5 rounded-xl bg-[#d9ae4c] px-3 py-1.5 text-xs font-black text-black shadow-md">
            <Users className="size-3.5" />
            CRM
          </span>
        </Link>
      </div>

      {/* ── Mobile overlay ───────────────────────────────── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ───────────────────────────────── */}
      <div
        className={`lg:hidden fixed top-0 right-0 z-[60] h-full w-[270px] bg-[#0d0d0d] px-5 py-6 shadow-2xl overflow-y-auto transition-transform duration-300 ease-in-out border-l border-[#d9ae4c]/20 ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-start mb-4" dir="ltr">
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition"
          >
            <X className="size-5" />
          </button>
        </div>
        <SidebarInner onNav={() => setMobileOpen(false)} />
      </div>

      {/* ── Desktop sidebar ──────────────────────────────── */}
      <aside className="hidden lg:flex lg:fixed lg:right-0 lg:top-0 lg:z-30 lg:h-screen lg:w-[265px] lg:flex-col lg:overflow-y-auto bg-[#0d0d0d] px-5 py-6 border-l border-[#d9ae4c]/15">
        <SidebarInner />
      </aside>

      {/* ── Main content ─────────────────────────────────── */}
      <main className="lg:mr-[265px]">
        {children}
      </main>
    </div>
  );
}
