const METEOCONS_CDN_BASE = "https://cdn.meteocons.com/3.0.0-next.10/svg/fill";

const ICON_LABELS = {
  "clear-day": "晴れ",
  "overcast-day": "曇り",
  "fog-day": "霧",
  rain: "雨",
  "partly-cloudy-day-rain": "小雨",
  "thunderstorms-day-rain": "雷雨",
  snow: "雪",
};

const SNOW_CODES = [71, 73, 75, 77, 85, 86];
const STORM_CODES = [95, 96, 99];
const DRIZZLE_CODES = [51, 53, 55, 56, 57];
const RAIN_CODES = [61, 63, 65, 66, 67, 80, 81, 82];

function normalizeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getPrecipitationLabel(mm) {
  if (mm >= 20)
    return { label: "激しい雨", meteoconsName: "thunderstorms-day-rain" };
  if (mm >= 10) return { label: "強い雨", meteoconsName: "rain" };
  if (mm >= 3) return { label: "雨", meteoconsName: "rain" };
  if (mm >= 1) return { label: "小雨", meteoconsName: "partly-cloudy-day-rain" };
  return { label: "霧雨", meteoconsName: "rain" };
}

function getWeatherLabelFromIcon(iconName) {
  return ICON_LABELS[iconName] || "";
}

/**
 * 天気条件を日本語ラベルに変換する
 * @param {number} mm - 時間降水量 (mm/h)
 * @param {number} [code] - WMO weathercode
 * @returns {{ label: string, meteoconsName: string|null }}
 */
export function getWeatherLabel(mm, code) {
  const precipitation = normalizeNumber(mm);
  const iconName = getWeatherIcon(code, precipitation ?? 0);

  // If WMO code maps to a specific icon (e.g. snow/thunder), prefer that label.
  if (iconName === "snow" || iconName === "thunderstorms-day-rain") {
    return { label: getWeatherLabelFromIcon(iconName), meteoconsName: iconName };
  }

  if (precipitation != null && precipitation > 0) {
    const precipitationLabel = getPrecipitationLabel(precipitation);
    return {
      label: precipitationLabel.label,
      meteoconsName: precipitationLabel.meteoconsName,
    };
  }

  return {
    label: getWeatherLabelFromIcon(iconName),
    meteoconsName: iconName || null,
  };
}

/**
 * WMO weathercodeと降水量からMeteocons名を返す
 * @param {number} code - WMO weathercode
 * @param {number} [precipitation=0] - 時間降水量 (mm/h)
 * @returns {string|null}
 */
export function getWeatherIcon(code, precipitation = 0) {
  const wmo = normalizeNumber(code);
  const precipitationAmount = normalizeNumber(precipitation);

  // Snow/thunder WMO codes take precedence even when precipitation > 0.
  if (wmo != null && SNOW_CODES.includes(wmo)) return "snow";
  if (wmo != null && STORM_CODES.includes(wmo)) return "thunderstorms-day-rain";

  if (precipitationAmount != null && precipitationAmount > 0) {
    if (precipitationAmount >= 20) return "thunderstorms-day-rain";
    if (precipitationAmount >= 1) return "rain";
    return "partly-cloudy-day-rain";
  }

  if (wmo == null) return "overcast-day";
  if (wmo === 0) return "clear-day";
  if (wmo === 1 || wmo === 2 || wmo === 3) return "overcast-day";
  if (wmo === 45 || wmo === 48) return "fog-day";
  if (DRIZZLE_CODES.includes(wmo) || RAIN_CODES.includes(wmo)) return "rain";

  return "overcast-day";
}

/**
 * MeteoconsアイコンのHTML文字列を返す
 * @param {string} iconName
 * @param {number} size - px
 * @returns {string} HTML string
 */
export function getMeteoconsImgTag(iconName, size = 32) {
  if (!iconName) return "";

  const pixelSize = Number(size) || 32;
  const altText = getWeatherLabelFromIcon(iconName) || iconName;
  return `<img src="${METEOCONS_CDN_BASE}/${encodeURIComponent(iconName)}.svg" alt="${altText}" width="${pixelSize}" height="${pixelSize}" style="width:${pixelSize}px;height:${pixelSize}px;display:block;" loading="eager" decoding="async" referrerpolicy="no-referrer" />`;
}
