import React, { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronLeft,
  Handshake,
  Loader2,
  Megaphone,
  Menu,
  MessageCircle,
  Newspaper,
  Phone,
  Play,
  ShieldCheck,
  Star,
  Video,
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
  propertyImages,
  SHAY_ABOUT_IMAGE,
  TEAM_LOGO,
  TYPING_TEXT,
  WHATSAPP_LINK,
} from "@/lib/siteData";
import { formatPropertyLocation } from "@/lib/property-display";

const navItems: Array<{ label: string; href: string; isRoute: boolean }> = [
  { label: "דף הבית", href: "#home", isRoute: false },
  { label: "אודות", href: "#about", isRoute: false },
  { label: "שיטה", href: "#method", isRoute: false },
  { label: "שיווק", href: "#marketing-methods", isRoute: false },
  { label: "נכסים", href: "/properties", isRoute: true },
  { label: "התחברות סוכנים", href: "/agent-login", isRoute: true },
];

const HERO_VIDEO_URL = "/media/hero-animation.mp4";
const HERO_LOOP_END_SECONDS = 5.4;
const HERO_LOOP_START_SECONDS = 0.02;
const HERO_LOOP_TARGET_SECONDS = 8;
const ELIYA_IMAGE_URL = "/agents/eliya-card.jpeg";
const AVIAD_IMAGE_URL = "/agents/aviad-card.jpeg";
const HODIYA_IMAGE_URL = "/agents/hodiya-card.png";
const RONEN_IMAGE_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663549770333/Skk9h57YxdLJzA5wF6rzPk/tryiton_1760536418265_f4vv644shhrm80csx0jvzt3etm2_d3afa6a6.png";
const YARDEN_IMAGE_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663549770333/Skk9h57YxdLJzA5wF6rzPk/WhatsAppImage2026-04-13at17.31.35_58f082a2.jpeg";
const HERO_TYPING_PHRASES = [
  "מוכרים בלעדיות. קונים בחכמה.",
  "מתחברים לשוק הנכסים של ירושלים.",
  "מומחי נדל״ן. תוצאות אמיתיות.",
  "הצוות שבאמת מכיר את השכונות.",
] as const;

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

const marketingMethodItems = [
  {
    title: "סרטוני הדמיה",
    description: "וידאו קצר שמכניס קונים לאווירה של הנכס עוד לפני הסיור.",
    type: "video",
    mediaUrl: HERO_VIDEO_URL,
    posterUrl: propertyImages.four,
    icon: Video,
  },
  {
    title: "עיתון מקומי, פליירים ומכתבי שכנים",
    description: "נראות מקומית שמחזקת אמון ומגיעה לקהל שמחפש בירושלים באמת.",
    type: "image",
    mediaUrl: propertyImages.two,
    icon: Newspaper,
  },
  {
    title: "בתים פתוחים לקונים ומתווכים",
    description: "אירועי מכירה מתוזמנים שמייצרים דחיפות, ביקושים ושיחות שטח.",
    type: "image",
    mediaUrl: propertyImages.one,
    icon: Building2,
  },
  {
    title: "פרסום אגרסיבי ברשתות",
    description: "קמפיינים ממומנים, אורגני, חשיפה ברשתות וחזרה חכמה לקהל שמתעניין.",
    type: "image",
    mediaUrl: propertyImages.three,
    icon: Megaphone,
  },
] as const;

const normalizeAgentName = (value: string) => value.replace(/\s+/g, "");

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

