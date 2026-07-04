const MUNICIPALITY_KEYS = [
  "city",
  "town",
  "village",
  "municipality",
  "city_district",
  "county",
  "suburb",
  "hamlet",
  "locality",
];

const PREFECTURE_KEYS = [
  "state",
  "region",
  "province",
  "state_district",
  "prefecture",
];

export function pickMunicipalityName(address) {
  for (const key of MUNICIPALITY_KEYS) {
    const value = address?.[key];
    if (value) return value;
  }
  return "";
}

export function pickPrefectureName(address) {
  for (const key of PREFECTURE_KEYS) {
    const value = address?.[key];
    if (value) return value;
  }
  return "";
}

export function formatMunicipalityLabel(address) {
  const prefecture = pickPrefectureName(address);
  const municipality = pickMunicipalityName(address);

  if (prefecture && municipality) {
    return `${prefecture} ${municipality}`;
  }

  return prefecture || municipality || "";
}
