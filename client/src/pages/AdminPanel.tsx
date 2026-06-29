import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Building2,
  ChevronLeft,
  Eye,
  ImagePlus,
  Loader2,
  MessageSquareQuote,
  Pencil,
  Plus,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import AgentLayout from "@/components/AgentLayout";

type UploadMimeType = "image/jpeg" | "image/png" | "image/webp";
type UploadMediaMimeType = UploadMimeType | "video/mp4" | "video/webm" | "video/quicktime";

type UploadImagePayload = {
  name: string;
  mimeType: UploadMediaMimeType;
  dataBase64: string;
};

type ImageFieldState = {
  storedUrl: string;
  previewUrl: string;
  upload: UploadImagePayload | null;
};

type StaffFormState = {
  accountRole: "agent" | "admin";
  name: string;
  email: string;
  phone: string;
  password: string;
  roleTitle: string;
  bio: string;
  photoUrl: ImageFieldState;
  sortOrder: number;
  isFeaturedOnHomepage: boolean;
  isActive: boolean;
};

type TestimonialFormState = {
  quote: string;
  sourceName: string;
  sourceLabel: string;
  stars: number;
  whatsappImageUrl: ImageFieldState;
  displayOrder: number;
  isPublished: boolean;
};

type SiteSettingsFormState = {
  siteName: string;
  headerLogoUrl: ImageFieldState;
  footerLogoUrl: ImageFieldState;
  landsmanLogoUrl: ImageFieldState;
  heroBackgroundUrl: ImageFieldState;
  shayAboutImageUrl: ImageFieldState;
  heroHeadline: string;
  heroTypingText: string;
  whatsappLink: string;
  officePhone: string;
  aboutTitle: string;
  aboutSubtitle: string;
  landsmanTitle: string;
  landsmanBody: string;
  footerSlogan: string;
};

type MarketingSectionFormState = {
  eyebrow: string;
  title: string;
  subtitle: string;
  highlightsText: string;
  items: Array<{
    id: string;
    title: string;
    description: string;
    type: "image" | "video";
    mediaUrl: ImageFieldState;
    posterUrl: ImageFieldState;
  }>;
};

type PropertyGalleryDraft = {
  previewUrls: string[];
  uploads: UploadImagePayload[];
  featuredImageIndex: number;
};

const allowedMimeTypes: UploadMimeType[] = ["image/jpeg", "image/png", "image/webp"];
const allowedMediaMimeTypes: UploadMediaMimeType[] = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm", "video/quicktime"];
const maxImageUploadBytes = 5 * 1024 * 1024;
const maxVideoUploadBytes = 3 * 1024 * 1024;

const buildImageField = (url?: string | null): ImageFieldState => ({
  storedUrl: url ?? "",
  previewUrl: url ?? "",
  upload: null,
});

const emptyStaffForm: StaffFormState = {
  accountRole: "agent",
  name: "",
  email: "",
  phone: "",
  password: "",
  roleTitle: "",
  bio: "",
  photoUrl: buildImageField(),
  sortOrder: 0,
  isFeaturedOnHomepage: true,
  isActive: true,
};

const emptyTestimonialForm: TestimonialFormState = {
  quote: "",
  sourceName: "",
  sourceLabel: "WhatsApp",
  stars: 5,
  whatsappImageUrl: buildImageField(),
  displayOrder: 1,
  isPublished: true,
};

const emptySettingsForm: SiteSettingsFormState = {
  siteName: "",
  headerLogoUrl: buildImageField(),
  footerLogoUrl: buildImageField(),
  landsmanLogoUrl: buildImageField(),
  heroBackgroundUrl: buildImageField(),
  shayAboutImageUrl: buildImageField(),
  heroHeadline: "",
  heroTypingText: "",
  whatsappLink: "",
  officePhone: "",
  aboutTitle: "",
  aboutSubtitle: "",
  landsmanTitle: "",
  landsmanBody: "",
  footerSlogan: "",
};

const emptyMarketingSectionForm: MarketingSectionFormState = {
  eyebrow: "שיטות השיווק שלנו",
  title: "לא רק מעלים מודעה — בונים חוויית מכירה",
  subtitle: "כאן נרכז את סרטוני ההדמיה, תמונות מהעיתון, בתים פתוחים, שלטים ופעולות שטח.",
  highlightsText: "סרטוני הדמיה\nעיתון מקומי, פליירים ומכתבי שכנים\nבתים פתוחים לקונים ומתווכים\nפרסום אגרסיבי ברשתות",
  items: [],
};

async function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("קריאת הקובץ נכשלה."));
    reader.readAsDataURL(file);
  });
}

async function buildUploadImagePayload(file: File): Promise<UploadImagePayload> {
  const mimeType: UploadMediaMimeType = allowedMediaMimeTypes.includes(file.type as UploadMediaMimeType)
    ? (file.type as UploadMediaMimeType)
    : "image/jpeg";

  return {
    name: file.name,
    mimeType,
    dataBase64: await fileToBase64(file),
  };
}

function serializeImageField(field: ImageFieldState) {
  if (field.upload) return field.upload;
  if (field.storedUrl) return field.storedUrl;
  return null;
}

function getFeaturedImageIndex(previewUrls: string[], featuredImageUrl?: string | null) {
  if (!previewUrls.length || !featuredImageUrl) return 0;
  const index = previewUrls.findIndex((imageUrl) => imageUrl === featuredImageUrl);
  return index >= 0 ? index : 0;
}

function ImageUploadField({
  label,
  hint,
  value,
  onFileSelected,
}: {
  label: string;
  hint: string;
  value: ImageFieldState;
  onFileSelected: (file: File | null) => Promise<void> | void;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-[#fbfdff] p-4">
      <div className="flex items-center gap-2 text-[#d9ae4c]">
        <ImagePlus className="size-4" />
        <p className="text-sm font-black">{label}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p>
      <label className="mt-4 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[#d9ae4c]/35 bg-white px-4 text-sm font-bold text-[#b98b2f] transition hover:bg-[#fff4d8]">
        <Upload className="size-4" />
        בחירת קובץ מהמחשב
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            void onFileSelected(file);
            event.currentTarget.value = "";
          }}
        />
      </label>
      {value.previewUrl ? (
        <div className="mt-4 overflow-hidden rounded-[20px] border border-slate-200 bg-white">
          <img src={value.previewUrl} alt={label} className="h-40 w-full object-cover" />
        </div>
      ) : (
        <div className="mt-4 rounded-[20px] border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-400">
          עדיין לא נבחרה תמונה.
        </div>
      )}
      <p className="mt-3 text-xs font-semibold text-slate-500">
        סוגי קבצים נתמכים: JPG, PNG, WebP. לאחר השמירה הקובץ יישמר באחסון הקבוע ויקושר אוטומטית למסד הנתונים.
      </p>
    </div>
  );
}

