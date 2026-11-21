const REQUIRED = ["temperature_2m", "shortwave_radiation", "wind_speed_10m"];

/**
 * Open-Meteoの応答に、路面温度の計算に要る値が全部あるか確かめる。
 * 欠け(null)があると、0として計算されて誤った温度が出るか、表示の途中で止まるため、
 * 数値を補わずにエラーにして、画面にはエラー文を出す。
 * 例外: 現在の日射量だけは、場所によってnullで返る(北極圏で確認)ことがあるので、
 * 同じ時刻(正時)の時間別の値で補う。
 * @returns 問題なければ引数をそのまま返す(日射量を補った場合は、その値を入れて返す)
 */
export function validateForecast(data) {
  const missing = () =>
    new Error("気象データに欠けがあり、表示できませんでした。時間をおいて、もう一度お試しください。");

  const isNumber = (value) => typeof value === "number" && Number.isFinite(value);

  const hourly = data?.hourly;
  const length = hourly?.time?.length ?? 0;
  if (!data?.current || length === 0) throw missing();

  for (const key of REQUIRED) {
    const values = hourly[key];
    if (!Array.isArray(values) || values.length < length || !values.slice(0, length).every(isNumber)) {
      throw missing();
    }
  }

  const current = data.current;
  if (current.shortwave_radiation === null) {
    const hourKey = String(current.time).slice(0, 13); // 例: "2026-07-01T01"
    const index = hourly.time.findIndex((t) => String(t).startsWith(hourKey));
    if (index >= 0) current.shortwave_radiation = hourly.shortwave_radiation[index];
  }

  if (!REQUIRED.every((key) => isNumber(current[key]))) throw missing();
  return data;
}
