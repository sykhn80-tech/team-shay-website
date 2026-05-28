# משימה: תפריט מובייל + לוגואים — Team Shay

## הפרויקט
- **תיקייה**: `/Users/shaulcohen/Desktop/hebrew-realestate-leads 2`
- **Stack**: React + TypeScript + Tailwind CSS
- **Deploy אחרי הכל**: `cd "/Users/shaulcohen/Desktop/hebrew-realestate-leads 2" && rm -f .git/index.lock && git add -A && git commit -m "תפריט מובייל ברור + לוגואים גדולים" && git push origin main`

---

## קובץ 1: `client/src/pages/Home.tsx`

### בעיה
בדף הבית, כשפותחים תפריט מובייל, פריטי הניווט לא נראים מספיק ברור.  
כרגע: טקסט זהב בהיר `#b98b2f` על רקע שמנת `#fffaf0` — ניגודיות נמוכה מדי.

### מה לשנות

**א. הגדל את לוגו Team Shay בסרגל העליון**

מצא (שורה ~540):
```tsx
className="h-14 w-auto md:h-16"
```
שנה ל:
```tsx
className="h-16 w-auto md:h-20"
```

---

**ב. עצב מחדש את פריטי הניווט במובייל — ניגודיות גבוהה וברורה**

מצא את ה-`itemStyle` בתוך ה-drawer (שורות ~581-594) והחלף את **כל הבלוק** של `itemStyle`, `hoverIn`, `hoverOut` ואת ה-`nav` כולה:

**קוד חדש** — החלף מ-`<p style={{ color: "#b98b2f"...` עד סגירת `</nav>` ב:

```tsx
<p style={{ color: "#d9ae4c", fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>
  ניווט מהיר
</p>
<nav style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
  {navItems.map((item) => {
    const baseStyle: React.CSSProperties = {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 20px",
      borderRadius: "16px",
      background: "#ffffff",
      color: "#0d0d0d",
      fontWeight: 800,
      fontSize: "1.05rem",
      border: "2px solid #f0e8d0",
      textDecoration: "none",
      cursor: "pointer",
      transition: "background 0.15s, border-color 0.15s",
    };

    const handleEnter = (e: React.MouseEvent<HTMLElement>) => {
      (e.currentTarget as HTMLElement).style.background = "#fff8e6";
      (e.currentTarget as HTMLElement).style.borderColor = "#d9ae4c";
    };
    const handleLeave = (e: React.MouseEvent<HTMLElement>) => {
      (e.currentTarget as HTMLElement).style.background = "#ffffff";
      (e.currentTarget as HTMLElement).style.borderColor = "#f0e8d0";
    };

    const inner = (
      <>
        <span>{item.label}</span>
        <ChevronLeft style={{ width: "18px", height: "18px", color: "#d9ae4c", flexShrink: 0 }} />
      </>
    );

    return item.isRoute ? (
      <Link
        key={item.label}
        href={item.href}
        onClick={() => setMobileMenuOpen(false)}
        style={baseStyle}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {inner}
      </Link>
    ) : (
      <a
        key={item.label}
        href={item.href}
        onClick={() => setMobileMenuOpen(false)}
        style={baseStyle}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {inner}
      </a>
    );
  })}
</nav>
```

---

**ג. הגדל את header ה-drawer** (הלוגו בתוך התפריט)

מצא (שורה ~562):
```tsx
className="h-10 w-auto brightness-200"
```
שנה ל:
```tsx
className="h-14 w-auto brightness-200"
```

---

**ד. הרחב את ה-drawer** — כך שיהיה יותר נוח לקריאה

מצא (שורה ~556):
```
w-72
```
שנה ל:
```
w-80
```

---

**ה. הסר את ה-wrapper של rounded+gradient** שמסביב ל-nav בתוך ה-drawer

מצא וגם הסר:
```tsx
<div
  className="rounded-[28px] px-4 py-4"
  style={{
    background: "linear-gradient(180deg, #ffffff 0%, #fff8e6 100%)",
    border: "1px solid rgba(217,174,76,0.18)",
    boxShadow: "0 18px 42px rgba(15,23,42,0.08)",
  }}
>
  ...
</div>
```
וגם את ה-`<div className="flex-1 bg-white px-4 py-5">` הסבב — החלף את שתיהן ב:
```tsx
<div style={{ flex: 1, background: "#fafafa", padding: "20px 16px", overflowY: "auto" }}>
  {/* nav כאן ישירות — ללא wrapper פנימי עם shadow/gradient */}
  [תוכן ה-nav מסעיף ב']
</div>
```

---

## קובץ 2: `client/src/pages/PropertyDetails.tsx`

### בעיה
לוגו Landsman Jerusalem קטן מדי לצד Team Shay.

### מה לשנות

**א. הגדל את שני הלוגואים בheader הנכס**

מצא (שורות ~146-148):
```tsx
<img src={headerLogoUrl} alt="Team Shay" className="h-20 w-auto object-contain md:h-24" />
<div className="w-px h-10 bg-slate-200 shrink-0" />
<img src={LANDSMAN_LOGO} alt="Landsman Jerusalem" className="h-12 w-auto object-contain opacity-80 md:h-14" />
```

שנה ל:
```tsx
<img src={headerLogoUrl} alt="Team Shay" className="h-20 w-auto object-contain md:h-28" />
<div className="w-px h-14 bg-slate-200 shrink-0 mx-1" />
<img src={LANDSMAN_LOGO} alt="Landsman Jerusalem" className="h-16 w-auto object-contain md:h-20" />
```

---

## בדיקה לפני Deploy

```bash
cd "/Users/shaulcohen/Desktop/hebrew-realestate-leads 2"
npx tsc --noEmit 2>&1 | grep -v "CrmImport"
```
חייב לחזור ריק.

---

## Deploy

```bash
cd "/Users/shaulcohen/Desktop/hebrew-realestate-leads 2"
rm -f .git/index.lock
git add -A
git commit -m "תפריט מובייל ברור + לוגואים גדולים"
git push origin main
```

---

## בדיקה אחרי Deploy
1. פתח https://teamshay-jerusalem-homes.co.il במובייל (או dev tools → mobile view)
2. לחץ על 3 הקווים → drawer נפתח מימין
3. צריך לראות: header שחור עם לוגו גדול + 5 פריטי ניווט לבנים עם טקסט כהה ברור + כפתור WhatsApp זהב
4. פתח /properties/1 → שני לוגואים גדולים ובולטים
