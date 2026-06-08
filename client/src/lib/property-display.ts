type PropertyLocationData = {
  address?: string | null;
  street?: string | null;
  neighborhood?: string | null;
  city?: string | null;
};

const normalizeLocationPart = (value?: string | null) =>
  (value ?? "").replace(/[,\s]+/g, " ").trim().toLocaleLowerCase("he-IL");

export function propertyStreetOnly(property: PropertyLocationData) {
  const addressStreet = property.address?.split(",")[0].trim();
  if (addressStreet) return addressStreet;
  return property.street?.split(",")[0].trim() || "";
}

export function formatPropertyLocation(property: PropertyLocationData) {
  const parts = [propertyStreetOnly(property), property.neighborhood?.trim(), property.city?.trim()].filter(Boolean) as string[];

  return parts
    .filter((part, index) => {
      const normalizedPart = normalizeLocationPart(part);
      return !parts.slice(0, index).some((previous) => {
        const normalizedPrevious = normalizeLocationPart(previous);
        return normalizedPrevious === normalizedPart || normalizedPrevious.includes(normalizedPart);
      });
    })
    .join(", ");
}
