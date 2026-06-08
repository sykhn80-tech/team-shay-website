# מאסטר פרומט — CRM מלא + אוטומציות | Team Shay

## הקשר
- **פרויקט**: אתר נדל"ן ירושלים לצוות Team Shay
- **תיקייה**: `/Users/shaulcohen/Desktop/hebrew-realestate-leads 2`
- **Stack**: React + TypeScript + tRPC + Vercel Blob + Vercel (deploy)
- **אוטומציות קיימות**: Make (מייק) — שני סנריו בנויים (שבת שלום + בלעדיות שבועית) — עובדים חלקית
- **WhatsApp API**: Green API — חשבון פעיל עם instance ID + token
- **לידים**: קיימים ב-Vercel Blob + מסונכרנים ל-Airtable
- **Authentication**: Cookie `team_shay_agent_session` = agent ID, adminProcedure לאדמין בלבד

---

## ארכיטקטורת ה-CRM

### ניתוב (Routing)
הוסף לתוך `client/src/App.tsx` מתחת לנתיבי ה-CRM הקיימים:
```
/agent-dashboard/crm              → CRM לידים (קיים)
/agent-dashboard/crm/dashboard    → דשבורד  
/agent-dashboard/crm/matches      → התאמות
/agent-dashboard/crm/followup     → פולואפ
/agent-dashboard/crm/tasks        → משימות
/agent-dashboard/crm/marketing    → פעולות שיווק
/agent-dashboard/crm/finance      → הכנסות/הוצאות
/agent-dashboard/crm/templates    → תבניות הודעות
/agent-dashboard/crm/documents    → מסמכים
```

### Layout חדש: CrmLayout
צור `client/src/components/CrmLayout.tsx` — עוטף את כל דפי ה-CRM.
ה-CrmLayout עצמו עטוף ב-AgentLayout (sidebar שחור ראשי).

**sidebar ה-CRM** (פנימי, מצד שמאל של התוכן):
```
דשבורד       → /agent-dashboard/crm/dashboard
לידים        → /agent-dashboard/crm  
התאמות       → /agent-dashboard/crm/matches
פולואפ       → /agent-dashboard/crm/followup
משימות       → /agent-dashboard/crm/tasks
פעולות שיווק → /agent-dashboard/crm/marketing
הכנסות/הוצ׳  → /agent-dashboard/crm/finance
תבניות       → /agent-dashboard/crm/templates
מסמכים       → /agent-dashboard/crm/documents
```
עיצוב: sidebar צר (`w-52`), רקע `#f8f6f1`, border ימין `border-r border-slate-200`.
פריט פעיל: `bg-[#fff4d8] text-[#b98b2f] font-black`.
במובייל: collapse לתפריט dropdown בראש הדף.

---

## מודלי נתונים — `server/db.ts`

הוסף את הטיפוסים הבאים לקובץ:

