import assert from "node:assert/strict";
import { test } from "node:test";
import { validateForecast } from "./forecast.js";

const makeForecast = () => ({
  current: {
    time: "2026-07-01T01:30",
    temperature_2m: 25,
    shortwave_radiation: 300,
    wind_speed_10m: 2,
  },
  hourly: {
    time: ["2026-07-01T00:00", "2026-07-01T01:00"],
    temperature_2m: [20, 21],
    shortwave_radiation: [0, 120],
    wind_speed_10m: [1, 1],
  },
});

test("値がそろっていれば、そのまま返す", () => {
  const data = makeForecast();
  assert.equal(validateForecast(data), data);
});

test("現在の気温が欠けている(null)と、エラーにする", () => {
  const data = makeForecast();
  data.current.temperature_2m = null;
  assert.throws(() => validateForecast(data), /欠け/);
});

test("時間別の値が1つでも欠けていると、エラーにする(0℃などに置き換えて誤表示しない)", () => {
  const data = makeForecast();
  data.hourly.temperature_2m[1] = null;
  assert.throws(() => validateForecast(data), /欠け/);
});

test("時間別の配列が無い・短い場合もエラーにする", () => {
  const data = makeForecast();
  data.hourly.wind_speed_10m = [1];
  assert.throws(() => validateForecast(data), /欠け/);
  assert.throws(() => validateForecast({ current: makeForecast().current }), /欠け/);
});

// 実際のOpen-Meteoは、北極圏(北緯78.2°)で current.shortwave_radiation だけnullを返し、時間別は全部そろっていた
test("現在の日射量だけがnullなら、同じ時刻(正時)の時間別の値で補う", () => {
  const data = makeForecast();
  data.current.shortwave_radiation = null;
  validateForecast(data);
  assert.equal(data.current.shortwave_radiation, 120); // 01:30 → 01:00の値
});

test("現在の日射量がnullで、同じ時刻の時間別の値も無ければ、エラーにする", () => {
  const data = makeForecast();
  data.current.shortwave_radiation = null;
  data.current.time = "2026-07-02T09:15"; // 時間別に無い日時
  assert.throws(() => validateForecast(data), /欠け/);
});

test("日射量以外(風速など)は、nullなら補わずエラーにする", () => {
  const data = makeForecast();
  data.current.wind_speed_10m = null;
  assert.throws(() => validateForecast(data), /欠け/);
});
