import assert from "node:assert/strict";
import { test } from "node:test";

global.Image = class {
  set src(_v) {
    queueMicrotask(() => this.onerror?.());
  }
};

const { drawCanvasGraph } = await import("./graph.js");

function makeCtx() {
  const textBoxes = [];
  const charWidth = { normal: 5, bold: 6 };
  let font = "";
  return {
    get font() {
      return font;
    },
    set font(v) {
      font = v;
    },
    textAlign: "left",
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    clearRect() {},
    fillRect() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    arc() {},
    fill() {},
    drawImage() {},
    measureText(text) {
      const w = text.length * (font.includes("bold") ? 6 : 5);
      return { width: w };
    },
    fillText(text, x, y) {
      const w = this.measureText(text).width;
      const left = this.textAlign === "center" ? x - w / 2 : x;
      textBoxes.push({ text, left, right: left + w, top: y - 8, bottom: y + 3 });
    },
    __textBoxes: textBoxes,
  };
}

function boxesIntersect(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

test("深夜0時台のように気温がY軸目盛りに近くても目盛りラベルとデータラベルが重ならない", async () => {
  const ctx = makeCtx();
  const dataPoints = [
    { hour: 0, surfaceTemp: 19.3, weathercode: 3, precipitation: 0, meta: { chartColor: "#000" } },
    { hour: 1, surfaceTemp: 19.5, weathercode: 3, precipitation: 0, meta: { chartColor: "#000" } },
  ];

  await drawCanvasGraph({
    ctx,
    dataPoints,
    currentHourVal: 0,
    highlightCurrent: false,
    maxScrollWidth: 1200,
    canvasHeight: 200,
    hourStepWidth: 70,
    graphPaddingLeft: 30,
  });

  const tickLabel = ctx.__textBoxes.find((b) => b.text === "20℃");
  const dataLabel = ctx.__textBoxes.find((b) => b.text === "19.3°");
  assert.ok(tickLabel, "20℃の目盛りラベルが描画されること");
  assert.ok(dataLabel, "19.3°のデータラベルが描画されること");
  assert.ok(
    !boxesIntersect(tickLabel, dataLabel),
    "目盛りラベルとデータラベルの描画範囲が重ならないこと",
  );
});

test("同じctxで2回描画しても(前回のtextAlignが残っても)目盛りラベルとデータラベルが重ならない", async () => {
  const ctx = makeCtx();
  const dataPoints = [
    { hour: 0, surfaceTemp: 19.3, weathercode: 3, precipitation: 0, meta: { chartColor: "#000" } },
    { hour: 1, surfaceTemp: 19.5, weathercode: 3, precipitation: 0, meta: { chartColor: "#000" } },
  ];
  const drawArgs = {
    ctx,
    dataPoints,
    currentHourVal: 0,
    highlightCurrent: false,
    maxScrollWidth: 1200,
    canvasHeight: 200,
    hourStepWidth: 70,
    graphPaddingLeft: 30,
  };

  await drawCanvasGraph(drawArgs);
  ctx.__textBoxes.length = 0;
  await drawCanvasGraph(drawArgs);

  const tickLabel = ctx.__textBoxes.find((b) => b.text === "20℃");
  const dataLabel = ctx.__textBoxes.find((b) => b.text === "19.3°");
  assert.equal(tickLabel.left, 8, "2回目の描画でも目盛りラベルは左端起点のまま");
  assert.ok(
    !boxesIntersect(tickLabel, dataLabel),
    "2回目の描画でも目盛りラベルとデータラベルの描画範囲が重ならないこと",
  );
});
