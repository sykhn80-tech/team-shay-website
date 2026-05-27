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
- `server/db.ts` — פונקציית `deduplicateCrmLeads`
- `server/routers.ts` — endpoint חדש `crm.deduplicate`
- `client/src/pages/CrmImport.tsx` — כפתור "מחק כפילויות"

### לאחר deploy:
1. כנס לאתר → התחבר כשי (admin)
2. עבור ל `/crm-import`
3. לחץ "מחק כפילויות"

## כללי עבודה
- Cowork כותב קוד ← Claude Code מריץ git
- לא צריך לאשר כל פקודה — אם Cowork אמר לפרוס, פרוס
- אחרי כל deploy דווח לשי: "✅ פורס — כנס ל [url]"
