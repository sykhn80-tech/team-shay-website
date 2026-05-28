import React, { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Building2,
  Check,
  ChevronLeft,
  Handshake,
  Loader2,
  Megaphone,
  Menu,
  MessageCircle,
  Phone,
  Ruler,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { trpc } from "@/lib/trpc";
import {
  agents as fallbackAgents,
  heroTrustBadges,
  JERUSALEM_HERO,
  LANDSMAN_LOGO,
  OFFICE_PHONE,
  OFFICE_PHONE_LINK,
  SHAY_ABOUT_IMAGE,
  TEAM_LOGO,
  TYPING_TEXT,
  WHATSAPP_LINK,
} from "@/lib/siteData";

const navItems: Array<{ label: string; href: string; isRoute: boolean }> = [
  { label: "דף הבית", href: "#home", isRoute: false },
  { label: "אודות", href: "#about", isRoute: false },
  { label: "שיטה", href: "#method", isRoute: false },
  { label: "נכסים", href: "/properties", isRoute: true },
  { label: "התחברות סוכנים", href: "/agent-login", isRoute: true },
];

const HERO_VIDEO_URL = "/media/hero-animation.mp4";
const HERO_LOOP_END_SECONDS = 5.4;
const HERO_LOOP_START_SECONDS = 0.02;
const HERO_LOOP_TARGET_SECONDS = 8;
const ELIYA_IMAGE_URL = "/agents/eliya-card.jpeg";
const AVIAD_IMAGE_URL = "/agents/aviad-card.jpeg";

const fallbackSettings = {
  siteName: "Team Shay",
  headerLogoUrl: TEAM_LOGO,
  footerLogoUrl: TEAM_LOGO,
  landsmanLogoUrl: LANDSMAN_LOGO,
  heroBackgroundUrl: JERUSALEM_HERO,
  shayAboutImageUrl: SHAY_ABOUT_IMAGE,
  heroHeadline: "דואגים למכור לכם את הנכס במחיר המקסימלי ובזמן הקצר ביותר",
  heroTypingText: TYPING_TEXT,
  whatsappLink: WHATSAPP_LINK,
  officePhone: OFFICE_PHONE,
  aboutTitle: "אמון, תוצאות ומקצוענות שמרגישים מהרגע הראשון",
  aboutSubtitle:
    "צוות שי כהן מבית Landsman ירושלים נבנה במטרה אחת: לתת לכם שקט נפשי. אנחנו לא רק 'מציגים' נכסים, אנחנו מנהלים אסטרטגיית שיווק חכמה, מדויקת ואגרסיבית כדי למקסם את שווי הנכס שלכם, במינימום זמן ובמקסימום שקיפות",
  landsmanTitle: "רשת חזקה מאחוריכם, צוות ממוקד לצדכם",
  landsmanBody:
    "Team Shay פועל תחת Landsman ירושלים ומחבר בין ידע מקומי, שיטות שיווק חכמות ונגישות לרשת רחבה של אנשי מקצוע, קונים ושיתופי פעולה, 15 סניפים ברחבי הארץ, הצטרפו לרשת הצומחת בישראל.",
  footerSlogan: "״מתווכים בצד שלך״",
};

const aboutChecklistItems = [
  {
    icon: Handshake,
    text: "ליווי אישי בגובה העיניים – מהפגישה הראשונה ועד להעברת המפתח",
  },
  {
    icon: Megaphone,
    text: "אסטרטגיית שיווק מתקדמת – חשיפה מקסימלית וסינון קונים קפדני.",
  },
  {
    icon: ShieldCheck,
    text: "אמנות המשא ומתן – נלחמים על כל שקל כדי להבטיח את האינטרס שלכם.",
  },
  {
    icon: Building2,
    text: "הגב של רשת Landsman – מאגר קונים עצום ובלעדי וחיבורים עמוקים בשוק.",
  },
];

const valueSteps = [
  {
    step: 1,
    title: "מעטפת שיווקית מלאה",
    subtitle:
      "אנחנו בונים לכל נכס מעטפת שיווקית מדויקת שמייצרת עניין וביקוש אמיתי – צילום מקצועי, פרסום חכם וחשיפה רחבה לקהל הנכון.",
  },
  {
    step: 2,
    title: "One Stop Shop",
    subtitle:
      "כל מה שצריך למכירה במקום אחד – משיווק, דרך ייעוץ משכנתאות, קבלנים ועד ליווי משפטי ומקצועי.",
  },
  {
    step: 3,
    title: "שת״פ מלא",
    subtitle:
      "אנחנו עובדים בשיתוף פעולה עם סוכנים וקונים רלוונטיים כדי להביא לחשיפה מקסימלית וליצור תחרות אמיתית על הנכס שלכם [ומתחייבים לכך].",
  },
  {
    step: 4,
    title: "תהליך שיטתי שעובד",
    subtitle:
      "עובדים לפי שיטה מוכחת שמובילה תוצאות – כל שלב מתוכנן מראש כדי להבטיח מכירה יעילה ומדויקת",
  },
  {
    step: 5,
    title: "סגירה חכמה ומקסום מחיר",
    subtitle:
      "אנחנו יודעים איך לסגור נכון את העסקה – למקסם את המחיר, לשמור על האינטרסים שלכם ולסיים את התהליך בצורה חלקה ובטוחה.",
  },
];

const normalizeAgentName = (value: string) => value.replace(/\s+/g, "");

type AgentDisplayOverride = {
  email: string;
  phone: string;
  expertise?: string;
  image?: string;
  imagePosition?: string;
};

const agentDisplayOverrides = new Map<string, AgentDisplayOverride>([
  [
    "שיכהן",
    { email: "shay2003ai@gmail.com", phone: "052-863-6631", expertise: "ראש הצוות, מומחה משא ומתן ושיווק פרויקטים" },
  ],
  ["שי", { email: "shay2003ai@gmail.com", phone: "052-863-6631", expertise: "ראש הצוות, מומחה משא ומתן ושיווק פרויקטים" }],
  [
    "אביעדניסים",
    {
      email: "aviad5436@gmail.com",
      phone: "052-533-5251",
      expertise: "סוכן מוכרים. מומחה לאזור גילה והר חומה",
      image: AVIAD_IMAGE_URL,
      imagePosition: "center center",
    },
  ],
  [
    "אביעד",
    {
      email: "aviad5436@gmail.com",
      phone: "052-533-5251",
      expertise: "סוכן מוכרים. מומחה לאזור גילה והר חומה",
      image: AVIAD_IMAGE_URL,
      imagePosition: "center center",
    },
  ],
  [
    "רונןדוידיאן",
    { email: "ronend0000@gmail.com", phone: "050-900-5161", expertise: "מלווה משקיעים ורוכשים" },
  ],
  ["רונן", { email: "ronend0000@gmail.com", phone: "050-900-5161", expertise: "מלווה משקיעים ורוכשים" }],
  [
    "אליהמרציאנו",
    {
      email: "eliyamarciano1@gmail.com",
      phone: "050-254-0855",
      expertise: "סוכן מוכרים. מומחה לאזור קריית יובל והסביבה",
      image: ELIYA_IMAGE_URL,
      imagePosition: "center top",
    },
  ],
  [
    "אליה",
    {
      email: "eliyamarciano1@gmail.com",
      phone: "050-254-0855",
      expertise: "סוכן מוכרים. מומחה לאזור קריית יובל והסביבה",
      image: ELIYA_IMAGE_URL,
      imagePosition: "center top",
    },
  ],
  [
    "ירדןגמליאל",
    {
      email: "yardeen12@gmail.com",
      phone: "050-253-5095",
      expertise: "סוכן מוכרים. מומחה לאזור קטמונים, קטמון, סן סימון ורסקו",
    },
  ],
  [
    "ירדן",
    {
      email: "yardeen12@gmail.com",
      phone: "050-253-5095",
      expertise: "סוכן מוכרים. מומחה לאזור קטמונים, קטמון, סן סימון ורסקו",
    },
  ],
]);

const normalizeTestimonialTitle = (value: string) => (value.trim() === "מאי אווריין" ? "מאי אוחיון" : value);

const fallbackTestimonials = [
  {
    id: 1,
    source: "WhatsApp",
    title: "שי אלמקיאס",
    quote: "תודה רבה לך, גם אני שמחתי מאוד להכיר. באמת מצאת לנו דירה ממש מתאימה וטובה, בהצלחה רבה.",
    stars: 5,
    displayOrder: 1,
    whatsappImageUrl: "/restored-testimonials/shi-almakais.png",
  },
  {
    id: 2,
    source: "google",
    title: "לינור לוברבאום",
    quote: "שי היקר עם יחסי אנוש גבוהים, קידם את העסקה בצורה טובה ביותר. נעים לעיניים, הכל מתנהל בנעימות.",
    stars: 5,
    displayOrder: 2,
    whatsappImageUrl: "/restored-testimonials/linor-loberbaum.png",
  },
  {
    id: 3,
    source: "google",
    title: "מאי אוחיון",
    quote: "רציתי להמליץ מכל הלב על המתווך שי כהן. מהרגע הראשון הרגשנו בידיים טובות, מקצועי וזמין לכל שאלה.",
    stars: 5,
    displayOrder: 3,
    whatsappImageUrl: "/restored-testimonials/mai-avorian.png",
  },
  {
    id: 4,
    source: "google",
    title: "בר אלוז",
    quote: "צוות מסור ואחראי, נהניתי מכל רגע איתם בתהליך וממליץ בחום!",
    stars: 5,
    displayOrder: 4,
    whatsappImageUrl: "/restored-testimonials/bar-eluz.png",
  },
  {
    id: 5,
    source: "google",
    title: "נטלי תורג'מן",
    quote: "ממליצה בחום ויושרה ברמה גבוהה, תודה על הליווי האישי והחם שהענקתם לנו.",
    stars: 5,
    displayOrder: 5,
    whatsappImageUrl: "/restored-testimonials/natali-torgeman.png",
  },
  {
    id: 6,
    source: "WhatsApp",
    title: "מואיז כהן",
    quote: "תודה רבה על השירות והסבלנות. אוהבים אותך!",
    stars: 5,
    displayOrder: 6,
    whatsappImageUrl: "/restored-testimonials/moiz-cohen.png",
  },
] as const;

export default function Home() {
  const [typedText, setTypedText] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [leadStep, setLeadStep] = useState<1 | 2>(1);
  const [propertyCarouselApi, setPropertyCarouselApi] = useState<CarouselApi | null>(null);
  const [selectedPropertySlide, setSelectedPropertySlide] = useState(0);
  const [isPropertyCarouselPaused, setIsPropertyCarouselPaused] = useState(false);
  const [formData, setFormData] = useState({
    neighborhood: "",
    rooms: "",
    sqm: "",
    fullName: "",
    phone: "",
  });

  const homeQuery = trpc.publicSite.home.useQuery(undefined, {
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 3_000,
  });
  const submitLeadMutation = trpc.publicSite.submitLead.useMutation();

  const settings = homeQuery.data?.settings ?? fallbackSettings;
  const whatsappLink = settings?.whatsappLink || WHATSAPP_LINK;
  const officePhone = settings?.officePhone || OFFICE_PHONE;
  const officePhoneLink = officePhone.replace(/\D/g, "") || OFFICE_PHONE_LINK;
  const trustBadges = heroTrustBadges.slice(0, 3);

  const homepageAgents = useMemo(() => {
    const dbAgents = homeQuery.data?.agents ?? [];
    if (dbAgents.length > 0) {
      return dbAgents.map((agent, index) => ({
        ...(() => {
          const fallbackAgent = fallbackAgents[index % fallbackAgents.length];
          const displayOverride = agentDisplayOverrides.get(normalizeAgentName(agent.name));
          return {
            id: agent.id,
            name: agent.name,
            expertise: displayOverride?.expertise || agent.roleTitle + (agent.bio ? `. ${agent.bio}` : ""),
            phone: displayOverride?.phone || agent.phone || officePhone,
            email: displayOverride?.email || agent.email || "",
            image: displayOverride?.image || agent.photoUrl || fallbackAgent?.image || SHAY_ABOUT_IMAGE,
            imagePosition: displayOverride?.imagePosition || fallbackAgent?.imagePosition || "center 20%",
          };
        })(),
      }));
    }

    return fallbackAgents.map((agent) => {
      const displayOverride = agentDisplayOverrides.get(normalizeAgentName(agent.name));
      return {
        ...agent,
        expertise: displayOverride?.expertise || agent.expertise,
        email: displayOverride?.email || (agent as { email?: string }).email || "",
        phone: displayOverride?.phone || agent.phone,
        image: displayOverride?.image || agent.image,
        imagePosition: displayOverride?.imagePosition || agent.imagePosition,
      };
    });
  }, [homeQuery.data?.agents, officePhone]);

  const featuredProperties = useMemo(() => {
    const properties = homeQuery.data?.properties ?? [];
    return properties.slice(0, 8).map((property) => ({
      id: property.id,
      title: property.title,
      neighborhood: property.neighborhood,
      city: property.city,
      price: property.price,
      rooms: property.rooms,
      sqm: property.sqm,
      status: property.status,
      image:
        property.featuredImageUrl ||
        property.images?.[0]?.imageUrl ||
        JERUSALEM_HERO,
    }));
  }, [homeQuery.data?.properties]);

  const featuredPropertyTrack = useMemo(
    () => featuredProperties,
    [featuredProperties],
  );

  const selectPropertySlide = useCallback((index: number) => {
    propertyCarouselApi?.scrollTo(index);
  }, [propertyCarouselApi]);

  const scrollPropertyCarousel = useCallback((direction: "prev" | "next") => {
    if (!propertyCarouselApi) return;

    if (direction === "prev") {
      propertyCarouselApi.scrollPrev();
      return;
    }

    propertyCarouselApi.scrollNext();
  }, [propertyCarouselApi]);

  useEffect(() => {
    if (!propertyCarouselApi) return;

    const updateSelectedSlide = () => {
      setSelectedPropertySlide(propertyCarouselApi.selectedScrollSnap());
    };

    updateSelectedSlide();
    propertyCarouselApi.on("select", updateSelectedSlide);
    propertyCarouselApi.on("reInit", updateSelectedSlide);

    return () => {
      propertyCarouselApi.off("select", updateSelectedSlide);
      propertyCarouselApi.off("reInit", updateSelectedSlide);
    };
  }, [propertyCarouselApi]);

  useEffect(() => {
    if (!propertyCarouselApi || isPropertyCarouselPaused || featuredPropertyTrack.length <= 1) return;

    const autoplay = window.setInterval(() => {
      propertyCarouselApi.scrollNext();
    }, 5000);

    return () => window.clearInterval(autoplay);
  }, [featuredPropertyTrack.length, isPropertyCarouselPaused, propertyCarouselApi]);

  const heroPlaybackRate = useMemo(
    () => Math.max(0.25, Math.min(1, (HERO_LOOP_END_SECONDS - HERO_LOOP_START_SECONDS) / HERO_LOOP_TARGET_SECONDS)),
    [],
  );

  const editableTestimonials = useMemo(() => {
    const testimonials = homeQuery.data?.testimonials ?? [];
    const source = testimonials.length > 0
      ? testimonials.map((testimonial) => ({
          id: testimonial.id,
          source: testimonial.sourceLabel || "חוות דעת",
          title: normalizeTestimonialTitle(testimonial.sourceName),
          quote: testimonial.quote,
          stars: testimonial.stars || 5,
          displayOrder: testimonial.displayOrder ?? 1,
          whatsappImageUrl: testimonial.whatsappImageUrl ?? null,
        }))
      : [...fallbackTestimonials];

    return [...source]
      .sort((left, right) => {
        const leftOrder = left.displayOrder ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = right.displayOrder ?? Number.MAX_SAFE_INTEGER;
        if (leftOrder !== rightOrder) return leftOrder - rightOrder;
        return Number(left.id) - Number(right.id);
      });
  }, [homeQuery.data?.testimonials]);

  const visibleTestimonials = useMemo(() => editableTestimonials, [editableTestimonials]);

  useEffect(() => {
    const text = settings?.heroTypingText || TYPING_TEXT;
    let index = 0;
    setTypedText("");

    const timer = window.setInterval(() => {
      index += 1;
      setTypedText(text.slice(0, index));

      if (index >= text.length) {
        window.clearInterval(timer);
      }
    }, 55);

    return () => window.clearInterval(timer);
  }, [settings?.heroTypingText]);


  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const scrollToForm = () => {
    document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileMenuOpen(false);
  };

  const handleNextStep = () => {
    if (!formData.neighborhood || !formData.rooms || !formData.sqm) {
      toast.error("כדי להמשיך, מלאו קודם את פרטי הנכס.");
      return;
    }

    setLeadStep(2);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.neighborhood || !formData.rooms || !formData.sqm) {
      toast.error("אנא השלימו את שלב פרטי הנכס.");
      setLeadStep(1);
      return;
    }

    if (!formData.fullName || !formData.phone) {
      toast.error("אנא מלאו שם מלא ומספר טלפון.");
      return;
    }

    try {
      await submitLeadMutation.mutateAsync({
        fullName: formData.fullName,
        phone: formData.phone,
        neighborhood: formData.neighborhood,
        rooms: Number(formData.rooms.replace("+", "")),
        sqm: Number(formData.sqm),
        notes: null,
      });

      const message = `שלום, אני ${formData.fullName} ורוצה שתחזרו אליי לגבי הנכס.%0A%0Aשכונה: ${formData.neighborhood}%0Aמספר חדרים: ${formData.rooms}%0Aמ״ר: ${formData.sqm}%0Aטלפון: ${formData.phone}`;
      window.open(`${whatsappLink}?text=${message}`, "_blank", "noopener,noreferrer");
      toast.success("הפרטים נשמרו ונפתחה שיחת WhatsApp להמשך טיפול.");
      setFormData({ neighborhood: "", rooms: "", sqm: "", fullName: "", phone: "" });
      setLeadStep(1);
    } catch {
      toast.error("לא הצלחנו לשמור את הפרטים כרגע. נסו שוב בעוד רגע.");
    }
  };

  const footerSloganRaw = settings?.footerSlogan || fallbackSettings.footerSlogan;
  const footerSloganDisplay = footerSloganRaw.startsWith("״") && footerSloganRaw.endsWith("״")
    ? footerSloganRaw
    : `״${footerSloganRaw.replace(/^["״]+|["״]+$/g, "")}״`;

  return (
    <div className="min-h-screen bg-white text-slate-950" dir="rtl">
      <div className="fixed inset-x-0 top-4 z-50 px-3 md:px-6">
        <header className="mx-auto max-w-7xl rounded-full border border-[#1b1b1b] bg-[#010101] px-4 py-1.5 shadow-[0_12px_34px_rgba(0,0,0,0.28)] backdrop-blur-md md:px-6">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <Button
              onClick={() => window.open(whatsappLink, "_blank", "noopener,noreferrer")}
              className="hidden rounded-full bg-[#d9ae4c] px-6 text-base font-black text-black shadow-[0_10px_28px_rgba(217,174,76,0.32)] hover:bg-[#c99a31] md:inline-flex"
            >
              ליצירת קשר
            </Button>

            <nav className="hidden items-center justify-center gap-8 text-[1.12rem] font-extrabold text-white lg:flex xl:gap-10 xl:text-[1.24rem]">
              {navItems.map((item) =>
                item.isRoute ? (
                    <Link key={item.label} href={item.href} className="transition hover:text-[#d9ae4c]">
                    {item.label}
                  </Link>
                ) : (
                  <a key={item.label} href={item.href} className="transition hover:text-[#d9ae4c]">
                    {item.label}
                  </a>
                ),
              )}
            </nav>

            <div className="mr-auto flex items-center justify-end gap-3 lg:mr-0">
              {/* Hamburger — 3 lines, not a circle */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="flex flex-col gap-[5px] p-2.5 text-white lg:hidden"
                aria-label="פתח תפריט"
              >
                <span className="block h-[2px] w-6 rounded-full bg-white" />
                <span className="block h-[2px] w-6 rounded-full bg-white" />
                <span className="block h-[2px] w-6 rounded-full bg-white" />
              </button>
              <div className="flex items-center justify-center">
                <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663549770333/Skk9h57YxdLJzA5wF6rzPk/teamshay-logo-new_6990c286.png" alt={settings?.siteName || "Team Shay"} className="h-14 w-auto md:h-16" />
              </div>
            </div>
          </div>

          {/* Mobile sidebar overlay — light white backdrop */}
          {mobileMenuOpen && (
            <div
              className="lg:hidden fixed inset-0 z-50"
              style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(4px)" }}
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Mobile sidebar drawer — black header + white nav body */}
          <div
            className={`lg:hidden fixed top-0 right-0 z-50 h-full w-72 shadow-2xl transition-transform duration-300 ease-in-out overflow-hidden ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}
            style={{ backgroundColor: "#ffffff", borderLeft: "2px solid #d9ae4c" }}
            dir="rtl"
          >
            {/* BLACK top header section */}
            <div className="flex items-center justify-between px-5 py-5" style={{ backgroundColor: "#0d0d0d" }}>
              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663549770333/Skk9h57YxdLJzA5wF6rzPk/teamshay-logo-new_6990c286.png" alt="Team Shay" className="h-10 w-auto brightness-200" />
              <button onClick={() => setMobileMenuOpen(false)} style={{ color: "#d9ae4c" }} className="p-2 rounded-lg transition" aria-label="סגור">
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 px-4 pt-4">
              {navItems.map((item) => {
                const itemStyle = { color: "#1a1a1a", fontWeight: 800, fontSize: "1rem", display: "block", borderRadius: "12px", padding: "14px 16px", transition: "background 0.15s" };
                return item.isRoute ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={itemStyle}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fff8e6"; (e.currentTarget as HTMLElement).style.color = "#d9ae4c"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#1a1a1a"; }}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={itemStyle}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fff8e6"; (e.currentTarget as HTMLElement).style.color = "#d9ae4c"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#1a1a1a"; }}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>
            <div className="px-4 mt-8 space-y-3">
              <button
                onClick={() => { window.open(whatsappLink, "_blank", "noopener,noreferrer"); setMobileMenuOpen(false); }}
                style={{ width: "100%", background: "#d9ae4c", color: "#000", fontWeight: 900, borderRadius: "999px", height: "48px", fontSize: "1rem", border: "none", cursor: "pointer" }}
              >
                שלחו הודעה עכשיו
              </button>
              <div style={{ borderTop: "1px solid #eee", paddingTop: "14px", marginTop: "8px", textAlign: "center" }}>
                <p style={{ fontSize: "11px", color: "#999" }}>Team Shay — נדל״ן ירושלים</p>
              </div>
            </div>
          </div>
        </header>
      </div>

      <main>
        <section id="home" className="relative isolate min-h-screen overflow-hidden bg-black px-4 pb-16 pt-36 md:px-6 md:pb-24 md:pt-40">
          <div className="absolute inset-0 z-0">
            <video
              className="absolute left-0 top-0 h-full w-full origin-top scale-[1.18] object-cover"
              style={{ objectPosition: "center top" }}
              src={HERO_VIDEO_URL}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden="true"
              onLoadedMetadata={(event) => {
                const video = event.currentTarget;
                video.playbackRate = heroPlaybackRate;
                video.currentTime = HERO_LOOP_START_SECONDS;
              }}
              onTimeUpdate={(event) => {
                const video = event.currentTarget;
                if (video.playbackRate !== heroPlaybackRate) {
                  video.playbackRate = heroPlaybackRate;
                }
                if (video.currentTime >= HERO_LOOP_END_SECONDS) {
                  video.currentTime = HERO_LOOP_START_SECONDS;
                  void video.play();
                }
              }}
            />
            <div className="absolute left-0 top-0 z-10 h-full w-full bg-[rgba(0,0,0,0.6)]" />
          </div>

          <div className="relative z-20 mx-auto flex min-h-[78vh] max-w-5xl flex-col items-center justify-center text-center text-white">
            <div className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-base font-extrabold shadow-[0_10px_30px_rgba(0,0,0,0.15)] backdrop-blur-md">
              {(settings?.siteName || "Team Shay") + " תחת רשת Landsman"}
            </div>
            <h1 className="mt-8 text-4xl font-black leading-[1.08] md:text-6xl lg:text-[4.7rem]">
              {settings?.heroHeadline || fallbackSettings.heroHeadline}
            </h1>
            <p className="mt-6 min-h-[2.5rem] text-[1.45rem] font-extrabold text-white md:text-[1.75rem]">
              {typedText}
              <span className="mr-1 inline-block h-7 w-[2px] animate-pulse bg-[#d9ae4c] align-middle" />
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {trustBadges.map((badge) => (
                <div
                  key={badge}
                  className="inline-flex items-center gap-2 rounded-full border border-[#d4af37]/40 bg-white/10 px-5 py-3 text-base font-extrabold text-white shadow-[0_12px_28px_rgba(0,0,0,0.12)] backdrop-blur-md"
                >
                  <Check className="size-4 text-[#d9ae4c]" />
                  {badge}
                </div>
              ))}
            </div>

            <p className="mt-8 max-w-3xl text-xl font-bold leading-8 text-white/90 md:text-[1.35rem]">
              אנחנו מלווים בעלי נכסים משלב התמחור ועד סגירת העסקה, עם שקיפות מלאה, זמינות גבוהה וחיבור ישיר לשוק הירושלמי הפעיל.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button
                onClick={scrollToForm}
                className="h-14 rounded-full bg-[#d9ae4c] px-8 text-base font-black text-black shadow-[0_12px_30px_rgba(217,174,76,0.3)] hover:bg-[#c99a31]"
              >
                שלחו הודעה עכשיו
              </Button>
              <Button
                variant="outline"
                onClick={scrollToForm}
                className="h-14 rounded-full border-[#d9ae4c] bg-white/5 px-8 text-base font-black text-white hover:bg-white/10"
              >
                <MessageCircle className="size-4 text-[#d9ae4c]" />
                להערכת שווי נכס
              </Button>
            </div>

            {homeQuery.isLoading ? (
              <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/85 backdrop-blur-md">
                <Loader2 className="size-4 animate-spin" />
                טוענים תוכן מעודכן מהמערכת
              </div>
            ) : null}
          </div>
        </section>

        <section id="about" className="px-4 py-20 md:px-6 md:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.92fr]">
            <div className="order-2 lg:order-1">
              <p className="text-base font-extrabold uppercase tracking-[0.03em] text-[#d9ae4c]">אודות צוות שי</p>
              <h2 className="mt-4 text-[2.15rem] font-extrabold leading-tight md:text-[3.45rem]">{settings?.aboutTitle || fallbackSettings.aboutTitle}</h2>
              <p className="mt-6 text-lg leading-8 text-slate-600">{settings?.aboutSubtitle || fallbackSettings.aboutSubtitle}</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {aboutChecklistItems.map(({ icon: Icon, text }) => (
                  <article
                    key={text}
                    className="flex flex-col items-center rounded-[24px] border border-slate-200 bg-white p-5 text-center shadow-[0_14px_30px_rgba(15,23,42,0.05)]"
                  >
                    <span className="flex size-12 items-center justify-center rounded-full bg-white text-[#d9ae4c] shadow-[0_10px_24px_rgba(217,174,76,0.18)]">
                      <Icon className="size-5" />
                    </span>
                    <p className="mt-4 text-base font-semibold leading-7 text-slate-700">{text}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="relative mx-auto max-w-[30rem]">
                <div className="absolute -inset-5 rounded-[42px] bg-[radial-gradient(circle_at_top,rgba(217,174,76,0.22),rgba(255,255,255,0))] blur-2xl" />
                <div className="relative overflow-hidden rounded-[36px] border border-slate-200 bg-white p-4 shadow-[0_28px_70px_rgba(15,23,42,0.12)]">
                  <img
                    src={settings?.shayAboutImageUrl || SHAY_ABOUT_IMAGE}
                    alt="שי כהן"
                    className="h-[520px] w-full rounded-[28px] object-cover"
                    style={{ objectPosition: "center 18%" }}
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="team" className="bg-white px-4 py-20 md:px-6 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-base font-extrabold uppercase tracking-[0.03em] text-[#d9ae4c]" style={{fontSize: '24px'}}>הצוות</p>
              <h2 className="mt-4 text-[2.1rem] font-extrabold md:text-[3.35rem]">הכירו את הסוכנים שלנו</h2>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
              {homepageAgents.map((agent) => (
                <article
                  key={agent.id}
                  className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_36px_rgba(15,23,42,0.06)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_24px_56px_rgba(15,23,42,0.14)]"
                >
                  <div className="h-56 overflow-hidden bg-white">
                    <img
                      src={agent.image}
                      alt={agent.name}
                      className="h-full w-full object-cover"
                      style={{ objectPosition: agent.imagePosition }}
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3 text-center">
                    <h3 className="text-[1.3rem] font-extrabold text-slate-950">{agent.name}</h3>
                    <p className="mt-1.5 min-h-[72px] text-sm font-semibold leading-6 text-slate-600 text-center">{agent.expertise}</p>
                    <div className="mt-2 flex flex-col items-center gap-1.5 border-t border-slate-100 pt-2.5">
                      {agent.email ? (
                        <a
                          href={`mailto:${agent.email}`}
                          className="text-sm font-bold leading-5 text-slate-600 transition hover:text-[#d9ae4c]"
                        >
                          {agent.email}
                        </a>
                      ) : null}
                      <a
                        href={`tel:${agent.phone.replace(/\D/g, "") || officePhoneLink}`}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d9ae4c] px-4 py-2 text-sm font-black text-white shadow-[0_10px_24px_rgba(217,174,76,0.28)]"
                      >
                        <Phone className="size-4" />
                        {agent.phone}
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="method" className="px-4 py-20 md:px-6 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-base font-extrabold uppercase tracking-[0.03em] text-[#d9ae4c]" style={{fontSize: '24px'}}>השיטה</p>
              <h2 className="mt-4 text-[2.1rem] font-extrabold md:text-[3.35rem]" style={{fontSize: '70px'}}>מה יוצא לכם מזה?</h2>
            </div>

            <div className="mt-14 grid gap-8 xl:grid-cols-5 xl:gap-5">
              {valueSteps.map((step, index) => (
                <div key={step.step} className="relative">
                  <article className="relative h-full rounded-[28px] border border-slate-200 bg-white px-6 pb-7 pt-10 text-center shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
                    <div className="absolute right-1/2 top-0 flex size-14 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-[#d9ae4c] text-lg font-black text-white shadow-[0_12px_24px_rgba(217,174,76,0.28)]">
                      {step.step}
                    </div>
                    <h3 className="text-[1.6rem] font-extrabold text-slate-950">{step.title}</h3>
                    <p className="mt-4 text-base font-semibold leading-7 text-slate-600">{step.subtitle}</p>
                  </article>
                  {index < valueSteps.length - 1 ? (
                    <div className="mt-5 flex items-center justify-center text-[#d9ae4c] xl:absolute xl:left-[-1.35rem] xl:top-1/2 xl:mt-0 xl:-translate-y-1/2">
                      <span className="hidden items-center gap-2 xl:inline-flex">
                        <ArrowLeft className="size-6" />
                      </span>
                      <span className="inline-flex items-center gap-2 xl:hidden">
                        <ArrowRight className="size-5" />
                        <ArrowLeft className="size-5" />
                      </span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="properties" className="bg-white px-4 py-20 md:px-6 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-lg font-extrabold uppercase tracking-[0.03em] text-[#d9ae4c] md:text-2xl">מחפשים נכס ? הגעתם למקום הנכון</p>
                <h2 className="mt-4 text-4xl font-extrabold leading-tight md:text-[3.35rem]">הנכסים המובחרים שלנו</h2>
              </div>
              <Link href="/properties" className="inline-flex items-center gap-2 text-base font-black text-[#d9ae4c]">
                לכל הנכסים
                <ChevronLeft className="size-4" />
              </Link>
            </div>

            <div
              className="mt-12"
              onMouseEnter={() => setIsPropertyCarouselPaused(true)}
              onMouseLeave={() => setIsPropertyCarouselPaused(false)}
              onTouchStart={() => setIsPropertyCarouselPaused(true)}
              onTouchEnd={() => setIsPropertyCarouselPaused(false)}
            >
              {featuredPropertyTrack.length ? (
                <Carousel
                  setApi={setPropertyCarouselApi}
                  opts={{
                    align: "start",
                    direction: "rtl",
                    loop: true,
                  }}
                  className="relative"
                >
                  <CarouselContent className="-ml-3 md:-ml-5">
                    {featuredPropertyTrack.map((property) => (
                      <CarouselItem key={property.id} className="basis-[84%] pl-3 sm:basis-[58%] md:pl-5 lg:basis-1/3">
                        <article className="h-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
                          <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                            <img
                              src={property.image}
                              alt={property.title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="flex h-full flex-col p-5">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-2xl font-black text-slate-950">₪{property.price.toLocaleString("he-IL")}</p>
                              <span className="rounded-full bg-[#d9ae4c] px-3 py-1 text-xs font-black text-white shadow-[0_8px_18px_rgba(217,174,76,0.22)]">{property.status}</span>
                            </div>
                            <h3 className="mt-3 text-[1.38rem] font-extrabold leading-snug text-slate-950">{property.title}</h3>
                            <p className="mt-3 text-base font-semibold text-slate-600">
                              {property.neighborhood}, {property.city}
                            </p>
                            <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-bold text-slate-700">
                              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-3">
                                <BedDouble className="size-4 text-[#d9ae4c]" />
                                <span>{property.rooms} חדרים</span>
                              </div>
                              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-3">
                                <Ruler className="size-4 text-[#d9ae4c]" />
                                <span>{property.sqm} מ״ר</span>
                              </div>
                            </div>
                            <Link href={`/properties/${property.id}`} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-[#d9ae4c]" aria-label={`פרטים נוספים ${property.title}`}>
                              פרטים נוספים
                              <ChevronLeft className="size-4" />
                            </Link>
                          </div>
                        </article>
                      </CarouselItem>
                    ))}
                  </CarouselContent>

                  {featuredPropertyTrack.length > 1 ? (
                    <>
                      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden items-center justify-between md:flex">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="pointer-events-auto -mr-5 size-11 rounded-full border-slate-200 bg-white text-slate-950 shadow-[0_14px_30px_rgba(15,23,42,0.14)] hover:bg-[#d9ae4c] hover:text-white"
                          onClick={() => scrollPropertyCarousel("next")}
                          aria-label="Next property"
                        >
                          <ArrowRight className="size-5" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="pointer-events-auto -ml-5 size-11 rounded-full border-slate-200 bg-white text-slate-950 shadow-[0_14px_30px_rgba(15,23,42,0.14)] hover:bg-[#d9ae4c] hover:text-white"
                          onClick={() => scrollPropertyCarousel("prev")}
                          aria-label="Previous property"
                        >
                          <ArrowLeft className="size-5" />
                        </Button>
                      </div>

                      <div className="mt-7 flex items-center justify-center gap-2">
                        {featuredPropertyTrack.map((property, index) => (
                          <button
                            key={`property-dot-${property.id}`}
                            type="button"
                            className={`h-2.5 rounded-full transition-all ${
                              selectedPropertySlide === index ? "w-8 bg-[#d9ae4c]" : "w-2.5 bg-slate-300"
                            }`}
                            onClick={() => selectPropertySlide(index)}
                            aria-label={`Go to property ${index + 1}`}
                            aria-current={selectedPropertySlide === index ? "true" : undefined}
                          />
                        ))}
                      </div>
                    </>
                  ) : null}
                </Carousel>
              ) : (
                <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
                  עדיין לא פורסמו נכסים להצגה בדף הבית.
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="testimonials" className="px-4 py-20 md:px-6 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-base font-extrabold uppercase tracking-[0.03em] text-[#d9ae4c]" style={{fontSize: '24px'}}>המלצות</p>
              <h2 className="mt-4 text-[2.1rem] font-extrabold md:text-[3.35rem]" style={{fontSize: '70px'}}>לקוחות משתפים</h2>
            </div>

            <div className="mx-auto mt-12 max-w-7xl">
              {homeQuery.isLoading ? (
                <div className="rounded-[30px] border border-slate-200 bg-white p-8 text-center text-slate-500">
                  טוענים המלצות מהמערכת...
                </div>
              ) : visibleTestimonials.length ? (
                <>
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" aria-label="קיר המלצות חי">
                    {visibleTestimonials.map((testimonial) => (
                      <article
                        key={testimonial.id}
                      className="flex min-h-[30rem] flex-col rounded-[30px] border border-slate-200 bg-white p-5 text-right shadow-[0_22px_50px_rgba(15,23,42,0.08)] md:p-6"
                    >
                      {testimonial.whatsappImageUrl ? (
                        <div className="h-40 overflow-hidden rounded-[24px] bg-slate-950">
                          <img
                            src={testimonial.whatsappImageUrl}
                            alt={testimonial.title}
                            className="h-full w-full object-cover object-top"
                              loading="lazy"
                            />
                          </div>
                        ) : null}
                        <div className="mt-5 flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xl font-black text-slate-950">{testimonial.title}</p>
                            <p className="mt-1 text-sm font-bold tracking-[0.02em] text-[#d9ae4c]">{testimonial.source}</p>
                          </div>
                          <div className="flex items-center gap-1 text-[#d4af37]" aria-label={`דירוג ${testimonial.stars} מתוך 5`}>
                            {Array.from({ length: testimonial.stars }).map((_, starIndex) => (
                              <Star key={`${testimonial.id}-${starIndex}`} className="size-5 fill-current" />
                            ))}
                          </div>
                        </div>
                        <p className="mt-4 flex-1 text-[1.04rem] font-semibold leading-8 text-slate-600">{testimonial.quote}</p>
                      </article>
                    ))}
                  </div>

                </>
              ) : (
                <div className="rounded-[30px] border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
                  עדיין לא נוספו המלצות להצגה בדף הבית.
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="lead-form" className="bg-white px-4 py-20 md:px-6 md:py-24">
          <div className="mx-auto max-w-4xl rounded-[36px] border border-slate-200 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-12">
            <div className="text-center">
              <p className="text-base font-extrabold uppercase tracking-[0.03em] text-[#d9ae4c]"></p>
              <h2 className="mt-4 text-[2.1rem] font-extrabold md:text-[3.35rem]">רוצים לדעת כמה שווה הנכס שלכם?</h2>
              <p className="mt-4 text-xl font-semibold leading-8 text-slate-600" style={{color: '#e18823'}}>
                למלא פרטים לוקח 30 שניות
              </p>
            </div>

            <div className="mt-8 flex items-center justify-center gap-4">
              <div className={`flex items-center gap-3 rounded-full px-4 py-2 text-base font-extrabold ${leadStep === 1 ? "bg-[#d9ae4c] text-white" : "bg-white text-[#b98b2f]"}`}>
                <span className="flex size-7 items-center justify-center rounded-full bg-white/20">1</span>
                פרטי הנכס
              </div>
              {leadStep === 2 ? (
                <>
                  <div className="h-px w-10 bg-[#d9ae4c]/25" />
                  <div className="flex items-center gap-3 rounded-full bg-[#d9ae4c] px-4 py-2 text-base font-extrabold text-white">
                    <span className="flex size-7 items-center justify-center rounded-full bg-white/20">2</span>
                    פרטים אישיים
                  </div>
                </>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
              <div className={leadStep === 1 ? "grid gap-5" : "hidden"}>
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-slate-700">שכונה / אזור</span>
                  <input
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleFormChange}
                    placeholder="למשל: קטמונים, גילה, ארנונה"
                    className="h-14 rounded-2xl border border-slate-200 px-4 text-base outline-none transition focus:border-[#d9ae4c] focus:ring-4 focus:ring-[#d9ae4c]/10"
                  />
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-700">מספר חדרים</span>
                    <select
                      name="rooms"
                      value={formData.rooms}
                      onChange={handleFormChange}
                      className="h-14 rounded-2xl border border-slate-200 px-4 text-base outline-none transition focus:border-[#d9ae4c] focus:ring-4 focus:ring-[#d9ae4c]/10"
                    >
                      <option value="">בחרו</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-700">גודל במ״ר</span>
                    <input
                      name="sqm"
                      value={formData.sqm}
                      onChange={handleFormChange}
                      placeholder="למשל: 120"
                      className="h-14 rounded-2xl border border-slate-200 px-4 text-base outline-none transition focus:border-[#d9ae4c] focus:ring-4 focus:ring-[#d9ae4c]/10"
                    />
                  </label>
                </div>

                <div className="flex justify-center">
                  <Button type="button" onClick={handleNextStep} className="h-14 rounded-full bg-[#d9ae4c] px-10 text-base font-extrabold text-black hover:bg-[#c99a31]">
                    להערכת שווי שוק במתנה
                  </Button>
                </div>
              </div>

              <div className={leadStep === 2 ? "grid gap-5" : "hidden"}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-700">שם מלא</span>
                    <input
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleFormChange}
                      placeholder="איך קוראים לכם?"
                      className="h-14 rounded-2xl border border-slate-200 px-4 text-base outline-none transition focus:border-[#d9ae4c] focus:ring-4 focus:ring-[#d9ae4c]/10"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-700">טלפון</span>
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      placeholder="050-000-0000"
                      className="h-14 rounded-2xl border border-slate-200 px-4 text-base outline-none transition focus:border-[#d9ae4c] focus:ring-4 focus:ring-[#d9ae4c]/10"
                    />
                  </label>
                </div>

                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button type="button" variant="outline" onClick={() => setLeadStep(1)} className="h-14 rounded-full border-[#d9ae4c] px-8 text-base font-extrabold text-[#d9ae4c] hover:bg-white">
                    חזרה לשלב הקודם
                  </Button>
                  <Button type="submit" disabled={submitLeadMutation.isPending} className="h-14 rounded-full bg-[#d9ae4c] px-10 text-base font-extrabold text-black hover:bg-[#c99a31]">
                    {submitLeadMutation.isPending ? "שומרים פרטים..." : "שלחו פרטים ונחזור אליכם בהקדם"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-6">
          <div className="mx-auto max-w-7xl rounded-[36px] bg-[#010101] p-8 text-white shadow-[0_24px_60px_rgba(15,23,42,0.22)] md:p-10">
            <div className="grid items-center gap-10 lg:grid-cols-[auto_1fr]">
              <div className="flex justify-center lg:justify-start">
                <img src={settings?.landsmanLogoUrl || LANDSMAN_LOGO} alt="Landsman ירושלים" className="h-16 w-auto object-contain md:h-20" loading="lazy" />
              </div>
              <div>
                <p className="text-base font-extrabold uppercase tracking-[0.03em] text-white">רשת Landsman</p>
                <h2 className="mt-4 text-[2.1rem] font-extrabold md:text-[3.35rem]">{settings?.landsmanTitle || fallbackSettings.landsmanTitle}</h2>
                <p className="mt-5 max-w-4xl text-lg leading-8 text-white/85">{settings?.landsmanBody || fallbackSettings.landsmanBody}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#010101] px-[5%] py-14 text-white" dir="rtl">
        <div className="relative flex w-full flex-col items-end gap-12 text-right md:flex-row md:items-start md:justify-between md:text-right">
          <div className="flex flex-col items-end text-right md:max-w-[28%]">
            <p className="text-base font-extrabold uppercase tracking-[0.03em] text-white">יצירת קשר</p>
            <div className="mt-4 flex flex-col items-end gap-3 text-right text-white" dir="rtl">
              <a href={`tel:${officePhoneLink}`} className="flex flex-row-reverse items-center justify-start gap-2 self-end text-right">
                <span>{officePhone}</span>
                <Phone className="size-4 shrink-0" />
              </a>
              <p className="self-end text-right">האומן 25 , תלפיות</p>
              <button
                onClick={() => window.open(whatsappLink, "_blank", "noopener,noreferrer")}
                className="flex flex-row-reverse items-center justify-start gap-2 self-end text-right text-white"
              >
                <span>שלחו הודעה עכשיו</span>
                <MessageCircle className="size-4 shrink-0" />
              </button>
            </div>
          </div>

          <div className="flex flex-col items-end text-right md:absolute md:left-1/2 md:top-0 md:w-fit md:-translate-x-1/2 md:items-center md:text-center">
            <div className="rounded-[28px] bg-transparent px-4 py-2 md:px-6 md:py-3">
              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663549770333/Skk9h57YxdLJzA5wF6rzPk/teamshay-logo-new_6990c286.png" alt={settings?.siteName || "Team Shay"} className="h-24 w-auto object-contain md:h-32" loading="lazy" />
            </div>
            <p className="mt-5 text-lg font-black text-white md:text-center" style={{ fontSize: "30px" }}>{footerSloganDisplay}</p>
          </div>

          <div className="flex flex-col items-end text-right md:max-w-[28%] md:self-start md:items-start md:justify-start">
            <p className="text-base font-extrabold uppercase tracking-[0.03em] text-white md:self-start">ניווט</p>
            <div className="mt-4 flex flex-col items-end gap-3 text-right text-white md:items-start" dir="rtl">
              <a href="#home" className="self-end text-right md:self-start">דף הבית</a>
              <a href="#about" className="self-end text-right md:self-start">אודות</a>
              <a href="#method" className="self-end text-right md:self-start">שיטה</a>
              <Link href="/properties" className="self-end text-right md:self-start">נכסים</Link>
              <Link href="/agent-login" className="self-end text-right md:self-start">התחברות סוכנים</Link>
            </div>
          </div>
        </div>
      </footer>

      <button
        onClick={() => window.open(whatsappLink, "_blank", "noopener,noreferrer")}
        className="fixed bottom-6 right-6 z-40 inline-flex size-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_18px_40px_rgba(37,211,102,0.35)] transition hover:scale-105"
        aria-label="שלחו הודעה עכשיו ב-WhatsApp"
      >
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-70 animate-ping" />
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-90 animate-pulse" />
        <span className="relative flex size-16 items-center justify-center rounded-full">
          <svg viewBox="0 0 32 32" className="size-8 fill-current" aria-hidden="true">
            <path d="M19.11 17.23c-.27-.13-1.58-.78-1.83-.87-.24-.09-.42-.13-.6.14-.18.27-.69.87-.85 1.05-.16.18-.31.2-.58.07-.27-.13-1.12-.41-2.13-1.31-.79-.71-1.33-1.58-1.49-1.84-.16-.27-.02-.41.12-.54.12-.12.27-.31.4-.47.13-.16.18-.27.27-.45.09-.18.04-.34-.02-.47-.07-.13-.6-1.45-.82-1.99-.22-.53-.44-.46-.6-.47l-.51-.01c-.18 0-.47.07-.71.34-.24.27-.93.91-.93 2.22s.96 2.57 1.09 2.75c.13.18 1.89 2.89 4.57 4.06.64.28 1.14.45 1.53.58.64.2 1.21.17 1.67.1.51-.08 1.58-.65 1.8-1.28.22-.63.22-1.17.16-1.28-.07-.11-.25-.18-.52-.31Z" />
            <path d="M16 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.25.59 4.44 1.71 6.37L3 29l6.85-1.79A12.76 12.76 0 0 0 16 28.8c7.06 0 12.8-5.74 12.8-12.8S23.06 3.2 16 3.2Zm0 23.36c-1.94 0-3.84-.52-5.49-1.49l-.39-.23-4.06 1.06 1.08-3.96-.25-.41a10.51 10.51 0 1 1 9.11 5.03Z" />
          </svg>
        </span>
      </button>
    </div>
  );
}
