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
git commit -m "<תאר בקצרה מה השתנה>"
git push
```

## הפרויקט
- **אתר**: https://teamshay-jerusalem-homes.co.il
- **GitHub**: https://github.com/sykhn80-tech/team-shay-website
- **Vercel**: פרוס אוטומטית אחרי push ל-main
- **Stack**: React + TypeScript + tRPC + Vercel Blob

## מה עכשיו צריך לעשות
Cowork כבר כתב את השינויים הבאים — הרץ deploy:

### שינויים ממתינים:
- `client/src/components/AgentLayout.tsx` — sidebar שחור עם זהב חזק, mobile drawer
- `client/src/pages/AdminPanel.tsx` — תיקון "חזרה אחורה" → navigate לCRM, קישור CRM בסיידבר
- `server/db.ts` — הרחבת CrmLeadData עם 15 שדות חדשים (תקציב, סוג ליד, שלב תהליך, פגישה, נכס)
- `server/routers.ts` — עדכון zod schemas ל-crm.create ו-crm.update עם כל השדות החדשים
- `client/src/pages/CrmPage.tsx` — ממשק CRM מלא: טבלה עם עמודות חדשות, פאנל צד לפרטים, מודל עריכה עם 4 סקציות (בסיסי/תקציב/נכס/פגישה), סינון לפי סוג ליד

### לאחר deploy:
1. בדוק `/agent-dashboard/crm` — טבלה עם עמודות סוג/שלב/תקציב, לחיצה על שורה פותחת פאנל פרטים מלא
2. בדוק הוספת ליד חדש — מודל עם 4 קטגוריות מתקפלות
3. בדוק `/admin` — לחצן "חזרה אחורה" מנווט לCRM

## כללי עבודה
- Cowork כותב קוד ← Claude Code מריץ git
- לא צריך לאשר כל פקודה — אם Cowork אמר לפרוס, פרוס
- אחרי כל deploy דווח לשי: "✅ פורס — כנס ל [url]"
