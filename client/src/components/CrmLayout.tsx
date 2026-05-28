import AgentLayout from "@/components/AgentLayout";
import { useMemo } from "react";
import { Link, useLocation } from "wouter";

type CrmLayoutProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

const navItems = [
  { label: "דשבורד", href: "/agent-dashboard/crm/dashboard" },
  { label: "לידים", href: "/agent-dashboard/crm" },
  { label: "התאמות", href: "/agent-dashboard/crm/matches" },
  { label: "פולואפ", href: "/agent-dashboard/crm/followup" },
  { label: "משימות", href: "/agent-dashboard/crm/tasks" },
  { label: "פעולות שיווק", href: "/agent-dashboard/crm/marketing" },
  { label: "הכנסות/הוצ׳", href: "/agent-dashboard/crm/finance" },
  { label: "תבניות", href: "/agent-dashboard/crm/templates" },
  { label: "מסמכים", href: "/agent-dashboard/crm/documents" },
];

function isActive(pathname: string, href: string) {
  if (href === "/agent-dashboard/crm") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function CrmLayout({ title, subtitle, children }: CrmLayoutProps) {
  const [location, navigate] = useLocation();

  const activeHref = useMemo(
    () => navItems.find((item) => isActive(location, item.href))?.href ?? "/agent-dashboard/crm",
    [location],
  );

  return (
    <AgentLayout>
      <div className="min-h-screen bg-[#f5f3ee] px-4 py-6 md:px-6">
        <div className="mx-auto max-w-[1360px]">
          <div className="mb-5 rounded-[26px] bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.06)]" dir="rtl">
            <p className="text-xs font-black uppercase tracking-[0.08em] text-[#b98b2f]">CRM Team Shay</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950 md:text-4xl">{title}</h1>
            {subtitle ? <p className="mt-2 text-base text-slate-600">{subtitle}</p> : null}
          </div>

          <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 lg:hidden" dir="rtl">
            <label className="mb-2 block text-sm font-black text-slate-700">ניווט CRM</label>
            <select
              value={activeHref}
              onChange={(event) => navigate(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold"
            >
              {navItems.map((item) => (
                <option key={item.href} value={item.href}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4 lg:gap-6" dir="ltr">
            <aside className="hidden w-52 shrink-0 rounded-2xl border-r border-slate-200 bg-[#f8f6f1] p-2 lg:block">
              <nav className="space-y-1.5" dir="rtl">
                {navItems.map((item) => {
                  const active = isActive(location, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block rounded-xl px-3 py-2.5 text-sm transition ${
                        active
                          ? "bg-[#fff4d8] text-[#b98b2f] font-black"
                          : "text-slate-600 font-semibold hover:bg-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </aside>

            <main className="min-w-0 flex-1" dir="rtl">
              {children}
            </main>
          </div>
        </div>
      </div>
    </AgentLayout>
  );
}
