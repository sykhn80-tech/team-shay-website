import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Building2,
  ChevronLeft,
  CirclePlus,
  Eye,
  LayoutDashboard,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  UserCircle2,
} from "lucide-react";
import { TEAM_LOGO } from "@/lib/siteData";
import { toast } from "sonner";

const sidebarItems = [
  { label: "סקירה כללית", icon: LayoutDashboard, active: true },
  { label: "הנכסים שלי", icon: Building2, active: false },
  { label: "פרופיל סוכן", icon: UserCircle2, active: false },
];

export default function AgentDashboard() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);

  const { data: agent, isLoading: isAgentLoading } = trpc.agent.me.useQuery();
  const { data: properties, isLoading: isPropertiesLoading } = trpc.agent.listProperties.useQuery(undefined, {
    enabled: !!agent,
  });

  const { data: selectedProperty } = trpc.agent.propertyById.useQuery(
    { propertyId: selectedPropertyId ?? 0 },
    { enabled: !!selectedPropertyId },
  );

  const logoutMutation = trpc.agent.logout.useMutation({
    onSuccess: async () => {
      await utils.agent.me.invalidate();
      await utils.agent.listProperties.invalidate();
      toast.success("התנתקת בהצלחה.");
      navigate("/agent-login");
    },
  });

  const deleteMutation = trpc.agent.deleteProperty.useMutation({
    onSuccess: async () => {
      await utils.agent.listProperties.invalidate();
      if (selectedPropertyId) {
        await utils.agent.propertyById.invalidate({ propertyId: selectedPropertyId });
      }
      setSelectedPropertyId(null);
      toast.success("הנכס נמחק בהצלחה.");
    },
    onError: (error) => {
      toast.error(error.message || "מחיקת הנכס נכשלה.");
    },
  });

  useEffect(() => {
    if (!isAgentLoading && !agent) {
      navigate("/agent-login");
    }
  }, [agent, isAgentLoading, navigate]);

  const totalProperties = properties?.length ?? 0;
  const soldProperties = properties?.filter((property) => property.status === "נמכר").length ?? 0;
  const activeProperties = properties?.filter((property) => property.status !== "נמכר").length ?? 0;

  const selectedSummary = useMemo(() => {
    if (!selectedProperty) return null;
    return {
      price: `₪${selectedProperty.price.toLocaleString("he-IL")}`,
      rooms: `${selectedProperty.rooms} חדרים`,
      sqm: `${selectedProperty.sqm} מ״ר`,
    };
  }, [selectedProperty]);

  const handleDelete = async (propertyId: number) => {
    const confirmed = typeof window === "undefined" ? true : window.confirm("למחוק את הנכס הזה?");
    if (!confirmed) return;
    await deleteMutation.mutateAsync({ propertyId });
  };

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
              ניהול מהיר של מלאי הנכסים, סטטוסים ועדכוני שיווק במקום אחד.
            </p>
          </div>

          <nav className="mt-8 space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
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
              );
            })}
          </nav>

          <div className="mt-8 rounded-[24px] border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-600">
            המערכת שומרת את הגישה באמצעות עוגיית סשן, כך שניתן להמשיך בין דפי הניהול בלי להתחבר מחדש בכל מעבר.
          </div>

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
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.08em] text-[#d9ae4c]">Dashboard</p>
                <h2 className="mt-3 text-3xl font-black text-black md:text-4xl">הנכסים שלי</h2>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  כאן אפשר לצפות במאגר הפעיל, לעקוב אחרי סטטוסים ולהוסיף נכסים חדשים במהירות.
                </p>
              </div>

              <Link href="/agent-dashboard/new-property">
                <Button className="h-12 rounded-full bg-[#d9ae4c] px-6 text-base font-black text-white hover:bg-[#c99a31]">
                  <Plus className="size-4" />
                  הוספת נכס חדש
                </Button>
              </Link>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                { label: "סה״כ נכסים", value: String(totalProperties) },
                { label: "נכסים פעילים", value: String(activeProperties) },
                { label: "נכסים שנמכרו", value: String(soldProperties) },
              ].map((item) => (
                <article key={item.label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
                  <p className="text-sm font-bold text-slate-500">{item.label}</p>
                  <p className="mt-3 text-3xl font-black text-[#d9ae4c]">{item.value}</p>
                </article>
              ))}
            </div>

            <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_360px]">
              <div className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.05)] md:p-6">
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-black">כרטיסי הנכסים שלי</h3>
                    <p className="mt-2 text-sm text-slate-500">תצוגת Grid נוחה לעריכה, צפייה ועדכון מהיר של כל נכס.</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#fff4d8] px-4 py-2 text-sm font-bold text-[#d9ae4c]">
                    <CirclePlus className="size-4" />
                    {agent?.email ?? "סוכן מחובר"}
                  </div>
                </div>

                {isPropertiesLoading ? (
                  <div className="py-10 text-center text-slate-500">טוענים נכסים...</div>
                ) : properties?.length ? (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {properties.map((property) => (
                      <article
                        key={property.id}
                        className="overflow-hidden rounded-[28px] border border-slate-200 bg-[#fcfeff] shadow-[0_16px_34px_rgba(15,23,42,0.05)]"
                      >
                        {property.featuredImageUrl ? (
                          <img
                            src={property.featuredImageUrl}
                            alt={property.title}
                            className="h-44 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-44 items-center justify-center bg-[#fff4d8] text-sm font-bold text-slate-500">
                            אין עדיין תמונה ראשית
                          </div>
                        )}

                        <div className="p-5 text-right">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="text-xl font-black text-black">{property.title}</h4>
                              <p className="mt-2 text-sm text-slate-500">{property.address}</p>
                            </div>
                            <span className="rounded-full bg-[#fff8d7] px-3 py-1 text-xs font-black text-[#b8860b]">
                              {property.status}
                            </span>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-bold text-slate-700">
                            <div className="rounded-2xl bg-[#fff8e6] px-3 py-2">{property.neighborhood}</div>
                            <div className="rounded-2xl bg-[#fff8e6] px-3 py-2">₪{property.price.toLocaleString("he-IL")}</div>
                            <div className="rounded-2xl bg-[#fff8e6] px-3 py-2">{property.rooms} חדרים</div>
                            <div className="rounded-2xl bg-[#fff8e6] px-3 py-2">{property.sqm} מ״ר</div>
                          </div>

                          <div className="mt-4 flex flex-wrap justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => navigate(`/agent-dashboard/new-property?id=${property.id}`)}
                              className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-50"
                            >
                              <Pencil className="size-4" />
                              עריכה
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setSelectedPropertyId(property.id)}
                              className="rounded-full border-[#d9ae4c] text-[#d9ae4c] hover:bg-[#fff4d8]"
                            >
                              <Eye className="size-4" />
                              צפייה
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleDelete(property.id)}
                              disabled={deleteMutation.isPending}
                              className="rounded-full border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="size-4" />
                              מחיקה
                            </Button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-lg font-bold text-slate-700">עדיין אין נכסים בחשבון הזה.</p>
                    <p className="mt-2 text-sm text-slate-500">אפשר להתחיל בלחיצה על כפתור הוספת נכס חדש.</p>
                  </div>
                )}
              </div>

              <aside className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
                <h3 className="text-2xl font-black text-black">תצוגת נכס</h3>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  לחצו על "צפייה" בשורת נכס כדי לראות תקציר מלא, תמונה ראשית ופרטי שיווק.
                </p>

                {selectedProperty ? (
                  <div className="mt-6">
                    {selectedProperty.featuredImageUrl ? (
                      <img
                        src={selectedProperty.featuredImageUrl}
                        alt={selectedProperty.title}
                        className="h-52 w-full rounded-[24px] object-cover"
                      />
                    ) : (
                      <div className="flex h-52 items-center justify-center rounded-[24px] bg-[#fff8e6] text-slate-400">
                        אין עדיין תמונה ראשית
                      </div>
                    )}

                    <h4 className="mt-5 text-2xl font-black text-black">{selectedProperty.title}</h4>
                    <p className="mt-2 text-sm text-slate-500">{selectedProperty.address}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-sm font-bold text-slate-700">
                      <span className="rounded-full bg-[#fff8e6] px-3 py-1">{selectedProperty.neighborhood}</span>
                      <span className="rounded-full bg-[#fff8e6] px-3 py-1">{selectedSummary?.rooms}</span>
                      <span className="rounded-full bg-[#fff8e6] px-3 py-1">{selectedSummary?.sqm}</span>
                    </div>
                    <p className="mt-4 text-xl font-black text-[#d9ae4c]">{selectedSummary?.price}</p>
                    <p className="mt-4 text-sm leading-7 text-slate-600">{selectedProperty.description}</p>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button
                        onClick={() => navigate(`/agent-dashboard/new-property?id=${selectedProperty.id}`)}
                        className="rounded-full bg-[#d9ae4c] text-white hover:bg-[#c99a31]"
                      >
                        עריכת הנכס
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDelete(selectedProperty.id)}
                        className="rounded-full border-red-200 text-red-600 hover:bg-red-50"
                      >
                        מחיקה
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-[24px] bg-[#fff8e6] p-5 text-sm leading-7 text-slate-500">
                    עדיין לא נבחר נכס לצפייה. בחרו שורה מהטבלה כדי לפתוח את פרטי הנכס בצד.
                  </div>
                )}
              </aside>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
