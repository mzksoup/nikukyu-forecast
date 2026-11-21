import assert from "node:assert/strict";
import { test } from "node:test";
import { validateForecast } from "./forecast.js";

const makeForecast = () => ({
  current: { temperature_2m: 25, shortwave_radiation: 300, wind_speed_10m: 2 },
  hourly: {
    time: ["2026-07-01T00:00", "2026-07-01T01:00"],
    temperature_2m: [20, 21],
    shortwave_radiation: [0, 0],
    wind_speed_10m: [1, 1],
  },
});

test("値がそろっていれば、そのまま返す", () => {
  const data = makeForecast();
  assert.equal(validateForecast(data), data);
});

test("現在の値が欠けている(null)と、エラーにする", () => {
  const data = makeForecast();
  data.current.shortwave_radiation = null;
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
