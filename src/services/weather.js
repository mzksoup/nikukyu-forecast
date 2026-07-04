import { fetchJsonWithTimeout } from "../utils/network.js";

export async function fetchWeatherForecast(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,shortwave_radiation,wind_speed_10m,relative_humidity_2m,precipitation,weather_code&hourly=temperature_2m,shortwave_radiation,wind_speed_10m,precipitation,weather_code&timezone=Asia%2FTokyo&forecast_days=3`;

  let lastError = null;
  let retryDelay = 1000;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await fetchJsonWithTimeout(url, 4000);
    } catch (error) {
      lastError = error;
      if (attempt === 1) break;
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      retryDelay *= 2;
    }
  }

  const error = new Error(
    "気象予測データのロードに失敗しました。接続状態をご確認ください。",
  );
  error.cause = lastError;
  throw error
}
