import React, { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  BedDouble,
  ChevronLeft,
  Loader2,
  MapPin,
  Phone,
  Ruler,
  SquareStack,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { TEAM_LOGO, WHATSAPP_LINK } from "@/lib/siteData";

type PropertyDetailsProps = {
  params?: {
    propertyId?: string;
  };
};

const formatPrice = (value: number) => `₪${value.toLocaleString("he-IL")}`;

type PublicProperty = {
  id: number;
  title: string;
  address: string;
  street: string | null;
  neighborhood: string;
  city: string;
  price: number;
  rooms: number;
  sqm: number;
  builtSqm: number | null;
  outdoorSpace: string | null;
  floor: number | null;
  status: "חדש" | "בלעדי" | "למכירה" | "נמכר";
  description: string;
  descriptionHtml: string | null;
  featuredImageUrl: string | null;
  images: Array<{
    imageUrl: string;
  }>;
};

function getGalleryImages(property: PublicProperty) {
  const images = property.images.map((image: { imageUrl: string }) => image.imageUrl);
  if (property.featuredImageUrl && !images.includes(property.featuredImageUrl)) {
    return [property.featuredImageUrl, ...images];
  }

  if (property.featuredImageUrl) {
    return [property.featuredImageUrl, ...images.filter((imageUrl: string) => imageUrl !== property.featuredImageUrl)];
  }

  return images;
}

export default function PropertyDetails({ params }: PropertyDetailsProps) {
  const propertyId = useMemo(() => {
    const routeValue = params?.propertyId;
    const parsedId = Number(routeValue);
    return Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null;
  }, [params?.propertyId]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const homeQuery = trpc.publicSite.home.useQuery(undefined, {
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const propertyQuery = trpc.publicSite.propertyById.useQuery(
    { propertyId: propertyId ?? 0 },
    {
      enabled: Boolean(propertyId),
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
    },
  );

  const property = propertyQuery.data as PublicProperty | null | undefined;
  const galleryImages = useMemo(() => (property ? getGalleryImages(property) : []), [property]);
  const selectedImageUrl = galleryImages[selectedImageIndex] ?? galleryImages[0] ?? property?.featuredImageUrl ?? null;
  const whatsappLink = homeQuery.data?.settings?.whatsappLink || WHATSAPP_LINK;
  const headerLogoUrl = homeQuery.data?.settings?.headerLogoUrl || TEAM_LOGO;

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [propertyId]);

  useEffect(() => {
    if (!galleryImages.length) {
      setSelectedImageIndex(0);
      return;
    }

    if (selectedImageIndex >= galleryImages.length) {
      setSelectedImageIndex(0);
    }
  }, [galleryImages, selectedImageIndex]);

  if (propertyQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff8e6]" dir="rtl">
        <div className="inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 text-base font-bold text-slate-700 shadow-md">
          <Loader2 className="size-5 animate-spin text-[#d9ae4c]" />
          טוענים את פרטי הנכס...
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-[#fff8e6] px-4 py-10 text-slate-950" dir="rtl">
        <div className="mx-auto max-w-4xl rounded-[36px] bg-white p-8 text-center shadow-[0_28px_70px_rgba(15,23,42,0.08)]">
          <img src={headerLogoUrl} alt="Team Shay" className="mx-auto h-16 w-auto object-contain" />
          <h1 className="mt-6 text-3xl font-black">הנכס המבוקש לא נמצא</h1>
          <p className="mt-4 text-base leading-8 text-slate-600">
            ייתכן שהנכס הוסר מהאתר, אינו מפורסם כרגע או שהקישור שהוזן אינו תקין.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/properties">
              <Button className="rounded-full bg-[#d9ae4c] px-6 text-white hover:bg-[#c99a31]">
                חזרה לכל הנכסים
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-50">
                חזרה לדף הבית
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff8e6] text-slate-950" dir="rtl">
      <section className="px-4 pb-12 pt-10 md:px-6 md:pb-16">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[36px] bg-white shadow-[0_28px_70px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-8 border-b border-slate-100 px-6 py-8 md:px-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <img src={headerLogoUrl} alt="Team Shay" className="h-16 w-auto object-contain" />
              <div>
                <p className="text-sm font-black uppercase tracking-[0.08em] text-[#d9ae4c]">Property Showcase</p>
                <h1 className="mt-2 text-3xl font-black md:text-5xl">{property.title}</h1>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/properties">
                <Button variant="outline" className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-50">
                  <ChevronLeft className="size-4" />
                  חזרה לכל הנכסים
                </Button>
              </Link>
              <Button
                onClick={() => window.open(whatsappLink, "_blank", "noopener,noreferrer")}
                className="rounded-full bg-[#d9ae4c] px-6 text-white hover:bg-[#c99a31]"
              >
                <Phone className="size-4" />
                יצירת קשר לגבי הנכס
              </Button>
            </div>
          </div>

          <div className="grid gap-8 px-6 py-8 md:px-10 xl:grid-cols-[1.2fr_0.8fr]">
            <section>
              <div className="overflow-hidden rounded-[32px] bg-slate-100">
                {selectedImageUrl ? (
                  <img src={selectedImageUrl} alt={property.title} className="aspect-[4/3] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center text-sm font-semibold text-slate-400">
                    עדיין לא הועלו תמונות לנכס זה.
                  </div>
                )}
              </div>

              {galleryImages.length > 1 ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {galleryImages.map((imageUrl: string, index: number) => (
                    <button
                      key={`${imageUrl}-${index}`}
                      type="button"
                      onClick={() => setSelectedImageIndex(index)}
                      className={`overflow-hidden rounded-[20px] border-2 transition ${
                        selectedImageIndex === index
                          ? "border-[#d9ae4c] shadow-[0_12px_24px_rgba(217,174,76,0.22)]"
                          : "border-transparent"
                      }`}
                    >
                      <img src={imageUrl} alt={`${property.title} ${index + 1}`} className="aspect-[4/3] w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </section>

            <aside className="space-y-6">
              <div className="rounded-[32px] bg-[#fff8e6] p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-3xl font-black text-slate-950">{formatPrice(property.price)}</p>
                  <span className="rounded-full bg-[#d9ae4c] px-4 py-2 text-sm font-black text-white">
                    {property.status}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-base font-semibold text-slate-600">
                  <MapPin className="size-4 text-[#d9ae4c]" />
                  {property.address}, {property.neighborhood}, {property.city}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2 text-[#d9ae4c]">
                    <BedDouble className="size-5" />
                    <p className="text-sm font-black">חדרים</p>
                  </div>
                  <p className="mt-3 text-2xl font-black text-slate-950">{property.rooms}</p>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2 text-[#d9ae4c]">
                    <Ruler className="size-5" />
                    <p className="text-sm font-black">מ״ר בנוי</p>
                  </div>
                  <p className="mt-3 text-2xl font-black text-slate-950">{property.sqm}</p>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2 text-[#d9ae4c]">
                    <SquareStack className="size-5" />
                    <p className="text-sm font-black">מ״ר עיקרי</p>
                  </div>
                  <p className="mt-3 text-2xl font-black text-slate-950">{property.builtSqm ?? "לא צוין"}</p>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2 text-[#d9ae4c]">
                    <MapPin className="size-5" />
                    <p className="text-sm font-black">קומה</p>
                  </div>
                  <p className="mt-3 text-2xl font-black text-slate-950">{property.floor ?? "לא צוין"}</p>
                </div>
              </div>

              <div className="rounded-[32px] border border-slate-200 bg-white p-6">
                <p className="text-sm font-black uppercase tracking-[0.06em] text-[#d9ae4c]">פרטי הנכס</p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                  <p><span className="font-black text-slate-950">שכונה:</span> {property.neighborhood}</p>
                  <p><span className="font-black text-slate-950">עיר:</span> {property.city}</p>
                  <p><span className="font-black text-slate-950">כתובת:</span> {property.address}</p>
                  {property.street ? <p><span className="font-black text-slate-950">רחוב:</span> {property.street}</p> : null}
                  {property.outdoorSpace ? <p><span className="font-black text-slate-950">מרפסת / חוץ:</span> {property.outdoorSpace}</p> : null}
                </div>
              </div>
            </aside>
          </div>

          <div className="border-t border-slate-100 px-6 py-8 md:px-10">
            <div className="max-w-4xl">
              <p className="text-sm font-black uppercase tracking-[0.06em] text-[#d9ae4c]">תיאור מלא</p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">כל מה שחשוב לדעת על הנכס</h2>
              <p className="mt-5 whitespace-pre-line text-base leading-8 text-slate-600">
                {property.description}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
