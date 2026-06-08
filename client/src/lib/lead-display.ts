export type LeadDisplayData = {
  id?: number;
  name: string;
  neighborhood?: string | null;
  propertyNeighborhood?: string | null;
  propertyStreet?: string | null;
  notes?: string | null;
};

function extractStreetFromNotes(notes?: string | null) {
  return notes?.match(/רחוב\s*:\s*([^\n\r]+)/)?.[1]?.trim() ?? "";
}

export function leadStreet(lead?: LeadDisplayData | null) {
  return lead?.propertyStreet?.trim() || extractStreetFromNotes(lead?.notes);
}

export function leadNeighborhood(lead?: LeadDisplayData | null) {
  return lead?.propertyNeighborhood?.trim() || lead?.neighborhood?.trim() || "";
}

export function leadLocation(lead?: LeadDisplayData | null) {
  return [leadStreet(lead), leadNeighborhood(lead)].filter(Boolean).join(" · ");
}

export function leadLabel(lead?: LeadDisplayData | null) {
  if (!lead) return "ליד לא משויך";
  const location = leadLocation(lead);
  return location ? `${lead.name} — ${location}` : lead.name;
}
