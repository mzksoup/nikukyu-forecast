import assert from "node:assert/strict";
import { test } from "node:test";
import { getWeatherIcon, getWeatherLabel } from "./weather.js";

test("WMOコード1(晴れ時々曇り)は夜間(20時)には夜用アイコンになる", () => {
  const icon = getWeatherIcon(1, 0, 20);
  assert.notEqual(icon, "overcast-day");
  assert.equal(icon, "overcast-night");
});

test("WMOコード1(晴れ時々曇り)は昼間(12時)は従来通り昼用アイコンのまま", () => {
  const icon = getWeatherIcon(1, 0, 12);
  assert.equal(icon, "overcast-day");
});

test("夜の曇りアイコンにも日本語ラベルがつく", () => {
  const { label } = getWeatherLabel(0, 3);
  assert.notEqual(label, "");
});