```typescript
// פולואפ
export type FollowUp = {
  id: number;
  agentId: number;
  leadId: number;
  scheduledDate: string;       // ISO date string
  type: "call" | "whatsapp" | "email" | "meeting";
  note: string | null;
  status: "pending" | "done" | "cancelled";
  createdAt: string;
  updatedAt: string;
};

// משימה
export type Task = {
  id: number;
  agentId: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "done";
  leadId: number | null;
  propertyId: number | null;
  createdAt: string;
  updatedAt: string;
};

// התאמה — נכס ↔ ליד
export type PropertyMatch = {
  id: number;
  agentId: number;
  leadId: number;
  propertyId: number;
  note: string | null;
  status: "pending" | "sent" | "interested" | "rejected";
  sentAt: string | null;
  createdAt: string;
};

// פעולת שיווק — לנכס בלעדי
export type MarketingAction = {
  id: number;
  agentId: number;
  propertyId: number;
  weekNumber: number;          // מספר שבוע ISO (1-52)
  year: number;
  templateId: number | null;
  customMessage: string | null;
  targetAudience: "all" | "buyers" | "sellers" | "investors";
  sentAt: string | null;
  recipientCount: number;
  status: "draft" | "scheduled" | "sent";
  createdAt: string;
};

// תבנית הודעה
export type MessageTemplate = {
  id: number;
  name: string;
  type: "shabbat" | "exclusivity" | "followup" | "general";
  content: string;             // טקסט עם placeholders: {name}, {address}, {price}
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// הכנסה/הוצאה
export type FinanceEntry = {
  id: number;
  agentId: number;
  type: "income" | "expense";
  category: string;            // "עמלה" | "פרסום" | "נסיעות" | "משרד" | "אחר"
  amount: number;
  date: string;
  description: string | null;
  propertyId: number | null;
  leadId: number | null;
  createdAt: string;
};

// מסמך
export type Document = {
  id: number;
  agentId: number;
  name: string;
  type: "contract" | "appraisal" | "id" | "power_of_attorney" | "other";
  url: string;                 // Vercel Blob URL
  leadId: number | null;
  propertyId: number | null;
  notes: string | null;
  uploadedAt: string;
};
```

### פונקציות Blob לכל מודול

בדומה לפונקציות הקיימות של לידים, הוסף ל-`server/db.ts`:

```typescript
// נתיבי Blob
const FOLLOWUPS_KEY = "crm/team-shay/followups.json";
const TASKS_KEY = "crm/team-shay/tasks.json";
const MATCHES_KEY = "crm/team-shay/matches.json";
const MARKETING_KEY = "crm/team-shay/marketing.json";
const TEMPLATES_KEY = "crm/team-shay/templates.json";
const FINANCE_KEY = "crm/team-shay/finance.json";
const DOCUMENTS_KEY = "crm/team-shay/documents.json";

// לכל אחד: getAll, save, getById, deleteById
// אותו pattern בדיוק כמו לידים — קרא את הפונקציות הקיימות והעתק את הדפוס
```

---

## tRPC Routers — `server/routers.ts`

הוסף router חדש `crm2` (כדי לא לשבור את `crm` הקיים) עם procedures:

```typescript
crm2: router({
  // Follow-ups
  followups: {
    list: agentProcedure...    // כל הפולואפים של הסוכן, ממוין לפי תאריך
    create: agentProcedure...
    update: agentProcedure...
    delete: agentProcedure...
  },
  // Tasks
  tasks: {
    list: agentProcedure...
    create: agentProcedure...
    update: agentProcedure...
    delete: agentProcedure...
  },
  // Matches
  matches: {
    list: agentProcedure...
    create: agentProcedure...
    updateStatus: agentProcedure...
    // sendViaWhatsApp: agentProcedure — קורא ל-Green API
  },
  // Marketing
  marketing: {
    list: agentProcedure...
    create: agentProcedure...
    update: agentProcedure...
    // getWeeklyData: publicProcedure — Make יקרא לזה
  },
  // Templates
  templates: {
    list: agentProcedure...
    create: agentProcedure...
    update: agentProcedure...
    delete: agentProcedure...
    // getActive: publicProcedure — Make יקרא לזה לשבת שלום ובלעדיות
  },
  // Finance
  finance: {
    list: agentProcedure...
    create: agentProcedure...
    update: agentProcedure...
    delete: agentProcedure...
    summary: agentProcedure...  // סיכום לפי חודש/שנה
  },
  // Documents
  documents: {
    list: agentProcedure...
    upload: agentProcedure...   // מקבל base64, שומר ב-Vercel Blob
    delete: agentProcedure...
  },
})
```

---

## Webhook endpoints לMake — `server/index.ts`

הוסף 3 endpoints שMake יוכל לקרוא ולכתוב:

