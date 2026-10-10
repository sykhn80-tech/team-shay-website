import React, { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  Home as HomeIcon,
  KeyRound,
  Loader2,
  Menu,
  MessageCircle,
  Phone,
  Play,
  Star,
  Search,
  TrendingUp,
  Volume2,
  VolumeX,
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
  BRAND_NAME,
  JERUSALEM_HERO,
  OFFICE_PHONE,
  OFFICE_PHONE_LINK,
  propertyImages,
  SHAY_ABOUT_IMAGE,
  TEAM_LOGO,
  WHATSAPP_LINK,
} from "@/lib/siteData";
import { formatPropertyLocation } from "@/lib/property-display";

const navItems: Array<{ label: string; href: string; isRoute: boolean }> = [
  { label: "דף הבית", href: "#home", isRoute: false },
  { label: "הסיפור שלנו", href: "#about", isRoute: false },
  { label: "השירותים", href: "#services", isRoute: false },
  { label: "נכסים", href: "/properties", isRoute: true },
  { label: "הצוות", href: "#team", isRoute: false },
];

const HERO_VIDEO_URL = "/media/hero-animation.mp4";
const HERO_LOOP_END_SECONDS = 5.4;
const HERO_LOOP_START_SECONDS = 0.02;
const HERO_LOOP_TARGET_SECONDS = 8;
const SHAY_BRAND_VIDEO_WEBM = "/media/shay-group-brand.webm";
const SHAY_BRAND_VIDEO_MP4 = "/media/shay-group-brand.mp4";
const SHAY_BRAND_VIDEO_POSTER = "/media/shay-group-brand-poster.jpg";
const ELIYA_IMAGE_URL = "/agents/eliya-card.jpeg";
const AVIAD_IMAGE_URL = "/agents/aviad-card.jpeg";
const HODIYA_IMAGE_URL = "/agents/hodiya-card.png";
const RONEN_IMAGE_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663549770333/Skk9h57YxdLJzA5wF6rzPk/tryiton_1760536418265_f4vv644shhrm80csx0jvzt3etm2_d3afa6a6.png";
const YARDEN_IMAGE_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663549770333/Skk9h57YxdLJzA5wF6rzPk/WhatsAppImage2026-04-13at17.31.35_58f082a2.jpeg";
const fallbackSettings = {
  siteName: BRAND_NAME,
  headerLogoUrl: TEAM_LOGO,
  footerLogoUrl: TEAM_LOGO,
  heroBackgroundUrl: JERUSALEM_HERO,
  shayAboutImageUrl: SHAY_ABOUT_IMAGE,
  heroHeadline: "קונים, מוכרים ומשקיעים בירושלים? יש צוות צעיר ורעב שיעשה את זה איתכם מקצה לקצה.",
  whatsappLink: WHATSAPP_LINK,
  officePhone: OFFICE_PHONE,
  aboutTitle: "כולם יודעים שדירה היא ביטחון. אז למה רוב האנשים לא קונים?",
  aboutSubtitle: "נעים מאוד, אני שי כהן, המייסד של Shay Group.",
  footerSlogan: "בצד שלך. גם אחרי המפתח.",
};

const valueSteps = [
  {
    step: "01",
    title: "מתחילים בשיחה",
    subtitle: "מבינים מה אתם רוצים להשיג, לפני שמדברים על דירה. מוכרים, קונים או משקיעים: השיחה הראשונה היא עליכם.",
  },
  {
    step: "02",
    title: "בונים תוכנית",
    subtitle: "למוכרים: מחיר ותוכנית שיווק. למשקיעים: תכנון פיננסי שמראה מה אפשר ומה נכון לכם.",
  },
  {
    step: "03",
    title: "יוצאים לשטח",
    subtitle: "משווקים את הדירה שלכם או מאתרים את הנכס שמתאים לתוכנית. אתם מקבלים עדכון על כל התקדמות.",
  },
  {
    step: "04",
    title: "סוגרים עסקה",
    subtitle: "משא ומתן, עורך דין ומשכנתא, עם אנשי מקצוע שעובדים איתנו קבוע. אתם חותמים כשהכול ברור.",
  },
  {
    step: "05",
    title: "נשארים גם אחרי המפתח",
    subtitle: "משכירים ומנהלים את הנכס בשבילכם, ומלווים אתכם לעסקה הבאה.",
  },
];

const normalizeAgentName = (value: string) => value.replace(/\s+/g, "");
const excludedHomepageAgentNames = new Set(["רונןדוידיאן", "רונן", "הודיהמליאח", "הודיה"]);

type AgentDisplayOverride = {
  email: string;
  phone: string;
  expertise?: string;
  image?: string;
  imagePosition?: string;
  imageFit?: "cover" | "contain";
  imageTransform?: string;
};

const agentDisplayOverrides = new Map<string, AgentDisplayOverride>([
  [
    "שיכהן",
    { email: "shay2003ai@gmail.com", phone: "052-863-6631", expertise: "ראש הצוות, מומחה משא ומתן ושיווק פרויקטים", image: SHAY_ABOUT_IMAGE, imagePosition: "center 18%" },
  ],
  ["שי", { email: "shay2003ai@gmail.com", phone: "052-863-6631", expertise: "ראש הצוות, מומחה משא ומתן ושיווק פרויקטים", image: SHAY_ABOUT_IMAGE, imagePosition: "center 18%" }],
  [
    "אביעדניסים",
    {
      email: "aviad5436@gmail.com",
      phone: "052-533-5251",
      expertise: "סוכן מוכרים. מומחה לאזור גילה והר חומה",
      image: AVIAD_IMAGE_URL,
      imagePosition: "center 35%",
    },
  ],
  [
    "אביעד",
    {
      email: "aviad5436@gmail.com",
      phone: "052-533-5251",
      expertise: "סוכן מוכרים. מומחה לאזור גילה והר חומה",
      image: AVIAD_IMAGE_URL,
      imagePosition: "center 35%",
    },
  ],
  [
    "רונןדוידיאן",
    { email: "ronend0000@gmail.com", phone: "050-900-5161", expertise: "סוכן מוכרים. מומחה לאזור רסקו וסן סימון", image: RONEN_IMAGE_URL, imagePosition: "center 18%" },
  ],
  ["רונן", { email: "ronend0000@gmail.com", phone: "050-900-5161", expertise: "סוכן מוכרים. מומחה לאזור רסקו וסן סימון", image: RONEN_IMAGE_URL, imagePosition: "center 18%" }],
  [
    "אליהמרציאנו",
    {
      email: "eliyamarciano1@gmail.com",
      phone: "050-254-0855",
      expertise: "מלווה משקיעים ורוכשים",
      image: ELIYA_IMAGE_URL,
      imagePosition: "center top",
      imageFit: "cover",
      imageTransform: "translateY(-28px) scale(1.2)",
    },
  ],
  [
    "אליה",
    {
      email: "eliyamarciano1@gmail.com",
      phone: "050-254-0855",
      expertise: "מלווה משקיעים ורוכשים",
      image: ELIYA_IMAGE_URL,
      imagePosition: "center top",
      imageFit: "cover",
      imageTransform: "translateY(-28px) scale(1.2)",
    },
  ],
  [
    "ירדןגמליאל",
    {
      email: "yardeen12@gmail.com",
      phone: "050-253-5095",
      expertise: "סוכן מוכרים. מומחה לאזור קטמונים, קטמון, סן סימון ורסקו",
      image: YARDEN_IMAGE_URL,
      imagePosition: "center 26%",
    },
  ],
  [
    "ירדן",
    {
      email: "yardeen12@gmail.com",
      phone: "050-253-5095",
      expertise: "סוכן מוכרים. מומחה לאזור קטמונים, קטמון, סן סימון ורסקו",
      image: YARDEN_IMAGE_URL,
      imagePosition: "center 26%",
    },
  ],
  [
    "הודיהמליאח",
    {
      email: "",
      phone: OFFICE_PHONE,
      expertise: "מומחית אזור ברסקו, סן סימון וקריית שמואל",
      image: HODIYA_IMAGE_URL,
      imagePosition: "center 34%",
    },
  ],
  [
    "הודיה",
    {
      email: "",
      phone: OFFICE_PHONE,
      expertise: "מומחית אזור ברסקו, סן סימון וקריית שמואל",
      image: HODIYA_IMAGE_URL,
      imagePosition: "center 34%",
    },
  ],
]);
const fallbackAgentByName = new Map(fallbackAgents.map((agent) => [normalizeAgentName(agent.name), agent]));

const normalizeTestimonialTitle = (value: string) => (value.trim() === "מאי אווריין" ? "מאי אוחיון" : value);
const isVideoMediaUrl = (value?: string | null) => Boolean(value && /\.(mp4|webm|mov)(\?|$)/i.test(value));

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

const celebrationColors = ["#D9AE4C", "#FFFDF8", "#B5653A"];
const celebrationPieces = Array.from({ length: 30 }, (_, index) => ({
  left: `${8 + ((index * 29) % 84)}%`,
  delay: `${(index % 8) * 35}ms`,
  rotation: `${(index * 47) % 360}deg`,
  color: celebrationColors[index % celebrationColors.length],
}));

const EFFECTS_MEDIA_QUERY = "(min-width: 1024px) and (hover: hover) and (pointer: fine)";

function useEffectsEnabled() {
  const [effectsEnabled, setEffectsEnabled] = useState(false);

  useEffect(() => {
    const desktopQuery = window.matchMedia(EFFECTS_MEDIA_QUERY);
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEffectsEnabled(desktopQuery.matches && !reducedMotionQuery.matches);
    update();
    desktopQuery.addEventListener?.("change", update);
    reducedMotionQuery.addEventListener?.("change", update);
    return () => {
      desktopQuery.removeEventListener?.("change", update);
      reducedMotionQuery.removeEventListener?.("change", update);
    };
  }, []);

  return effectsEnabled;
}

