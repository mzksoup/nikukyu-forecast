import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calculateVerifiedSurfaceTemperature,
  getStatusMetadata,
  roundForDisplay,
} from "./temperature.js";

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

// 画面には小数1桁(toFixed(1))で出すので、判定も同じ丸め後の値で行い、
// 凡例「安全(25℃以下)/注意(25.1〜35℃)/危険(35.1〜45℃)/絶対NG(45.1℃以上)」と食い違わせない
test("危険度の境界: 小数1桁に丸めた値で判定する(25.04は表示が25.0℃なので安全)", () => {
  const label = (t) => getStatusMetadata(t).shortLabel;
  assert.equal(label(25.0), "安全");
  assert.equal(label(25.04), "安全");
  assert.equal(label(25.1), "注意");
  assert.equal(label(35.0), "注意");
  assert.equal(label(35.04), "注意");
  assert.equal(label(35.1), "危険");
  assert.equal(label(45.04), "危険");
  assert.equal(label(45.1), "絶対NG");
  assert.equal(label(-8), "安全");
});

test("roundForDisplayは、画面表示(toFixed(1))と同じ値を数で返す", () => {
  assert.equal(roundForDisplay(25.04), 25);
  assert.equal(roundForDisplay(25.06), 25.1);
});
