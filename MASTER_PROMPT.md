# 🏠 Team Shay Website — Master Prompt (סיכום מלא)

## הפרויקט
- **אתר**: https://teamshay-jerusalem-homes.co.il
- **GitHub**: https://github.com/sykhn80-tech/team-shay-website
- **Vercel**: פריסה אוטומטית אחרי push ל-main
- **Stack**: React + TypeScript + tRPC + Vercel Blob + Express
- **תיקייה מקומית**: `~/Desktop/hebrew-realestate-leads 2`

---

## אדריכלות המערכת

### Auth
- Cookie: `team_shay_agent_session` = מזהה סוכן (מספר)
- `agentProcedure` = כל סוכן מחובר
- `adminProcedure` = רק `accountRole === "admin"`
- סוכנים: שי=1 (admin), רונן=2, אביעד=3, ירדן=4, אליה=5

### ניתוב (Routes)
- `/` → דף הבית ציבורי (Home.tsx)
- `/properties/:id` → פרטי נכס (PropertyDetails.tsx)
- `/agent-login` → דף כניסה לסוכנים
- `/agent-dashboard` → לוח בקרה ראשי (AgentDashboard.tsx + AgentLayout)
- `/agent-dashboard/crm` → CRM לידים (CrmPage.tsx)
- `/agent-dashboard/marketing` → שיווק נכסים
- `/agent-dashboard/cma` → הערכת שווי
- `/admin` → פאנל ניהול (AdminPanel.tsx) — גלוי רק לאדמין

### אחסון נתונים
- CRM לידים: Vercel Blob בנתיב `crm/team-shay/leads.json`
- תמונות: Vercel Blob
- נתוני אתר: Vercel Blob

---

## קבצים מרכזיים ומה בהם

### `client/src/components/AgentLayout.tsx`
הסיידבר השחור-זהב המרכזי — עוטף את כל דפי אזור הסוכנים.
- `WHITE_LOGO` = לוגו לבן של Team Shay (h-20 בסיידבר, h-14 במובייל)
- `NAV_ITEMS` = 3 פריטים: לוח בקרה, שיווק נכסים, הערכת שווי CMA
- CRM כפתור זהב נפרד מעל הניווט
- Drawer מובייל: `z-[60]` (חשוב! ראה תקלות)
- Overlay מובייל: `z-50`
- Desktop sidebar: `w-[265px]`, `bg-[#0d0d0d]`

### `client/src/pages/AgentLogin.tsx`
- אחרי התחברות → redirect ל-`/agent-dashboard` (לא `/admin`)
- תמיכה ב-`?next=` param לניווט חזרה

### `client/src/pages/AdminPanel.tsx`
- **עטוף ב-AgentLayout** — sidebar שחור, ללא sidebar לבן משלו
- מכיל: ניהול נכסים, סוכנים, המלצות, הגדרות אתר
- גישה: adminProcedure בלבד
- **אין** sidebar פנימי — הוסר לחלוטין

### `client/src/pages/CrmPage.tsx`
CRM מלא בסגנון Base44:
- טבלה עם 9 עמודות: שם+פרטים, טלפון, סוג/שלב, תקציב, סטטוס, מקור, תאריך, סוכן, פעולות
- פאנל צד (`LeadPanel`) נפתח מימין — צבע header שחור `#0d0d0d`
- מודל עריכה (`LeadModal`) עם 4 קטגוריות מתקפלות
- Export CSV
- פילטר לפי מקור
- תצוגת מובייל בכרטיסים
- ממשק מלא מרמת Admin: מציג לידים של כל הצוות

### `server/db.ts` — CrmLeadData
```typescript
type CrmLeadData = {
  id, agentId, name, phone, email, neighborhood, notes, tags, leadStatus, source, createdAt, updatedAt,
  // 15 שדות חדשים (כולם optional):
  secondaryPhone?, leadType?, budgetMin?, budgetMax?, desiredBudget?,
  processStage?, lastContact?, meetingDate?, meetingTime?, meetingNotes?,
  meetingLocation?, propertyNeighborhood?, propertyStreet?, propertyRooms?,
  propertyType?, currentPropertyPrice?
}
```

### `client/src/pages/Home.tsx` — תפריט מובייל
```tsx
{/* Overlay */}
<div className="lg:hidden fixed inset-0 z-50" style={{ background: "rgba(255,255,255,0.55)" }} />
{/* Drawer */}
<div className={`lg:hidden fixed top-0 right-0 z-[60] ...`}>
  {/* BLACK header */}
  <div style={{ backgroundColor: "#0d0d0d" }}>
    <img ... />
    <button (close) style={{ color: "#d9ae4c" }} />
  </div>
  {/* WHITE nav — inline styles חובה */}
  <nav>
    {navItems.map(item => (
      <Link style={{ color: "#1a1a1a", fontWeight: 800 }}>...</Link>
    ))}
  </nav>
</div>
```

### `client/src/pages/PropertyDetails.tsx`
```tsx
import { LANDSMAN_LOGO, TEAM_LOGO } from "@/lib/siteData";
// בheader של הנכס:
<img src={headerLogoUrl} alt="Team Shay" className="h-16" />
<div className="w-px h-10 bg-slate-200" />  {/* מפריד */}
<img src={LANDSMAN_LOGO} alt="Landsman Jerusalem" className="h-10 opacity-80" />
```