function AnimatedStat({ value, className }: { value: string; className?: string }) {
  const elementRef = useRef<HTMLSpanElement | null>(null);
  const [progress, setProgress] = useState(0);
  const effectsEnabled = useEffectsEnabled();

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (!effectsEnabled) {
      setProgress(1);
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = () => {
      const startedAt = performance.now();
      const duration = reducedMotion ? 0 : 900;
      const animate = (now: number) => {
        const next = duration === 0 ? 1 : Math.min(1, (now - startedAt) / duration);
        setProgress(next);
        if (next < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        start();
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [effectsEnabled]);

  const numericValue = Number.parseFloat(value.replace(/[^0-9.]/g, "")) || 0;
  const prefix = value.startsWith("₪") ? "₪" : "";
  const suffix = value.replace(/[0-9.]/g, "");
  const renderedNumber = value.includes(".") ? (numericValue * progress).toFixed(1) : Math.round(numericValue * progress).toString();

  return <span ref={elementRef} className={className}>{prefix}{renderedNumber}{suffix}</span>;
}

export default function Home() {
  const effectsEnabled = useEffectsEnabled();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [leadStep, setLeadStep] = useState<1 | 2 | 3>(1);
  const [leadTrack, setLeadTrack] = useState<"seller" | "investor" | "landlord" | "buyer" | null>(null);
  const [propertyCarouselApi, setPropertyCarouselApi] = useState<CarouselApi | null>(null);
  const [marketingCarouselApi, setMarketingCarouselApi] = useState<CarouselApi | null>(null);
  const [selectedPropertySlide, setSelectedPropertySlide] = useState(0);
  const [selectedMarketingSlide, setSelectedMarketingSlide] = useState(0);
  const [isPropertyCarouselPaused, setIsPropertyCarouselPaused] = useState(false);
  const [selectedMarketingIndex, setSelectedMarketingIndex] = useState(0);
  const [equitySliderDragging, setEquitySliderDragging] = useState(false);
  const [displayedEquity, setDisplayedEquity] = useState(200000);
  const equityAnimationFrame = useRef<number | null>(null);
  const [sliderSparks, setSliderSparks] = useState<Array<{ id: number; left: string; delay: string; x: number; y: number }>>([]);
  const sliderSparkTimeout = useRef<number | null>(null);
  const [marketingPreviewOpen, setMarketingPreviewOpen] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const shayVideoSectionRef = useRef<HTMLDivElement | null>(null);
  const shayVideoRef = useRef<HTMLVideoElement | null>(null);
  const [shayVideoInView, setShayVideoInView] = useState(false);
  const [shouldLoadShayVideo, setShouldLoadShayVideo] = useState(false);
  const [shayVideoLoaded, setShayVideoLoaded] = useState(false);
  const [shayVideoMuted, setShayVideoMuted] = useState(true);
  const [shayVideoReducedMotion, setShayVideoReducedMotion] = useState(false);
  const [shayVideoMotionOverride, setShayVideoMotionOverride] = useState(false);
  const [shayVideoManualPlay, setShayVideoManualPlay] = useState(false);
  const testimonialsSectionRef = useRef<HTMLElement | null>(null);
  const [testimonialsExpanded, setTestimonialsExpanded] = useState(false);
  const [testimonialPreview, setTestimonialPreview] = useState<{
    title: string;
    source: string;
    quote: string;
    stars: number;
    whatsappImageUrl: string | null;
  } | null>(null);
  const [formData, setFormData] = useState({
    neighborhood: "",
    rooms: "",
    sqm: "",
    fullName: "",
    phone: "",
    equity: "200000",
    hasProperty: "",
    propertyLocation: "",
    landlordPath: "",
    buyerArea: "",
  });

  useEffect(() => {
    if (!effectsEnabled) return;

    setFormData((previous) => ({ ...previous, equity: "50000" }));
    const start = window.setTimeout(() => {
      setFormData((previous) => ({ ...previous, equity: "200000" }));
    }, 120);

    return () => window.clearTimeout(start);
  }, [effectsEnabled]);

  useEffect(() => {
    if (!showThankYou) return;
    const timeout = window.setTimeout(() => setShowThankYou(false), 2500);
    return () => window.clearTimeout(timeout);
  }, [showThankYou]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReducedMotion = () => setShayVideoReducedMotion(mediaQuery.matches);
    updateReducedMotion();
    mediaQuery.addEventListener?.("change", updateReducedMotion);
    return () => mediaQuery.removeEventListener?.("change", updateReducedMotion);
  }, []);

  useEffect(() => {
    const node = shayVideoSectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShayVideoInView(entry.isIntersecting);
        if (entry.isIntersecting) setShouldLoadShayVideo(true);
      },
      { rootMargin: "0px", threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = shayVideoRef.current;
    if (!video || !shayVideoLoaded) return;
    const motionAllowed = shayVideoManualPlay || (effectsEnabled && (!shayVideoReducedMotion || shayVideoMotionOverride));
    if ((shayVideoInView || shayVideoManualPlay) && motionAllowed) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [effectsEnabled, shayVideoInView, shayVideoLoaded, shayVideoReducedMotion, shayVideoMotionOverride, shayVideoManualPlay]);

  const playShayVideoIfVisible = useCallback(() => {
    const video = shayVideoRef.current;
    const motionAllowed = shayVideoManualPlay || (effectsEnabled && (!shayVideoReducedMotion || shayVideoMotionOverride));
    if (!video || (!shayVideoInView && !shayVideoManualPlay) || !motionAllowed) return;
    void video.play().catch(() => undefined);
  }, [effectsEnabled, shayVideoInView, shayVideoReducedMotion, shayVideoMotionOverride, shayVideoManualPlay]);

  useEffect(() => () => {
    if (sliderSparkTimeout.current) window.clearTimeout(sliderSparkTimeout.current);
  }, []);

  useEffect(() => {
    const target = Number(formData.equity || 50000);
    if (!effectsEnabled) {
      setDisplayedEquity(target);
      return;
    }

    if (equityAnimationFrame.current) cancelAnimationFrame(equityAnimationFrame.current);
    const startValue = displayedEquity;
    const startTime = performance.now();
    const duration = 180;
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      setDisplayedEquity(Math.round(startValue + (target - startValue) * progress));
      if (progress < 1) equityAnimationFrame.current = requestAnimationFrame(animate);
    };
    equityAnimationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (equityAnimationFrame.current) cancelAnimationFrame(equityAnimationFrame.current);
    };
  }, [effectsEnabled, formData.equity]);

  const homeQuery = trpc.publicSite.home.useQuery(undefined, {
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  const submitLeadMutation = trpc.publicSite.submitLead.useMutation();

  const settings = homeQuery.data?.settings ?? fallbackSettings;
  const whatsappLink = settings?.whatsappLink || WHATSAPP_LINK;
  const officePhone = settings?.officePhone || OFFICE_PHONE;
  const officePhoneLink = officePhone.replace(/\D/g, "") || OFFICE_PHONE_LINK;
  const trustBadges = [
    { value: "5.0", label: "בגוגל, 32 ביקורות" },
    { value: "20M+ ₪", label: "היקף עסקאות" },
    { value: "20+", label: "עסקאות שנסגרו" },
    { value: "3", label: "שירותים בכתובת אחת" },
  ];
  const cmsMarketingItems = homeQuery.data?.marketingSection?.items ?? [];
  const marketingSection = {
    eyebrow: "פעולות השיווק שלנו",
    title: "לא רק מעלים מודעה — בונים חוויית מכירה.",
    subtitle:
      "זה רק על קצה המזלג. אלה חלק מהפעולות שאנחנו מתחייבים עליהן בכל נכס שאנחנו משווקים, ואת הרשימה המלאה תקבלו בפגישה הראשונה.",
    items: cmsMarketingItems.map((item, index) => ({
      ...item,
      id: item.id ?? `marketing-${index + 1}`,
    })),
  };
  const marketingItems = useMemo(() => marketingSection.items.slice(0, 10), [marketingSection.items]);
  const selectedMarketingItem = marketingItems[selectedMarketingIndex] ?? marketingItems[0];

  const homepageAgents = useMemo(() => {
    const dbAgents = homeQuery.data?.agents ?? [];
    if (dbAgents.length > 0) {
      return dbAgents.filter((agent) => !excludedHomepageAgentNames.has(normalizeAgentName(agent.name))).map((agent, index) => ({
        ...(() => {
          const fallbackByName = fallbackAgentByName.get(normalizeAgentName(agent.name));
          const fallbackAgent = fallbackByName ?? fallbackAgents[index % fallbackAgents.length];
          const displayOverride = agentDisplayOverrides.get(normalizeAgentName(agent.name));
          return {
            id: agent.id,
            name: agent.name,
            expertise: agent.roleTitle + (agent.bio ? `. ${agent.bio}` : "") || displayOverride?.expertise || "",
            phone: agent.phone || displayOverride?.phone || officePhone,
            email: agent.email || displayOverride?.email || "",
            image: displayOverride?.image || fallbackByName?.image || agent.photoUrl || fallbackAgent?.image || SHAY_ABOUT_IMAGE,
            imagePosition: displayOverride?.imagePosition || fallbackAgent?.imagePosition || "center 20%",
            imageFit: displayOverride?.imageFit || (fallbackAgent as { imageFit?: "cover" | "contain" })?.imageFit || "cover",
            imageTransform: displayOverride?.imageTransform || (fallbackAgent as { imageTransform?: string })?.imageTransform,
          };
        })(),
      }));
    }

    return fallbackAgents.filter((agent) => !excludedHomepageAgentNames.has(normalizeAgentName(agent.name))).map((agent) => {
      const displayOverride = agentDisplayOverrides.get(normalizeAgentName(agent.name));
      return {
        ...agent,
        expertise: displayOverride?.expertise || agent.expertise,
        email: displayOverride?.email || (agent as { email?: string }).email || "",
        phone: displayOverride?.phone || agent.phone,
        image: displayOverride?.image || agent.image,
        imagePosition: displayOverride?.imagePosition || agent.imagePosition,
        imageFit: displayOverride?.imageFit || (agent as { imageFit?: "cover" | "contain" }).imageFit || "cover",
        imageTransform: displayOverride?.imageTransform || (agent as { imageTransform?: string }).imageTransform,
      };
    });
  }, [homeQuery.data?.agents, officePhone]);

  const homepageProperties = useMemo(() => {
    const properties = homeQuery.data?.properties ?? [];
    return properties.map((property) => ({
      id: property.id,
      title: property.title,
      neighborhood: property.neighborhood,
      city: property.city,
      price: property.price,
      rooms: property.rooms,
      sqm: property.sqm,
      status: property.status,
      address: property.address,
      street: property.street,
      agentId: property.agentId,
      image:
        property.featuredImageUrl ||
        property.images?.[0]?.imageUrl ||
        JERUSALEM_HERO,
    }));
  }, [homeQuery.data?.properties]);

  const featuredProperties = useMemo(
    () => homepageProperties.filter((property) => ["בלעדי", "למכירה", "חדש"].includes(property.status.trim())).slice(0, 10),
    [homepageProperties],
  );

  const soldProperties = useMemo(() => {
    return homepageProperties
      .filter((property) => {
        const location = formatPropertyLocation(property);
        const isTargetRental = (location.includes("סן מרטין 13") && property.price === 4900)
          || (location.includes("סן מרטין 25") && property.price === 8500);
        return property.status.trim() === "נמכר" || isTargetRental;
      })
      .slice(0, 10)
      .map((property) => {
        const location = formatPropertyLocation(property).replace(/,\s*03\b/g, "");
        const isTargetRental = (location.includes("סן מרטין 13") && property.price === 4900)
          || (location.includes("סן מרטין 25") && property.price === 8500);
        return {
          ...property,
          displayLocation: location,
          displayStatus: isTargetRental ? "הושכר" : property.status.trim(),
        };
      });
  }, [homepageProperties]);

  const soldPropertiesTrack = useMemo(() => {
    if (!soldProperties.length) return [];
    const copiesPerLoop = Math.max(6, Math.ceil(20 / soldProperties.length));
    const loop = Array.from({ length: copiesPerLoop }, () => soldProperties).flat();
    return [...loop, ...loop];
  }, [soldProperties]);

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

  const scrollMarketingCarousel = useCallback((direction: "prev" | "next") => {
    if (!marketingCarouselApi) return;

    if (direction === "prev") {
      marketingCarouselApi.scrollPrev();
      return;
    }

    marketingCarouselApi.scrollNext();
  }, [marketingCarouselApi]);

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

  useEffect(() => {
    if (!marketingCarouselApi) return;

    const updateSelectedSlide = () => {
      setSelectedMarketingSlide(marketingCarouselApi.selectedScrollSnap());
    };

    updateSelectedSlide();
    marketingCarouselApi.on("select", updateSelectedSlide);
    marketingCarouselApi.on("reInit", updateSelectedSlide);

    return () => {
      marketingCarouselApi.off("select", updateSelectedSlide);
      marketingCarouselApi.off("reInit", updateSelectedSlide);
    };
  }, [marketingCarouselApi]);

  useEffect(() => {
    if (selectedMarketingIndex >= marketingItems.length) {
      setSelectedMarketingIndex(0);
    }
  }, [marketingItems.length, selectedMarketingIndex]);

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
          quote: testimonial.quote.replace(/מ?לנדסמן ירושלים/g, "").replace(/\s{2,}/g, " ").trim(),
          stars: testimonial.stars || 5,
          displayOrder: testimonial.displayOrder ?? 1,
          whatsappImageUrl: testimonial.whatsappImageUrl ?? null,
        }))
      : [...fallbackTestimonials];

    return [...source]
      .sort((left, right) => {
        const leftIsCarmit = left.title.includes("כרמית") ? 1 : 0;
        const rightIsCarmit = right.title.includes("כרמית") ? 1 : 0;
        if (leftIsCarmit !== rightIsCarmit) return rightIsCarmit - leftIsCarmit;
        const leftOrder = left.displayOrder ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = right.displayOrder ?? Number.MAX_SAFE_INTEGER;
        if (leftOrder !== rightOrder) return leftOrder - rightOrder;
        return Number(left.id) - Number(right.id);
      });
  }, [homeQuery.data?.testimonials]);

  const visibleTestimonials = useMemo(() => editableTestimonials, [editableTestimonials]);
  const testimonialCards = useMemo(() => visibleTestimonials.slice(0, 6), [visibleTestimonials]);
  const openTestimonialPreview = useCallback((testimonial: (typeof testimonialCards)[number]) => {
    if (!testimonial.whatsappImageUrl) return;
    setTestimonialPreview({
      title: testimonial.title,
      source: testimonial.source,
      quote: testimonial.quote,
      stars: testimonial.stars,
      whatsappImageUrl: testimonial.whatsappImageUrl ?? null,
    });
  }, []);

  const testimonialStackStyles = useMemo(() => [
    { transform: "translate3d(-50%, 0, 0) rotate(0deg) scale(1)", zIndex: 30, opacity: 1 },
    { transform: "translate3d(-54%, 12px, 0) rotate(-4deg) scale(0.98)", zIndex: 25, opacity: 0.72 },
    { transform: "translate3d(-46%, 20px, 0) rotate(4deg) scale(0.96)", zIndex: 24, opacity: 0.66 },
    { transform: "translate3d(-58%, 34px, 0) rotate(-6deg) scale(0.94)", zIndex: 20, opacity: 0.5 },
    { transform: "translate3d(-42%, 44px, 0) rotate(6deg) scale(0.92)", zIndex: 19, opacity: 0.44 },
    { transform: "translate3d(-50%, 56px, 0) rotate(0deg) scale(0.9)", zIndex: 18, opacity: 0.36 },
  ], []);

  useEffect(() => {
    if (testimonialsExpanded || !effectsEnabled) {
      if (!effectsEnabled) setTestimonialsExpanded(true);
      return;
    }
    const section = testimonialsSectionRef.current;
    if (!section) return;

    let revealTimer: number | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          revealTimer = window.setTimeout(() => setTestimonialsExpanded(true), 1600);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      if (revealTimer) window.clearTimeout(revealTimer);
    };
  }, [effectsEnabled, testimonialsExpanded]);

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleEquitySliderRelease = (event: React.PointerEvent<HTMLInputElement>) => {
    setEquitySliderDragging(false);
    if (!effectsEnabled) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const left = `${Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100))}%`;
    const amount = Number(formData.equity || 50000);
    const sparkCount = amount >= 650000 ? 16 : 8;
    setSliderSparks(Array.from({ length: sparkCount }, (_, index) => ({
      id: Date.now() + index,
      left,
      delay: `${(index % 5) * 25}ms`,
      x: Math.round(Math.cos((index / sparkCount) * Math.PI * 2) * (amount >= 650000 ? 34 : 22)),
      y: Math.round(Math.sin((index / sparkCount) * Math.PI * 2) * (amount >= 650000 ? 34 : 22)),
    })));
    if (sliderSparkTimeout.current) window.clearTimeout(sliderSparkTimeout.current);
    sliderSparkTimeout.current = window.setTimeout(() => setSliderSparks([]), 850);
  };

  const scrollToForm = (track?: "seller" | "investor" | "landlord" | "buyer") => {
    if (track) {
      setLeadTrack(track);
      setLeadStep(2);
    }
    document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileMenuOpen(false);
  };

  const selectLeadTrack = (track: "seller" | "investor" | "landlord" | "buyer") => {
    setLeadTrack(track);
    setLeadStep(2);
    setFormData((previous) => ({ ...previous, fullName: "", phone: "" }));
    window.setTimeout(() => scrollToForm(track), 0);
  };

  const handleNextStep = () => {
    if (!leadTrack) {
      toast.error("בחרו קודם מה מביא אתכם אלינו.");
      return;
    }

    const hasPropertyDetails = leadTrack === "seller"
      ? formData.neighborhood && formData.rooms
      : leadTrack === "investor"
        ? formData.equity
        : leadTrack === "landlord"
          ? formData.propertyLocation && formData.landlordPath
          : formData.buyerArea && formData.rooms;

    if (!hasPropertyDetails) {
      toast.error("השלימו את הפרטים כדי שנוכל לחזור אליכם מדויקים יותר.");
      return;
    }

    setLeadStep(3);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!leadTrack || leadStep !== 3) {
      toast.error("אנא השלימו קודם את הפרטים הראשוניים.");
      setLeadStep(2);
      return;
    }

    if (!formData.fullName || !formData.phone) {
      toast.error("אנא מלאו שם מלא ומספר טלפון.");
      return;
    }

    try {
      const result = await submitLeadMutation.mutateAsync({
        fullName: formData.fullName,
        phone: formData.phone,
        neighborhood: formData.neighborhood || formData.propertyLocation || formData.buyerArea || "לא צוין",
        rooms: Number(formData.rooms.replace("+", "")) || 1,
        sqm: Number(formData.sqm) || 1,
        notes: [
          `מסלול: ${leadTrack === "seller" ? "מוכר דירה" : leadTrack === "investor" ? "רוצה להשקיע" : leadTrack === "landlord" ? "צריך להשכיר נכס" : "מחפש דירה למגורים"}`,
          formData.equity ? `הון עצמי: ${formData.equity}` : "",
          formData.hasProperty ? `נכס קיים: ${formData.hasProperty}` : "",
          formData.landlordPath ? `מסלול השכרה: ${formData.landlordPath}` : "",
        ].filter(Boolean).join(" | "),
      });

      if (result.emailSent) {
        toast.success("הפרטים נשלחו למייל ונחזור אליכם בהקדם.");
      } else {
        toast.warning("הפרטים נשמרו, אבל המייל לא נשלח. צריך להגדיר RESEND_API_KEY ב-Vercel.");
      }
      setShowThankYou(true);
      setLeadStep(1);
      setLeadTrack(null);
      setFormData({ neighborhood: "", rooms: "", sqm: "", fullName: "", phone: "", equity: "200000", hasProperty: "", propertyLocation: "", landlordPath: "", buyerArea: "" });
    } catch {
      toast.error("לא הצלחנו לשמור את הפרטים כרגע. נסו שוב בעוד רגע.");
    }
  };

  const footerSloganDisplay = "בצד שלך. גם אחרי המפתח.";

  return (
    <div className="home-page min-h-screen overflow-x-hidden bg-[#FBF7EF] text-[#2A211B]" dir="rtl">
      <div className="fixed inset-x-0 top-4 z-50 px-3 md:px-6">
        <header className="mx-auto max-w-7xl origin-top scale-[0.9] rounded-full border border-[#4a382b] bg-[#1C1612] px-4 py-2 shadow-[0_12px_34px_rgba(28,22,18,0.28)] backdrop-blur-md md:px-6">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <Button
              onClick={() => window.open(whatsappLink, "_blank", "noopener,noreferrer")}
              className="hidden rounded-full bg-[#d9ae4c] px-6 text-base font-black text-black shadow-[0_10px_28px_rgba(217,174,76,0.32)] hover:bg-[#b98b2f] md:inline-flex"
            >
              ליצירת קשר
            </Button>

            <nav className="hidden items-center justify-center gap-8 text-[1.12rem] font-extrabold text-[#FFFDF8] lg:flex xl:gap-10 xl:text-[1.24rem]">
              {navItems.map((item) =>
                item.isRoute ? (
                    <Link key={item.label} href={item.href} className="transition hover:text-[#D9AE4C]">
                    {item.label}
                  </Link>
                ) : (
                  <a key={item.label} href={item.href} className="transition hover:text-[#D9AE4C]">
                    {item.label}
                  </a>
                ),
              )}
            </nav>

            <div className="mr-auto flex items-center justify-end gap-3 lg:mr-0">
              {/* Hamburger — 3 lines, not a circle */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="flex flex-col gap-[5px] p-2.5 text-[#FFFDF8] lg:hidden"
                aria-label="פתח תפריט"
              >
                <span className="block h-[2px] w-6 rounded-full bg-[#FFFDF8]" />
                <span className="block h-[2px] w-6 rounded-full bg-[#FFFDF8]" />
                <span className="block h-[2px] w-6 rounded-full bg-[#FFFDF8]" />
              </button>
              <div className="flex items-center justify-center">
                <img src={TEAM_LOGO} alt={BRAND_NAME} className="team-shay-logo h-24 w-auto brightness-0 invert md:h-28" />
              </div>
            </div>
          </div>

        </header>

        {/* Mobile sidebar overlay — outside header to avoid clipping/stacking issues */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden"
            style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(4px)" }}
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <div
          className={`fixed top-0 right-0 z-[70] flex h-full w-80 flex-col overflow-hidden shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${mobileMenuOpen ? "visible translate-x-0" : "invisible translate-x-full"}`}
          style={{ backgroundColor: "#ffffff", borderLeft: "2px solid #d9ae4c" }}
          dir="rtl"
        >
          <div className="flex items-center justify-between px-5 py-5" style={{ backgroundColor: "#0d0d0d" }}>
            <img src={TEAM_LOGO} alt={BRAND_NAME} className="team-shay-logo h-20 w-auto brightness-0 invert" />
            <button onClick={() => setMobileMenuOpen(false)} style={{ color: "#d9ae4c" }} className="p-2 rounded-lg transition" aria-label="סגור">
              <X className="size-5" />
            </button>
          </div>
          <div style={{ flex: 1, background: "#fafafa", padding: "20px 16px", overflowY: "auto" }}>
            <p style={{ color: "#d9ae4c", fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>
              ניווט מהיר
            </p>
            <nav style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {navItems.map((item) => {
                const baseStyle: React.CSSProperties = {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  borderRadius: "16px",
                  background: "#ffffff",
                  color: "#0d0d0d",
                  fontWeight: 800,
                  fontSize: "1.05rem",
                  border: "2px solid #e1eae4",
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "background 0.15s, border-color 0.15s",
                };

                const handleEnter = (e: React.MouseEvent<HTMLElement>) => {
                  (e.currentTarget as HTMLElement).style.background = "#fbfaf5";
                  (e.currentTarget as HTMLElement).style.borderColor = "#d9ae4c";
                };
                const handleLeave = (e: React.MouseEvent<HTMLElement>) => {
                  (e.currentTarget as HTMLElement).style.background = "#ffffff";
                  (e.currentTarget as HTMLElement).style.borderColor = "#e1eae4";
                };

                const inner = (
                  <>
                    <span>{item.label}</span>
                    <ChevronLeft style={{ width: "18px", height: "18px", color: "#d9ae4c", flexShrink: 0 }} />
                  </>
                );

                return item.isRoute ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={baseStyle}
                    onMouseEnter={handleEnter}
                    onMouseLeave={handleLeave}
                  >
                    {inner}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={baseStyle}
                    onMouseEnter={handleEnter}
                    onMouseLeave={handleLeave}
                  >
                    {inner}
                  </a>
                );
              })}
            </nav>
          </div>
          <div className="border-t border-[#E8DCC6] bg-[#FFFDF8] px-4 py-4">
            <button
              onClick={() => { window.open(whatsappLink, "_blank", "noopener,noreferrer"); setMobileMenuOpen(false); }}
              style={{ width: "100%", background: "#d9ae4c", color: "#000", fontWeight: 900, borderRadius: "999px", height: "48px", fontSize: "1rem", border: "none", cursor: "pointer" }}
            >
              שלחו הודעה עכשיו
            </button>
            <div style={{ borderTop: "1px solid #eee", paddingTop: "14px", marginTop: "12px", textAlign: "center" }}>
              <p style={{ fontSize: "11px", color: "#999" }}>Shay Group — נדל״ן ירושלים</p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex flex-col">
        <section id="home" className="order-1 relative isolate min-h-screen overflow-hidden bg-[#1C1612] px-4 pb-16 pt-36 md:px-6 md:pb-24 md:pt-40">
          <div className="absolute inset-0 z-0">
            <video
              className="absolute left-0 top-0 h-full w-full origin-top scale-[1.18] object-cover"
              style={{ objectPosition: "center top" }}
              src={HERO_VIDEO_URL}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
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
            <div className="absolute left-0 top-0 z-10 h-full w-full bg-[rgba(28,22,18,0.66)]" />
          </div>

          <div className="relative z-20 mx-auto flex min-h-[78vh] max-w-5xl flex-col items-center justify-center text-center text-white">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#D9AE4C] md:text-base">
              Shay Group - Real Estate Company
            </p>
            <h1 className="mt-8 max-w-5xl text-4xl font-black leading-[1.08] md:text-6xl lg:text-[4.7rem]">
              נדל״ן בירושלים. עם צוות שנשאר גם אחרי המפתח.
            </h1>

            <p className="mt-8 max-w-[680px] text-[1.3rem] font-bold leading-8 text-[#FFFDF8]/90 md:text-[1.45rem]">
              מלווים אתכם מהפגישה הראשונה, דרך המשכנתא ועורך הדין, ועד שהדירה מושכרת ומנוהלת. הכול בכתובת אחת.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button
                onClick={() => scrollToForm()}
                className="h-14 rounded-full bg-[#D9AE4C] px-8 text-base font-black text-[#2A211B] shadow-[0_12px_30px_rgba(217,174,76,0.3)] hover:bg-[#B98B2F]"
              >
                בדקו מה מתאים לכם ↓
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-3 text-base font-bold text-[#FFFDF8]/85 md:text-lg">
              <button type="button" onClick={() => selectLeadTrack("seller")} className="underline-offset-4 transition hover:text-[#D9AE4C] hover:underline">מוכרים דירה</button>
              <button type="button" onClick={() => selectLeadTrack("investor")} className="underline-offset-4 transition hover:text-[#D9AE4C] hover:underline">רוצים להשקיע</button>
              <button type="button" onClick={() => selectLeadTrack("landlord")} className="underline-offset-4 transition hover:text-[#D9AE4C] hover:underline">צריכים להשכיר נכס</button>
            </div>

            <div className="mt-10 grid w-full max-w-4xl grid-cols-2 pb-14 md:grid-cols-4 md:pb-0">
              {trustBadges.map((badge, index) => (
                <div
                  key={badge.label}
                  className={`flex min-h-20 flex-col items-center justify-center px-3 text-center ${index === 1 ? "border-r border-[#E8DCC6]/30" : index === 2 ? "border-t border-[#E8DCC6]/30" : index === 3 ? "border-r border-t border-[#E8DCC6]/30" : ""} ${index > 0 ? "md:border-r md:border-t-0 md:border-[#E8DCC6]/30" : ""}`}
                >
                  <AnimatedStat value={badge.value} className="text-2xl font-black text-[#D9AE4C] md:text-3xl" />
                  <span className="mt-1 text-xs font-bold text-[#FFFDF8]/80 md:text-sm">{badge.label}</span>
                </div>
              ))}
            </div>

            {homeQuery.isLoading ? (
              <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/85 backdrop-blur-md">
                <Loader2 className="size-4 animate-spin" />
                טוענים תוכן מעודכן מהמערכת
              </div>
            ) : null}
          </div>
        </section>

        <section id="about" className="order-3 bg-[#FBF7EF] px-4 py-20 md:px-6 md:py-24">
          <div className="mx-auto grid max-w-7xl items-start gap-12 lg:grid-cols-[1fr_0.92fr]">
            <div className="order-2 lg:order-1">
              <p className="text-base font-extrabold uppercase tracking-[0.03em] text-[#B5653A]">הסיפור מאחורי Shay Group</p>
              <h2 className="mt-4 max-w-[680px] text-[2.15rem] font-extrabold leading-tight text-[#2A211B] md:text-[3.45rem]">כולם יודעים שדירה היא ביטחון. אז למה רוב האנשים לא קונים?</h2>
              <div className="mt-6 max-w-[680px] space-y-4 text-lg leading-8 text-[#5A4E44]">
                <p>נעים מאוד, אני שי כהן, המייסד של Shay Group.</p>
                <p>אחרי כמה שנים בעולם הנדל״ן החלטתי להקים משרד שעובד אחרת. וזה התחיל הרבה לפני הדירה הראשונה שמכרתי.</p>
                <p>כששירתתי כמפקד לוחם, ראיתי את זה שוב ושוב: חבר'ה מעולים משתחררים עם מענק וחסכונות, טסים, חוזרים, והכסף נגמר. אף אחד לא אמר להם שאפשר גם לטייל וגם להתחיל לבנות משהו לשנים הבאות. אף אחד לא ישב איתם ותכנן.</p>
                <p>בנדל״ן פגשתי את אותו סיפור בגילאים אחרים. זוגות צעירים, אנשים מבוגרים, אנשים שמתמודדים עם חובות או עם מגבלה. כולם ידעו שדירה היא ביטחון, ורובם לא קנו. הם פחדו, והפחד תמיד הגיע מאותם ארבעה מקומות.</p>
                <p><strong className="font-black text-[#2A211B]">&quot;אני לא יודע אם אני יכול להרשות לעצמי.&quot;</strong> אז לפני שמחפשים דירה, יושבים אצלנו עם מתכנן פיננסי ובונים תמונה ברורה, עד הפרט האחרון.</p>
                <p><strong className="font-black text-[#2A211B]">&quot;אין לי כוח לשוכרים ולנזקים.&quot;</strong> אז אנחנו בודקים את השוכר, גובים את שכר הדירה ומטפלים בכל מה שקורה בנכס.</p>
                <p><strong className="font-black text-[#2A211B]">&quot;מיסים, משכנתא, חוזים. זה גדול עליי.&quot;</strong> אז אנשי המקצוע עובדים איתנו קבוע, ומסבירים הכול בעברית פשוטה.</p>
                <p><strong className="font-black text-[#2A211B]">&quot;ומה אם המתווך ייעלם ברגע שאחתום?&quot;</strong> אז בנינו משרד שהעבודה שלו ממשיכה גם אחרי המפתח.</p>
                <p>אז אם גם אתם יודעים שדירה היא ביטחון ועדיין לא עשיתם את הצעד, בואו נשב. שיחה אחת, בלי התחייבות, ותדעו איפה אתם עומדים.</p>
              </div>
              <a href="#lead-form" className="mt-2 inline-block text-base font-black text-[#B5653A] underline-offset-4 hover:underline">לבדיקת התאמה ↑</a>
              <p className="mt-6 text-lg font-black text-[#2A211B]">שי כהן, מייסד Shay Group</p>
              <div className="mt-8 grid grid-cols-3 gap-3">
                {[
                  ["20M+ ₪", "היקף עסקאות"],
                  ["20+", "עסקאות שנסגרו"],
                  [String(homepageAgents.length), "אנשי צוות"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl border border-[#E8DCC6] bg-[#FFFDF8] p-4 text-center shadow-[0_12px_26px_rgba(90,78,68,0.08)]">
                    <p className="text-2xl font-black text-[#d9ae4c]"><AnimatedStat value={value} /></p>
                    <p className="mt-1 text-sm font-bold text-[#5A4E44]">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="relative mx-auto max-w-[30rem]">
                <div className="absolute -inset-5 rounded-[42px] bg-[radial-gradient(circle_at_top,rgba(217,174,76,0.22),rgba(255,255,255,0))] blur-2xl" />
                <div className="relative overflow-hidden rounded-[36px] border border-[#E8DCC6] bg-[#FFFDF8] p-4 shadow-[0_28px_70px_rgba(90,78,68,0.14)]">
                  <div ref={shayVideoSectionRef} className="relative">
                    {shayVideoManualPlay || (effectsEnabled && shouldLoadShayVideo && !shayVideoReducedMotion) || shayVideoMotionOverride ? (
                      <video
                        ref={shayVideoRef}
                        className="h-[520px] w-full rounded-[28px] object-cover"
                        poster={SHAY_BRAND_VIDEO_POSTER}
                        muted={shayVideoMuted}
                        autoPlay
                        loop
                        playsInline
                        preload="none"
                        aria-label="סרטון תדמית של Shay Group"
                        onLoadedData={() => {
                          setShayVideoLoaded(true);
                          playShayVideoIfVisible();
                        }}
                        onCanPlay={playShayVideoIfVisible}
                      >
                        <source src={SHAY_BRAND_VIDEO_WEBM} type="video/webm" />
                        <source src={SHAY_BRAND_VIDEO_MP4} type="video/mp4" />
                      </video>
                    ) : (
                      <img
                        src={SHAY_BRAND_VIDEO_POSTER}
                        alt="סרטון תדמית של Shay Group"
                        className="h-[520px] w-full rounded-[28px] object-cover"
                        loading="lazy"
                      />
                    )}
                    {(!effectsEnabled || shayVideoReducedMotion) && !shayVideoManualPlay && !shayVideoMotionOverride ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShayVideoMotionOverride(true);
                          setShouldLoadShayVideo(true);
                          setShayVideoManualPlay(true);
                          setShayVideoMuted(false);
                        }}
                        className="absolute bottom-4 left-4 inline-flex size-11 items-center justify-center rounded-full bg-[#D9AE4C] text-[#2A211B] shadow-lg"
                        aria-label="הפעלת סרטון תדמית של Shay Group"
                      >
                        <Play className="size-5 fill-current" aria-hidden="true" />
                      </button>
                    ) : shayVideoManualPlay || (effectsEnabled && shouldLoadShayVideo) ? (
                      <button
                        type="button"
                        onClick={() => {
                          const video = shayVideoRef.current;
                          if (!video) return;
                          video.muted = !video.muted;
                          setShayVideoMuted(video.muted);
                        }}
                        className="absolute bottom-4 left-4 inline-flex size-10 items-center justify-center rounded-full bg-[#D9AE4C] text-[#2A211B] shadow-lg"
                        aria-label={shayVideoMuted ? "הפעלת סאונד בסרטון התדמית" : "כיבוי סאונד בסרטון התדמית"}
                      >
                        {shayVideoMuted ? <VolumeX className="size-4" aria-hidden="true" /> : <Volume2 className="size-4" aria-hidden="true" />}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="order-5 border-y border-[#E8DCC6] bg-[#F3EADB] px-4 py-20 md:px-6 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-base font-extrabold uppercase tracking-[0.03em] text-[#B5653A]">מה אנחנו עושים</p>
              <h2 className="mt-4 text-[2.1rem] font-extrabold text-[#2A211B] md:text-[3.35rem]">מוכרים, משקיעים או משכירים? אותו צוות. אותו הרעב.</h2>
            </div>
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              <article className="flex h-full flex-col rounded-[28px] border border-[#E8DCC6] bg-[#FFFDF8] p-7 shadow-[0_16px_36px_rgba(90,78,68,0.10)]">
                <h3 className="text-2xl font-black text-[#2A211B]">דירה נמכרת טוב כשהיא משווקת טוב.</h3>
                <p className="mt-4 flex-1 max-w-[680px] text-lg font-semibold leading-8 text-[#5A4E44]">צילום מקצועי, וידאו, קמפיין ממומן ובית פתוח. גללו עוד קצת ותראו חלק מפעולות השיווק שאנחנו מתחייבים עליהן בכל נכס. מחפשים לקנות? על כל דירה שאנחנו משווקים אתם מדברים ישר עם הסוכן שמכיר אותה.</p>
                <a href="#marketing-methods" className="mt-6 font-black text-[#B5653A]">לפעולות השיווק שלנו ↓</a>
                <button type="button" onClick={() => selectLeadTrack("seller")} className="mt-7 inline-flex w-fit items-center rounded-full bg-[#D9AE4C] px-6 py-3 text-base font-black text-[#2A211B] transition hover:bg-[#B98B2F]">כמה שווה הדירה שלי?</button>
              </article>
              <article className="flex h-full flex-col rounded-[28px] border border-[#E8DCC6] bg-[#FFFDF8] p-7 shadow-[0_16px_36px_rgba(90,78,68,0.10)]">
                <h3 className="text-2xl font-black text-[#2A211B]">אתם מביאים את ההחלטה. אנחנו מביאים את כל השאר.</h3>
                <p className="mt-4 flex-1 max-w-[680px] text-lg font-semibold leading-8 text-[#5A4E44]">תכנון פיננסי, איתור הנכס, משא ומתן מול הקבלן או בעל הנכס, עורך דין ויועץ משכנתאות. במקום חמישה טלפונים לחמישה אנשים, שיחה אחת. דירה חדשה מקבלן, או מקום בקבוצת משקיעים שמשיגה תנאים שיחיד לא מקבל.</p>
                <button type="button" onClick={() => selectLeadTrack("investor")} className="mt-7 inline-flex w-fit items-center rounded-full bg-[#D9AE4C] px-6 py-3 text-base font-black text-[#2A211B] transition hover:bg-[#B98B2F]">לתיאום שיחת אבחון</button>
              </article>
              <article className="flex h-full flex-col rounded-[28px] border border-[#E8DCC6] bg-[#FFFDF8] p-7 shadow-[0_16px_36px_rgba(90,78,68,0.10)]">
                <h3 className="text-2xl font-black text-[#2A211B]">שוכר טוב הוא לא עניין של מזל. הוא עניין של בדיקה.</h3>
                <p className="mt-4 text-lg font-semibold leading-8 text-[#5A4E44]">לכל בעל דירה, גם אם לא קניתם דרכנו. שני מסלולים:</p>
                <p className="mt-3 text-lg font-semibold leading-8 text-[#5A4E44]"><strong className="font-black text-[#2A211B]">השכרה.</strong> מצלמים, מפרסמים, מראים את הדירה ומביאים לכם שוכר עד חתימה על החוזה.</p>
                <p className="mt-3 flex-1 text-lg font-semibold leading-8 text-[#5A4E44]"><strong className="font-black text-[#2A211B]">ניהול מלא עם תעודת אחריות.</strong> כל מה שבמסלול ההשכרה, ועוד: בדיקת BDI לשוכר, גביית שכר הדירה כל חודש וטיפול בכל תקלה. אתם לא מדברים עם השוכר. אנחנו כן.</p>
                <button type="button" onClick={() => selectLeadTrack("landlord")} className="mt-7 inline-flex w-fit items-center rounded-full bg-[#D9AE4C] px-6 py-3 text-base font-black text-[#2A211B] transition hover:bg-[#B98B2F]">אני רוצה לשמוע עוד</button>
              </article>
            </div>
            <p className="mt-8 text-center text-lg font-black text-[#5A4E44]">מי שמוכר איתנו חוזר לקנות. מי שקונה נשאר להשכיר. ככה זה כשלא נעלמים.</p>
          </div>
        </section>

        <section id="team" className="order-9 bg-[#FBF7EF] px-4 py-20 md:px-6 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-base font-extrabold uppercase tracking-[0.03em] text-[#d9ae4c]" style={{fontSize: '24px'}}>הצוות</p>
              <h2 className="mt-4 text-[2.1rem] font-extrabold md:text-[3.35rem]">האנשים שתדברו איתם.</h2>
              <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">לכל שכונה יש אצלנו מי שמכיר אותה מקרוב. הטלפון שלו כאן.</p>
            </div>

            <div className="mx-auto mt-12 flex max-w-7xl flex-wrap justify-center gap-4">
              {homepageAgents.map((agent) => (
                <article
                  key={agent.id}
                  className="group w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_36px_rgba(15,23,42,0.06)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_24px_56px_rgba(15,23,42,0.14)] sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)] xl:w-[250px]"
                >
                  <div className="relative h-48 overflow-hidden bg-[#F3EADB]">
                    <img
                      src={agent.image}
                      alt={agent.name}
                      className="h-full w-full object-cover"
                      style={{ objectPosition: "center top" }}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.classList.add("hidden");
                        event.currentTarget.nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                    <div className="absolute inset-0 hidden flex items-center justify-center bg-[#F3EADB] text-4xl font-black text-[#B5653A]" aria-hidden="true">
                      {agent.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("")}
                    </div>
                  </div>
                  <div className="p-3 text-center">
                    <h3 className="text-[1.3rem] font-extrabold text-slate-950">{agent.name}</h3>
                    <p className="mt-1.5 min-h-[84px] text-xs font-semibold leading-5 text-slate-600 text-center">{agent.expertise}</p>
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

        <section id="method" className="order-7 bg-[#F3EADB] px-4 py-20 md:px-6 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-base font-extrabold uppercase tracking-[0.03em] text-[#d9ae4c]" style={{fontSize: '24px'}}>איך זה עובד</p>
              <h2 className="mt-4 text-[2.1rem] font-extrabold md:text-[3.35rem]">חמישה צעדים, ואף אחד מהם לא עושים לבד.</h2>
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

        <section id="marketing-methods" className="order-6 border-y border-[#E8DCC6] bg-[#FBF7EF] px-4 py-20 text-[#2A211B] md:px-6 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-5 text-center md:items-center">
              <p className="inline-flex items-center justify-center gap-2 self-center rounded-full border border-[#d9ae4c]/40 bg-white px-5 py-2 text-sm font-black text-[#d9ae4c] shadow-sm">
                <Play className="size-4 fill-current" />
                {marketingSection.eyebrow}
              </p>
              <h2 className="text-4xl font-extrabold leading-tight md:text-[3.4rem]">
                {marketingSection.title}
              </h2>
              <p className="max-w-4xl text-lg font-semibold leading-8 text-slate-600">
                {marketingSection.subtitle}
              </p>
            </div>

            <div className="mt-12">
              {marketingItems.length ? (
                <Carousel
                  setApi={setMarketingCarouselApi}
                  opts={{ align: "center", direction: "rtl", loop: marketingItems.length > 3 }}
                  className="relative"
                >
                  <CarouselContent className="-ml-5">
                    {marketingItems.map((item, index) => {
                      return (
                        <CarouselItem key={item.id || item.title} className="basis-[78%] pl-5 sm:basis-[48%] lg:basis-[31%] xl:basis-[25%]">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMarketingIndex(index);
                              setMarketingPreviewOpen(true);
                            }}
                            className="group relative h-[460px] w-full overflow-hidden rounded-[30px] border border-[#E8DCC6] bg-[#1C1612] text-right shadow-[0_22px_50px_rgba(90,78,68,0.16)] transition duration-500 hover:-translate-y-1 hover:border-[#D9AE4C] hover:shadow-[0_24px_58px_rgba(217,174,76,0.2)]"
                          >
                            {item.type === "video" ? (
                              <video src={item.mediaUrl} poster={item.posterUrl ?? undefined} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" muted playsInline />
                            ) : (
                              <img src={item.mediaUrl} alt={item.title} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
                            )}
                            <span className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/22 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                              <p className="text-sm font-black text-[#D9AE4C]">{item.type === "video" ? "וידאו" : "תמונה"}</p>
                              <h3 className="mt-2 text-2xl font-black leading-tight text-[#D9AE4C]">{item.title}</h3>
                              <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-white/82">{item.description}</p>
                              <span className="mt-5 inline-flex rounded-full border border-white/45 bg-white/10 px-5 py-2 text-sm font-black text-white opacity-0 backdrop-blur-sm transition duration-300 group-hover:border-[#D9AE4C] group-hover:bg-[#D9AE4C] group-hover:text-[#2A211B] group-hover:opacity-100">
                                צפייה מלאה
                              </span>
                            </div>
                          </button>
                        </CarouselItem>
                      );
                    })}
                  </CarouselContent>

                  {marketingItems.length > 1 ? (
                    <div className="mt-8 flex items-center justify-center gap-4">
                      <Button type="button" variant="outline" size="icon" className="size-12 rounded-full border-[#D9AE4C] bg-[#D9AE4C] text-[#2A211B] shadow-[0_12px_26px_rgba(217,174,76,0.24)] hover:bg-[#B98B2F]" onClick={() => scrollMarketingCarousel("next")} aria-label="פעולת שיווק הבאה">
                        <ArrowRight className="size-5" />
                      </Button>
                      <Button type="button" variant="outline" size="icon" className="size-12 rounded-full border-[#D9AE4C] bg-[#D9AE4C] text-[#2A211B] shadow-[0_12px_26px_rgba(217,174,76,0.24)] hover:bg-[#B98B2F]" onClick={() => scrollMarketingCarousel("prev")} aria-label="פעולת שיווק קודמת">
                        <ArrowLeft className="size-5" />
                      </Button>
                    </div>
                  ) : null}

                  <div className="mt-5 flex items-center justify-center gap-2">
                    {marketingItems.map((item, index) => (
                      <button key={`marketing-dot-${item.id || index}`} type="button" className={`h-2.5 rounded-full transition-all ${selectedMarketingSlide === index ? "w-8 bg-[#D9AE4C]" : "w-2.5 bg-[#E8DCC6]"}`} onClick={() => marketingCarouselApi?.scrollTo(index)} aria-label={`מעבר לפעולת שיווק ${index + 1}`} aria-current={selectedMarketingSlide === index ? "true" : undefined} />
                    ))}
                  </div>
                </Carousel>
              ) : null}
            </div>

            {marketingPreviewOpen && selectedMarketingItem ? (
              <div
                className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4"
                role="dialog"
                aria-modal="true"
                onClick={() => setMarketingPreviewOpen(false)}
              >
                <div className="w-full max-w-6xl overflow-hidden rounded-[30px] bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
                    <div className="text-right">
                      <p className="text-xs font-black uppercase tracking-[0.08em] text-[#b98b2f]">Preview</p>
                      <h3 className="text-xl font-black text-slate-950">{selectedMarketingItem.title}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMarketingPreviewOpen(false)}
                      className="flex size-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-[#d9ae4c] hover:text-[#b98b2f]"
                      aria-label="סגירת תצוגה מקדימה"
                    >
                      <X className="size-5" />
                    </button>
                  </div>
                  <div className="bg-black">
                    {selectedMarketingItem.type === "video" ? (
                      <video
                        src={selectedMarketingItem.mediaUrl}
                        poster={selectedMarketingItem.posterUrl ?? undefined}
                        controls
                        autoPlay
                        playsInline
                        className="max-h-[78vh] w-full object-contain"
                      />
                    ) : (
                      <img
                        src={selectedMarketingItem.mediaUrl}
                        alt={selectedMarketingItem.title}
                        className="max-h-[78vh] w-full object-contain"
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : null}
            <div className="mt-8 text-center">
              <button type="button" onClick={() => selectLeadTrack("seller")} className="text-base font-black text-[#B5653A] underline-offset-4 hover:text-[#2A211B] hover:underline">
                רוצים לראות את זה על הדירה שלכם? ←
              </button>
            </div>
          </div>
        </section>

        <section id="properties" className="order-10 bg-[#F3EADB] px-4 py-20 text-[#2A211B] md:px-6 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-lg font-extrabold uppercase tracking-[0.03em] text-[#d9ae4c] md:text-2xl">מחפשים נכס? הגעתם למקום הנכון</p>
                <h2 className="mt-4 text-4xl font-extrabold leading-tight text-[#1A1A1A] md:text-[3.35rem]">הבית הבא שלכם אולי כבר כאן.</h2>
              </div>
              <Link href="/properties" className="inline-flex items-center gap-2 text-base font-black text-[#d9ae4c]">
                לכל הנכסים ←
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
                        <Link
                          href={`/properties/${property.id}`}
                          className="group relative block h-[520px] overflow-hidden rounded-[30px] border border-[#d9ae4c]/30 bg-[#1A1A1A] text-white shadow-[0_20px_48px_rgba(15,23,42,0.14)] transition duration-500 hover:-translate-y-1.5 hover:border-[#d9ae4c] hover:shadow-[0_26px_64px_rgba(217,174,76,0.24)]"
                          aria-label={`פתיחת דף הנכס ${property.title}`}
                        >
                          <div className="absolute inset-0 overflow-hidden">
                            <img
                              src={property.image}
                              alt={property.title}
                              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                              loading="lazy"
                            />
                          </div>
                          <span className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/12 to-black/82 transition duration-500 group-hover:from-black/78 group-hover:via-black/38 group-hover:to-black/88" />
                          <div className="absolute inset-x-0 top-0 p-7 text-center">
                            <h3 className="mx-auto max-w-[92%] text-3xl font-black leading-tight drop-shadow-[0_3px_14px_rgba(0,0,0,0.45)] md:text-[2.25rem]">
                              {formatPropertyLocation(property) || property.title}
                            </h3>
                            <p className="mt-4 text-base font-bold text-white/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
                              {property.rooms} חדרים · {property.sqm} מ״ר
                            </p>
                          </div>

                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="translate-y-4 rounded-full border border-white/75 bg-black/24 px-10 py-4 text-base font-black text-white opacity-0 shadow-[0_16px_38px_rgba(0,0,0,0.28)] backdrop-blur-[2px] transition duration-300 group-hover:translate-y-0 group-hover:border-[#d9ae4c] group-hover:bg-[#d9ae4c] group-hover:text-black group-hover:opacity-100">
                              פרטים נוספים
                            </span>
                          </div>

                          <div className="absolute inset-x-0 bottom-0 p-7 text-center">
                            <span className="mb-3 inline-flex rounded-full bg-[#d9ae4c] px-4 py-1.5 text-xs font-black text-black shadow-[0_10px_24px_rgba(0,0,0,0.22)]">
                              {property.status}
                            </span>
                            <p className="text-3xl font-black text-[#d9ae4c] drop-shadow-[0_3px_16px_rgba(0,0,0,0.45)]">
                              ₪{property.price.toLocaleString("he-IL")}
                            </p>
                          </div>
                        </Link>
                      </CarouselItem>
                    ))}
                  </CarouselContent>

                  {featuredPropertyTrack.length > 1 ? (
                    <>
                      <div className="mt-8 flex items-center justify-center gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-12 rounded-full border-[#d9ae4c] bg-[#d9ae4c] text-black shadow-[0_12px_26px_rgba(217,174,76,0.24)] hover:bg-[#b98b2f] hover:text-black"
                          onClick={() => scrollPropertyCarousel("next")}
                          aria-label="Next property"
                        >
                          <ArrowRight className="size-5" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-12 rounded-full border-[#d9ae4c] bg-[#d9ae4c] text-black shadow-[0_12px_26px_rgba(217,174,76,0.24)] hover:bg-[#b98b2f] hover:text-black"
                          onClick={() => scrollPropertyCarousel("prev")}
                          aria-label="Previous property"
                        >
                          <ArrowLeft className="size-5" />
                        </Button>
                      </div>

                      <div className="mt-5 flex items-center justify-center gap-2">
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

        <section className="order-8 overflow-hidden bg-[#FBF7EF] px-4 py-20 text-[#2A211B] md:px-6 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <p className="text-base font-black uppercase tracking-[0.08em] text-[#d9ae4c]">הצלחות מהשטח</p>
              <h2 className="mt-4 text-4xl font-black text-[#1A1A1A] md:text-[3.35rem]">נמכר, נקנה והושכר.</h2>
              <p className="mx-auto mt-4 max-w-3xl text-lg font-semibold leading-8 text-[#6B6B6B]">
                כל כתובת כאן היא חוזה חתום.
              </p>
            </div>

            {soldPropertiesTrack.length ? (
              <div className="mt-12 overflow-hidden [direction:ltr]">
                <div className="sold-properties-marquee flex w-max gap-5 px-3">
                  {soldPropertiesTrack.map((property, index) => (
                    <article
                      key={`${property.id}-${index}`}
                      className="w-[310px] shrink-0 overflow-hidden rounded-[28px] border border-[#d9ae4c]/30 bg-white text-right shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition hover:border-[#d9ae4c] [direction:rtl] md:w-[360px]"
                    >
                      <div className="relative h-52 overflow-hidden">
                        <img src={property.image} alt={property.title} className="h-full w-full object-cover" loading="lazy" />
                        <span className="absolute right-4 top-4 rounded-full bg-[#d9ae4c] px-4 py-2 text-sm font-black text-black shadow-lg">
                          {property.displayStatus === "הושכר" ? "הושכר ✓" : "נמכר ✓"}
                        </span>
                      </div>
                      <div className="p-5">
                        <h3 className="text-xl font-black text-[#1A1A1A]">{property.displayLocation || property.title}</h3>
                        <p className="mt-5 text-2xl font-black text-[#d9ae4c]">₪{property.price.toLocaleString("he-IL")}{property.displayStatus === "הושכר" ? " לחודש" : ""}</p>
                        <div className="mt-4 border-t border-[#d9ae4c]/20 pt-4 text-sm font-bold">
                          <span className="text-[#6B6B6B]">עסקה שנחתמה עם Shay Group</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-12 rounded-[28px] border border-dashed border-[#d9ae4c]/40 bg-white p-8 text-center text-[#6B6B6B]">
                עסקאות חדשות יופיעו כאן מיד כשהן מתעדכנות במערכת.
              </div>
            )}
          </div>
        </section>

        <section ref={testimonialsSectionRef} id="testimonials" className="order-4 bg-[#F3EADB] px-4 py-14 text-[#2A211B] md:px-6 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-base font-extrabold uppercase tracking-[0.03em] text-[#d9ae4c]" style={{fontSize: "20px"}}>המלצות</p>
              <h2 className="mt-3 text-[2rem] font-extrabold md:text-[3.25rem]">ככה זה נראה מהצד של הלקוח.</h2>
              <p className="mt-3 text-base font-black text-slate-600">Google · 5.0 ★★★★★ · מבוסס על 32 ביקורות</p>
            </div>

            <div className="mx-auto mt-9 max-w-7xl">
              {homeQuery.isLoading ? (
                <div className="rounded-[30px] border border-slate-200 bg-white p-8 text-center text-slate-500">
                  טוענים המלצות מהמערכת...
                </div>
              ) : visibleTestimonials.length ? (
                <div className="relative mx-auto overflow-visible py-3 transition-all duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)]" aria-label="קיר המלצות חי">
                  <div
                    className={`testimonials-grid-motion grid gap-4 transition-all duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 ${
                      testimonialsExpanded ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
                    }`}
                  >
                    {testimonialCards.map((testimonial, index) => (
                      <button
                        type="button"
                        key={`grid-${testimonial.id}`}
                        onClick={() => openTestimonialPreview(testimonial)}
                        className="group relative flex min-h-[23rem] cursor-pointer flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white text-right shadow-[0_2px_12px_rgba(0,0,0,0.08)] outline-none transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 hover:border-[#d9ae4c] hover:shadow-[0_28px_70px_rgba(217,174,76,0.22)] focus-visible:border-[#d9ae4c] focus-visible:ring-4 focus-visible:ring-[#d9ae4c]/25"
                        style={{ transitionDelay: testimonialsExpanded ? `${Math.min(index, 5) * 150}ms` : "0ms" }}
                      >
                        {testimonial.whatsappImageUrl ? (
                          <div className="relative h-44 overflow-hidden bg-[#1A1A1A] md:h-48 xl:h-52" aria-label={`פתיחת המלצה של ${testimonial.title} בגודל מלא`}>
                            {isVideoMediaUrl(testimonial.whatsappImageUrl) ? (
                              <video src={testimonial.whatsappImageUrl} className="h-full w-full object-contain" muted playsInline preload="metadata" />
                            ) : (
                              <img src={testimonial.whatsappImageUrl} alt={testimonial.title} className="h-full w-full object-contain" loading="lazy" />
                            )}
                            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
                            <span className="absolute bottom-4 right-4 inline-flex translate-y-3 items-center gap-2 rounded-full bg-[#d9ae4c] px-5 py-2 text-sm font-black text-[#1A1A1A] opacity-0 shadow-lg transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                              {isVideoMediaUrl(testimonial.whatsappImageUrl) ? <Play className="size-4 fill-current" /> : <MessageCircle className="size-4" />}
                              לחצו לצפייה
                            </span>
                          </div>
                        ) : null}
                        <div className="flex flex-1 flex-col p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-base font-black text-slate-950">{testimonial.title}</p>
                              <p className="mt-1 text-xs font-bold tracking-[0.02em] text-[#d9ae4c]">{testimonial.source}</p>
                            </div>
                            <div className="flex items-center gap-1 text-[#d9ae4c]" aria-label={`דירוג ${testimonial.stars} מתוך 5`}>
                              {Array.from({ length: testimonial.stars }).map((_, starIndex) => (
                                <Star key={`grid-${testimonial.id}-${starIndex}`} className="size-3.5 fill-current" />
                              ))}
                            </div>
                          </div>
                          <p className="mt-3 line-clamp-5 flex-1 text-sm font-semibold leading-6 text-slate-600">{testimonial.quote}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div
                    className={`testimonials-stack-motion absolute inset-x-0 top-3 flex min-h-[23rem] justify-center transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      testimonialsExpanded ? "pointer-events-none -translate-y-2 opacity-0 blur-[1px]" : "translate-y-0 opacity-100 blur-0"
                    }`}
                    aria-hidden={testimonialsExpanded}
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-6 flex justify-center">
                      <span className="h-[22rem] w-full max-w-[14rem] rounded-[34px] bg-[#d9ae4c]/15 blur-3xl" />
                    </div>
                    {testimonialCards.map((testimonial, index) => {
                      const stackedStyle = testimonialStackStyles[index] ?? testimonialStackStyles[0];
                      return (
                        <button
                          type="button"
                          key={`stack-${testimonial.id}`}
                          onClick={() => openTestimonialPreview(testimonial)}
                          className="group absolute left-1/2 top-0 flex min-h-[23rem] w-full max-w-[14rem] cursor-pointer flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white text-right shadow-[0_2px_12px_rgba(0,0,0,0.08)] outline-none transition-all duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-3 hover:border-[#d9ae4c] hover:shadow-[0_28px_70px_rgba(217,174,76,0.22)] focus-visible:border-[#d9ae4c] focus-visible:ring-4 focus-visible:ring-[#d9ae4c]/25"
                          style={{ ...stackedStyle, transitionDelay: `${index * 120}ms` }}
                        >
                          {testimonial.whatsappImageUrl ? (
                            <div className="relative h-44 overflow-hidden bg-[#1A1A1A] md:h-48 xl:h-52" aria-label={`פתיחת המלצה של ${testimonial.title} בגודל מלא`}>
                              {isVideoMediaUrl(testimonial.whatsappImageUrl) ? (
                                <video src={testimonial.whatsappImageUrl} className="h-full w-full object-contain" muted playsInline preload="metadata" />
                              ) : (
                                <img src={testimonial.whatsappImageUrl} alt={testimonial.title} className="h-full w-full object-contain" loading="lazy" />
                              )}
                            </div>
                          ) : null}
                          <div className="flex flex-1 flex-col p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-base font-black text-slate-950">{testimonial.title}</p>
                                <p className="mt-1 text-xs font-bold tracking-[0.02em] text-[#d9ae4c]">{testimonial.source}</p>
                              </div>
                              <div className="flex items-center gap-1 text-[#d9ae4c]" aria-label={`דירוג ${testimonial.stars} מתוך 5`}>
                                {Array.from({ length: testimonial.stars }).map((_, starIndex) => (
                                  <Star key={`stack-${testimonial.id}-${starIndex}`} className="size-3.5 fill-current" />
                                ))}
                              </div>
                            </div>
                            <p className="mt-3 line-clamp-5 flex-1 text-sm font-semibold leading-6 text-slate-600">{testimonial.quote}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-[30px] border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
                  עדיין לא נוספו המלצות להצגה בדף הבית.
                </div>
              )}
            </div>
          </div>
        </section>

        {testimonialPreview ? (
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/82 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={`המלצה של ${testimonialPreview.title}`}
            onClick={() => setTestimonialPreview(null)}
          >
            <div
              className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[32px] bg-white text-right shadow-[0_30px_90px_rgba(0,0,0,0.35)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="text-sm font-black text-[#d9ae4c]">{testimonialPreview.source}</p>
                  <h3 className="text-2xl font-black text-[#1A1A1A]">{testimonialPreview.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setTestimonialPreview(null)}
                  className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-[#d9ae4c] hover:text-[#1A1A1A]"
                  aria-label="סגירת המלצה"
                >
                  <X className="size-5" />
                </button>
              </div>
              {testimonialPreview.whatsappImageUrl ? (
                <div className="bg-[#0f0f0f]">
                  {isVideoMediaUrl(testimonialPreview.whatsappImageUrl) ? (
                    <video src={testimonialPreview.whatsappImageUrl} className="max-h-[68vh] w-full object-contain" controls playsInline autoPlay />
                  ) : (
                    <img src={testimonialPreview.whatsappImageUrl} alt={testimonialPreview.title} className="max-h-[68vh] w-full object-contain" />
                  )}
                </div>
              ) : null}
              <div className="space-y-3 p-5">
                <div className="flex items-center justify-end gap-1 text-[#d9ae4c]" aria-label={`דירוג ${testimonialPreview.stars} מתוך 5`}>
                  {Array.from({ length: testimonialPreview.stars }).map((_, starIndex) => (
                    <Star key={`preview-${starIndex}`} className="size-5 fill-current" />
                  ))}
                </div>
                <p className="text-lg font-semibold leading-9 text-slate-700">{testimonialPreview.quote}</p>
              </div>
            </div>
          </div>
        ) : null}

        <section id="lead-form" className="order-2 bg-[#F3EADB] px-4 py-20 md:px-6 md:py-24">
          <div className="relative mx-auto max-w-[760px] rounded-[36px] border border-[#E8DCC6] bg-[#FFFDF8] p-8 shadow-[0_24px_60px_rgba(90,78,68,0.12)] md:p-12">
            {showThankYou ? (
              <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden rounded-[36px]" aria-live="polite">
                <div className="absolute inset-x-0 top-1/2 text-center text-2xl font-black text-[#2A211B]">תודה, הפרטים התקבלו</div>
                {effectsEnabled ? celebrationPieces.map((piece, index) => (
                  <span
                    key={`celebration-${index}`}
                    className="celebration-confetti absolute top-1/2 h-3 w-1.5 rounded-sm"
                    style={{ left: piece.left, backgroundColor: piece.color, animationDelay: piece.delay, transform: `rotate(${piece.rotation})` }}
                  />
                )) : null}
              </div>
            ) : null}
            <div className="text-center">
              <p className="text-base font-extrabold uppercase tracking-[0.03em] text-[#B5653A]">בדיקת התאמה · 30 שניות</p>
              <h2 className="mt-4 text-[2.1rem] font-extrabold leading-tight text-[#2A211B] md:text-[3.35rem]">עדיין מתלבטים? בדיוק בשביל זה אנחנו כאן.</h2>
            </div>

            {leadStep === 1 ? (
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 text-center">
                  <p className="text-sm font-black text-[#B5653A]">שלב 1 מתוך 3</p>
                  <p className="mt-2 text-xl font-black text-[#2A211B]">מה מביא אתכם אלינו?</p>
                </div>
                {[
                  ["seller", "מוכרים דירה", "הערכת שווי לדירה שלכם", HomeIcon],
                  ["investor", "רוצים להשקיע", "שיחת אבחון, בלי התחייבות", TrendingUp],
                  ["landlord", "צריכים להשכיר נכס", "שוכר בלבד או ניהול מלא", KeyRound],
                  ["buyer", "מחפשים דירה לגור בה", "דירות שמתאימות לכם", Search],
                ].map(([track, label, description, Icon]) => (
                  <button key={track as string} type="button" onClick={() => { setLeadTrack(track as typeof leadTrack); setLeadStep(2); }} className="group flex min-h-28 items-center gap-4 rounded-2xl border border-[#E8DCC6] bg-[#FFFDF8] px-5 py-5 text-right transition hover:border-[#D9AE4C] hover:bg-[#FFF8E6] focus-visible:border-[#D9AE4C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9AE4C]/40">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F3EADB] text-[#D9AE4C] transition group-hover:bg-[#D9AE4C] group-hover:text-[#2A211B]"><Icon className="size-5" /></span>
                    <span>
                      <span className="block text-lg font-black text-[#2A211B]">{label as string}</span>
                      <span className="mt-1 block text-sm font-semibold leading-5 text-[#5A4E44]">{description as string}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : leadStep === 2 ? (
              <div className="mt-10 grid gap-5">
                <button
                  type="button"
                  onClick={() => { setLeadStep(1); setLeadTrack(null); }}
                  className="justify-self-start text-base font-black text-[#B5653A] underline underline-offset-4 transition hover:text-[#2A211B]"
                >
                  → חזרה
                </button>
                <p className="text-center text-sm font-black text-[#B5653A]">שלב 2 מתוך 3</p>
                {leadTrack === "seller" ? (
                  <>
                    <p className="text-xl font-black text-slate-900">מה נמכור עבורכם?</p>
                    <label className="grid gap-2"><span className="text-sm font-bold text-slate-700">שכונה / אזור</span><input name="neighborhood" value={formData.neighborhood} onChange={handleFormChange} placeholder="למשל: קטמונים, גילה, ארנונה" className="h-14 rounded-2xl border border-slate-200 px-4 text-base outline-none focus:border-[#d9ae4c]" /></label>
                    <label className="grid gap-2"><span className="text-sm font-bold text-slate-700">מספר חדרים</span><select name="rooms" value={formData.rooms} onChange={handleFormChange} className="h-14 rounded-2xl border border-slate-200 px-4 text-base outline-none focus:border-[#d9ae4c]"><option value="">בחרו</option>{[2, 3, 4, 5, 6].map((room) => <option key={room} value={room}>{room}</option>)}</select></label>
                  </>
                ) : leadTrack === "investor" ? (
                  <>
                    <p className="text-xl font-black text-slate-900">מה גובה ההון העצמי שלכם?</p>
                    <div className="relative rounded-3xl border border-[#E8DCC6] bg-[#FFFDF8] px-5 py-6 text-center">
                      <output className="block text-3xl font-black text-[#2A211B]" htmlFor="equity-slider">
                        {displayedEquity >= 650000 ? "650,000 ₪ ומעלה" : `${displayedEquity.toLocaleString("he-IL")} ₪`}
                      </output>
                      <input
                        id="equity-slider"
                        name="equity"
                        type="range"
                        min="50000"
                        max="650000"
                        step="50000"
                        value={formData.equity || "200000"}
                        onChange={handleFormChange}
                        dir="rtl"
                        className={`equity-slider mt-7 h-2 w-full cursor-pointer ${equitySliderDragging ? "is-dragging" : ""}`}
                        style={{ "--slider-progress": `${Math.max(0, Math.min(100, ((Number(formData.equity || 50000) - 50000) / 600000) * 100))}%` } as React.CSSProperties}
                        onPointerDown={() => setEquitySliderDragging(true)}
                        onPointerUp={handleEquitySliderRelease}
                        onPointerCancel={() => setEquitySliderDragging(false)}
                        aria-label="הון עצמי פנוי"
                      />
                      {sliderSparks.map((spark) => (
                        <span
                          key={spark.id}
                          className="slider-spark pointer-events-none absolute top-1/2 h-1.5 w-1.5 rounded-full bg-[#D9AE4C]"
                          style={{ left: spark.left, animationDelay: spark.delay, "--spark-x": `${spark.x}px`, "--spark-y": `${spark.y}px` } as React.CSSProperties}
                        />
                      ))}
                      <div className="mt-3 flex items-center justify-between text-xs font-bold text-[#5A4E44]" dir="rtl">
                        <span>50K</span>
                        <span>200K</span>
                        <span>400K</span>
                        <span>650K+</span>
                      </div>
                    </div>
                    <div className="grid gap-2"><span className="text-sm font-bold text-slate-700">יש בבעלותכם נכס?</span><div className="grid gap-3 sm:grid-cols-2">
                      {["כן", "לא, זו תהיה העסקה הראשונה"].map((value) => (
                        <button key={value} type="button" onClick={() => setFormData((previous) => ({ ...previous, hasProperty: value }))} className={`min-h-14 w-full whitespace-nowrap rounded-2xl border px-4 text-sm font-bold transition sm:text-base ${formData.hasProperty === value ? "border-[#D9AE4C] bg-[#FFF8E6] text-[#2A211B]" : "border-slate-200 bg-white text-slate-700 hover:border-[#D9AE4C]"}`}>{value}</button>
                      ))}
                    </div></div>
                  </>
                ) : leadTrack === "landlord" ? (
                  <>
                    <p className="text-xl font-black text-slate-900">איך אפשר לעזור עם הנכס?</p>
                    <input name="propertyLocation" value={formData.propertyLocation} onChange={handleFormChange} placeholder="איפה נמצא הנכס?" className="h-14 rounded-2xl border border-slate-200 px-4 text-base outline-none focus:border-[#d9ae4c]" />
                    <select name="landlordPath" value={formData.landlordPath} onChange={handleFormChange} className="h-14 rounded-2xl border border-slate-200 px-4 text-base outline-none focus:border-[#d9ae4c]"><option value="">בחרו</option><option value="הערכת שכר דירה">הערכת שכר דירה</option><option value="השכרה וניהול מלא">השכרה וניהול מלא</option></select>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-black text-slate-900">מה אתם מחפשים?</p>
                    <input name="buyerArea" value={formData.buyerArea} onChange={handleFormChange} placeholder="באיזה אזור בירושלים?" className="h-14 rounded-2xl border border-slate-200 px-4 text-base outline-none focus:border-[#d9ae4c]" />
                    <select name="rooms" value={formData.rooms} onChange={handleFormChange} className="h-14 rounded-2xl border border-slate-200 px-4 text-base outline-none focus:border-[#d9ae4c]"><option value="">כמה חדרים?</option>{[2, 3, 4, 5, 6].map((room) => <option key={room} value={room}>{room}</option>)}</select>
                  </>
                )}
                <Button type="button" onClick={handleNextStep} className="h-14 rounded-full bg-[#D9AE4C] px-10 text-base font-extrabold text-[#2A211B] hover:bg-[#B98B2F]">המשיכו</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-10 grid gap-5">
                <button
                  type="button"
                  onClick={() => setLeadStep(2)}
                  className="justify-self-start text-base font-black text-[#B5653A] underline underline-offset-4 transition hover:text-[#2A211B]"
                >
                  → חזרה
                </button>
                <p className="text-center text-sm font-black text-[#B5653A]">שלב 3 מתוך 3</p>
                <p className="text-xl font-black text-[#2A211B]">לאן נחזור אליכם?</p>
                <div className="grid gap-5 sm:grid-cols-2">
                  <input required name="fullName" value={formData.fullName} onChange={handleFormChange} placeholder="שם מלא" className="h-14 rounded-2xl border border-slate-200 px-4 text-base outline-none focus:border-[#d9ae4c]" />
                  <input required name="phone" value={formData.phone} onChange={handleFormChange} placeholder="טלפון" className="h-14 rounded-2xl border border-slate-200 px-4 text-base outline-none focus:border-[#d9ae4c]" />
                </div>
                <p className="text-sm font-semibold text-slate-500">חוזרים אליכם בתוך יום עסקים אחד. בלי התחייבות.</p>
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button type="button" variant="outline" onClick={() => setLeadStep(2)} className="h-14 rounded-full border-[#d9ae4c] px-8 text-base font-extrabold text-[#d9ae4c]">חזרה</Button>
                  <Button type="submit" disabled={submitLeadMutation.isPending} className="h-14 rounded-full bg-[#d9ae4c] px-10 text-base font-extrabold text-black hover:bg-[#b98b2f]">{submitLeadMutation.isPending ? "שומרים פרטים..." : "שלחו פרטים"}</Button>
                </div>
              </form>
            )}
          </div>
        </section>

        <section className="order-11 bg-[#F3EADB] px-4 pb-20 md:px-6 md:pb-24">
          <div className="mx-auto max-w-5xl rounded-[36px] bg-[#1C1612] px-7 py-14 text-center text-[#FFFDF8] md:px-12">
            <h2 className="text-4xl font-black md:text-6xl">מוכרים, קונים או משקיעים? בואו נתחיל בשיחה.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg font-semibold leading-8 text-white/80">30 שניות, שתי שאלות, וחוזרים אליכם בתוך יום עסקים אחד.</p>
            <Button type="button" onClick={() => scrollToForm()} className="mt-8 h-14 rounded-full bg-[#d9ae4c] px-9 text-base font-black text-black hover:bg-[#b98b2f]">בדקו מה מתאים לכם</Button>
          </div>
        </section>

      </main>

      <footer className="bg-[#1C1612] px-[5%] py-14 pb-24 text-[#FFFDF8] md:pb-14" dir="rtl">
        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-10 text-center md:grid-cols-2 md:gap-x-16 lg:grid-cols-3 lg:items-start lg:gap-8">
          <div className="flex flex-col items-center text-center md:col-start-1 md:row-start-2 lg:col-start-auto lg:row-start-auto lg:items-end lg:text-right">
            <p className="text-base font-extrabold uppercase tracking-[0.03em] text-white">יצירת קשר</p>
            <div className="mt-4 flex flex-col items-center gap-3 text-center text-white lg:items-end lg:text-right" dir="rtl">
              <a href={`tel:${officePhoneLink}`} className="flex min-h-11 flex-row-reverse items-center justify-start gap-2 text-center lg:self-end lg:text-right">
                <span>{officePhone}</span>
                <Phone className="size-4 shrink-0" />
              </a>
              <p className="text-center lg:text-right">האומן 25, תלפיות, ירושלים</p>
            </div>
          </div>

          <div className="flex flex-col items-center text-center md:col-span-2 md:row-start-1 lg:col-span-1 lg:row-start-auto">
            <div className="rounded-[28px] bg-transparent px-4 py-2 md:px-6 md:py-3">
            <img src={TEAM_LOGO} alt={BRAND_NAME} className="team-shay-logo h-56 w-auto object-contain brightness-0 invert md:h-64" loading="lazy" />
            </div>
            <p className="mt-5 text-lg font-black text-white md:text-center" style={{ fontSize: "30px" }}>{footerSloganDisplay}</p>
            <p className="mt-10 w-full max-w-3xl text-center text-xs leading-6 text-white/60">אין לראות באמור באתר ייעוץ השקעות או תחליף לייעוץ אישי המתחשב בנתוניו של כל אדם.</p>
          </div>

          <div className="flex flex-col items-center text-center md:col-start-2 md:row-start-2 lg:col-start-auto lg:row-start-auto lg:items-end lg:text-right">
            <p className="text-base font-extrabold uppercase tracking-[0.03em] text-white">ניווט</p>
            <div className="mt-4 flex flex-col items-center gap-3 text-center text-white lg:items-end lg:text-right" dir="rtl">
              <a href="#home" className="flex min-h-11 items-center text-center lg:text-right">דף הבית</a>
              <a href="#about" className="flex min-h-11 items-center text-center lg:text-right">הסיפור שלנו</a>
              <a href="#services" className="flex min-h-11 items-center text-center lg:text-right">השירותים</a>
              <Link href="/properties" className="flex min-h-11 items-center text-center lg:text-right">נכסים</Link>
              <a href="#team" className="flex min-h-11 items-center text-center lg:text-right">הצוות</a>
              <Link href="/agent-login" className="flex min-h-11 items-center text-center lg:text-right">התחברות סוכנים</Link>
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
