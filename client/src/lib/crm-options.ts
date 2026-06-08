export type CrmOption = {
  value: string;
  label: string;
};

export const LEAD_TYPE_OPTIONS: CrmOption[] = [
  { value: "exclusive", label: "בלעדיות" },
  { value: "buyer", label: "קונה" },
  { value: "seller", label: "מוכר" },
  { value: "rental", label: "השכרה" },
  { value: "agreement", label: "הסכם" },
  { value: "past_client", label: "לקוח עבר" },
  { value: "buyer_and_seller", label: "קונה ומוכר" },
];

export const NEIGHBORHOOD_OPTIONS: CrmOption[] = [
  "גילה", "גבעת מסואה", "גבעת קנדה", "ארנונה", "פת", "תלפיות", "בקעה",
  "קטמון", "גבעת מרדכי", "רמת שרת", "בית וגן", "קריית מנחם", "עיר גנים",
  "מלחה", "רמת דניה", "ארמון הנציב", "נווה יעקב", "פסגת זאב", "רמות", "בית צפפה",
].map(value => ({ value, label: value }));

export const PROPERTY_TYPE_OPTIONS: CrmOption[] = [
  "דירה", "בית פרטי", "דופלקס", "פנטהאוז", "גג", "קוטג'", "מגרש", "מסחרי", "אחר",
].map(value => ({ value, label: value }));

export const ROOM_OPTIONS: CrmOption[] = [
  "1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5", "5.5", "6", "6+",
].map(value => ({ value, label: value }));

export const DEFAULT_AGENT_NAMES = [
  "שי כהן", "ירדן גמליאל", "אליה מרציאנו", "רונן דוידיאן", "אביעד ניסים",
];

export function normalizeLeadType(value?: string | null) {
  const normalized = (value ?? "").trim().toLowerCase();
  if (/exclusive|בלעדי|בלעדיות/.test(normalized)) return "exclusive";
  if (/buyer_and_seller|קונה ומוכר|קונה ומוכר/.test(normalized)) return "buyer_and_seller";
  if (/past_client|לקוח עבר/.test(normalized)) return "past_client";
  if (/agreement|הסכם/.test(normalized)) return "agreement";
  if (/rental|שוכר|משכיר|השכרה|שכירות/.test(normalized)) return "rental";
  if (/buyer|קונה/.test(normalized)) return "buyer";
  if (/seller|מוכר/.test(normalized)) return "seller";
  return normalized;
}

export function leadTypeLabel(value?: string | null) {
  const normalized = normalizeLeadType(value);
  return LEAD_TYPE_OPTIONS.find(option => option.value === normalized)?.label ?? value ?? "";
}
