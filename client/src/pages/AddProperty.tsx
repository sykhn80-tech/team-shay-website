import React, {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ChevronLeft, Eye, ImagePlus, Layers3, UploadCloud } from "lucide-react";
import { neighborhoods, roomOptions, statusOptions, TEAM_LOGO } from "@/lib/siteData";
import { trpc } from "@/lib/trpc";

type PropertyFormState = {
  title: string;
  address: string;
  street: string;
  neighborhood: string;
  city: string;
  price: string;
  sqm: string;
  builtSqm: string;
  rooms: string;
  floor: string;
  outdoorSpace: string;
  description: string;
  status: string;
  isPublished: boolean;
};

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGES = 12;

const initialState: PropertyFormState = {
  title: "",
  address: "",
  street: "",
  neighborhood: neighborhoods[0] ?? "",
  city: "ירושלים",
  price: "",
  sqm: "",
  builtSqm: "",
  rooms: "",
  floor: "",
  outdoorSpace: "",
  description: "",
  status: statusOptions[0] ?? "חדש",
  isPublished: true,
};

async function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error(`קריאת הקובץ ${file.name} נכשלה.`));
    reader.readAsDataURL(file);
  });
}

function parsePositiveInteger(value: string) {
  const normalized = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(normalized) && normalized > 0 ? normalized : null;
}

