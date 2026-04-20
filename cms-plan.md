# Team Shay CMS Plan

## Goal

להרחיב את האתר הקיים למערכת דינמית מלאה שבה התוכן הציבורי, הנכסים, הסוכנים, ההמלצות ונכסי המדיה מנוהלים ממסד נתונים ומפאנל Admin, תוך שמירה על חוויית RTL, מיתוג Team Shay, והרשאות נפרדות בין אדמין לסוכנים.

## Roles and Access Model

| Role | Auth Source | Access |
| --- | --- | --- |
| `admin` | Manus OAuth user עם `role=admin` | גישה ל-`/admin`, ניהול מלא של האתר, סוכנים, המלצות, תמונות, והקצאות נכסים |
| `agent` | התחברות אימייל/סיסמה מבוססת cookie ייעודי | גישה ל-`/agent-dashboard`, ניהול נכסים אישיים בלבד |
| `public` | ללא התחברות | צפייה באתר הציבורי ובקטלוג הנכסים |

החלטת העבודה היא להשאיר את דשבורד הסוכנים על מנגנון ההתחברות הקיים, ולבנות את פאנל ה-Admin על גבי הרשאות האדמין שכבר קיימות דרך `adminProcedure`.

## Data Model Expansion

| Entity | Purpose | Key Fields |
| --- | --- | --- |
| `siteSettings` | ניהול תוכן גלובלי ותמונות מרכזיות באתר | `headerLogoUrl`, `footerLogoUrl`, `heroBackgroundUrl`, `shayAboutImageUrl`, `heroHeadline`, `heroTypingText`, `whatsappLink`, `officePhone`, `landsmanLogoUrl` |
| `agents` | סוכני האתר שמוצגים באתר ו/או יכולים לקבל שיוך לנכסים | `name`, `slug`, `roleTitle`, `bio`, `phone`, `email`, `photoUrl`, `sortOrder`, `isPublished` |
| `agentAccounts` | חשבונות התחברות לסוכנים | הרחבה עם `agentProfileId`, `managedByAdmin`, `lastLoginAt` |
| `testimonials` | המלצות עריכות לדף הבית | `quote`, `title`, `source`, `stars`, `whatsappImageUrl`, `sortOrder`, `isPublished` |
| `properties` | נכסים ציבוריים ודינמיים | `agentId`, `title`, `street`, `addressLine`, `neighborhood`, `city`, `price`, `builtSqm`, `outdoorSpace`, `rooms`, `floor`, `status`, `descriptionHtml`, `featuredImageUrl`, `isPublished` |
| `propertyImages` | גלריית תמונות מרובת העלאה לכל נכס | `propertyId`, `imageUrl`, `imageKey`, `sortOrder`, `altText` |
| `leadSubmissions` | שמירת לידים מטופס ההמרה | `fullName`, `phone`, `neighborhood`, `rooms`, `sqm`, `createdAt` |

## Router Plan

| Router | Audience | Main Procedures |
| --- | --- | --- |
| `publicSite` | public | `getHomepage()`, `listPublishedProperties()`, `getFilterOptions()` |
| `publicLeads` | public | `createLead()` |
| `adminSite` | admin | `getSettings()`, `updateSettings()` |
| `adminAgents` | admin | `list()`, `create()`, `update()`, `delete()` |
| `adminTestimonials` | admin | `list()`, `create()`, `update()`, `delete()` |
| `adminProperties` | admin | `listAll()`, `create()`, `update()`, `delete()`, `assignAgent()` |
| `adminAgentAccounts` | admin | `list()`, `create()`, `updatePassword()`, `toggleActive()` |
| `agent` | agent | לשמר `me`, `listProperties`, `propertyById`, `createProperty`, `updateProperty`, `deleteProperty` עם הרחבת שדות |

## Frontend Structure Plan

| Route | Purpose |
| --- | --- |
| `/` | דף בית דינמי מבוסס CMS |
| `/properties` | קטלוג נכסים דינמי עם פילטרים |
| `/agent-login` | התחברות סוכנים |
| `/agent-dashboard` | דשבורד סוכן לניהול נכסיו |
| `/admin` | דשבורד אדמין ראשי |
| `/admin/site` | ניהול תמונות ותוכן גלובלי |
| `/admin/properties` | ניהול כל הנכסים |
| `/admin/agents` | ניהול כרטיסי צוות וחשבונות סוכן |
| `/admin/testimonials` | ניהול 6 ההמלצות והקרוסלה |
| `/admin/leads` | צפייה בלידים שהתקבלו |

## Implementation Notes

הצעד הבא הוא להרחיב את הסכמה ב-`drizzle/schema.ts`, להוסיף שכבת עזרי DB חדשה, ולממש seed בסיסי ל-`siteSettings` ולחשבון admin/agent כך שהמערכת תוכל לעלות עם נתונים ראשוניים בלי לשבור את הגרסה הקיימת.