export default function Home() {
  const [typedText, setTypedText] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [leadStep, setLeadStep] = useState<1 | 2>(1);
  const [propertyCarouselApi, setPropertyCarouselApi] = useState<CarouselApi | null>(null);
  const [marketingCarouselApi, setMarketingCarouselApi] = useState<CarouselApi | null>(null);
  const [selectedPropertySlide, setSelectedPropertySlide] = useState(0);
  const [selectedMarketingSlide, setSelectedMarketingSlide] = useState(0);
  const [isPropertyCarouselPaused, setIsPropertyCarouselPaused] = useState(false);
  const [selectedMarketingIndex, setSelectedMarketingIndex] = useState(0);
  const [marketingPreviewOpen, setMarketingPreviewOpen] = useState(false);
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
  const marketingSection = homeQuery.data?.marketingSection ?? {
    eyebrow: "שיטות השיווק שלנו",
    title: "לא רק מעלים מודעה — בונים חוויית מכירה",
    subtitle:
      "כאן נרכז את סרטוני ההדמיה, תמונות מהעיתון, בתים פתוחים, שלטים ופעולות שטח. כל מדיה שתעלה תוכל להיות מוצגת ככרטיס חי, עם צפייה ישירה באתר.",
    highlights: ["וידאו שנפתח בלחיצה", "גלריות לפני/אחרי", "כרטיסי קמפיין מודגשים", "תיעוד שטח מבתים פתוחים"],
    items: marketingMethodItems.map((item, index) => ({ ...item, id: `fallback-${index + 1}` })),
  };
  const marketingItems = useMemo(() => marketingSection.items.slice(0, 10), [marketingSection.items]);
  const selectedMarketingItem = marketingItems[selectedMarketingIndex] ?? marketingItems[0];

  const homepageAgents = useMemo(() => {
    const dbAgents = homeQuery.data?.agents ?? [];
    if (dbAgents.length > 0) {
      return dbAgents.map((agent, index) => ({
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

    return fallbackAgents.map((agent) => {
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
    () => homepageProperties.filter((property) => ["בלעדי", "למכירה"].includes(property.status.trim())).slice(0, 10),
    [homepageProperties],
  );

  const soldProperties = useMemo(() => {
    return homepageProperties
      .filter((property) => property.status.trim() === "נמכר")
      .slice(0, 10)
      .map((property) => ({
      ...property,
    }));
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
    if (!propertyCarouselApi || isPropertyCarouselPaused || featuredPropertyTrack.length <= 1) return;

    const autoplay = window.setInterval(() => {
      propertyCarouselApi.scrollNext();
    }, 5000);

    return () => window.clearInterval(autoplay);
  }, [featuredPropertyTrack.length, isPropertyCarouselPaused, propertyCarouselApi]);

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
    if (testimonialsExpanded) return;
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
  }, [testimonialsExpanded]);

  useEffect(() => {
    let phraseIndex = 0;
    let characterIndex = 0;
    let deleting = false;
    let pauseUntil = 0;
    setTypedText("");

    const timer = window.setInterval(() => {
      if (Date.now() < pauseUntil) return;
      const phrase = HERO_TYPING_PHRASES[phraseIndex];

      if (!deleting) {
        characterIndex += 1;
        setTypedText(phrase.slice(0, characterIndex));
        if (characterIndex >= phrase.length) {
          deleting = true;
          pauseUntil = Date.now() + 1_550;
        }
      } else {
        characterIndex -= 1;
        setTypedText(phrase.slice(0, characterIndex));
        if (characterIndex <= 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % HERO_TYPING_PHRASES.length;
          pauseUntil = Date.now() + 250;
        }
      }
    }, 70);

    return () => window.clearInterval(timer);
  }, []);


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
      const result = await submitLeadMutation.mutateAsync({
        fullName: formData.fullName,
        phone: formData.phone,
        neighborhood: formData.neighborhood,
        rooms: Number(formData.rooms.replace("+", "")),
        sqm: Number(formData.sqm),
        notes: null,
      });

      if (result.emailSent) {
        toast.success("הפרטים נשלחו למייל ונחזור אליכם בהקדם.");
      } else {
        toast.warning("הפרטים נשמרו, אבל המייל לא נשלח. צריך להגדיר RESEND_API_KEY ב-Vercel.");
      }
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
                <img src={TEAM_LOGO} alt={settings?.siteName || "Team Shay"} className="team-shay-logo h-16 w-auto brightness-0 invert md:h-20" />
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
          className={`fixed top-0 right-0 z-[70] flex h-full w-80 flex-col overflow-hidden shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}
          style={{ backgroundColor: "#ffffff", borderLeft: "2px solid #d9ae4c" }}
          dir="rtl"
        >
          <div className="flex items-center justify-between px-5 py-5" style={{ backgroundColor: "#0d0d0d" }}>
            <img src={TEAM_LOGO} alt="Team Shay" className="team-shay-logo h-14 w-auto brightness-0 invert" />
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
                  border: "2px solid #f0e8d0",
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "background 0.15s, border-color 0.15s",
                };

                const handleEnter = (e: React.MouseEvent<HTMLElement>) => {
                  (e.currentTarget as HTMLElement).style.background = "#fff8e6";
                  (e.currentTarget as HTMLElement).style.borderColor = "#d9ae4c";
                };
                const handleLeave = (e: React.MouseEvent<HTMLElement>) => {
                  (e.currentTarget as HTMLElement).style.background = "#ffffff";
                  (e.currentTarget as HTMLElement).style.borderColor = "#f0e8d0";
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
          <div className="border-t border-[#f3dfb0] bg-white px-4 py-4">
            <button
              onClick={() => { window.open(whatsappLink, "_blank", "noopener,noreferrer"); setMobileMenuOpen(false); }}
              style={{ width: "100%", background: "#d9ae4c", color: "#000", fontWeight: 900, borderRadius: "999px", height: "48px", fontSize: "1rem", border: "none", cursor: "pointer" }}
            >
              שלחו הודעה עכשיו
            </button>
            <div style={{ borderTop: "1px solid #eee", paddingTop: "14px", marginTop: "12px", textAlign: "center" }}>
              <p style={{ fontSize: "11px", color: "#999" }}>Team Shay — נדל״ן ירושלים</p>
            </div>
          </div>
        </div>
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

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {homepageAgents.map((agent) => (
                <article
                  key={agent.id}
                  className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_36px_rgba(15,23,42,0.06)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_24px_56px_rgba(15,23,42,0.14)]"
                >
                  <div className="h-48 overflow-hidden bg-white">
                    <img
                      src={agent.image}
                      alt={agent.name}
                      className={`h-full w-full transition duration-500 ${agent.imageFit === "contain" ? "object-contain p-1" : "object-cover"}`}
                      style={{
                        objectPosition: agent.imagePosition,
                        transform: agent.imageTransform,
                        transformOrigin: agent.imageTransform ? "center top" : undefined,
                      }}
                      loading="lazy"
                    />
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

        <section id="marketing-methods" className="border-y border-[#D4AF37]/20 bg-white px-4 py-20 text-[#1A1A1A] md:px-6 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-5 text-center md:items-center">
              <p className="inline-flex items-center justify-center gap-2 self-center rounded-full border border-[#D4AF37]/40 bg-white px-5 py-2 text-sm font-black text-[#D4AF37] shadow-sm">
                <Play className="size-4 fill-current" />
                {marketingSection.eyebrow}
              </p>
              <h2 className="text-4xl font-extrabold leading-tight md:text-[3.4rem]">
                {marketingSection.title}
              </h2>
              <p className="max-w-4xl text-lg font-semibold leading-8 text-slate-600">
                {marketingSection.subtitle}
              </p>
              <div className="flex max-w-5xl flex-wrap justify-center gap-3">
                {marketingSection.highlights.map((item) => (
                  <div key={item} className="rounded-full border border-[#D4AF37]/25 bg-white px-4 py-2 text-sm font-black text-[#D4AF37] shadow-sm">
                    {item}
                  </div>
                ))}
              </div>
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
                            className="group relative h-[460px] w-full overflow-hidden rounded-[30px] border border-[#D4AF37]/35 bg-[#1A1A1A] text-right shadow-[0_22px_50px_rgba(15,23,42,0.12)] transition duration-500 hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-[0_24px_58px_rgba(212,175,55,0.20)]"
                          >
                            {item.type === "video" ? (
                              <video src={item.mediaUrl} poster={item.posterUrl ?? undefined} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" muted playsInline />
                            ) : (
                              <img src={item.mediaUrl} alt={item.title} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
                            )}
                            <span className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/22 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                              <p className="text-sm font-black text-[#D4AF37]">{item.type === "video" ? "וידאו" : "תמונה"}</p>
                              <h3 className="mt-2 text-2xl font-black leading-tight text-[#D4AF37]">{item.title}</h3>
                              <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-white/82">{item.description}</p>
                              <span className="mt-5 inline-flex rounded-full border border-white/45 bg-white/10 px-5 py-2 text-sm font-black text-white opacity-0 backdrop-blur-sm transition duration-300 group-hover:border-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black group-hover:opacity-100">
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
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-12 rounded-full border-[#D4AF37] bg-[#D4AF37] text-black shadow-[0_12px_26px_rgba(212,175,55,0.24)] hover:bg-[#B8960C] hover:text-black"
                        onClick={() => scrollMarketingCarousel("next")}
                        aria-label="פעולת שיווק הבאה"
                      >
                        <ArrowRight className="size-5" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-12 rounded-full border-[#D4AF37] bg-[#D4AF37] text-black shadow-[0_12px_26px_rgba(212,175,55,0.24)] hover:bg-[#B8960C] hover:text-black"
                        onClick={() => scrollMarketingCarousel("prev")}
                        aria-label="פעולת שיווק קודמת"
                      >
                        <ArrowLeft className="size-5" />
                      </Button>
                    </div>
                  ) : null}

                  <div className="mt-5 flex items-center justify-center gap-2">
                    {marketingItems.map((item, index) => (
                      <button
                        key={`marketing-dot-${item.id || index}`}
                        type="button"
                        className={`h-2.5 rounded-full transition-all ${
                          selectedMarketingSlide === index ? "w-8 bg-[#D4AF37]" : "w-2.5 bg-slate-300"
                        }`}
                        onClick={() => marketingCarouselApi?.scrollTo(index)}
                        aria-label={`מעבר לפעולת שיווק ${index + 1}`}
                        aria-current={selectedMarketingSlide === index ? "true" : undefined}
                      />
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
                      <p className="text-xs font-black uppercase tracking-[0.08em] text-[#B8960C]">Preview</p>
                      <h3 className="text-xl font-black text-slate-950">{selectedMarketingItem.title}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMarketingPreviewOpen(false)}
                      className="flex size-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-[#D4AF37] hover:text-[#B8960C]"
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
          </div>
        </section>

        <section id="properties" className="bg-white px-4 py-20 text-[#1A1A1A] md:px-6 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-lg font-extrabold uppercase tracking-[0.03em] text-[#d9ae4c] md:text-2xl">מחפשים נכס ? הגעתם למקום הנכון</p>
                <h2 className="mt-4 text-4xl font-extrabold leading-tight text-[#1A1A1A] md:text-[3.35rem]">הנכסים המובחרים שלנו</h2>
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
                        <Link
                          href={`/properties/${property.id}`}
                          className="group relative block h-[520px] overflow-hidden rounded-[30px] border border-[#D4AF37]/30 bg-[#1A1A1A] text-white shadow-[0_20px_48px_rgba(15,23,42,0.14)] transition duration-500 hover:-translate-y-1.5 hover:border-[#D4AF37] hover:shadow-[0_26px_64px_rgba(212,175,55,0.24)]"
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
                            <span className="translate-y-4 border border-white/75 bg-black/24 px-10 py-4 text-base font-black text-white opacity-0 shadow-[0_16px_38px_rgba(0,0,0,0.28)] backdrop-blur-[2px] transition duration-300 group-hover:translate-y-0 group-hover:border-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black group-hover:opacity-100">
                              פרטים נוספים
                            </span>
                          </div>

                          <div className="absolute inset-x-0 bottom-0 p-7 text-center">
                            <span className="mb-3 inline-flex rounded-full bg-[#D4AF37] px-4 py-1.5 text-xs font-black text-black shadow-[0_10px_24px_rgba(0,0,0,0.22)]">
                              {property.status}
                            </span>
                            <p className="text-3xl font-black text-[#D4AF37] drop-shadow-[0_3px_16px_rgba(0,0,0,0.45)]">
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
                          className="size-12 rounded-full border-[#D4AF37] bg-[#D4AF37] text-black shadow-[0_12px_26px_rgba(212,175,55,0.24)] hover:bg-[#B8960C] hover:text-black"
                          onClick={() => scrollPropertyCarousel("next")}
                          aria-label="Next property"
                        >
                          <ArrowRight className="size-5" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-12 rounded-full border-[#D4AF37] bg-[#D4AF37] text-black shadow-[0_12px_26px_rgba(212,175,55,0.24)] hover:bg-[#B8960C] hover:text-black"
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

        <section className="overflow-hidden bg-white px-4 py-20 text-[#1A1A1A] md:px-6 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <p className="text-base font-black uppercase tracking-[0.08em] text-[#D4AF37]">הצלחות מהשטח</p>
              <h2 className="mt-4 text-4xl font-black text-[#1A1A1A] md:text-[3.35rem]">נמכר לאחרונה — עסקאות שסגרנו</h2>
              <p className="mx-auto mt-4 max-w-3xl text-lg font-semibold leading-8 text-[#6B6B6B]">
                הירושלמים בוחרים ב-Team Shay. התוצאות מדברות בעד עצמן.
              </p>
            </div>

            {soldPropertiesTrack.length ? (
              <div className="mt-12 overflow-hidden [direction:ltr]">
                <div className="sold-properties-marquee flex w-max gap-5 px-3">
                  {soldPropertiesTrack.map((property, index) => (
                    <article
                      key={`${property.id}-${index}`}
                      className="w-[310px] shrink-0 overflow-hidden rounded-[28px] border border-[#D4AF37]/30 bg-white text-right shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition hover:border-[#D4AF37] [direction:rtl] md:w-[360px]"
                    >
                      <div className="relative h-52 overflow-hidden">
                        <img src={property.image} alt={property.title} className="h-full w-full object-cover" loading="lazy" />
                        <span className="absolute right-4 top-4 rounded-full bg-[#D4AF37] px-4 py-2 text-sm font-black text-black shadow-lg">
                          נמכר ✓
                        </span>
                      </div>
                      <div className="p-5">
                        <h3 className="text-xl font-black text-[#1A1A1A]">{formatPropertyLocation(property) || property.title}</h3>
                        <p className="mt-5 text-2xl font-black text-[#D4AF37]">₪{property.price.toLocaleString("he-IL")}</p>
                        <div className="mt-4 border-t border-[#D4AF37]/20 pt-4 text-sm font-bold">
                          <span className="text-[#6B6B6B]">נמכר עם צוות שי</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-12 rounded-[28px] border border-dashed border-[#D4AF37]/40 bg-white p-8 text-center text-[#6B6B6B]">
                עסקאות חדשות יופיעו כאן מיד כשהן מתעדכנות במערכת.
              </div>
            )}
          </div>
        </section>

        <section ref={testimonialsSectionRef} id="testimonials" className="bg-white px-4 py-14 text-[#1A1A1A] md:px-6 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-base font-extrabold uppercase tracking-[0.03em] text-[#D4AF37]" style={{fontSize: "20px"}}>המלצות</p>
              <h2 className="mt-3 text-[2rem] font-extrabold md:text-[3.25rem]">לקוחות משתפים</h2>
            </div>

            <div className="mx-auto mt-9 max-w-7xl">
              {homeQuery.isLoading ? (
                <div className="rounded-[30px] border border-slate-200 bg-white p-8 text-center text-slate-500">
                  טוענים המלצות מהמערכת...
                </div>
              ) : visibleTestimonials.length ? (
                <div className="relative mx-auto overflow-visible py-3 transition-all duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)]" aria-label="קיר המלצות חי">
                  <div
                    className={`grid gap-4 transition-all duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 ${
                      testimonialsExpanded ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
                    }`}
                  >
                    {testimonialCards.map((testimonial, index) => (
                      <button
                        type="button"
                        key={`grid-${testimonial.id}`}
                        onClick={() => openTestimonialPreview(testimonial)}
                        className="group relative flex min-h-[25rem] cursor-pointer flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white text-right shadow-[0_2px_12px_rgba(0,0,0,0.08)] outline-none transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 hover:border-[#D4AF37] hover:shadow-[0_28px_70px_rgba(212,175,55,0.22)] focus-visible:border-[#D4AF37] focus-visible:ring-4 focus-visible:ring-[#D4AF37]/25"
                        style={{ transitionDelay: testimonialsExpanded ? `${Math.min(index, 5) * 150}ms` : "0ms" }}
                      >
                        {testimonial.whatsappImageUrl ? (
                          <div className="relative h-56 overflow-hidden bg-[#FDF8F0] md:h-60 xl:h-64" aria-label={`פתיחת המלצה של ${testimonial.title} בגודל מלא`}>
                            {isVideoMediaUrl(testimonial.whatsappImageUrl) ? (
                              <video src={testimonial.whatsappImageUrl} className="h-full w-full object-contain" muted playsInline preload="metadata" />
                            ) : (
                              <img src={testimonial.whatsappImageUrl} alt={testimonial.title} className="h-full w-full object-contain" loading="lazy" />
                            )}
                            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
                            <span className="absolute bottom-4 right-4 inline-flex translate-y-3 items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-2 text-sm font-black text-[#1A1A1A] opacity-0 shadow-lg transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                              {isVideoMediaUrl(testimonial.whatsappImageUrl) ? <Play className="size-4 fill-current" /> : <MessageCircle className="size-4" />}
                              לחצו לצפייה
                            </span>
                          </div>
                        ) : null}
                        <div className="flex flex-1 flex-col p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-base font-black text-slate-950">{testimonial.title}</p>
                              <p className="mt-1 text-xs font-bold tracking-[0.02em] text-[#D4AF37]">{testimonial.source}</p>
                            </div>
                            <div className="flex items-center gap-1 text-[#D4AF37]" aria-label={`דירוג ${testimonial.stars} מתוך 5`}>
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
                    className={`absolute inset-x-0 top-3 flex min-h-[25rem] justify-center transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      testimonialsExpanded ? "pointer-events-none -translate-y-2 opacity-0 blur-[1px]" : "translate-y-0 opacity-100 blur-0"
                    }`}
                    aria-hidden={testimonialsExpanded}
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-6 flex justify-center">
                      <span className="h-[24rem] w-full max-w-[14rem] rounded-[34px] bg-[#D4AF37]/15 blur-3xl" />
                    </div>
                    {testimonialCards.map((testimonial, index) => {
                      const stackedStyle = testimonialStackStyles[index] ?? testimonialStackStyles[0];
                      return (
                        <button
                          type="button"
                          key={`stack-${testimonial.id}`}
                          onClick={() => openTestimonialPreview(testimonial)}
                          className="group absolute left-1/2 top-0 flex min-h-[25rem] w-full max-w-[14rem] cursor-pointer flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white text-right shadow-[0_2px_12px_rgba(0,0,0,0.08)] outline-none transition-all duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-3 hover:border-[#D4AF37] hover:shadow-[0_28px_70px_rgba(212,175,55,0.22)] focus-visible:border-[#D4AF37] focus-visible:ring-4 focus-visible:ring-[#D4AF37]/25"
                          style={{ ...stackedStyle, transitionDelay: `${index * 120}ms` }}
                        >
                          {testimonial.whatsappImageUrl ? (
                            <div className="relative h-56 overflow-hidden bg-[#FDF8F0] md:h-60 xl:h-64" aria-label={`פתיחת המלצה של ${testimonial.title} בגודל מלא`}>
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
                                <p className="mt-1 text-xs font-bold tracking-[0.02em] text-[#D4AF37]">{testimonial.source}</p>
                              </div>
                              <div className="flex items-center gap-1 text-[#D4AF37]" aria-label={`דירוג ${testimonial.stars} מתוך 5`}>
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
                  <p className="text-sm font-black text-[#D4AF37]">{testimonialPreview.source}</p>
                  <h3 className="text-2xl font-black text-[#1A1A1A]">{testimonialPreview.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setTestimonialPreview(null)}
                  className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-[#D4AF37] hover:text-[#1A1A1A]"
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
                <div className="flex items-center justify-end gap-1 text-[#D4AF37]" aria-label={`דירוג ${testimonialPreview.stars} מתוך 5`}>
                  {Array.from({ length: testimonialPreview.stars }).map((_, starIndex) => (
                    <Star key={`preview-${starIndex}`} className="size-5 fill-current" />
                  ))}
                </div>
                <p className="text-lg font-semibold leading-9 text-slate-700">{testimonialPreview.quote}</p>
              </div>
            </div>
          </div>
        ) : null}

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
              <img src={TEAM_LOGO} alt={settings?.siteName || "Team Shay"} className="team-shay-logo h-24 w-auto object-contain brightness-0 invert md:h-32" loading="lazy" />
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