export default function AddProperty() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: agent, isLoading: isAgentLoading } = trpc.agent.me.useQuery();

  const propertyIdFromQuery = useMemo(() => {
    if (typeof window === "undefined") return null;
    const raw = new URLSearchParams(window.location.search).get("id");
    return raw ? Number(raw) : null;
  }, []);

  const isEditMode = Number.isFinite(propertyIdFromQuery) && !!propertyIdFromQuery;

  const { data: existingProperty, isLoading: isPropertyLoading } = trpc.agent.propertyById.useQuery(
    { propertyId: propertyIdFromQuery ?? 0 },
    { enabled: Boolean(propertyIdFromQuery) },
  );

  const [form, setForm] = useState<PropertyFormState>(initialState);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!isAgentLoading && !agent) {
      navigate("/agent-login");
    }
  }, [agent, isAgentLoading, navigate]);

  useEffect(() => {
    if (!existingProperty) return;

    setForm({
      title: existingProperty.title,
      address: existingProperty.address,
      street: existingProperty.street ?? "",
      neighborhood: existingProperty.neighborhood,
      city: existingProperty.city,
      price: String(existingProperty.price),
      sqm: String(existingProperty.sqm),
      builtSqm: existingProperty.builtSqm ? String(existingProperty.builtSqm) : "",
      rooms: String(existingProperty.rooms),
      floor: existingProperty.floor ? String(existingProperty.floor) : "",
      outdoorSpace: existingProperty.outdoorSpace ?? "",
      description: existingProperty.description,
      status: existingProperty.status,
      isPublished: existingProperty.isPublished,
    });
  }, [existingProperty]);

  const invalidatePropertyViews = async () => {
    await Promise.all([
      utils.agent.listProperties.invalidate(),
      utils.publicSite.home.invalidate(),
      utils.publicSite.properties.invalidate(),
      utils.admin.dashboard.invalidate(),
    ]);

    if (propertyIdFromQuery) {
      await utils.agent.propertyById.invalidate({ propertyId: propertyIdFromQuery });
    }
  };

  const createPropertyMutation = trpc.agent.createProperty.useMutation({
    onSuccess: async () => {
      await invalidatePropertyViews();
      toast.success("הנכס נשמר בהצלחה.");
      navigate("/agent-dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "שמירת הנכס נכשלה.");
    },
  });

  const updatePropertyMutation = trpc.agent.updateProperty.useMutation({
    onSuccess: async () => {
      await invalidatePropertyViews();
      toast.success("הנכס עודכן בהצלחה.");
      navigate("/agent-dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "עדכון הנכס נכשל.");
    },
  });

  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [previews]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []).slice(0, MAX_IMAGES);
    const invalidType = selectedFiles.find((file) => !file.type.startsWith("image/"));
    if (invalidType) {
      toast.error(`הקובץ ${invalidType.name} אינו תמונה נתמכת.`);
      return;
    }

    const oversized = selectedFiles.find((file) => file.size > MAX_FILE_SIZE_BYTES);
    if (oversized) {
      toast.error(`הקובץ ${oversized.name} גדול מדי. הגודל המקסימלי הוא 8MB לתמונה.`);
      return;
    }

    setFiles(selectedFiles);
  };

  const buildPayload = async () => {
     const nextImages = await Promise.all(
      files.map(async (file) => {
        const mimeType: "image/jpeg" | "image/png" | "image/webp" =
          file.type === "image/png" || file.type === "image/webp" || file.type === "image/jpeg"
            ? file.type
            : "image/jpeg";

        return {
          name: file.name,
          mimeType,
          dataBase64: await fileToBase64(file),
        };
      }),
    );


    return {
      title: form.title.trim(),
      address: form.address.trim(),
      street: form.street.trim() || null,
      neighborhood: form.neighborhood.trim(),
      city: form.city.trim() || "ירושלים",
      price: parsePositiveInteger(form.price) ?? 0,
      sqm: parsePositiveInteger(form.sqm) ?? 0,
      builtSqm: parsePositiveInteger(form.builtSqm),
      rooms: parsePositiveInteger(form.rooms) ?? 0,
      floor: parsePositiveInteger(form.floor),
      outdoorSpace: form.outdoorSpace.trim() || null,
      status: form.status as "חדש" | "בלעדי" | "למכירה" | "נמכר",
      description: form.description.trim(),
      descriptionHtml: null,
      isPublished: form.isPublished,
      images: nextImages,
    };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !form.title ||
      !form.address ||
      !form.neighborhood ||
      !form.city ||
      !form.price ||
      !form.sqm ||
      !form.rooms ||
      !form.description
    ) {
      toast.error("אנא מלאו את כל שדות החובה לפני שמירת הנכס.");
      return;
    }

    if (!parsePositiveInteger(form.price) || !parsePositiveInteger(form.sqm) || !parsePositiveInteger(form.rooms)) {
      toast.error("מחיר, מ״ר ומספר חדרים חייבים להיות מספרים חיוביים.");
      return;
    }

    try {
      const payload = await buildPayload();

      if (isEditMode && propertyIdFromQuery) {
        await updatePropertyMutation.mutateAsync({ propertyId: propertyIdFromQuery, data: payload });
        return;
      }

      await createPropertyMutation.mutateAsync(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "העלאת התמונות או שמירת הנכס נכשלה.");
    }
  };

  const isSubmitting = createPropertyMutation.isPending || updatePropertyMutation.isPending;
  const existingImageUrls = existingProperty?.images?.map((image) => image.imageUrl) ?? [];
  const previewImages = previews.length ? previews : existingImageUrls;
  const formattedPrice = parsePositiveInteger(form.price)?.toLocaleString("he-IL") ?? form.price;

  return (
    <div className="min-h-screen bg-[#fff8e6] text-black" dir="rtl">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <img src={TEAM_LOGO} alt="Team Shay" className="h-14 w-auto object-contain" />
            <div>
              <p className="text-sm font-black uppercase tracking-[0.08em] text-[#d9ae4c]">Agent CMS</p>
              <h1 className="mt-2 text-3xl font-black text-black md:text-4xl">
                {isEditMode ? "עריכת נכס קיים" : "הוספת נכס חדש"}
              </h1>
            </div>
          </div>

          <Link href="/agent-dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-[#d9ae4c]">
            <ChevronLeft className="size-4" />
            חזרה לדשבורד
          </Link>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] md:p-8"
          >
            {isEditMode && isPropertyLoading ? (
              <div className="py-10 text-center text-slate-500">טוענים את פרטי הנכס לעריכה...</div>
            ) : (
              <div className="grid gap-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="grid gap-2 md:col-span-2">
                    <span className="text-sm font-bold text-slate-700">כותרת הנכס</span>
                    <Input
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="למשל: פנטהאוז מרשים עם נוף פתוח"
                      className="h-13 rounded-2xl border-slate-200"
                    />
                  </label>

                  <label className="grid gap-2 md:col-span-2">
                    <span className="text-sm font-bold text-slate-700">כתובת מלאה</span>
                    <Input
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="רחוב, מספר בית, קומה ודירה אם צריך"
                      className="h-13 rounded-2xl border-slate-200"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-700">רחוב (אופציונלי)</span>
                    <Input
                      name="street"
                      value={form.street}
                      onChange={handleChange}
                      placeholder="למשל: דרך חברון"
                      className="h-13 rounded-2xl border-slate-200"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-700">עיר</span>
                    <Input
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="ירושלים"
                      className="h-13 rounded-2xl border-slate-200"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-700">שכונה</span>
                    <select
                      name="neighborhood"
                      value={form.neighborhood}
                      onChange={handleChange}
                      className="h-13 rounded-2xl border border-slate-200 bg-white px-4 text-base text-black outline-none focus:border-[#d9ae4c]"
                    >
                      {neighborhoods.map((neighborhood) => (
                        <option key={neighborhood} value={neighborhood}>
                          {neighborhood}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-700">מחיר מבוקש</span>
                    <Input
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="3250000"
                      className="h-13 rounded-2xl border-slate-200"
                    />
                  </label>
                </div>

                <div className="grid gap-5 md:grid-cols-4">
                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-700">מ״ר בנוי</span>
                    <Input
                      name="sqm"
                      value={form.sqm}
                      onChange={handleChange}
                      placeholder="132"
                      className="h-13 rounded-2xl border-slate-200"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-700">מ״ר עיקרי (אופציונלי)</span>
                    <Input
                      name="builtSqm"
                      value={form.builtSqm}
                      onChange={handleChange}
                      placeholder="118"
                      className="h-13 rounded-2xl border-slate-200"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-700">מספר חדרים</span>
                    <select
                      name="rooms"
                      value={form.rooms}
                      onChange={handleChange}
                      className="h-13 rounded-2xl border border-slate-200 bg-white px-4 text-base text-black outline-none focus:border-[#d9ae4c]"
                    >
                      <option value="">בחרו</option>
                      {roomOptions.map((rooms) => (
                        <option key={rooms} value={rooms}>
                          {rooms} חדרים
                        </option>
                      ))}
                      <option value="7">7 חדרים ומעלה</option>
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-700">קומה (אופציונלי)</span>
                    <Input
                      name="floor"
                      value={form.floor}
                      onChange={handleChange}
                      placeholder="12"
                      className="h-13 rounded-2xl border-slate-200"
                    />
                  </label>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-700">סטטוס</span>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="h-13 rounded-2xl border border-slate-200 bg-white px-4 text-base text-black outline-none focus:border-[#d9ae4c]"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-700">מרפסת / חוץ (אופציונלי)</span>
                    <Input
                      name="outdoorSpace"
                      value={form.outdoorSpace}
                      onChange={handleChange}
                      placeholder="למשל: מרפסת 18 מ״ר + גינה"
                      className="h-13 rounded-2xl border-slate-200"
                    />
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-slate-700">תיאור הנכס</span>
                  <Textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="ספרו על היתרונות, הנוף, המפרט, השדרוגים, הנגישות והסביבה"
                    className="min-h-40 rounded-[24px] border-slate-200"
                  />
                </label>

                <div className="grid gap-4 rounded-[28px] border border-dashed border-[#d9ae4c]/35 bg-[#fff8e6] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="flex items-center gap-2 text-base font-black text-[#b98b2f]">
                        <UploadCloud className="size-5" />
                        {isEditMode ? "בחירת תמונות חדשות לגלריה" : "בחירת תמונות לגלריה"}
                      </span>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        אפשר להעלות עד {MAX_IMAGES} תמונות. אם לא נבחרו תמונות חדשות במצב עריכה, הגלריה הקיימת תישמר.
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
                      {files.length ? `${files.length} קבצים חדשים` : `${existingImageUrls.length} תמונות קיימות`}
                    </span>
                  </div>
                    <Input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFilesChange}
                      className="cursor-pointer rounded-2xl border-slate-200 bg-white"

                  />
                </div>

                <label className="inline-flex items-center gap-3 rounded-[24px] border border-slate-200 bg-[#fbfdff] px-5 py-4 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, isPublished: event.target.checked }))
                    }
                  />
                  לפרסם את הנכס באתר הציבורי מיד לאחר השמירה
                </label>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Link href="/agent-dashboard">
                    <Button variant="outline" className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-50">
                      ביטול
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !agent}
                    className="rounded-full bg-[#d9ae4c] px-6 text-white hover:bg-[#c99a31]"
                  >
                    {isSubmitting
                      ? "שומרים..."
                      : isEditMode
                        ? form.isPublished
                          ? "שמור ועדכן באתר"
                          : "שמור כטיוטה"
                        : form.isPublished
                          ? "שמור ופרסם נכס חדש"
                          : "שמור נכס כטיוטה"}
                  </Button>
                </div>
              </div>
            )}
          </form>

          <aside className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-2 text-[#d9ae4c]">
                <Eye className="size-5" />
                <h2 className="text-xl font-black">תצוגה מקדימה</h2>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">כך הנכס יוצג במערכות Team Shay לאחר השמירה.</p>
              <div className="mt-5 rounded-[28px] bg-[#fff8e6] p-5">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-[#d9ae4c]">כרטיס נכס</p>
                <h3 className="mt-3 text-2xl font-black text-black">{form.title || "כותרת הנכס תופיע כאן"}</h3>
                <p className="mt-3 text-sm text-slate-500">{form.address || "כתובת"}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm font-bold">
                  <span className="rounded-full bg-white px-3 py-1 text-slate-700">{form.neighborhood || "שכונה"}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-slate-700">{form.rooms || "חדרים"}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-slate-700">{form.sqm || "מ״ר"}</span>
                  {form.floor ? <span className="rounded-full bg-white px-3 py-1 text-slate-700">קומה {form.floor}</span> : null}
                </div>
                <p className="mt-4 text-xl font-black text-[#d9ae4c]">{formattedPrice ? `₪${formattedPrice}` : "מחיר"}</p>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {form.description || "כאן יוצג תיאור הנכס לאחר מילוי הטופס."}
                </p>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-2 text-[#d9ae4c]">
                <ImagePlus className="size-5" />
                <h3 className="text-xl font-black text-black">גלריית תמונות</h3>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {previewImages.length ? (
                  previewImages.map((imageUrl, index) => (
                    <img
                      key={`${imageUrl}-${index}`}
                      src={imageUrl}
                      alt={`תמונת נכס ${index + 1}`}
                      className="h-28 w-full rounded-2xl object-cover"
                    />
                  ))
                ) : (
                  <div className="col-span-2 rounded-[24px] bg-[#fff8e6] p-5 text-sm leading-7 text-slate-500">
                    עדיין לא נבחרו תמונות. לאחר בחירת קבצים תופיע כאן תצוגה מקדימה של הגלריה.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-2 text-[#d9ae4c]">
                <Layers3 className="size-5" />
                <h3 className="text-xl font-black text-black">מצב פרסום</h3>
              </div>
              <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
                <p>
                  סטטוס נוכחי: <span className="font-black text-slate-900">{form.status}</span>
                </p>
                <p>
                  חשיפה לציבור: <span className="font-black text-slate-900">{form.isPublished ? "מפורסם באתר" : "טיוטה פנימית בלבד"}</span>
                </p>
                <p>
                  במצב עריכה, שמירת הטופס תעדכן מיד את קטלוג הנכסים הציבורי ואת הדשבורדים בהתאם לסטטוס הפרסום.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
