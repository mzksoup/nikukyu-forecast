import { fetchJsonWithTimeout } from "../utils/network.js";
import { formatMunicipalityLabel } from "../utils/location.js";

export async function reverseGeocodeMunicipality(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=ja`;
  const data = await fetchJsonWithTimeout(url, 4000);
  return formatMunicipalityLabel(data?.address) || "";
}

function extractIpLocation(data) {
  return {
    lat: data?.latitude,
    lon: data?.longitude,
    label: [data?.country_name, data?.region, data?.city]
      .filter(Boolean)
      .join(" / "),
  };
}

export async function getIpGeolocation(reason) {
  const endpoints = [
    { name: "freeipapi", url: "https://free.freeipapi.com/api/json" },
    { name: "ipapi", url: "https://ipapi.co/json/" },
  ];

  let lastError =
    reason instanceof Error
      ? reason
      : new Error(String(reason || "IP fallback requested"));

  for (const endpoint of endpoints) {
    try {
      const data = await fetchJsonWithTimeout(endpoint.url, 3500);
      const location = extractIpLocation(data);

      if (
        typeof location.lat === "number" &&
        typeof location.lon === "number"
      ) {
        const label = await reverseGeocodeMunicipality(location.lat, location.lon);
        return {
          lat: location.lat,
          lon: location.lon,
          label: label || location.label,
          source: endpoint.name,
        };
      }

      lastError = new Error(`${endpoint.name} returned invalid coordinates`);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}