```typescript
// 1. Make מושך נתוני שיווק שבועיים
app.get("/api/webhooks/weekly-marketing", async (req, res) => {
  // מחזיר: { properties: [...], template: {...} }
  // Make ישלח זאת ללקוחות דרך Green API
});

// 2. Make מושך תבנית שבת שלום
app.get("/api/webhooks/shabbat-template", async (req, res) => {
  // מחזיר: { content: "...", imageUrl: "..." }
});

// 3. Make מדווח שהודעה נשלחה (לעדכון סטטוס)
app.post("/api/webhooks/mark-sent", async (req, res) => {
  // body: { marketingActionId, recipientCount }
  // מעדכן status → "sent" ב-Blob
});
```
**אבטחה**: הוסף header validation — `x-webhook-secret: process.env.WEBHOOK_SECRET`

---

## דפי CRM — קבצים ליצירה

### 1. `/agent-dashboard/crm/dashboard` — `CrmDashboard.tsx`

**תצוגה**: 4 קארדים עליונים + timeline + tasks היום

```
┌──────────┬──────────┬──────────┬──────────┐
│ לידים    │ משימות   │ פולואפים │ הכנסות   │
│ פעילים   │ פתוחות   │ השבוע    │ החודש    │
│   47     │    8     │    5     │ ₪45,000  │
└──────────┴──────────┴──────────┴──────────┘

📅 פולואפים להיום (רשימה)
✅ משימות דחופות (רשימה)
📊 גרף הכנסות חודשי (Chart.js בר)
```

### 2. `/agent-dashboard/crm` — `CrmPage.tsx` (קיים — השאר, רק הוסף tabs)

CRM לידים הקיים — לא שוברים אותו.

### 3. `/agent-dashboard/crm/matches` — `CrmMatches.tsx`

**פונקציה**: הסוכן בוחר ליד → רואה נכסים מתאימים → שולח ללקוח.

```
┌─ בחר ליד ──────────────────────────────────┐
│ [dropdown — שם + תקציב]                     │
└────────────────────────────────────────────┘

┌─ נכסים מתאימים לתקציב ────────────────────┐
│ [כרטיס נכס] [כרטיס נכס] [כרטיס נכס]       │
│ ✓ סמן → שלח ב-WhatsApp                    │
└────────────────────────────────────────────┘
```

כפתור "שלח ב-WhatsApp" קורא לGreen API:
```
POST https://api.green-api.com/waInstance{instanceId}/sendMessage/{token}
body: { chatId: "${lead.phone}@c.us", message: "..." }
```

### 4. `/agent-dashboard/crm/followup` — `CrmFollowup.tsx`

**תצוגה**: לוח שבועי + רשימה לפי תאריך

```
┌─ השבוע ────────────────────────────────────┐
│ ראשון  שני  שלישי  רביעי  חמישי  שישי      │
│ [2]    [1]   [0]    [3]    [1]    [2]       │
└────────────────────────────────────────────┘

┌─ פולואפים ממתינים ─────────────────────────┐
│ ● שי כהן  📞 שיחה  מחר 10:00  [בוצע] [ערוך]│
│ ● דן לוי  💬 WA    יום ד      [בוצע] [ערוך] │
└────────────────────────────────────────────┘

[+ פולואפ חדש]
```

### 5. `/agent-dashboard/crm/tasks` — `CrmTasks.tsx`

**תצוגה**: Kanban עמודות פשוט

```
┌─ פתוח ─────┐  ┌─ בביצוע ───┐  ┌─ הושלם ────┐
│ [כרטיס]    │  │ [כרטיס]    │  │ [כרטיס]    │
│ [כרטיס]    │  │             │  │ [כרטיס]    │
│ [+ חדש]    │  │             │  │             │
└────────────┘  └────────────┘  └────────────┘
```

### 6. `/agent-dashboard/crm/marketing` — `CrmMarketing.tsx`

**מרכז הנתונים השבועי** — כל נכס בלעדי מקבל רשומה שבועית.

