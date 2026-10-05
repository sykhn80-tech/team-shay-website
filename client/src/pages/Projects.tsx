import { Building2, ChevronLeft, Loader2, MapPin } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BRAND_NAME, JERUSALEM_HERO, TEAM_LOGO } from "@/lib/siteData";
import { trpc } from "@/lib/trpc";

type PublicProject = {
  id: string;
  title: string;
  neighborhood: string;
  city: string;
  description: string;
  status: "בקרוב" | "בשיווק" | "הושלם";
  coverImageUrl: string | null;
};

export default function Projects() {
  const projectsQuery = trpc.publicSite.projects.useQuery(undefined, {
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const projects = (projectsQuery.data ?? []) as PublicProject[];

  return (
    <div className="min-h-screen bg-[#fbfaf5] text-slate-950" dir="rtl">
      <header className="border-b border-[#4b8067]/20 bg-white px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img
              src={TEAM_LOGO}
              alt={BRAND_NAME}
              className="h-16 w-auto object-contain"
              style={{ filter: "brightness(0) saturate(100%) invert(31%) sepia(17%) saturate(1364%) hue-rotate(109deg) brightness(91%) contrast(90%)" }}
            />
            <div>
              <p className="text-sm font-black uppercase tracking-[0.08em] text-[#4b8067]">Shay Group</p>
              <h1 className="mt-1 text-3xl font-black md:text-5xl">פרויקטים</h1>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" className="rounded-full border-[#4b8067]/30 bg-white px-5 text-[#2f6653] hover:bg-[#eef3ef]">
              <ChevronLeft className="size-4" />
              חזרה לדף הבית
            </Button>
          </Link>
        </div>
      </header>

      <main className="px-4 py-12 md:px-8 md:py-16">
        <section className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.08em] text-[#4b8067]">התחדשות, תכנון ואיכות חיים</p>
            <h2 className="mt-3 text-4xl font-black leading-tight md:text-6xl">הפרויקטים של Shay Group</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">כאן תמצאו פרויקטים נבחרים בירושלים והסביבה, עם פרטים ברורים ודרך ישירה לדבר איתנו.</p>
          </div>

          {projectsQuery.isLoading ? (
            <div className="flex min-h-64 items-center justify-center text-[#4b8067]">
              <Loader2 className="size-7 animate-spin" />
            </div>
          ) : projects.length ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <article key={project.id} className="overflow-hidden rounded-lg border border-[#4b8067]/20 bg-white shadow-[0_14px_32px_rgba(15,23,42,0.06)]">
                  <img src={project.coverImageUrl || JERUSALEM_HERO} alt={project.title} className="aspect-[16/10] w-full object-cover" loading="lazy" />
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-2xl font-black text-slate-950">{project.title}</h3>
                      <span className="shrink-0 rounded-full bg-[#eef3ef] px-3 py-1 text-xs font-black text-[#2f6653]">{project.status}</span>
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-sm font-bold text-[#2f6653]">
                      <MapPin className="size-4" />
                      {[project.neighborhood, project.city].filter(Boolean).join(", ")}
                    </p>
                    <p className="mt-4 min-h-20 text-base leading-7 text-slate-600">{project.description}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-12 border-y border-[#4b8067]/20 py-14 text-center">
              <Building2 className="mx-auto size-9 text-[#4b8067]" />
              <h2 className="mt-4 text-3xl font-black">פרויקטים חדשים יתווספו בקרוב</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">בינתיים נשמח לעזור לכם למצוא את הנכס הבא שלכם בירושלים והסביבה.</p>
              <Link href="/properties" className="mt-6 inline-block">
                <Button className="rounded-full bg-[#4b8067] px-6 text-white hover:bg-[#3a6b55]">לכל הנכסים</Button>
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
