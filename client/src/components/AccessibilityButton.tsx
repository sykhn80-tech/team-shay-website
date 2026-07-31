import { useEffect, useState } from "react";
import { Accessibility, Contrast, Link2, Type, X } from "lucide-react";

type AccessibilitySettings = {
  largeText: boolean;
  highContrast: boolean;
  underlineLinks: boolean;
};

const STORAGE_KEY = "team-shay-accessibility";

const DEFAULT_SETTINGS: AccessibilitySettings = {
  largeText: false,
  highContrast: false,
  underlineLinks: false,
};

function readSettings() {
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    return storedValue ? { ...DEFAULT_SETTINGS, ...JSON.parse(storedValue) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function AccessibilityButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(() =>
    typeof window === "undefined" ? DEFAULT_SETTINGS : readSettings(),
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("accessibility-large-text", settings.largeText);
    root.classList.toggle("accessibility-high-contrast", settings.highContrast);
    root.classList.toggle("accessibility-underline-links", settings.underlineLinks);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const toggleSetting = (key: keyof AccessibilitySettings) => {
    setSettings((previous) => ({ ...previous, [key]: !previous[key] }));
  };

  const resetSettings = () => setSettings(DEFAULT_SETTINGS);

  return (
    <div className="site-accessibility-widget fixed bottom-5 left-4 z-40 print:hidden" dir="rtl">
      {isOpen ? (
        <div className="mb-3 w-64 rounded-[22px] border border-[#D4AF37]/40 bg-white p-4 text-right shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-[#1A1A1A]">נגישות</p>
              <p className="text-xs font-semibold text-slate-500">התאמות תצוגה מהירות</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="grid size-8 place-items-center rounded-full bg-[#FDF8F0] text-[#1A1A1A] transition hover:bg-[#D4AF37]/20"
              aria-label="סגור תפריט נגישות"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={() => toggleSetting("largeText")}
              className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-sm font-bold transition ${
                settings.largeText ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#1A1A1A]" : "border-slate-200 text-slate-600 hover:border-[#D4AF37]/50"
              }`}
            >
              <span>הגדלת טקסט</span>
              <Type className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => toggleSetting("highContrast")}
              className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-sm font-bold transition ${
                settings.highContrast ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#1A1A1A]" : "border-slate-200 text-slate-600 hover:border-[#D4AF37]/50"
              }`}
            >
              <span>ניגודיות גבוהה</span>
              <Contrast className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => toggleSetting("underlineLinks")}
              className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-sm font-bold transition ${
                settings.underlineLinks ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#1A1A1A]" : "border-slate-200 text-slate-600 hover:border-[#D4AF37]/50"
              }`}
            >
              <span>הדגשת קישורים</span>
              <Link2 className="size-4" />
            </button>
          </div>

          <button type="button" onClick={resetSettings} className="mt-3 text-xs font-black text-[#B8960C] underline-offset-4 hover:underline">
            איפוס הגדרות
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="grid size-11 place-items-center rounded-full border border-[#D4AF37]/50 bg-[#1A1A1A] text-[#D4AF37] shadow-[0_12px_28px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:bg-[#D4AF37] hover:text-[#1A1A1A]"
        aria-label={isOpen ? "סגור תפריט נגישות" : "פתח תפריט נגישות"}
      >
        <Accessibility className="size-5" />
      </button>
    </div>
  );
}
