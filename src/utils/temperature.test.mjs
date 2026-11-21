import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateVerifiedSurfaceTemperature } from "./temperature.js";

const Ta = 30; // 気温
const Rs = 800; // 日射量
const U = 2; // 風速

test("降水なし(P=0)は既存の計算結果と一致する", () => {
  const withoutP = calculateVerifiedSurfaceTemperature(Ta, Rs, U);
  const withP0 = calculateVerifiedSurfaceTemperature(Ta, Rs, U, 0);
  assert.equal(withP0, withoutP);
});

test("軽い降水(5mm/h)は無降水より路面温度が低くなる", () => {
  const dry = calculateVerifiedSurfaceTemperature(Ta, Rs, U, 0);
  const light = calculateVerifiedSurfaceTemperature(Ta, Rs, U, 5);
  assert.ok(light < dry);
});

test("豪雨(20mm/h)は路面温度がほぼ気温まで下がる", () => {
  const heavy = calculateVerifiedSurfaceTemperature(Ta, Rs, U, 20);
  assert.ok(Math.abs(heavy - Ta) < 0.5);
});

test("降水量が未定義/負値でも壊れない(0扱い)", () => {
  const base = calculateVerifiedSurfaceTemperature(Ta, Rs, U, 0);
  const undef = calculateVerifiedSurfaceTemperature(Ta, Rs, U, undefined);
  const negative = calculateVerifiedSurfaceTemperature(Ta, Rs, U, -5);
  assert.equal(undef, base);
  assert.equal(negative, base);
});

// デザインルール(design-principles.md): 危険度4色は意味色の例外として認める。平色・角丸なし・DADSトークン値
import { getStatusMetadata } from "./temperature.js";

const STAGE_TEMPS = [20, 30, 40, 50];
const EXPECTED_CHART_COLORS = ["#197A4B", "#FFD43D", "#C74700", "#CE0000"];

test("危険度4段階はグラデーション・Tailwindカラー名を使わず平色トークンで定義する", () => {
  for (const t of STAGE_TEMPS) {
    const meta = getStatusMetadata(t);
    assert.ok(!/from-|to-|gradient/.test(meta.colorClass), `${t}℃: colorClassにグラデが残っている`);
    assert.match(meta.colorClass, /bg-\[#[0-9A-Fa-f]{6}\]/);
  }
});

test("危険度4段階のchartColorはDADSの意味色トークンと一致する", () => {
  assert.deepEqual(
    STAGE_TEMPS.map((t) => getStatusMetadata(t).chartColor),
    EXPECTED_CHART_COLORS,
  );
});
