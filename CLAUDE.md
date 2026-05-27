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
git commit -m "CRM מלא + תיקון ניווט + תפריט מובייל לבן"
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
1. `client/src/components/AgentLayout.tsx` — sidebar שחור (`#0d0d0d`) עם זהב חזק, mobile drawer
2. `client/src/pages/AdminPanel.tsx` — לחצן "חזרה אחורה" מנווט ל-`/agent-dashboard/crm` + CRM בסיידבר
3. `server/db.ts` — הרחבת CrmLeadData עם 15 שדות חדשים
4. `server/routers.ts` — עדכון zod schemas לכל השדות החדשים
5. `client/src/pages/CrmPage.tsx` — CRM מלא: טבלה, פאנל פרטים, מודל 4 קטגוריות
6. `client/src/pages/Home.tsx` — תפריט מובייל: רקע **לבן** + טקסט כהה + hover זהב

### לאחר deploy — בדוק:
1. `/agent-dashboard/crm` — טבלה עם עמודות סוג/שלב/תקציב, לחיצה על שורה פותחת פאנל
2. `/admin` — לחצן "חזרה אחורה" מנווט ל-CRM
3. דף הבית במובייל — תפריט לבן עם hover זהב

## כללי עבודה
- Cowork כותב קוד ← Claude Code מריץ git
- לא צריך לאשר כל פקודה — אם Cowork אמר לפרוס, פרוס
- אחרי כל deploy דווח לשי: "✅ פורס — כנס ל [url]"
