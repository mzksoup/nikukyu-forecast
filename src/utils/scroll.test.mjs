import assert from "node:assert/strict";
import { test } from "node:test";
import { snapScrollOffset } from "./scroll.js";

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
