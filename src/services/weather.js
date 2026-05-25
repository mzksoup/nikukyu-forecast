export async function fetchWeatherForecast(lat, lon) {
  let responseData = null;
  let retryDelay = 1000;

  for (let i = 0; i < 5; i++) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,shortwave_radiation,wind_speed_10m,relative_humidity_2m&hourly=temperature_2m,shortwave_radiation,wind_speed_10m&timezone=Asia%2FTokyo&forecast_days=3`;
      const response = await fetch(url);
      if (response.ok) {
        responseData = await response.json();
        break;
      }
    } catch (error) {
      // retry
    }

    await new Promise((resolve) => setTimeout(resolve, retryDelay));
    retryDelay *= 2;
  }

  if (!responseData) {
    throw new Error("気象予測データのロードに失敗しました。接続状態をご確認ください。");
  }

  return responseData;
}