function MediaUploadField({
  label,
  hint,
  value,
  onFileSelected,
  onPreview,
}: {
  label: string;
  hint: string;
  value: ImageFieldState;
  onFileSelected: (file: File | null) => Promise<void> | void;
  onPreview?: () => void;
}) {
  const isVideo = value.previewUrl && /\.(mp4|webm|mov)(\?|$)/i.test(value.previewUrl);

  return (
    <div className="rounded-[24px] border border-slate-200 bg-[#fbfdff] p-4">
      <div className="flex items-center gap-2 text-[#d9ae4c]">
        <ImagePlus className="size-4" />
        <p className="text-sm font-black">{label}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p>
      <label className="mt-4 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[#d9ae4c]/35 bg-white px-4 text-sm font-bold text-[#b98b2f] transition hover:bg-[#fff4d8]">
        <Upload className="size-4" />
        בחירת תמונה או וידאו
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            void onFileSelected(file);
            event.currentTarget.value = "";
          }}
        />
      </label>
      {value.previewUrl ? (
        <div className="mt-4 overflow-hidden rounded-[20px] border border-slate-200 bg-white">
          {isVideo ? (
            <video src={value.previewUrl} className="h-40 w-full object-cover" controls playsInline />
          ) : (
            <img src={value.previewUrl} alt={label} className="h-40 w-full object-cover" />
          )}
          {onPreview ? (
            <button
              type="button"
              onClick={onPreview}
              className="flex w-full items-center justify-center gap-2 border-t border-slate-100 bg-white px-4 py-3 text-sm font-black text-[#B8960C] transition hover:bg-[#fff7df]"
            >
              <Eye className="size-4" />
              תצוגה בגודל מלא
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 rounded-[20px] border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-400">
          עדיין לא נבחר קובץ.
        </div>
      )}
      <p className="mt-3 text-xs font-semibold text-slate-500">
        תומך JPG, PNG, WebP עד 5MB. וידאו: MP4, WebM או MOV עד 3MB במסלול ההעלאה הנוכחי.
      </p>
    </div>
  );
}

