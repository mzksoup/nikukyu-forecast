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
