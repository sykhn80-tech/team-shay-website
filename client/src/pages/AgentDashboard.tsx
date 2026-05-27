import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  CirclePlus,
  Eye,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import AgentLayout from "@/components/AgentLayout";

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

  // Redirect if not logged in
  if (!isAgentLoading && !agent) {
    navigate("/agent-login");
    return null;
  }

  const totalProperties = properties?.length ?? 0;
  const soldProperties = properties?.filter((p) => p.status === "נמכר").length ?? 0;
  const activeProperties = properties?.filter((p) => p.status !== "נמכר").length ?? 0;

  const selectedSummary = useMemo(() => {
    if (!selectedProperty) return null;
    return {
      price: `₪${selectedProperty.price.toLocaleString("he-IL")}`,
      rooms: `${selectedProperty.rooms} חדרים`,
      sqm: `${selectedProperty.sqm} מ״ר`,
    };
  }, [selectedProperty]);

  const handleDelete = async (propertyId: number) => {
    if (!window.confirm("למחוק את הנכס הזה?")) return;
    await deleteMutation.mutateAsync({ propertyId });
  };

  return (
    <AgentLayout>
      <div className="px-4 py-6 md:px-8 md:py-8" dir="rtl">
        <div className="mx-auto max-w-6xl">

          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.08em] text-[#d9ae4c]">Dashboard</p>
              <h2 className="mt-2 text-3xl font-black text-black md:text-4xl">הנכסים שלי</h2>
              <p className="mt-2 text-base leading-7 text-slate-500">
                מאגר הנכסים הפעיל — עריכה, עדכון סטטוסים והוספה מהירה.
              </p>
            </div>
            <Link href="/agent-dashboard/new-property">
              <Button className="h-12 rounded-full bg-[#d9ae4c] px-6 text-base font-black text-white hover:bg-[#c99a31] shadow-md shadow-amber-200/50">
                <Plus className="size-4" />
                הוספת נכס חדש
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { label: "סה״כ נכסים", value: String(totalProperties), color: "text-[#d9ae4c]" },
              { label: "נכסים פעילים", value: String(activeProperties), color: "text-emerald-500" },
              { label: "נכסים שנמכרו", value: String(soldProperties), color: "text-slate-400" },
            ].map((item) => (
              <article
                key={item.label}
                className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-bold text-slate-500">{item.label}</p>
                <p className={`mt-2 text-4xl font-black ${item.color}`}>{item.value}</p>
              </article>
            ))}
          </div>

          {/* Admin CRM shortcut */}
          {agent?.accountRole === "admin" && (
            <Link href="/agent-dashboard/crm">
              <div className="mt-6 rounded-[24px] bg-gradient-to-l from-[#d9ae4c]/10 to-[#fff4d8] border border-[#f3dfb0] p-5 hover:border-[#d9ae4c] transition cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="rounded-2xl bg-[#d9ae4c] p-3 shadow-md shadow-amber-200/50">
                      <Users className="size-6 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-800">CRM לידים — כל הצוות</p>
                      <p className="text-sm text-slate-500 mt-0.5">צפה ונהל את כל לידי הצוות במקום אחד</p>
                    </div>
                  </div>
                  <span className="text-[#d9ae4c] font-black text-sm group-hover:translate-x-[-4px] transition-transform">
                    כניסה ←
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* Properties grid */}
          <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="rounded-[28px] border border-slate-100 bg-white p-4 shadow-sm md:p-6">
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-black text-black">כרטיסי הנכסים שלי</h3>
                  <p className="mt-1 text-sm text-slate-500">לחץ "צפייה" לפרטים מורחבים בצד ימין.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#fff4d8] px-4 py-2 text-sm font-bold text-[#d9ae4c]">
                  <CirclePlus className="size-4" />
                  {agent?.email ?? "סוכן מחובר"}
                </div>
              </div>

              {isPropertiesLoading ? (
                <div className="py-10 text-center text-slate-400">טוענים נכסים...</div>
              ) : properties?.length ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {properties.map((property) => (
                    <article
                      key={property.id}
                      className="overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      {property.featuredImageUrl ? (
                        <img
                          src={property.featuredImageUrl}
                          alt={property.title}
                          className="h-44 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-44 items-center justify-center bg-[#fff4d8] text-sm font-bold text-slate-400">
                          אין עדיין תמונה ראשית
                        </div>
                      )}

                      <div className="p-5 text-right">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-lg font-black text-black">{property.title}</h4>
                            <p className="mt-1 text-sm text-slate-500">{property.address}</p>
                          </div>
                          <span className="rounded-full bg-[#fff8d7] px-3 py-1 text-xs font-black text-[#b8860b] whitespace-nowrap">
                            {property.status}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-bold text-slate-700">
                          <div className="rounded-xl bg-[#fff8e6] px-3 py-2">{property.neighborhood}</div>
                          <div className="rounded-xl bg-[#fff8e6] px-3 py-2">₪{property.price.toLocaleString("he-IL")}</div>
                          <div className="rounded-xl bg-[#fff8e6] px-3 py-2">{property.rooms} חדרים</div>
                          <div className="rounded-xl bg-[#fff8e6] px-3 py-2">{property.sqm} מ״ר</div>
                        </div>

                        <div className="mt-4 flex flex-wrap justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/agent-dashboard/new-property?id=${property.id}`)}
                            className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 font-bold"
                          >
                            <Pencil className="size-3.5" />
                            עריכה
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPropertyId(property.id)}
                            className="rounded-full border-[#d9ae4c] text-[#d9ae4c] hover:bg-[#fff4d8] font-bold"
                          >
                            <Eye className="size-3.5" />
                            צפייה
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(property.id)}
                            disabled={deleteMutation.isPending}
                            className="rounded-full border-red-200 text-red-500 hover:bg-red-50 font-bold"
                          >
                            <Trash2 className="size-3.5" />
                            מחיקה
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-lg font-bold text-slate-700">עדיין אין נכסים בחשבון הזה.</p>
                  <p className="mt-2 text-sm text-slate-500">לחץ על "הוספת נכס חדש" כדי להתחיל.</p>
                </div>
              )}
            </div>

            {/* Property preview panel */}
            <aside className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black text-black">תצוגת נכס</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                לחץ "צפייה" על נכס כדי לראות פרטים מורחבים כאן.
              </p>

              {selectedProperty ? (
                <div className="mt-5">
                  {selectedProperty.featuredImageUrl ? (
                    <img
                      src={selectedProperty.featuredImageUrl}
                      alt={selectedProperty.title}
                      className="h-52 w-full rounded-[20px] object-cover"
                    />
                  ) : (
                    <div className="flex h-52 items-center justify-center rounded-[20px] bg-[#fff8e6] text-slate-400 text-sm">
                      אין עדיין תמונה
                    </div>
                  )}
                  <h4 className="mt-5 text-xl font-black text-black">{selectedProperty.title}</h4>
                  <p className="mt-1 text-sm text-slate-500">{selectedProperty.address}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold text-slate-700">
                    <span className="rounded-full bg-[#fff8e6] px-3 py-1">{selectedProperty.neighborhood}</span>
                    <span className="rounded-full bg-[#fff8e6] px-3 py-1">{selectedSummary?.rooms}</span>
                    <span className="rounded-full bg-[#fff8e6] px-3 py-1">{selectedSummary?.sqm}</span>
                  </div>
                  <p className="mt-3 text-xl font-black text-[#d9ae4c]">{selectedSummary?.price}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{selectedProperty.description}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button
                      onClick={() => navigate(`/agent-dashboard/new-property?id=${selectedProperty.id}`)}
                      className="rounded-full bg-[#d9ae4c] text-white hover:bg-[#c99a31] font-bold"
                    >
                      עריכת הנכס
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDelete(selectedProperty.id)}
                      className="rounded-full border-red-200 text-red-500 hover:bg-red-50 font-bold"
                    >
                      מחיקה
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-[20px] bg-[#fff8e6] p-5 text-sm leading-7 text-slate-500 text-center">
                  בחר נכס מהרשימה כדי לראות פרטים
                </div>
              )}
            </aside>
          </section>
        </div>
      </div>
    </AgentLayout>
  );
}
