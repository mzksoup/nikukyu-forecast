import assert from "node:assert/strict";
import { test } from "node:test";
import { keyboardScrollTarget, snapScrollOffset } from "./scroll.js";

const hourStepWidth = 70;

test("minScrollが非倍数でも、丸め後1ステップ以内なら端まで詰める(42d1f87の回帰)", () => {
  const minScroll = -1298; // 70の倍数ではない
  const snapped = snapScrollOffset(-1260, minScroll, hourStepWidth);
  assert.equal(snapped, minScroll);
});

test("差がちょうどhourStepWidthのときも端まで詰める(e2d0094の回帰、<=境界)", () => {
  const minScroll = -1400; // 70の倍数(20列分)
  // itemSnappedIndexが19に丸まり、端(20列目)まで1列分(70px)足りない状態
  const snapped = snapScrollOffset(-1350, minScroll, hourStepWidth);
  assert.equal(snapped, minScroll);
});

test("スクロール可能量がhourStepWidth未満でも左端(0)に戻れる(CodeRabbit指摘)", () => {
  const minScroll = -50; // hourStepWidth(70)未満
  const snapped = snapScrollOffset(0, minScroll, hourStepWidth);
  assert.equal(snapped, 0);
});

test("→キーで1列ぶん先の時間帯へ、←キーで1列ぶん戻る", () => {
  assert.equal(keyboardScrollTarget("ArrowRight", -140, -1298, hourStepWidth), -210);
  assert.equal(keyboardScrollTarget("ArrowLeft", -140, -1298, hourStepWidth), -70);
});

test("左端で←、右端で→を押しても、範囲の外へ出ない", () => {
  assert.equal(keyboardScrollTarget("ArrowLeft", 0, -1298, hourStepWidth), 0);
  assert.equal(keyboardScrollTarget("ArrowRight", -1298, -1298, hourStepWidth), -1298);
});

test("Homeで左端、Endで右端。対象外のキーはnull", () => {
  assert.equal(keyboardScrollTarget("Home", -500, -1298, hourStepWidth), 0);
  assert.equal(keyboardScrollTarget("End", -500, -1298, hourStepWidth), -1298);
  assert.equal(keyboardScrollTarget("a", -500, -1298, hourStepWidth), null);
});
