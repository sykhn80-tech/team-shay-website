# משימה לביצוע — Team Shay Website

## הפרויקט
- **תיקייה**: `/Users/shaulcohen/Desktop/hebrew-realestate-leads 2`
- **Stack**: React + TypeScript + tRPC + Vercel Blob
- **Deploy**: `git push origin main` → Vercel אוטומטי
- **אתר**: https://teamshay-jerusalem-homes.co.il

---

## המשימות

### 1. אחרי התחברות → /agent-dashboard (לא /admin ולא /crm)
**קובץ**: `client/src/pages/AgentLogin.tsx`

שנה:
```ts
// לפני:
return next && next.startsWith("/") ? next : "/admin";
// אחרי:
return next && next.startsWith("/") ? next : "/agent-dashboard";
```
שורה שנייה תופיע פעמיים — שנה שתיהן.

---

### 2. AdminPanel — הסר sidebar לבן, עטוף ב-AgentLayout
**קובץ**: `client/src/pages/AdminPanel.tsx`

**א. הוסף import בראש הקובץ:**
```ts
import AgentLayout from "@/components/AgentLayout";
```

**ב. הסר מה-imports:**
`BarChart2, LayoutDashboard, Megaphone, UserCircle2`
(נשארו רק מה שנמצא בשימוש בגוף הקובץ)

**ג. מצא והסר את כל הבלוק הזה** (sidebar לבן + sidebarItems):
```tsx
const sidebarItems = [ ... ];
const handleGoBack = () => { navigate("/agent-dashboard/crm"); };

return (
  <div className="min-h-screen bg-[#fffdf7] py-8" dir="rtl">
    <div className="mx-auto max-w-[1440px] px-4">
      <aside className="rounded-[28px] ...">
        ... כל תוכן הsidebar הלבן ...
      </aside>
      <div className="mt-6 space-y-8 lg:mt-0 lg:mr-[304px]" dir="rtl">
```

**ד. החלף בזה:**
```tsx
return (
  <AgentLayout>
  <div className="py-6 px-4" dir="rtl">
    <div className="mx-auto max-w-[1160px] space-y-8">
```

**ה. בסוף הקובץ**, החלף את 3 סגירות ה-`</div>` + ה-`);` ב:
```tsx
        </div>
      </div>
    </AgentLayout>
  );
}
```
⚠️ **חשוב**: ספור בדיוק — צריכות להיות בדיוק 2 סגירות `</div>` ואחר כך `</AgentLayout>`.
אחרי שינוי הרץ: `npx tsc --noEmit 2>&1 | grep AdminPanel` — חייב להחזיר ריק.

---

### 3. AgentLayout — לוגו גדול + drawer z-index תקין
**קובץ**: `client/src/components/AgentLayout.tsx`

**א. לוגו sidebar** — שנה `h-14` ל-`h-20`:
```tsx
// לפני:
className="h-14 w-auto object-contain"
// אחרי:
className="h-20 w-auto object-contain"
```

**ב. לוגו mobile top bar** — שנה `h-11` ל-`h-14`:
```tsx
// לפני:
className="h-11 w-auto object-contain"
// אחרי:
className="h-14 w-auto object-contain"
```

**ג. Drawer מובייל** — שנה `z-50` ל-`z-[60]`:
```tsx
// מצא את שורת ה-drawer (מכילה translate-x-full):
// לפני:
className={`lg:hidden fixed top-0 right-0 z-50 h-full w-[270px] ...`}
// אחרי:
className={`lg:hidden fixed top-0 right-0 z-[60] h-full w-[270px] ...`}
```
📌 **למה חשוב**: ה-overlay הוא `z-50`. אם ה-drawer גם `z-50` הוא מוסתר. חייב `z-[60]`.

---

### 4. Home.tsx — drawer מובייל מעל ה-overlay
**קובץ**: `client/src/pages/Home.tsx`

מצא את ה-drawer (מכיל `translate-x-full`) ושנה `z-50` ל-`z-[60]`:
```tsx
// לפני:
className={`lg:hidden fixed top-0 right-0 z-50 h-full w-72 ...`}
// אחרי:
className={`lg:hidden fixed top-0 right-0 z-[60] h-full w-72 ...`}
```

---

### 5. PropertyDetails — לוגו Landsman ירושלים
**קובץ**: `client/src/pages/PropertyDetails.tsx`

**א. שנה import:**
```ts
// לפני:
import { TEAM_LOGO, WHATSAPP_LINK } from "@/lib/siteData";
// אחרי:
import { LANDSMAN_LOGO, TEAM_LOGO, WHATSAPP_LINK } from "@/lib/siteData";
```

**ב. מצא את header הנכס** (מכיל `<img src={headerLogoUrl}`) והוסף אחריו:
```tsx
<img src={headerLogoUrl} alt="Team Shay" className="h-16 w-auto object-contain" />
{/* הוסף: */}
<div className="w-px h-10 bg-slate-200 shrink-0" />
<img src={LANDSMAN_LOGO} alt="Landsman Jerusalem" className="h-10 w-auto object-contain opacity-80" />
```

---

## בדיקה לפני Deploy

```bash
cd "/Users/shaulcohen/Desktop/hebrew-realestate-leads 2"
npx tsc --noEmit 2>&1 | grep -v "CrmImport"
```
חייב לחזור ריק (ללא שגיאות). השגיאה ב-CrmImport.tsx היא ישנה ולא שלנו — מתעלמים.

---

## Deploy

```bash
cd "/Users/shaulcohen/Desktop/hebrew-realestate-leads 2"
rm -f .git/index.lock
git add -A
git commit -m "AdminPanel שחור + login → agent-dashboard + לוגואים גדולים + Landsman בנכסים + mobile z-index"
git push origin main
```

---

## בדיקה אחרי Deploy
1. https://teamshay-jerusalem-homes.co.il/agent-login — אחרי כניסה → מגיע ל-/agent-dashboard
2. https://teamshay-jerusalem-homes.co.il/admin — sidebar שחור בלבד, ללא sidebar לבן
3. https://teamshay-jerusalem-homes.co.il/properties/1 — שני לוגואים בheader
4. מובייל (רוחב < 1024px) — לחיצה על hamburger פותחת drawer
