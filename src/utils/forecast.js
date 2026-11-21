const REQUIRED = ["temperature_2m", "shortwave_radiation", "wind_speed_10m"];

/**
 * Open-Meteoの応答に、路面温度の計算に要る値が全部あるか確かめる。
 * 欠け(null)があると、0として計算されて誤った温度が出るか、表示の途中で止まるため、
 * 数値を補わずにエラーにして、画面にはエラー文を出す。
 * @returns 問題なければ引数をそのまま返す
 */
export function validateForecast(data) {
  const missing = () =>
    new Error("気象データに欠けがあり、表示できませんでした。時間をおいて、もう一度お試しください。");

  const isNumber = (value) => typeof value === "number" && Number.isFinite(value);

  if (!data?.current || !REQUIRED.every((key) => isNumber(data.current[key]))) {
    throw missing();
  }

  const hourly = data.hourly;
  const length = hourly?.time?.length ?? 0;
  if (length === 0) throw missing();

  for (const key of REQUIRED) {
    const values = hourly[key];
    if (!Array.isArray(values) || values.length < length || !values.slice(0, length).every(isNumber)) {
      throw missing();
    }
  }
  return data;
}