### `client/src/lib/siteData.ts`
```typescript
export const TEAM_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/.../teamshay-header-logo_e291cb40.png";
export const LANDSMAN_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/.../jerusalem_8ba016e6.png";
// לוגו לבן (לsidebar):
const WHITE_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/.../teamshay-logo-new_6990c286.png";
```

---

## תקלות שתוקנו — ולמה קרו

### 🔴 תקלה 1: AdminPanel גרם לקריסת Claude Code (TypeScript error)
**מה קרה**: עטפתי את AdminPanel ב-AgentLayout אבל שכחתי שבמקור היו 3 רמות של `<div>` מקוננים. הסרתי את פתיחת 2 הרמות אבל נשארו 3 סגירות `</div>` — אחת עודפת.

**שגיאה**:
```
AdminPanel.tsx(1088): error TS17002: Expected corresponding JSX closing tag for 'AgentLayout'
```

**תיקון**: הסרת `</div>` עודף אחד בסוף הקובץ (מהמבנה הישן של `min-h-screen` wrapper).

**לקח**: כשמשנים מבנה JSX מקונן — לספור פתיחות וסגירות בדיוק. פקודת בדיקה:
```bash
npx tsc --noEmit 2>&1 | head -20
```

---

### 🔴 תקלה 2: אדמין נתקע על CRM (לולאת redirect)
**מה קרה**: ב-AgentDashboard.tsx היה קוד שעשה redirect אוטומטי לאדמין ל-`/agent-dashboard/crm`. כל פריט ניווט ב-sidebar שלחץ על `/agent-dashboard` גרם לריענון שחזר לCRM.

**תיקון**: הסרת הבלוק:
```tsx
// הוסר:
if (!isAgentLoading && agent?.accountRole === "admin") {
  navigate("/agent-dashboard/crm");
  return null;
}
```

---

### 🔴 תקלה 3: תפריט מובייל — טקסט בלתי נראה
**מה קרה**: Tailwind CSS מוחק בbuild ייצור כל class שאינו בשימוש קבוע בקוד. `text-slate-800` שהוספנו לתפריט המובייל נמחק בbuild.

**תיקון**: **חובה** להשתמש ב-inline styles לצבעי טקסט חדשים בHome.tsx:
```tsx
style={{ color: "#1a1a1a", fontWeight: 800 }}
```
**לעולם לא להשתמש ב-className לצבעים חדשים** שלא מופיעים במקומות אחרים בקוד.

---

### 🔴 תקלה 4: Drawer מובייל מוסתר מאחורי Overlay (z-index)
**מה קרה**: Overlay וDrawer שניהם היו עם `z-50`. ה-overlay הסתיר את ה-drawer.

**תיקון**:
```tsx
// Overlay
<div className="fixed inset-0 z-50" />

// Drawer — חייב z-[60] !!!
<div className="fixed top-0 right-0 z-[60]" />
```
חל גם על `AgentLayout.tsx` וגם על `Home.tsx`.

---

### 🔴 תקלה 5: AdminPanel.tsx — import של icons לא בשימוש
**מה קרה**: אחרי הסרת ה-sidebar הלבן מ-AdminPanel, נשארו imports של:
`BarChart2, LayoutDashboard, Megaphone, UserCircle2` — שהיו רק בsidebarItems שהוסרו.

**תיקון**: הסרת ה-imports המיותרים. TypeScript יודיע על unused imports אבל לא יכשל build בהכרח — עדיף לנקות.

---

### 🔴 תקלה 6: Login redirect לכתובת לא נכונה
**מה קרה**: AgentLogin.tsx עשה redirect ל-`/admin` אחרי התחברות. המשתמש נחת על AdminPanel (white sidebar) ולא על agent-dashboard (black sidebar).

**תיקון** ב-AgentLogin.tsx:
```tsx
// לפני:
return next && next.startsWith("/") ? next : "/admin";
// אחרי:
return next && next.startsWith("/") ? next : "/agent-dashboard";
```

---

## כלל זהב לפריסה

תמיד לפני deploy:
```bash
npx tsc --noEmit 2>&1 | grep -v "CrmImport"
```
(מתעלמים מהשגיאה הקיימת ב-CrmImport.tsx שאינה שלנו)

אם יש שגיאות — לתקן לפני push.

---

## זרימת עבודה

```
Cowork (כותב קוד) → עדכון CLAUDE.md → Claude Code (מריץ deploy)
```

Claude Code מריץ:
```bash
rm -f .git/index.lock
git add -A
git commit -m "[תיאור קצר]"
git push
```
Vercel מפרסם אוטומטית תוך ~1 דקה.

---

## לוגואים — URLs

| לוגו | URL |
|------|-----|
| Team Shay צבעוני | `https://d2xsxph8kpxj0f.cloudfront.net/.../teamshay-header-logo_e291cb40.png` |
| Team Shay לבן | `https://d2xsxph8kpxj0f.cloudfront.net/.../teamshay-logo-new_6990c286.png` |
| Landsman ירושלים | `https://d2xsxph8kpxj0f.cloudfront.net/.../jerusalem_8ba016e6.png` |

---

## צבעי המותג

| שימוש | ערך |
|-------|-----|
| זהב ראשי | `#d9ae4c` |
| זהב כהה | `#b98b2f` |
| שחור sidebar | `#0d0d0d` |
| רקע אתר ציבורי | `#fff8e6` / `#fffdf7` |
| רקע אדמין | `#f5f3ee` |
