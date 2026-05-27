# Team Shay Website — Claude Code Instructions

## תפקיד
Claude Code מבצע deployment. Cowork כותב את הקוד.
כשCowork מסיים שינויים, Claude Code מריץ deploy.

## פקודת deploy סטנדרטית
כשCowork אומר "תפרוס" או "deploy" — הרץ:
```bash
rm -f .git/index.lock
git add -A
git status
git commit -m "תיקון ניווט אדמין + תפריט מובייל לבן + CRM מלא"
git push
```

## הפרויקט
- **אתר**: https://teamshay-jerusalem-homes.co.il
- **GitHub**: https://github.com/sykhn80-tech/team-shay-website
- **Vercel**: פרוס אוטומטית אחרי push ל-main
- **Stack**: React + TypeScript + tRPC + Vercel Blob

## מה עכשיו צריך לעשות
Cowork כבר כתב את השינויים הבאים — הרץ deploy **עכשיו**:

### שינויים ממתינים (כל הקבצים האלה שונו):
1. `client/src/pages/AgentDashboard.tsx` — הסרת redirect אוטומטי של אדמין לCRM (עכשיו אדמין יכול לנווט חופשי)
2. `client/src/components/AgentLayout.tsx` — sidebar שחור עם זהב חזק
3. `client/src/pages/AdminPanel.tsx` — "חזרה אחורה" מנווט ל-/agent-dashboard/crm
4. `server/db.ts` — הרחבת CrmLeadData עם 15 שדות חדשים
5. `server/routers.ts` — עדכון zod schemas
6. `client/src/pages/CrmPage.tsx` — CRM מלא עם פאנל פרטים ומודל 4 קטגוריות
7. `client/src/pages/Home.tsx` — תפריט מובייל: רקע לבן, טקסט כהה #1a1a1a, hover זהב (style inline)

### לאחר deploy — בדוק:
1. `/agent-dashboard` — אדמין רואה דשבורד, יכול ללחוץ CRM מהסיידבר
2. `/agent-dashboard/crm` — ניווט חופשי בין עמודים
3. `/admin` — "חזרה אחורה" → CRM
4. דף הבית במובייל — תפריט פתוח, טקסט כהה נראה על רקע לבן

## כללי עבודה
- Cowork כותב קוד ← Claude Code מריץ git
- לא צריך לאשר כל פקודה — אם Cowork אמר לפרוס, פרוס
- אחרי כל deploy דווח לשי: "✅ פורס — כנס ל [url]"
