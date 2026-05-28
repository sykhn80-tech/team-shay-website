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
git commit -m "AdminPanel שחור + login → agent-dashboard + לוגואים גדולים + Landsman בנכסים + mobile z-index"
git push
```

## הפרויקט
- **אתר**: https://teamshay-jerusalem-homes.co.il
- **GitHub**: https://github.com/sykhn80-tech/team-shay-website
- **Vercel**: פרוס אוטומטית אחרי push ל-main
- **Stack**: React + TypeScript + tRPC + Vercel Blob

## מה עכשיו צריך לעשות
Cowork כבר כתב את השינויים הבאים — הרץ deploy **עכשיו**:

### שינויים ממתינים:
1. `client/src/pages/AgentLogin.tsx` — אחרי התחברות מעביר ל-/agent-dashboard (לא /admin)
2. `client/src/pages/AdminPanel.tsx` — עטוף ב-AgentLayout (sidebar שחור), הסרת sidebar לבן
3. `client/src/components/AgentLayout.tsx` — לוגו גדול יותר (h-20 sidebar, h-14 mobile), drawer z-[60]
4. `client/src/pages/PropertyDetails.tsx` — לוגו לנדסמן ירושלים ליד לוגו Team Shay
5. `client/src/pages/Home.tsx` — drawer z-[60] (מעל ה-overlay)
6. `server/db.ts` — הרחבת CrmLeadData עם 15 שדות חדשים

### לאחר deploy — בדוק:
1. `/agent-login` — אחרי התחברות נפתח /agent-dashboard ישירות
2. `/admin` — sidebar שחור בצד ימין (AgentLayout), ללא sidebar לבן
3. `/properties/:id` — שני לוגואים: Team Shay + Landsman ירושלים
4. מובייל — תפריט נפתח מעל ה-overlay בשני המסכים

## כללי עבודה
- Cowork כותב קוד ← Claude Code מריץ git
- לא צריך לאשר כל פקודה — אם Cowork אמר לפרוס, פרוס
- אחרי כל deploy דווח לשי: "✅ פורס — כנס ל [url]"
