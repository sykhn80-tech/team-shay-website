# משימה לביצוע עכשיו — Claude Code

אתה Claude Code. תפקידך לבצע deploy של האתר. אין צורך לשאול שאלות — פשוט הרץ.

## פקודה לביצוע:

```bash
cd ~/Desktop/hebrew-realestate-leads\ 2
rm -f .git/index.lock
git add -A
git status
git commit -m "AdminPanel שחור + login → agent-dashboard + לוגואים גדולים + Landsman בנכסים + mobile z-index"
git push origin main
```

## מה שונה בעדכון הזה:
1. `AgentLogin.tsx` — אחרי התחברות → /agent-dashboard (לא /admin)
2. `AdminPanel.tsx` — עטוף ב-AgentLayout, sidebar לבן הוסר
3. `AgentLayout.tsx` — לוגו h-20, drawer z-[60]
4. `PropertyDetails.tsx` — לוגו Landsman ירושלים ליד Team Shay
5. `Home.tsx` — drawer z-[60]

## לאחר הרצה:
דווח: ✅ פורס — כנס ל https://teamshay-jerusalem-homes.co.il
