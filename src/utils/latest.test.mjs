import assert from "node:assert/strict";
import { test } from "node:test";
import { createLatestGuard } from "./latest.js";

test("後から始めた処理が最新になり、先に始めた処理の結果は捨てられる", () => {
  const newRequest = createLatestGuard();
  const first = newRequest(); // 例: 起動時の東京のデモデータ
  const second = newRequest(); // 例: そのあと押したGPSの現在地
  assert.equal(first(), false);
  assert.equal(second(), true);
});

test("1つだけなら、最新のまま", () => {
  const newRequest = createLatestGuard();
  assert.equal(newRequest()(), true);
});