export default function AdminPanel() {
  const utils = trpc.useUtils();
  const [, navigate] = useLocation();
  const [settingsForm, setSettingsForm] = useState<SiteSettingsFormState>(emptySettingsForm);
  const [marketingSectionForm, setMarketingSectionForm] = useState<MarketingSectionFormState>(emptyMarketingSectionForm);
  const [newStaff, setNewStaff] = useState<StaffFormState>(emptyStaffForm);
  const [newTestimonial, setNewTestimonial] = useState<TestimonialFormState>(emptyTestimonialForm);
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [editingStaffForm, setEditingStaffForm] = useState<StaffFormState>(emptyStaffForm);
  const [editingTestimonialId, setEditingTestimonialId] = useState<number | null>(null);
  const [editingTestimonialForm, setEditingTestimonialForm] = useState<TestimonialFormState>(emptyTestimonialForm);
  const [propertyGalleryDrafts, setPropertyGalleryDrafts] = useState<Record<number, PropertyGalleryDraft>>({});
  const [adminMediaPreview, setAdminMediaPreview] = useState<{ title: string; type: "image" | "video"; url: string; posterUrl?: string } | null>(null);

  const agentSessionQuery = trpc.agent.me.useQuery();
  const dashboardQuery = trpc.admin.dashboard.useQuery(undefined, {
    enabled: Boolean(agentSessionQuery.data),
  });
  const updateSettingsMutation = trpc.admin.updateSiteSettings.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.admin.dashboard.invalidate(), utils.publicSite.home.invalidate()]);
      toast.success("הגדרות האתר נשמרו והתמונות קושרו למסד.");
    },
    onError: (error) => toast.error(error.message || "שמירת ההגדרות נכשלה."),
  });
  const updateMarketingSectionMutation = trpc.admin.updateMarketingSection.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.admin.dashboard.invalidate(), utils.publicSite.home.invalidate()]);
      toast.success("סקשן שיטות השיווק נשמר ועודכן באתר.");
    },
    onError: (error) => toast.error(error.message || "שמירת סקשן השיווק נכשלה."),
  });
  const createStaffMutation = trpc.admin.createStaff.useMutation({
    onSuccess: async () => {
      setNewStaff(emptyStaffForm);
      await utils.admin.dashboard.invalidate();
      toast.success("חשבון חדש נוסף בהצלחה.");
    },
    onError: (error) => toast.error(error.message || "לא הצלחנו ליצור חשבון חדש."),
  });
  const updateStaffMutation = trpc.admin.updateStaff.useMutation({
    onSuccess: async () => {
      setEditingStaffId(null);
      await Promise.all([utils.admin.dashboard.invalidate(), utils.publicSite.home.invalidate()]);
      toast.success("פרטי החשבון עודכנו.");
    },
    onError: (error) => toast.error(error.message || "עדכון החשבון נכשל."),
  });
  const deleteStaffMutation = trpc.admin.deleteStaff.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.admin.dashboard.invalidate(), utils.publicSite.home.invalidate()]);
      toast.success("החשבון נמחק.");
    },
    onError: (error) => toast.error(error.message || "מחיקת החשבון נכשלה."),
  });
  const createTestimonialMutation = trpc.admin.createTestimonial.useMutation({
    onSuccess: async () => {
      setNewTestimonial(emptyTestimonialForm);
      await Promise.all([utils.admin.dashboard.invalidate(), utils.publicSite.home.invalidate()]);
      toast.success("המלצה חדשה נוספה.");
    },
    onError: (error) => toast.error(error.message || "יצירת ההמלצה נכשלה."),
  });
  const updateTestimonialMutation = trpc.admin.updateTestimonial.useMutation({
    onSuccess: async () => {
      setEditingTestimonialId(null);
      await Promise.all([utils.admin.dashboard.invalidate(), utils.publicSite.home.invalidate()]);
      toast.success("ההמלצה עודכנה.");
    },
    onError: (error) => toast.error(error.message || "עדכון ההמלצה נכשל."),
  });
  const deleteTestimonialMutation = trpc.admin.deleteTestimonial.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.admin.dashboard.invalidate(), utils.publicSite.home.invalidate()]);
      toast.success("ההמלצה נמחקה.");
    },
    onError: (error) => toast.error(error.message || "מחיקת ההמלצה נכשלה."),
  });
  const deletePropertyMutation = trpc.admin.deleteProperty.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.admin.dashboard.invalidate(),
        utils.publicSite.home.invalidate(),
        utils.publicSite.properties.invalidate(),
      ]);
      toast.success("הנכס הוסר מהמערכת.");
    },
    onError: (error) => toast.error(error.message || "מחיקת הנכס נכשלה."),
  });
  const updatePropertyMutation = trpc.admin.updateProperty.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.admin.dashboard.invalidate(),
        utils.publicSite.home.invalidate(),
        utils.publicSite.properties.invalidate(),
      ]);
      toast.success("גלריית הנכס נשמרה והאתר הציבורי עודכן מיד.");
    },
    onError: (error) => toast.error(error.message || "עדכון גלריית הנכס נכשל."),
  });

  useEffect(() => {
    if (agentSessionQuery.isLoading || agentSessionQuery.isFetching) return;
    if (!agentSessionQuery.data) {
      toast.error("הגישה לפאנל הניהול מותרת רק לסוכנים מורשים עם אימייל וסיסמה תקינים.");
      navigate("/agent-login?next=%2Fadmin");
    }
  }, [agentSessionQuery.data, agentSessionQuery.isFetching, agentSessionQuery.isLoading, navigate]);

  useEffect(() => {
    if (!dashboardQuery.data?.settings) return;

    setSettingsForm({
      siteName: dashboardQuery.data.settings.siteName ?? "",
      headerLogoUrl: buildImageField(dashboardQuery.data.settings.headerLogoUrl),
      footerLogoUrl: buildImageField(dashboardQuery.data.settings.footerLogoUrl),
      landsmanLogoUrl: buildImageField(dashboardQuery.data.settings.landsmanLogoUrl),
      heroBackgroundUrl: buildImageField(dashboardQuery.data.settings.heroBackgroundUrl),
      shayAboutImageUrl: buildImageField(dashboardQuery.data.settings.shayAboutImageUrl),
      heroHeadline: dashboardQuery.data.settings.heroHeadline ?? "",
      heroTypingText: dashboardQuery.data.settings.heroTypingText ?? "",
      whatsappLink: dashboardQuery.data.settings.whatsappLink ?? "",
      officePhone: dashboardQuery.data.settings.officePhone ?? "",
      aboutTitle: dashboardQuery.data.settings.aboutTitle ?? "",
      aboutSubtitle: dashboardQuery.data.settings.aboutSubtitle ?? "",
      landsmanTitle: dashboardQuery.data.settings.landsmanTitle ?? "",
      landsmanBody: dashboardQuery.data.settings.landsmanBody ?? "",
      footerSlogan: dashboardQuery.data.settings.footerSlogan ?? "",
    });
  }, [dashboardQuery.data?.settings]);

  useEffect(() => {
    const section = dashboardQuery.data?.marketingSection;
    if (!section) return;

    setMarketingSectionForm({
      eyebrow: section.eyebrow,
      title: section.title,
      subtitle: section.subtitle,
      highlightsText: section.highlights.join("\n"),
      items: section.items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        type: item.type,
        mediaUrl: buildImageField(item.mediaUrl),
        posterUrl: buildImageField(item.posterUrl ?? ""),
      })),
    });
  }, [dashboardQuery.data?.marketingSection]);

  const activeStaff = useMemo(() => dashboardQuery.data?.staff ?? [], [dashboardQuery.data?.staff]);
  const testimonials = useMemo(() => dashboardQuery.data?.testimonials ?? [], [dashboardQuery.data?.testimonials]);
  const properties = useMemo(() => dashboardQuery.data?.properties ?? [], [dashboardQuery.data?.properties]);
  const leads = useMemo(() => dashboardQuery.data?.leads ?? [], [dashboardQuery.data?.leads]);

  useEffect(() => {
    setPropertyGalleryDrafts(
      Object.fromEntries(
        properties.map((property) => [
          property.id,
          {
            previewUrls: (property.images ?? []).map((image) => image.imageUrl),
            uploads: [],
            featuredImageIndex: getFeaturedImageIndex(
              (property.images ?? []).map((image) => image.imageUrl),
              property.featuredImageUrl,
            ),
          },
        ]),
      ),
    );
  }, [properties]);

  const handleSingleImageSelection = async (
    file: File | null,
    apply: (updater: (previous: ImageFieldState) => ImageFieldState) => void,
  ) => {
    if (!file) return;
    if (!allowedMediaMimeTypes.includes(file.type as UploadMediaMimeType)) {
      toast.error("אפשר להעלות JPG, PNG, WebP, MP4, WebM או MOV.");
      return;
    }
    const isVideoUpload = file.type.startsWith("video/");
    const maxBytes = isVideoUpload ? maxVideoUploadBytes : maxImageUploadBytes;
    if (file.size > maxBytes) {
      toast.error(
        isVideoUpload
          ? "הסרטון גדול מדי. כרגע אפשר להעלות MP4/WebM/MOV עד 3MB — דחס את הסרטון או העלה גרסה קצרה יותר."
          : "התמונה גדולה מדי. אפשר להעלות תמונות עד 5MB.",
      );
      return;
    }

    const upload = await buildUploadImagePayload(file);
    const previewUrl = URL.createObjectURL(file);
    apply((previous) => ({
      ...previous,
      previewUrl,
      upload,
    }));
  };

  const handleSaveSettings = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await updateSettingsMutation.mutateAsync({
      siteName: settingsForm.siteName,
      headerLogoUrl: serializeImageField(settingsForm.headerLogoUrl),
      footerLogoUrl: serializeImageField(settingsForm.footerLogoUrl),
      landsmanLogoUrl: serializeImageField(settingsForm.landsmanLogoUrl),
      heroBackgroundUrl: serializeImageField(settingsForm.heroBackgroundUrl),
      shayAboutImageUrl: serializeImageField(settingsForm.shayAboutImageUrl),
      heroHeadline: settingsForm.heroHeadline,
      heroTypingText: settingsForm.heroTypingText,
      whatsappLink: settingsForm.whatsappLink,
      officePhone: settingsForm.officePhone,
      aboutTitle: settingsForm.aboutTitle,
      aboutSubtitle: settingsForm.aboutSubtitle,
      landsmanTitle: settingsForm.landsmanTitle,
      landsmanBody: settingsForm.landsmanBody,
      footerSlogan: settingsForm.footerSlogan,
    });
  };

  const handleSaveMarketingSection = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const highlights = marketingSectionForm.highlightsText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    await updateMarketingSectionMutation.mutateAsync({
      eyebrow: marketingSectionForm.eyebrow,
      title: marketingSectionForm.title,
      subtitle: marketingSectionForm.subtitle,
      highlights,
      items: marketingSectionForm.items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        type: item.type,
        mediaUrl: serializeImageField(item.mediaUrl) || item.mediaUrl.previewUrl,
        posterUrl: serializeImageField(item.posterUrl),
      })),
    });
  };

  const handleCreateStaff = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await createStaffMutation.mutateAsync({
      ...newStaff,
      bio: newStaff.bio || null,
      photoUrl: serializeImageField(newStaff.photoUrl),
      password: newStaff.password || undefined,
    });
  };

  const handleSaveStaff = async (accountId: number) => {
    await updateStaffMutation.mutateAsync({
      accountId,
      data: {
        ...editingStaffForm,
        bio: editingStaffForm.bio || null,
        photoUrl: serializeImageField(editingStaffForm.photoUrl),
        password: editingStaffForm.password || undefined,
      },
    });
  };

  const handleCreateTestimonial = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await createTestimonialMutation.mutateAsync({
      ...newTestimonial,
      whatsappImageUrl: serializeImageField(newTestimonial.whatsappImageUrl),
    });
  };

  const handleSaveTestimonial = async (testimonialId: number) => {
    await updateTestimonialMutation.mutateAsync({
      testimonialId,
      data: {
        ...editingTestimonialForm,
        whatsappImageUrl: serializeImageField(editingTestimonialForm.whatsappImageUrl),
      },
    });
  };

  const handlePropertyGallerySelection = async (propertyId: number, fileList: FileList | null) => {
    const files = Array.from(fileList ?? []).filter((file) => allowedMimeTypes.includes(file.type as UploadMimeType));

    if (!files.length) {
      toast.error("יש לבחור לפחות קובץ JPG, PNG או WebP אחד.");
      return;
    }

    const uploads = await Promise.all(files.map((file) => buildUploadImagePayload(file)));
    const previewUrls = files.map((file) => URL.createObjectURL(file));

    setPropertyGalleryDrafts((previous) => ({
      ...previous,
      [propertyId]: {
        previewUrls,
        uploads,
        featuredImageIndex: 0,
      },
    }));
  };

  const handleSavePropertyGallery = async (property: (typeof properties)[number]) => {
    const draft = propertyGalleryDrafts[property.id];
    const previewUrls = draft?.previewUrls.length
      ? draft.previewUrls
      : (property.images ?? []).map((image) => image.imageUrl);
    const featuredImageIndex = draft?.featuredImageIndex ?? getFeaturedImageIndex(previewUrls, property.featuredImageUrl);

    if (!previewUrls.length) {
      toast.error("כדי לעדכן גלריה יש לבחור קודם תמונה אחת לפחות.");
      return;
    }

    await updatePropertyMutation.mutateAsync({
      propertyId: property.id,
      data: {
        agentId: property.agentId,
        title: property.title,
        address: property.address,
        street: property.street ?? null,
        neighborhood: property.neighborhood,
        city: property.city,
        price: property.price,
        rooms: property.rooms,
        sqm: property.sqm,
        builtSqm: property.builtSqm ?? null,
        outdoorSpace: property.outdoorSpace ?? null,
        floor: property.floor ?? null,
        status: property.status,
        description: property.description,
        descriptionHtml: property.descriptionHtml ?? null,
        isPublished: property.isPublished,
        featuredImageIndex: draft?.uploads.length ? featuredImageIndex : null,
        featuredImageUrl: previewUrls[featuredImageIndex] ?? property.featuredImageUrl ?? null,
        images: draft?.uploads ?? [],
      },
    });
  };

  if (agentSessionQuery.isLoading || (agentSessionQuery.data && dashboardQuery.isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffdf7]" dir="rtl">
        <div className="inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 text-base font-bold text-slate-700 shadow-md">
          <Loader2 className="size-5 animate-spin text-[#d9ae4c]" />
          טוענים את פאנל הניהול המאובטח...
        </div>
      </div>
    );
  }

  if (!agentSessionQuery.data) {
    return null;
  }

  return (
    <AgentLayout>
    <div className="py-6 px-4" dir="rtl">
      <div className="mx-auto max-w-[1160px] space-y-8">
        <header className="rounded-[32px] bg-[#d9ae4c] px-6 py-6 text-white shadow-[0_20px_50px_rgba(217,174,76,0.25)] md:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.08em] text-white/75">Admin Panel</p>
              <h1 className="mt-3 text-3xl font-black md:text-5xl">ניהול האתר, הסוכנים, ההמלצות והלידים</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-white/90">
                הגישה לפאנל הניהול נעולה לסוכנים מורשים בלבד. כל שינוי שתבצעו כאן נשמר ישירות במסד הנתונים ומתעדכן מיד באתר הציבורי.
              </p>
              <p className="mt-2 text-sm font-bold text-white/80">
                מחובר כעת: {agentSessionQuery.data.name} · {agentSessionQuery.data.email}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/agent-dashboard/new-property">
                <Button className="rounded-full bg-[#fff2a8] text-black hover:bg-[#ffe97a]">
                  <Plus className="size-4" />
                  הוספת נכס חדש
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="rounded-full border-white/70 bg-white/10 text-white hover:bg-white/15">
                  <ChevronLeft className="size-4" />
                  חזרה לאתר
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            { title: "נכסים", value: properties.length, icon: Building2 },
            { title: "סוכנים ואדמינים", value: activeStaff.length, icon: Users },
            { title: "המלצות", value: testimonials.length, icon: MessageSquareQuote },
            { title: "לידים חדשים", value: leads.length, icon: ShieldCheck },
          ].map((item) => (
            <article key={item.title} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
              <item.icon className="size-6 text-[#d9ae4c]" />
              <p className="mt-4 text-sm font-black uppercase tracking-[0.06em] text-slate-500">{item.title}</p>
              <p className="mt-2 text-4xl font-black text-slate-950">{item.value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <form id="admin-site-settings" onSubmit={handleSaveSettings} className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.05)] md:p-8">
            <div className="flex items-center gap-3">
              <Settings className="size-5 text-[#d9ae4c]" />
              <div>
                <p className="text-sm font-black uppercase tracking-[0.06em] text-[#d9ae4c]">Global Site Manager</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">הגדרות אתר גלובליות</h2>
              </div>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {[
                ["siteName", "שם האתר"],
                ["whatsappLink", "קישור WhatsApp"],
                ["officePhone", "טלפון משרד"],
                ["heroHeadline", "כותרת Hero"],
                ["heroTypingText", "טקסט אנימציית typing"],
                ["aboutTitle", "כותרת אזור אודות"],
                ["landsmanTitle", "כותרת Landsman"],
                ["footerSlogan", "סלוגן footer"],
              ].map(([key, label]) => (
                <label key={key} className="grid gap-2">
                  <span className="text-sm font-bold text-slate-700">{label}</span>
                  <input
                    value={settingsForm[key as keyof Omit<SiteSettingsFormState, "headerLogoUrl" | "footerLogoUrl" | "landsmanLogoUrl" | "heroBackgroundUrl" | "shayAboutImageUrl" | "aboutSubtitle" | "landsmanBody">] as string}
                    onChange={(event) => setSettingsForm((prev) => ({ ...prev, [key]: event.target.value }))}
                    className="h-12 rounded-2xl border border-slate-200 px-4 outline-none transition focus:border-[#d9ae4c] focus:ring-4 focus:ring-[#d9ae4c]/10"
                  />
                </label>
              ))}

              <ImageUploadField
                label="לוגו Header"
                hint="התמונה הזו תוצג בחלק העליון של האתר."
                value={settingsForm.headerLogoUrl}
                onFileSelected={(file) =>
                  handleSingleImageSelection(file, (updater) =>
                    setSettingsForm((prev) => ({ ...prev, headerLogoUrl: updater(prev.headerLogoUrl) })),
                  )
                }
              />
              <ImageUploadField
                label="לוגו Footer"
                hint="התמונה הזו תופיע באזור התחתון של האתר."
                value={settingsForm.footerLogoUrl}
                onFileSelected={(file) =>
                  handleSingleImageSelection(file, (updater) =>
                    setSettingsForm((prev) => ({ ...prev, footerLogoUrl: updater(prev.footerLogoUrl) })),
                  )
                }
              />
              <ImageUploadField
                label="רקע Hero"
                hint="רקע מרכזי לחלק העליון של דף הבית."
                value={settingsForm.heroBackgroundUrl}
                onFileSelected={(file) =>
                  handleSingleImageSelection(file, (updater) =>
                    setSettingsForm((prev) => ({ ...prev, heroBackgroundUrl: updater(prev.heroBackgroundUrl) })),
                  )
                }
              />
              <ImageUploadField
                label="תמונת Shay"
                hint="תמונה לאזור האודות והמיתוג האישי."
                value={settingsForm.shayAboutImageUrl}
                onFileSelected={(file) =>
                  handleSingleImageSelection(file, (updater) =>
                    setSettingsForm((prev) => ({ ...prev, shayAboutImageUrl: updater(prev.shayAboutImageUrl) })),
                  )
                }
              />
              <div className="md:col-span-2">
                <ImageUploadField
                  label="לוגו Landsman"
                  hint="לוגו שותף המופיע במקטעי האמון והחיבור לרשת."
                  value={settingsForm.landsmanLogoUrl}
                  onFileSelected={(file) =>
                    handleSingleImageSelection(file, (updater) =>
                      setSettingsForm((prev) => ({ ...prev, landsmanLogoUrl: updater(prev.landsmanLogoUrl) })),
                    )
                  }
                />
              </div>

              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm font-bold text-slate-700">תיאור אודות</span>
                <textarea
                  value={settingsForm.aboutSubtitle}
                  onChange={(event) => setSettingsForm((prev) => ({ ...prev, aboutSubtitle: event.target.value }))}
                  rows={4}
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#d9ae4c] focus:ring-4 focus:ring-[#d9ae4c]/10"
                />
              </label>
              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm font-bold text-slate-700">טקסט Landsman</span>
                <textarea
                  value={settingsForm.landsmanBody}
                  onChange={(event) => setSettingsForm((prev) => ({ ...prev, landsmanBody: event.target.value }))}
                  rows={4}
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#d9ae4c] focus:ring-4 focus:ring-[#d9ae4c]/10"
                />
              </label>
            </div>

            <Button type="submit" disabled={updateSettingsMutation.isPending} className="mt-6 rounded-full bg-[#d9ae4c] px-8 text-white hover:bg-[#c99a31]">
              {updateSettingsMutation.isPending ? "שומרים..." : "שמירת הגדרות האתר"}
            </Button>
          </form>

          <section id="admin-leads" className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.05)] md:p-8">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-[#d9ae4c]" />
              <div>
                <p className="text-sm font-black uppercase tracking-[0.06em] text-[#d9ae4c]">Lead Inbox</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">לידים אחרונים</h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {leads.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">עדיין לא התקבלו לידים במערכת.</div>
              ) : (
                leads.slice(0, 8).map((lead) => (
                  <article key={lead.id} className="rounded-[24px] border border-slate-200 bg-[#fbfdff] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-lg font-black text-slate-950">{lead.fullName}</p>
                      <span className="rounded-full bg-[#fff4d8] px-3 py-1 text-xs font-black text-[#d9ae4c]">{lead.neighborhood}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-600">טלפון: {lead.phone}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {lead.rooms} חדרים · {lead.sqm} מ״ר
                    </p>
                    {lead.notes ? <p className="mt-2 text-sm leading-7 text-slate-500">{lead.notes}</p> : null}
                  </article>
                ))
              )}
            </div>
          </section>
        </section>

        <section className="grid gap-8 xl:grid-cols-2">
          <section id="admin-staff" className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.05)] md:p-8">
            <div className="flex items-center gap-3">
              <Users className="size-5 text-[#d9ae4c]" />
              <div>
                <p className="text-sm font-black uppercase tracking-[0.06em] text-[#d9ae4c]">Team Manager</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">ניהול סוכנים ואדמינים</h2>
              </div>
            </div>

            <form onSubmit={handleCreateStaff} className="mt-6 grid gap-4 rounded-[28px] bg-[#fff8e6] p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <input placeholder="שם מלא" value={newStaff.name} onChange={(e) => setNewStaff((prev) => ({ ...prev, name: e.target.value }))} className="h-12 rounded-2xl border border-slate-200 px-4" />
                <input placeholder="אימייל" type="email" value={newStaff.email} onChange={(e) => setNewStaff((prev) => ({ ...prev, email: e.target.value }))} className="h-12 rounded-2xl border border-slate-200 px-4" />
                <input placeholder="טלפון" value={newStaff.phone} onChange={(e) => setNewStaff((prev) => ({ ...prev, phone: e.target.value }))} className="h-12 rounded-2xl border border-slate-200 px-4" />
                <input placeholder="תפקיד" value={newStaff.roleTitle} onChange={(e) => setNewStaff((prev) => ({ ...prev, roleTitle: e.target.value }))} className="h-12 rounded-2xl border border-slate-200 px-4" />
                <input placeholder="סיסמה ראשונית" value={newStaff.password} onChange={(e) => setNewStaff((prev) => ({ ...prev, password: e.target.value }))} className="h-12 rounded-2xl border border-slate-200 px-4" />
                <input placeholder="Sort Order" type="number" value={newStaff.sortOrder} onChange={(e) => setNewStaff((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))} className="h-12 rounded-2xl border border-slate-200 px-4" />
                <select value={newStaff.accountRole} onChange={(e) => setNewStaff((prev) => ({ ...prev, accountRole: e.target.value as StaffFormState["accountRole"] }))} className="h-12 rounded-2xl border border-slate-200 px-4">
                  <option value="agent">סוכן</option>
                  <option value="admin">אדמין</option>
                </select>
              </div>
              <textarea placeholder="Bio" value={newStaff.bio} onChange={(e) => setNewStaff((prev) => ({ ...prev, bio: e.target.value }))} rows={3} className="rounded-2xl border border-slate-200 px-4 py-3" />
              <ImageUploadField
                label="תמונת סוכן"
                hint="התמונה תישמר באחסון הקבוע ותופיע אוטומטית באתר ובכרטיס הסוכן."
                value={newStaff.photoUrl}
                onFileSelected={(file) =>
                  handleSingleImageSelection(file, (updater) =>
                    setNewStaff((prev) => ({ ...prev, photoUrl: updater(prev.photoUrl) })),
                  )
                }
              />
              <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-700">
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={newStaff.isFeaturedOnHomepage} onChange={(e) => setNewStaff((prev) => ({ ...prev, isFeaturedOnHomepage: e.target.checked }))} /> מוצג בדף הבית</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={newStaff.isActive} onChange={(e) => setNewStaff((prev) => ({ ...prev, isActive: e.target.checked }))} /> פעיל</label>
              </div>
              <Button type="submit" disabled={createStaffMutation.isPending} className="rounded-full bg-[#d9ae4c] text-white hover:bg-[#c99a31]">
                {createStaffMutation.isPending ? "יוצרים חשבון..." : "יצירת חשבון חדש"}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              {activeStaff.map((member) => {
                const isEditing = editingStaffId === member.id;
                return (
                  <article key={member.id} className="rounded-[24px] border border-slate-200 p-5">
                    {isEditing ? (
                      <div className="grid gap-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <input value={editingStaffForm.name} onChange={(e) => setEditingStaffForm((prev) => ({ ...prev, name: e.target.value }))} className="h-12 rounded-2xl border border-slate-200 px-4" />
                          <input value={editingStaffForm.email} onChange={(e) => setEditingStaffForm((prev) => ({ ...prev, email: e.target.value }))} className="h-12 rounded-2xl border border-slate-200 px-4" />
                          <input value={editingStaffForm.phone} onChange={(e) => setEditingStaffForm((prev) => ({ ...prev, phone: e.target.value }))} className="h-12 rounded-2xl border border-slate-200 px-4" />
                          <input value={editingStaffForm.roleTitle} onChange={(e) => setEditingStaffForm((prev) => ({ ...prev, roleTitle: e.target.value }))} className="h-12 rounded-2xl border border-slate-200 px-4" />
                          <select value={editingStaffForm.accountRole} onChange={(e) => setEditingStaffForm((prev) => ({ ...prev, accountRole: e.target.value as StaffFormState["accountRole"] }))} className="h-12 rounded-2xl border border-slate-200 px-4">
                            <option value="agent">סוכן</option>
                            <option value="admin">אדמין</option>
                          </select>
                          <input placeholder="סיסמה חדשה (אופציונלי)" value={editingStaffForm.password} onChange={(e) => setEditingStaffForm((prev) => ({ ...prev, password: e.target.value }))} className="h-12 rounded-2xl border border-slate-200 px-4" />
                          <input placeholder="סדר הצגה" type="number" value={editingStaffForm.sortOrder} onChange={(e) => setEditingStaffForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))} className="h-12 rounded-2xl border border-slate-200 px-4" />
                        </div>
                        <textarea value={editingStaffForm.bio} onChange={(e) => setEditingStaffForm((prev) => ({ ...prev, bio: e.target.value }))} rows={3} className="rounded-2xl border border-slate-200 px-4 py-3" />
                        <ImageUploadField
                          label="תמונת סוכן"
                          hint="אפשר לבחור תמונה חדשה ישירות מהמחשב."
                          value={editingStaffForm.photoUrl}
                          onFileSelected={(file) =>
                            handleSingleImageSelection(file, (updater) =>
                              setEditingStaffForm((prev) => ({ ...prev, photoUrl: updater(prev.photoUrl) })),
                            )
                          }
                        />
                        <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-700">
                          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={editingStaffForm.isFeaturedOnHomepage} onChange={(e) => setEditingStaffForm((prev) => ({ ...prev, isFeaturedOnHomepage: e.target.checked }))} /> מוצג בדף הבית</label>
                          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={editingStaffForm.isActive} onChange={(e) => setEditingStaffForm((prev) => ({ ...prev, isActive: e.target.checked }))} /> פעיל</label>
                        </div>
                        <div className="flex gap-3">
                          <Button type="button" disabled={updateStaffMutation.isPending} onClick={() => handleSaveStaff(member.id)} className="rounded-full bg-[#d9ae4c] text-white hover:bg-[#c99a31]">
                            {updateStaffMutation.isPending ? "שומר..." : "שמירת שינויים"}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setEditingStaffId(null)} className="rounded-full">ביטול</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            {member.photoUrl ? <img src={member.photoUrl} alt={member.name} className="h-16 w-16 rounded-2xl object-cover" /> : null}
                            <div>
                              <h3 className="text-xl font-black text-slate-950">{member.name}</h3>
                              <p className="mt-2 text-sm font-semibold text-slate-600">{member.roleTitle}</p>
                              <p className="mt-1 text-sm text-slate-500">{member.email}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setEditingStaffId(member.id);
                                setEditingStaffForm({
                                  accountRole: member.accountRole,
                                  name: member.name,
                                  email: member.email,
                                  phone: member.phone,
                                  password: "",
                                  roleTitle: member.roleTitle,
                                  bio: member.bio ?? "",
                                  photoUrl: buildImageField(member.photoUrl),
                                  sortOrder: member.sortOrder,
                                  isFeaturedOnHomepage: member.isFeaturedOnHomepage,
                                  isActive: member.isActive,
                                });
                              }}
                              className="rounded-full"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button type="button" variant="outline" onClick={() => deleteStaffMutation.mutate({ accountId: member.id })} className="rounded-full text-red-600">
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
                          <span className="rounded-full bg-[#fff4d8] px-3 py-1 text-[#d9ae4c]">{member.accountRole === "admin" ? "אדמין" : "סוכן"}</span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{member.phone}</span>
                          {member.isFeaturedOnHomepage ? <span className="rounded-full bg-[#fff8d7] px-3 py-1 text-[#b8860b]">מוצג בדף הבית</span> : null}
                        </div>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
        </section>

        <form
          id="admin-marketing-section"
          onSubmit={handleSaveMarketingSection}
          className="rounded-[32px] border border-[#D4AF37]/25 bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.05)] md:p-8"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-center gap-3">
              <ImagePlus className="size-5 text-[#d9ae4c]" />
              <div>
                <p className="text-sm font-black uppercase tracking-[0.06em] text-[#d9ae4c]">Marketing Section</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">סקשן שיטות השיווק באתר</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                  כאן אפשר לשנות כותרות, טקסטים, הדגשים, תמונות וסרטונים שמופיעים מתחת ל״השיטה״ בדף הבית.
                </p>
              </div>
            </div>
            <Button
              type="submit"
              disabled={updateMarketingSectionMutation.isPending}
              className="rounded-full bg-[#d9ae4c] px-8 text-black hover:bg-[#c99a31]"
            >
              {updateMarketingSectionMutation.isPending ? "שומרים..." : "שמירת סקשן השיווק"}
            </Button>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {[
              ["eyebrow", "כותרת קטנה"],
              ["title", "כותרת ראשית"],
            ].map(([key, label]) => (
              <label key={key} className="grid gap-2">
                <span className="text-sm font-bold text-slate-700">{label}</span>
                <input
                  value={marketingSectionForm[key as "eyebrow" | "title"]}
                  onChange={(event) => setMarketingSectionForm((prev) => ({ ...prev, [key]: event.target.value }))}
                  className="h-12 rounded-2xl border border-slate-200 px-4 outline-none transition focus:border-[#d9ae4c] focus:ring-4 focus:ring-[#d9ae4c]/10"
                />
              </label>
            ))}
            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-bold text-slate-700">תיאור הסקשן</span>
              <textarea
                value={marketingSectionForm.subtitle}
                onChange={(event) => setMarketingSectionForm((prev) => ({ ...prev, subtitle: event.target.value }))}
                rows={3}
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#d9ae4c] focus:ring-4 focus:ring-[#d9ae4c]/10"
              />
            </label>
            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-bold text-slate-700">תגיות / הדגשים — שורה לכל הדגש</span>
              <textarea
                value={marketingSectionForm.highlightsText}
                onChange={(event) => setMarketingSectionForm((prev) => ({ ...prev, highlightsText: event.target.value }))}
                rows={4}
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#d9ae4c] focus:ring-4 focus:ring-[#d9ae4c]/10"
              />
            </label>
          </div>

          <div className="mt-8 grid gap-5 xl:grid-cols-2">
            {marketingSectionForm.items.map((item, index) => (
              <article key={item.id} className="rounded-[28px] border border-slate-200 bg-[#fbfdff] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-black text-slate-950">כרטיס שיווק #{index + 1}</p>
                  <select
                    value={item.type}
                    onChange={(event) =>
                      setMarketingSectionForm((prev) => ({
                        ...prev,
                        items: prev.items.map((current, currentIndex) =>
                          currentIndex === index ? { ...current, type: event.target.value as "image" | "video" } : current,
                        ),
                      }))
                    }
                    className="h-10 rounded-2xl border border-[#D4AF37]/50 bg-white px-3 text-sm font-bold outline-none"
                  >
                    <option value="image">תמונה</option>
                    <option value="video">וידאו</option>
                  </select>
                </div>

                <div className="mt-5 grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-700">כותרת הכרטיס</span>
                    <input
                      value={item.title}
                      onChange={(event) =>
                        setMarketingSectionForm((prev) => ({
                          ...prev,
                          items: prev.items.map((current, currentIndex) =>
                            currentIndex === index ? { ...current, title: event.target.value } : current,
                          ),
                        }))
                      }
                      className="h-12 rounded-2xl border border-slate-200 px-4 outline-none transition focus:border-[#d9ae4c] focus:ring-4 focus:ring-[#d9ae4c]/10"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-700">תיאור הכרטיס</span>
                    <textarea
                      value={item.description}
                      onChange={(event) =>
                        setMarketingSectionForm((prev) => ({
                          ...prev,
                          items: prev.items.map((current, currentIndex) =>
                            currentIndex === index ? { ...current, description: event.target.value } : current,
                          ),
                        }))
                      }
                      rows={3}
                      className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#d9ae4c] focus:ring-4 focus:ring-[#d9ae4c]/10"
                    />
                  </label>
                  <MediaUploadField
                    label="קובץ מדיה לכרטיס"
                    hint="אפשר להעלות תמונה או סרטון. אם לא מעלים קובץ חדש, הקובץ הקיים נשאר."
                    value={item.mediaUrl}
                    onPreview={() =>
                      item.mediaUrl.previewUrl
                        ? setAdminMediaPreview({
                            title: item.title,
                            type: item.type,
                            url: item.mediaUrl.previewUrl,
                            posterUrl: item.posterUrl.previewUrl || undefined,
                          })
                        : undefined
                    }
                    onFileSelected={(file) =>
                      handleSingleImageSelection(file, (updater) =>
                        setMarketingSectionForm((prev) => ({
                          ...prev,
                          items: prev.items.map((current, currentIndex) =>
                            currentIndex === index ? { ...current, mediaUrl: updater(current.mediaUrl) } : current,
                          ),
                        })),
                      )
                    }
                  />
                  {item.type === "video" ? (
                    <MediaUploadField
                      label="תמונת פתיחה לווידאו"
                      hint="אופציונלי — תמונה שתופיע לפני הפעלת הסרטון."
                      value={item.posterUrl}
                      onPreview={() =>
                        item.posterUrl.previewUrl
                          ? setAdminMediaPreview({
                              title: `תמונת פתיחה — ${item.title}`,
                              type: "image",
                              url: item.posterUrl.previewUrl,
                            })
                          : undefined
                      }
                      onFileSelected={(file) =>
                        handleSingleImageSelection(file, (updater) =>
                          setMarketingSectionForm((prev) => ({
                            ...prev,
                            items: prev.items.map((current, currentIndex) =>
                              currentIndex === index ? { ...current, posterUrl: updater(current.posterUrl) } : current,
                            ),
                          })),
                        )
                      }
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </form>

        {adminMediaPreview ? (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setAdminMediaPreview(null)}
          >
            <div className="w-full max-w-6xl overflow-hidden rounded-[28px] bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h3 className="text-lg font-black text-slate-950">{adminMediaPreview.title}</h3>
                <Button type="button" variant="outline" onClick={() => setAdminMediaPreview(null)} className="rounded-full">
                  סגירה
                </Button>
              </div>
              <div className="bg-black">
                {adminMediaPreview.type === "video" ? (
                  <video
                    src={adminMediaPreview.url}
                    poster={adminMediaPreview.posterUrl}
                    controls
                    playsInline
                    className="max-h-[78vh] w-full object-contain"
                  />
                ) : (
                  <img src={adminMediaPreview.url} alt={adminMediaPreview.title} className="max-h-[78vh] w-full object-contain" />
                )}
              </div>
            </div>
          </div>
        ) : null}

        <section id="admin-testimonials" className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.05)] md:p-8">
            <div className="flex items-center gap-3">
              <MessageSquareQuote className="size-5 text-[#d9ae4c]" />
              <div>
                <p className="text-sm font-black uppercase tracking-[0.06em] text-[#d9ae4c]">Testimonials Manager</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">ניהול המלצות וקרוסלה</h2>
              </div>
            </div>

            <form onSubmit={handleCreateTestimonial} className="mt-6 grid gap-4 rounded-[28px] bg-[#fff8e6] p-5">
              <input placeholder="שם מקור / כותרת" value={newTestimonial.sourceName} onChange={(e) => setNewTestimonial((prev) => ({ ...prev, sourceName: e.target.value }))} className="h-12 rounded-2xl border border-slate-200 px-4" />
              <textarea placeholder="טקסט ההמלצה" value={newTestimonial.quote} onChange={(e) => setNewTestimonial((prev) => ({ ...prev, quote: e.target.value }))} rows={4} className="rounded-2xl border border-slate-200 px-4 py-3" />
              <div className="grid gap-4 md:grid-cols-3">
                <input placeholder="סוג מקור (WhatsApp / Google)" value={newTestimonial.sourceLabel} onChange={(e) => setNewTestimonial((prev) => ({ ...prev, sourceLabel: e.target.value }))} className="h-12 rounded-2xl border border-slate-200 px-4" />
                <input type="number" min={1} max={5} value={newTestimonial.stars} onChange={(e) => setNewTestimonial((prev) => ({ ...prev, stars: Number(e.target.value) }))} className="h-12 rounded-2xl border border-slate-200 px-4" />
                <input type="number" min={1} value={newTestimonial.displayOrder} onChange={(e) => setNewTestimonial((prev) => ({ ...prev, displayOrder: Number(e.target.value) }))} className="h-12 rounded-2xl border border-slate-200 px-4" placeholder="מיקום בתצוגה" />
              </div>
              <ImageUploadField
                label="צילום WhatsApp / מקור"
                hint="אפשר להעלות צילום מסך או תמונת מקור ישירות מהמחשב."
                value={newTestimonial.whatsappImageUrl}
                onFileSelected={(file) =>
                  handleSingleImageSelection(file, (updater) =>
                    setNewTestimonial((prev) => ({ ...prev, whatsappImageUrl: updater(prev.whatsappImageUrl) })),
                  )
                }
              />
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={newTestimonial.isPublished} onChange={(e) => setNewTestimonial((prev) => ({ ...prev, isPublished: e.target.checked }))} /> מפורסם באתר</label>
              <Button type="submit" disabled={createTestimonialMutation.isPending} className="rounded-full bg-[#d9ae4c] text-white hover:bg-[#c99a31]">
                {createTestimonialMutation.isPending ? "מוסיפים המלצה..." : "הוספת המלצה חדשה"}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              {testimonials.map((item) => {
                const isEditing = editingTestimonialId === item.id;
                return (
                  <article key={item.id} className="rounded-[24px] border border-slate-200 p-5">
                    {isEditing ? (
                      <div className="grid gap-4">
                        <input value={editingTestimonialForm.sourceName} onChange={(e) => setEditingTestimonialForm((prev) => ({ ...prev, sourceName: e.target.value }))} className="h-12 rounded-2xl border border-slate-200 px-4" />
                        <textarea value={editingTestimonialForm.quote} onChange={(e) => setEditingTestimonialForm((prev) => ({ ...prev, quote: e.target.value }))} rows={4} className="rounded-2xl border border-slate-200 px-4 py-3" />
                        <div className="grid gap-4 md:grid-cols-3">
                          <input value={editingTestimonialForm.sourceLabel} onChange={(e) => setEditingTestimonialForm((prev) => ({ ...prev, sourceLabel: e.target.value }))} className="h-12 rounded-2xl border border-slate-200 px-4" />
                          <input type="number" min={1} max={5} value={editingTestimonialForm.stars} onChange={(e) => setEditingTestimonialForm((prev) => ({ ...prev, stars: Number(e.target.value) }))} className="h-12 rounded-2xl border border-slate-200 px-4" />
                          <input type="number" min={1} value={editingTestimonialForm.displayOrder} onChange={(e) => setEditingTestimonialForm((prev) => ({ ...prev, displayOrder: Number(e.target.value) }))} className="h-12 rounded-2xl border border-slate-200 px-4" placeholder="מיקום בתצוגה" />
                        </div>
                        <ImageUploadField
                          label="תמונת מקור להמלצה"
                          hint="ניתן לבחור קובץ חדש ולהחליף את התמונה הקיימת."
                          value={editingTestimonialForm.whatsappImageUrl}
                          onFileSelected={(file) =>
                            handleSingleImageSelection(file, (updater) =>
                              setEditingTestimonialForm((prev) => ({ ...prev, whatsappImageUrl: updater(prev.whatsappImageUrl) })),
                            )
                          }
                        />
                        <div className="flex gap-3">
                          <Button type="button" onClick={() => handleSaveTestimonial(item.id)} className="rounded-full bg-[#d9ae4c] text-white hover:bg-[#c99a31]">שמירת שינויים</Button>
                          <Button type="button" variant="outline" onClick={() => setEditingTestimonialId(null)} className="rounded-full">ביטול</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            {item.whatsappImageUrl ? <img src={item.whatsappImageUrl} alt={item.sourceName} className="h-16 w-16 rounded-2xl object-cover" /> : null}
                            <div>
                              <h3 className="text-lg font-black text-slate-950">{item.sourceName}</h3>
                              <p className="mt-2 text-sm leading-7 text-slate-600">{item.quote}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setEditingTestimonialId(item.id);
                                setEditingTestimonialForm({
                                  quote: item.quote,
                                  sourceName: item.sourceName,
                                  sourceLabel: item.sourceLabel,
                                  stars: item.stars,
                                  whatsappImageUrl: buildImageField(item.whatsappImageUrl),
                                  displayOrder: item.displayOrder,
                                  isPublished: item.isPublished,
                                });
                              }}
                              className="rounded-full"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button type="button" variant="outline" onClick={() => deleteTestimonialMutation.mutate({ testimonialId: item.id })} className="rounded-full text-red-600">
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
                          <span className="rounded-full bg-[#fff4d8] px-3 py-1 text-[#d9ae4c]">{item.sourceLabel}</span>
                          <span className="rounded-full bg-[#fff8d7] px-3 py-1 text-[#b8860b]">{item.stars} כוכבים</span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">מיקום {item.displayOrder}</span>
                        </div>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <section id="admin-properties" className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.05)] md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Building2 className="size-5 text-[#d9ae4c]" />
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.06em] text-[#d9ae4c]">Property Manager</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-950">ניהול נכסים</h2>
                </div>
              </div>
              <Link href="/agent-dashboard/new-property">
                <Button className="rounded-full bg-[#d9ae4c] text-white hover:bg-[#c99a31]">
                  <Plus className="size-4" />
                  הוספת נכס
                </Button>
              </Link>
            </div>

            <div className="mt-4 rounded-[24px] bg-[#fff8e6] p-4 text-sm leading-7 text-slate-600">
              כעת אפשר להעלות מתוך /admin קבצי JPG, PNG ו-WebP ישירות ללוגואים, תמונות התוכן וגלריות הנכסים. לאחר השמירה התמונות נשמרות באחסון הקבוע, מקושרות למסד ומתעדכנות מיד באתר הציבורי.
            </div>

            <div className="mt-6 space-y-4">
              {properties.map((property) => (
                <article key={property.id} className="rounded-[24px] border border-slate-200 p-5">
                  {(() => {
                    const draft = propertyGalleryDrafts[property.id];
                    const previewUrls = draft?.previewUrls.length
                      ? draft.previewUrls
                      : (property.images ?? []).map((image) => image.imageUrl);
                    const featuredImageIndex = draft?.featuredImageIndex ?? getFeaturedImageIndex(previewUrls, property.featuredImageUrl);

                    return (
                      <>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4">
                      {property.featuredImageUrl ? <img src={property.featuredImageUrl} alt={property.title} className="h-20 w-20 rounded-2xl object-cover" /> : null}
                      <div>
                        <h3 className="text-xl font-black text-slate-950">{property.title}</h3>
                        <p className="mt-2 text-sm text-slate-600">{property.address}, {property.neighborhood}</p>
                        <p className="mt-2 text-sm font-semibold text-slate-600">₪{property.price.toLocaleString("he-IL")} · {property.rooms} חדרים · {property.sqm} מ״ר</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                          <span className="rounded-full bg-[#fff4d8] px-3 py-1 text-[#d9ae4c]">{property.status}</span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">נכס מנוהל במערכת</span>
                          {property.isPublished ? <span className="rounded-full bg-[#fff8d7] px-3 py-1 text-[#b8860b]">מפורסם</span> : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/agent-dashboard/new-property?id=${property.id}`}>
                        <Button variant="outline" className="rounded-full">
                          <Pencil className="size-4" />
                        </Button>
                      </Link>
                      <Button type="button" variant="outline" onClick={() => deletePropertyMutation.mutate({ propertyId: property.id })} className="rounded-full text-red-600">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[24px] bg-[#fff8e6] p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-sm font-black text-slate-950">גלריית תמונות הנכס</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">בחירת תמונות לגלריה מתוך המחשב תחליף את גלריית הנכס הנוכחית לאחר השמירה. אפשר גם לבחור איזו תמונה תופיע כתמונה הראשית.</p>
                      </div>
                      <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[#d9ae4c]/35 bg-white px-4 text-sm font-bold text-[#b98b2f] transition hover:bg-[#fff4d8]">
                        <Upload className="size-4" />
                        בחירת תמונות לגלריה
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(event) => {
                            void handlePropertyGallerySelection(property.id, event.target.files);
                            event.currentTarget.value = "";
                          }}
                        />
                      </label>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                      {previewUrls.length ? (
                        previewUrls.map((imageUrl, index) => (
                          <button
                            key={`${property.id}-${imageUrl}-${index}`}
                            type="button"
                            onClick={() =>
                              setPropertyGalleryDrafts((previous) => ({
                                ...previous,
                                [property.id]: {
                                  ...(previous[property.id] ?? { previewUrls, uploads: [], featuredImageIndex: 0 }),
                                  previewUrls,
                                  featuredImageIndex: index,
                                },
                              }))
                            }
                            className={`relative overflow-hidden rounded-2xl border-2 text-right transition ${
                              featuredImageIndex === index
                                ? "border-[#d9ae4c] shadow-[0_10px_24px_rgba(217,174,76,0.22)]"
                                : "border-transparent"
                            }`}
                          >
                            <img src={imageUrl} alt={`${property.title} ${index + 1}`} className="h-24 w-full object-cover" />
                            <span className={`absolute right-2 top-2 rounded-full px-3 py-1 text-[11px] font-black ${
                              featuredImageIndex === index
                                ? "bg-[#d9ae4c] text-white"
                                : "bg-white/90 text-slate-700"
                            }`}>
                              {featuredImageIndex === index ? "תמונה ראשית" : "הגדר כראשית"}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="col-span-full rounded-[20px] border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-400">
                          עדיין לא הועלו תמונות לגלריה של נכס זה.
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        onClick={() => void handleSavePropertyGallery(property)}
                        disabled={updatePropertyMutation.isPending}
                        className="rounded-full bg-[#d9ae4c] text-white hover:bg-[#c99a31]"
                      >
                        {updatePropertyMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                        שמירת גלריה לאתר
                      </Button>
                      <span className="text-xs font-semibold text-slate-500">הקבצים נשמרים באחסון הקבוע ומקושרים אוטומטית למסד הנתונים של הנכס.</span>
                    </div>
                  </div>
                      </>
                    );
                  })()}
                </article>
              ))}
            </div>
          </section>

        </section>
        </div>
      </div>
    </AgentLayout>
  );
}
