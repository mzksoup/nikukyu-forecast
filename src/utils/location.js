export function pickMunicipalityName(address) {
  return (
    address?.city ||
    address?.town ||
    address?.village ||
    address?.municipality ||
    address?.city_district ||
    address?.county ||
    address?.suburb ||
    address?.hamlet ||
    address?.locality ||
    ""
  );
}

export function pickPrefectureName(address, displayName = "") {
  const prefecture =
    address?.state ||
    address?.region ||
    address?.province ||
    address?.state_district ||
    address?.prefecture ||
    "";

  if (prefecture) {
    return prefecture;
  }

  if (typeof displayName !== "string" || !displayName.trim()) {
    return "";
  }

  const municipality = pickMunicipalityName(address);
  const segments = displayName
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (municipality) {
    const municipalityIndex = segments.indexOf(municipality);
    if (municipalityIndex >= 0) {
      const candidate = segments[municipalityIndex + 1];
      if (candidate && /[都道府県]$/.test(candidate)) {
        return candidate;
      }
    }
  }

  return segments.find((segment) => /[都道府県]$/.test(segment)) || "";
}

export function formatMunicipalityLabel(address, displayName = "") {
  const prefecture = pickPrefectureName(address, displayName);
  const municipality = pickMunicipalityName(address);

  if (prefecture && municipality) {
    return `${prefecture} ${municipality}`;
  }

  return prefecture || municipality || "";
}
