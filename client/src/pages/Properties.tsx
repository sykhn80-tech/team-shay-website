import React, { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { BedDouble, ChevronLeft, Loader2, Ruler, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  maxPropertyPrice,
  minPropertyPrice,
  sampleProperties,
  TEAM_LOGO,
  WHATSAPP_LINK,
} from "@/lib/siteData";
import { propertyStreetOnly } from "@/lib/property-display";

const formatPrice = (value: number) => `₪${value.toLocaleString("he-IL")}`;
const formatNeighborhoodCity = (property: { neighborhood?: string | null; city?: string | null }) => {
  const neighborhood = property.neighborhood?.trim() ?? "";
  const city = property.city?.trim() ?? "";
  if (!neighborhood) return city;
  if (!city || neighborhood === city) return neighborhood;
  return `${neighborhood}, ${city}`;
};

export default function Properties() {
  const [areaQuery, setAreaQuery] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([minPropertyPrice, maxPropertyPrice]);
  const [roomFilter, setRoomFilter] = useState("");

  const homeQuery = trpc.publicSite.home.useQuery(undefined, {
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 10_000,
  });

  const propertiesQuery = trpc.publicSite.properties.useQuery(
    {
      area: areaQuery.trim() || undefined,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
    },
    {
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      refetchInterval: 10_000,
    },
  );

  const cmsProperties = homeQuery.data?.properties ?? [];

  const computedMinPrice = useMemo(() => {
    if (cmsProperties.length > 0) {
      return Math.min(...cmsProperties.map((property) => property.price));
    }
    return minPropertyPrice;
  }, [cmsProperties]);

  const computedMaxPrice = useMemo(() => {
    if (cmsProperties.length > 0) {
      return Math.max(...cmsProperties.map((property) => property.price));
    }
    return maxPropertyPrice;
  }, [cmsProperties]);

  useEffect(() => {
    setPriceRange([computedMinPrice, computedMaxPrice]);
  }, [computedMinPrice, computedMaxPrice]);

  const filteredProperties = useMemo(() => {
    const source = propertiesQuery.data && propertiesQuery.data.length > 0
      ? propertiesQuery.data
      : propertiesQuery.isLoading
        ? sampleProperties.filter((property) => {
            const matchesArea = `${property.neighborhood} ${property.city} ${property.address} ${property.title}`
              .toLowerCase()
              .includes(areaQuery.trim().toLowerCase());
            const matchesPrice = property.price >= priceRange[0] && property.price <= priceRange[1];
            return matchesArea && matchesPrice;
          })
        : [];

    return source.map((property, index) => {
      const normalized = property as {
        id: number;
        title: string;
        address?: string;
        street?: string;
        neighborhood: string;
        city: string;
        price: number;
        rooms: number;
        sqm: number;
        status: string;
        description: string;
        featuredImageUrl?: string | null;
        image?: string | null;
        images?: Array<{ imageUrl: string }>;
      };

      return {
        id: normalized.id,
        title: normalized.title,
        address:
          normalized.address ||
          `${normalized.street || ""} ${normalized.neighborhood}`.trim() ||
          sampleProperties[index % sampleProperties.length]?.address ||
          "ירושלים",
        street: normalized.street,
        neighborhood: normalized.neighborhood,
        city: normalized.city,
        price: normalized.price,
        rooms: normalized.rooms,
        sqm: normalized.sqm,
        status: normalized.status,
        description: normalized.description,
        image:
          normalized.featuredImageUrl ||
          normalized.images?.[0]?.imageUrl ||
          normalized.image ||
          sampleProperties[index % sampleProperties.length]?.image,
      };
    }).filter((property) => {
      if (property.status.trim() === "נמכר") return false;
      if (!roomFilter) return true;
      if (roomFilter === "5+") return property.rooms >= 5;
      return Math.floor(property.rooms) === Number(roomFilter);
    });
  }, [areaQuery, priceRange, propertiesQuery.data, propertiesQuery.isLoading, roomFilter]);

  const handleMinChange = (value: number) => {
    setPriceRange(([_, max]) => [Math.min(value, max), max]);
  };

  const handleMaxChange = (value: number) => {
    setPriceRange(([min]) => [min, Math.max(value, min)]);
  };

  return (
    <div className="min-h-screen bg-[#FDF8F0] text-slate-950" dir="rtl">
      <section className="px-4 pb-12 pt-10 md:px-6 md:pb-16">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_24px_65px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-8 border-b border-[#D4AF37]/30 bg-white px-6 py-8 md:px-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <img src={TEAM_LOGO} alt="Team Shay" className="team-shay-logo h-16 w-auto object-contain" />
              <div>
                <p className="text-sm font-black uppercase tracking-[0.08em] text-[#d9ae4c]">קטלוג נכסים</p>
                <h1 className="mt-2 text-3xl font-black text-[#1A1A1A] md:text-5xl">כל הנכסים במקום אחד</h1>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/">
                <Button variant="outline" className="rounded-full border-[#D4AF37] bg-white text-[#1A1A1A] hover:bg-[#D4AF37] hover:text-black">
                  <ChevronLeft className="size-4" />
                  חזרה לדף הבית
                </Button>
              </Link>
              <Button
                onClick={() => window.open(homeQuery.data?.settings?.whatsappLink || WHATSAPP_LINK, "_blank", "noopener,noreferrer")}
                className="rounded-full bg-[#D4AF37] px-6 text-black hover:bg-[#e5c45e]"
              >
                דברו איתנו
              </Button>
            </div>
          </div>

          <div className="px-6 py-8 md:px-10">
            <div className="grid gap-8 xl:grid-cols-[320px_1fr]">
              <aside className="order-1 rounded-[30px] border border-[#D4AF37]/35 bg-white p-6 text-slate-950 shadow-[0_18px_40px_rgba(15,23,42,0.07)] xl:order-none">
                <div className="flex items-center gap-2 text-[#d9ae4c]">
                  <SlidersHorizontal className="size-4" />
                  <p className="text-sm font-black uppercase tracking-[0.06em]">סינון חכם</p>
                </div>
                <h2 className="mt-4 text-2xl font-black text-[#1A1A1A]">מצאו נכס לפי מחיר ואזור</h2>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  השתמשו בטווח המחיר ובחיפוש האזורי כדי להתמקד רק בנכסים הרלוונטיים עבורכם.
                </p>

                <div className="mt-8 rounded-[24px] border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-700">טווח מחיר</p>
                    <p className="text-xs font-bold text-[#d9ae4c]">
                      {formatPrice(priceRange[0])} — {formatPrice(priceRange[1])}
                    </p>
                  </div>

                  <div className="mt-6 space-y-5">
                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-500">מינימום</label>
                      <input
                        type="range"
                        min={computedMinPrice}
                        max={computedMaxPrice}
                        step={50000}
                        value={priceRange[0]}
                        onChange={(event) => handleMinChange(Number(event.target.value))}
                        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#f7e7bb] accent-[#d9ae4c]"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-500">מקסימום</label>
                      <input
                        type="range"
                        min={computedMinPrice}
                        max={computedMaxPrice}
                        step={50000}
                        value={priceRange[1]}
                        onChange={(event) => handleMaxChange(Number(event.target.value))}
                        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#f7e7bb] accent-[#d9ae4c]"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-5">
                  <label className="text-sm font-black text-slate-700">חיפוש אזור</label>
                  <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 focus-within:border-[#d9ae4c] focus-within:ring-4 focus-within:ring-[#d9ae4c]/10">
                    <Search className="size-4 text-slate-400" />
                    <input
                      autoComplete="off"
                      value={areaQuery}
                      onChange={(event) => setAreaQuery(event.target.value)}
                      placeholder="לדוגמה: קטמונים"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-5">
                  <p className="text-sm font-black text-slate-700">מספר חדרים</p>
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {["2", "3", "4", "5+"].map((rooms) => (
                      <button
                        key={rooms}
                        type="button"
                        onClick={() => setRoomFilter((current) => current === rooms ? "" : rooms)}
                        className={`rounded-xl py-2 text-sm font-black transition ${roomFilter === rooms ? "bg-[#D4AF37] text-black" : "bg-[#F8F8F8] text-slate-600 hover:bg-[#fff4d8]"}`}
                      >
                        {rooms}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 rounded-[24px] bg-[#D4AF37] p-5 text-[#1A1A1A]">
                  <p className="text-sm font-black uppercase tracking-[0.06em] text-black/60">תוצאה נוכחית</p>
                  <p className="mt-3 text-4xl font-black">{filteredProperties.length}</p>
                  <p className="mt-2 text-sm leading-7 text-black/70">נכסים תואמים לטווח המחיר ולאזור שבחרתם.</p>
                </div>
              </aside>

              <div className="order-2 xl:order-none">
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.06em] text-[#d9ae4c]">מאגר מתעדכן</p>
                    <h2 className="mt-2 text-2xl font-black">נכסים בירושלים והסביבה</h2>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    {propertiesQuery.isFetching ? <Loader2 className="size-4 animate-spin" /> : null}
                    <span>המחירים והפרטים מוצגים בפורמט קריא ומהיר להשוואה.</span>
                  </div>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
                  {filteredProperties.map((property) => {
                    const streetOnly = propertyStreetOnly(property);
                    const areaOnly = formatNeighborhoodCity(property);
                    return (
                    <article
                      key={property.id}
                      className="group flex h-full min-h-[620px] flex-col overflow-hidden rounded-[28px] border border-[#D4AF37]/35 bg-white shadow-[0_18px_36px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-[0_24px_48px_rgba(212,175,55,0.22)]"
                    >
                      <div className="relative overflow-hidden">
                        <img src={property.image} alt={property.title} className="h-56 w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                        <span className="absolute right-4 top-4 rounded-full bg-[#D4AF37] px-3 py-1.5 text-xs font-black text-black shadow-lg">{property.status}</span>
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-2xl font-black text-slate-950">{formatPrice(property.price)}</p>
                        </div>

                        <h3 className="mt-3 text-xl font-black text-slate-950">{property.title}</h3>
                        <div className="mt-4 rounded-[22px] border border-[#D4AF37]/25 bg-[#fffaf0] p-4">
                          <p className="text-2xl font-black leading-tight text-slate-950">
                            {streetOnly || property.title}
                          </p>
                          {areaOnly ? <p className="mt-2 text-base font-black text-[#B8960C]">{areaOnly}</p> : null}
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-bold text-slate-700">
                          <div className="flex items-center gap-2 rounded-2xl bg-[#fff8e6] px-3 py-3"><BedDouble className="size-4 text-[#D4AF37]" />{property.rooms} חדרים</div>
                          <div className="flex items-center gap-2 rounded-2xl bg-[#fff8e6] px-3 py-3"><Ruler className="size-4 text-[#D4AF37]" />{property.sqm} מ״ר</div>
                        </div>

                        <p className="mt-4 line-clamp-4 text-sm leading-7 text-slate-600">{property.description}</p>

                        <div className="mt-auto pt-5">
                          <Link href={`/properties/${property.id}`} className="block">
                            <Button className="w-full rounded-full bg-[#D4AF37] text-[#1A1A1A] hover:bg-[#B8960C] hover:text-black">
                              לפרטים נוספים
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
                </div>

                {!filteredProperties.length ? (
                  <div className="mt-10 rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center">
                    <p className="text-xl font-black text-slate-800">לא נמצאו נכסים שמתאימים לסינון הנוכחי.</p>
                    <p className="mt-3 text-sm leading-7 text-slate-500">אפשר להרחיב את טווח המחיר או לנסות חיפוש אזור אחר.</p>
                    <Button
                      onClick={() => {
                        setAreaQuery("");
                        setPriceRange([computedMinPrice, computedMaxPrice]);
                        setRoomFilter("");
                      }}
                      variant="outline"
                      className="mt-6 rounded-full border-[#d9ae4c] text-[#d9ae4c] hover:bg-[#fff4d8]"
                    >
                      איפוס סינון
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
