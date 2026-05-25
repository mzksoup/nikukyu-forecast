import { fetchJsonWithTimeout } from "../utils/network.js";
import { formatMunicipalityLabel } from "../utils/location.js";

export async function reverseGeocodeMunicipality(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=ja`;
  const data = await fetchJsonWithTimeout(url, 4000);
  const label = formatMunicipalityLabel(data?.address);

  if (label) {
    return label;
  }

  if (typeof data?.display_name === "string" && data.display_name.trim()) {
    return data.display_name.split(",").slice(0, 2).join(" ");
  }

  return "";
}

export async function getIpGeolocation(reason) {
  const endpoints = [
    {
      name: "freeipapi",
      url: "https://free.freeipapi.com/api/json",
      extract: (data) => ({
        lat: data?.latitude,
        lon: data?.longitude,
        label: [data?.country_name, data?.region, data?.city]
          .filter(Boolean)
          .join(" / "),
      }),
    },
    {
      name: "ipapi",
      url: "https://ipapi.co/json/",
      extract: (data) => ({
        lat: data?.latitude,
        lon: data?.longitude,
        label: [data?.country_name, data?.region, data?.city]
          .filter(Boolean)
          .join(" / "),
      }),
    },
  ];

  let lastError =
    reason instanceof Error ? reason : new Error(String(reason || "IP fallback requested"));

  for (const endpoint of endpoints) {
    try {
      const data = await fetchJsonWithTimeout(endpoint.url, 3500);
      const location = endpoint.extract(data);

      if (typeof location.lat === "number" && typeof location.lon === "number") {
        return {
          lat: location.lat,
          lon: location.lon,
          label: location.label,
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
