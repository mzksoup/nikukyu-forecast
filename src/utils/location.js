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

export function pickPrefectureName(address) {
  return (
    address?.state ||
    address?.region ||
    address?.province ||
    address?.state_district ||
    ""
  );
}

export function formatMunicipalityLabel(address) {
  const prefecture = pickPrefectureName(address);
  const municipality = pickMunicipalityName(address);

  if (prefecture && municipality) {
    return `${prefecture} ${municipality}`;
  }

  return prefecture || municipality || "";
}