```
┌─ שבוע נוכחי: 23/2025 ──────────────────────┐
│ [בחר נכס בלעדי ▼]                           │
│                                              │
│ קהל יעד:  ○ כולם  ○ קונים  ○ מוכרים         │
│ הודעה:    [textarea — או בחר תבנית]          │
│ תמונה:    [נוספת אוטומטית מהנכס]             │
│                                              │
│ [שמור טיוטה]  [תזמן לשליחה שישי 10:00]      │
└────────────────────────────────────────────┘

┌─ היסטוריית שיווק ──────────────────────────┐
│ שבוע 22 | דירה קטמונים | 47 נמענים | ✅ נשלח│
│ שבוע 21 | בית ארנונה    | 52 נמענים | ✅ נשלח│
└────────────────────────────────────────────┘
```

**זרימה עם Make**:
1. Make מריץ כל שישי 9:00 → GET `/api/webhooks/weekly-marketing`
2. מקבל: נכס בלעדי + הודעה + רשימת לידים רלוונטיים
3. שולח דרך Green API לכל ליד

### 7. `/agent-dashboard/crm/finance` — `CrmFinance.tsx`

```
┌─ סיכום ────────────────────────────────────┐
│ הכנסות החודש: ₪48,000  הוצאות: ₪3,200     │
│ רווח: ₪44,800                              │
└────────────────────────────────────────────┘

┌─ טבלת פעולות ──────────────────────────────┐
│ תאריך   | סוג    | קטגוריה | סכום   | עמלה │
│ 28/05   | הכנסה  | עמלה    | ₪24,000 |     │
│ 27/05   | הוצאה  | פרסום   | ₪800   |     │
└────────────────────────────────────────────┘
[+ הוסף רשומה]  [ייצא Excel]
```

### 8. `/agent-dashboard/crm/templates` — `CrmTemplates.tsx`

**חשוב**: כאן יושבות תבניות שבת שלום + בלעדיות שבועית.

```
┌─ תבניות פעילות ────────────────────────────┐
│                                              │
│ [שבת שלום 🕍]                               │
│ "שבת שלום לכל משפחות ירושלים..."           │
│ תמונה: [thumbnail] [החלף תמונה]             │
│ [ערוך] [פעיל ✓]                             │
│                                              │
│ [בלעדיות שבועית 🏠]                          │
│ "הצגת הנכס הבלעדי הזה שלנו: {address}..."  │
│ placeholders: {name} {address} {price} {url} │
│ [ערוך] [פעיל ✓]                             │
│                                              │
│ [+ תבנית חדשה]                              │
└────────────────────────────────────────────┘
```

**Public endpoint לMake** (ללא auth):
```
GET /api/webhooks/shabbat-template
→ { content: "...", imageUrl: "https://..." }
```

Make מריץ כל שישי 8:00 → מושך → שולח לכל הלידים דרך Green API.

### 9. `/agent-dashboard/crm/documents` — `CrmDocuments.tsx`

```
┌─ מסמכים ───────────────────────────────────┐
│ חיפוש: [_______________]  [+ העלה מסמך]    │
│                                              │
│ 📄 חוזה מכר — שי כהן — 28/05 [הורד][מחק]  │
│ 📄 שמאות — קטמונים 5 — 20/05  [הורד][מחק]  │
└────────────────────────────────────────────┘
```

העלאת מסמך: base64 → PUT Vercel Blob → שמור URL ב-JSON.

---

## Green API — Integration

### הגדרת Environment Variables
הוסף ל-`.env` (ולVercel env vars):
```
GREEN_API_INSTANCE_ID=your_instance_id
GREEN_API_TOKEN=your_token
WEBHOOK_SECRET=random_strong_secret_here
```

