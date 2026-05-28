import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { storeAgentSessionToken } from "@/lib/agentSession";
import { trpc } from "@/lib/trpc";
import { AlertCircle, ChevronLeft, LockKeyhole, Mail } from "lucide-react";
import { toast } from "sonner";
import { JERUSALEM_HERO, TEAM_LOGO } from "@/lib/siteData";

function getRedirectTarget(accountRole?: string) {
  return accountRole === "admin" ? "/admin" : "/agent-dashboard";
}

export default function AgentLogin() {
  const utils = trpc.useUtils();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inlineError, setInlineError] = useState<string | null>(null);

  const { data: activeAgent, isLoading: isAgentLoading } = trpc.agent.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: true,
  });
  const redirectTarget = useMemo(() => getRedirectTarget(activeAgent?.accountRole), [activeAgent?.accountRole]);

  const loginMutation = trpc.admin.login.useMutation({
    onError: (error) => {
      const message = error.message || "לא הצלחנו להתחבר. בדקו את הפרטים ונסו שוב.";
      setInlineError(message);
      toast.error(message);
    },
  });

  useEffect(() => {
    if (isAgentLoading || !activeAgent) return;

    if (typeof window !== "undefined") {
      window.location.assign(redirectTarget);
      return;
    }

    navigate(redirectTarget);
  }, [activeAgent, isAgentLoading, navigate, redirectTarget]);

  const verifySessionAfterLogin = async (sessionToken?: string) => {
    if (typeof window === "undefined") return true;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const headers = new Headers();
      if (sessionToken) {
        headers.set("x-team-shay-agent-session", sessionToken);
      }

      const response = await window.fetch("/api/trpc/agent.me?batch=1&input=%7B%7D", {
        credentials: "include",
        headers,
      });
      const payload = (await response.json()) as Array<{
        result?: {
          data?: {
            json?: unknown;
          };
        };
      }>;
      const session = payload?.[0]?.result?.data?.json;

      if (session && typeof session === "object") {
        return true;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 180));
    }

    return false;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInlineError(null);

    if (!email || !password) {
      const message = "יש למלא כתובת אימייל וסיסמה.";
      setInlineError(message);
      toast.error(message);
      return;
    }

    try {
      const loginResult = await loginMutation.mutateAsync({
        email: email.trim().toLowerCase(),
        password,
      });

      storeAgentSessionToken(loginResult.sessionToken);

      const sessionReady = await verifySessionAfterLogin(loginResult.sessionToken);
      if (!sessionReady) {
        const message = "ההתחברות הצליחה אך הסשן לא נשמר בדפדפן. רעננו ונסו שוב.";
        setInlineError(message);
        toast.error(message);
        return;
      }

      await Promise.all([
        utils.agent.me.invalidate(),
        utils.admin.me.invalidate(),
        utils.admin.dashboard.invalidate(),
      ]);

      toast.success("התחברות הצליחה. מעבירים אתכם למסך הניהול...");
      const nextTarget = getRedirectTarget(loginResult.admin.accountRole);

      if (typeof window !== "undefined") {
        window.location.assign(nextTarget);
        return;
      }

      navigate(nextTarget);
    } catch {
      // Inline and toast errors are handled in the mutation onError callback.
    }
  };

  return (
    <div className="min-h-screen bg-white text-black" dir="rtl">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <section
          className="relative hidden overflow-hidden lg:block"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(217, 174, 76, 0.58), rgba(4, 12, 24, 0.75)), url(${JERUSALEM_HERO})`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,242,168,0.18),transparent_38%)]" />
          <div className="relative flex h-full flex-col justify-between p-10 text-white">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-white/90">
              <ChevronLeft className="size-4" />
              חזרה לאתר
            </Link>

            <div className="max-w-xl">
              <p className="text-sm font-black uppercase tracking-[0.08em] text-[#fff2a8]">Agent Area</p>
              <h1 className="mt-4 text-5xl font-black leading-tight">מערכת סוכנים נקייה, מהירה וממוקדת עבודה</h1>
              <p className="mt-5 text-lg leading-8 text-white/88">
                התחברות לסוכנים מאפשרת גישה לנכסים, ניהול מלאי ועדכון מהיר של מידע שיווקי בממשק אחד מסודר.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-12 md:px-6">
          <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-10">
            <div className="text-center">
              <img src={TEAM_LOGO} alt="Team Shay" className="mx-auto h-16 w-auto object-contain" />
              <p className="mt-6 text-sm font-black uppercase tracking-[0.08em] text-[#d9ae4c]">התחברות סוכן</p>
              <h2 className="mt-3 text-3xl font-black text-black">כניסה למסך הניהול</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                התחברו עם האימייל והסיסמה שהוגדרו לכרטיס הסוכן שלכם, ולאחר אימות תועברו בהפניה מלאה ישירות למסך האדמין.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-700">אימייל</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#d9ae4c]" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (inlineError) setInlineError(null);
                    }}
                    placeholder="agent@teamshay.co.il"
                    className="h-13 rounded-2xl border-slate-200 pr-11 text-right"
                    autoComplete="email"
                  />
                </div>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-700">סיסמה</span>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#d9ae4c]" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (inlineError) setInlineError(null);
                    }}
                    placeholder="הקלידו סיסמה"
                    className="h-13 rounded-2xl border-slate-200 pr-11 text-right"
                    autoComplete="current-password"
                  />
                </div>
              </label>

              {inlineError ? (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-right text-sm font-bold text-red-700">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{inlineError}</span>
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="mt-2 h-13 rounded-full bg-[#d9ae4c] text-base font-black text-white hover:bg-[#c99a31]"
              >
                {loginMutation.isPending ? "מתחברים..." : "כניסה למערכת"}
              </Button>
            </form>

            <div className="mt-6 rounded-[24px] bg-[#fff8e6] p-4 text-sm leading-7 text-slate-600">
              <p className="font-black text-black">גישה למערכת</p>
              <p className="mt-2">
                פרטי ההתחברות נמסרים לסוכנים מורשים בלבד. אם אתם חלק מהצוות ואין לכם גישה,
                פנו למנהל המערכת לקבלת הרשאה או לאיפוס סיסמה.
              </p>
            </div>

            <div className="mt-6 grid gap-3 text-center text-sm text-slate-500">
              <p>
                צריכים לחזור לדף הראשי? <Link href="/" className="font-bold text-[#d9ae4c]">לחצו כאן</Link>
              </p>
              <p>
                לאחר התחברות תקינה תועברו ישירות אל <Link href="/admin" className="font-bold text-[#d9ae4c]">מסך הניהול המתאים</Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
