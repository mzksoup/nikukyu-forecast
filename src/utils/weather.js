const METEOCONS_CDN_BASE = "https://cdn.meteocons.com/3.0.0-next.10/svg/fill";

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
  switch (iconName) {
    case "clear-day":
      return "晴れ";
    case "overcast-day":
      return "曇り";
    case "fog-day":
      return "霧";
    case "rain":
      return "雨";
    case "partly-cloudy-day-rain":
      return "小雨";
    case "thunderstorms-day-rain":
      return "雷雨";
    case "snow":
      return "雪";
    default:
      return "";
  }
}

/**
 * 降水量(mm/h)を日本語ラベルに変換する
 * @param {number} mm - 時間降水量 (mm/h)
 * @param {number} [code] - WMO weathercode
 * @returns {{ label: string, meteoconsName: string|null }}
 */
export function getRainLabel(mm, code) {
  return getWeatherLabel(mm, code);
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
  const precipitationAmount = normalizeNumber(precipitation);
  if (precipitationAmount != null && precipitationAmount > 0) {
    const wmo = normalizeNumber(code);
    // Snow/thunder WMO codes should take precedence even when precipitation > 0.
    if (
      wmo === 71 ||
      wmo === 73 ||
      wmo === 75 ||
      wmo === 77 ||
      wmo === 85 ||
      wmo === 86
    )
      return "snow";
    if (wmo === 95 || wmo === 96 || wmo === 99) return "thunderstorms-day-rain";
    if (precipitationAmount >= 20) return "thunderstorms-day-rain";
    if (precipitationAmount >= 1) return "rain";
    return "partly-cloudy-day-rain";
  }

  const weatherCode = normalizeNumber(code);
  if (weatherCode == null) return "overcast-day";

  if (weatherCode === 0) return "clear-day";
  if (weatherCode === 1 || weatherCode === 2 || weatherCode === 3) {
    return "overcast-day";
  }
  if (weatherCode === 45 || weatherCode === 48) return "fog-day";
  if (
    weatherCode === 51 ||
    weatherCode === 53 ||
    weatherCode === 55 ||
    weatherCode === 56 ||
    weatherCode === 57
  ) {
    return "rain";
  }
  if (
    weatherCode === 61 ||
    weatherCode === 63 ||
    weatherCode === 65 ||
    weatherCode === 66 ||
    weatherCode === 67 ||
    weatherCode === 80 ||
    weatherCode === 81 ||
    weatherCode === 82
  ) {
    return "rain";
  }
  if (
    weatherCode === 71 ||
    weatherCode === 73 ||
    weatherCode === 75 ||
    weatherCode === 77 ||
    weatherCode === 85 ||
    weatherCode === 86
  ) {
    return "snow";
  }
  if (weatherCode === 95 || weatherCode === 96 || weatherCode === 99) {
    return "thunderstorms-day-rain";
  }

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
  return `<img src="${METEOCONS_CDN_BASE}/${iconName}.svg" alt="${iconName}" width="${pixelSize}" height="${pixelSize}" style="width:${pixelSize}px;height:${pixelSize}px;display:block;" loading="eager" decoding="async" referrerpolicy="no-referrer" />`;
}