### פונקציית שליחה — `server/greenApi.ts` (קובץ חדש)
```typescript
export async function sendWhatsApp(phone: string, message: string, imageUrl?: string) {
  const base = `https://api.green-api.com/waInstance${process.env.GREEN_API_INSTANCE_ID}`;
  const token = process.env.GREEN_API_TOKEN;
  const chatId = phone.replace(/\D/g, "").startsWith("972")
    ? `${phone.replace(/\D/g, "")}@c.us`
    : `972${phone.replace(/^0/, "").replace(/\D/g, "")}@c.us`;

  if (imageUrl) {
    return fetch(`${base}/sendFileByUrl/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, urlFile: imageUrl, fileName: "image.jpg", caption: message }),
    });
  }

  return fetch(`${base}/sendMessage/${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, message }),
  });
}
```

---

## Make (מייק) — תיקון הסנריו הקיים

### סנריו 1: שבת שלום
```
[שעון — כל שישי 8:00]
→ HTTP GET /api/webhooks/shabbat-template  (x-webhook-secret header)
→ [JSON Parser] → content + imageUrl
→ HTTP GET /api/trpc/crm.list (מושך כל הלידים הפעילים)  
→ [Iterator — לכל ליד]
→ HTTP POST Green API /sendFileByUrl  (תמונה + הודעה)
→ [Sleep 2s בין הודעות — חשוב לא לחסום]
```

### סנריו 2: בלעדיות שבועית
```
[שעון — כל שישי 9:00]
→ HTTP GET /api/webhooks/weekly-marketing  (x-webhook-secret header)
→ [JSON Parser] → property + message + leads[]
→ [Iterator — לכל ליד]
→ [Replace variables] → {name} {address} {price}
→ HTTP POST Green API /sendMessage
→ HTTP POST /api/webhooks/mark-sent (מדווח שנשלח)
```

**⚠️ תיקון בעיה נפוצה**: הוסף delay של 2-3 שניות בין כל הודעה ל-Green API אחרת החשבון נחסם.

---

## סדר ביצוע (לקודקס)

1. **`server/db.ts`** — הוסף כל הטיפוסים + פונקציות Blob
2. **`server/greenApi.ts`** — צור קובץ חדש עם פונקציית השליחה
3. **`server/index.ts`** — הוסף 3 webhook endpoints
4. **`server/routers.ts`** — הוסף router `crm2` עם כל ה-procedures
5. **`client/src/components/CrmLayout.tsx`** — sidebar + layout
6. **`client/src/App.tsx`** — הוסף 8 routes חדשים
7. **דפים לפי סדר חשיבות**:
   - `CrmTemplates.tsx` — קריטי לאוטומציה
   - `CrmMarketing.tsx` — קריטי לאוטומציה
   - `CrmFollowup.tsx`
   - `CrmTasks.tsx`
   - `CrmDashboard.tsx`
   - `CrmMatches.tsx`
   - `CrmFinance.tsx`
   - `CrmDocuments.tsx`

---

## בדיקה לפני Deploy

```bash
cd "/Users/shaulcohen/Desktop/hebrew-realestate-leads 2"
npx tsc --noEmit 2>&1 | grep -v "CrmImport"
# חייב להחזיר ריק
```

## Deploy
```bash
cd "/Users/shaulcohen/Desktop/hebrew-realestate-leads 2"
rm -f .git/index.lock
git add -A
git commit -m "CRM מלא — 9 מודולים + Green API + webhook endpoints לMake"
git push origin main
```

---

## הערות חשובות לקודקס

1. **אל תשבור קוד קיים** — `CrmPage.tsx` הקיים נשאר שלם. `CrmLayout` עוטף אותו.
2. **כל נתון — JSON ב-Vercel Blob** — אותו pattern כמו לידים. קרא `getCrmLeads()` כdemo.
3. **Green API phone format**: `972501234567@c.us` (הסר 0 ראשון, הוסף 972)
4. **Make webhook secret**: תמיד בדוק `req.headers["x-webhook-secret"] === process.env.WEBHOOK_SECRET`
5. **Tailwind classes חדשות** — השתמש ב-inline styles לצבעים חדשים (Tailwind מוחק unused classes ב-build)
6. **TypeScript strict** — כל שדה חדש ב-CrmLeadData שנוסף הוא optional (`?`) לתאימות לאחור
