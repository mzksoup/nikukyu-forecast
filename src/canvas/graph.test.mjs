import assert from "node:assert/strict";
import { test } from "node:test";
import { GRAPH_PADDING_LEFT } from "../constants.js";

global.Image = class {
  set src(_v) {
    queueMicrotask(() => this.onerror?.());
  }
};

const { drawCanvasGraph } = await import("./graph.js");

function makeCtx() {
  const textBoxes = [];
  const arcs = [];
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
    arc(x, y, radius) {
      arcs.push({ x, y, radius });
    },
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
    __arcs: arcs,
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
    graphPaddingLeft: GRAPH_PADDING_LEFT,
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

test("0時(最初の点)のマーカー自体が目盛りラベル欄に食い込まない", async () => {
  const ctx = makeCtx();
  const dataPoints = [
    { hour: 0, surfaceTemp: 21.8, weathercode: 3, precipitation: 0, meta: { chartColor: "#000" } },
    { hour: 1, surfaceTemp: 21.1, weathercode: 3, precipitation: 0, meta: { chartColor: "#000" } },
  ];

  await drawCanvasGraph({
    ctx,
    dataPoints,
    currentHourVal: 0,
    highlightCurrent: false,
    maxScrollWidth: 1200,
    canvasHeight: 200,
    hourStepWidth: 70,
    graphPaddingLeft: GRAPH_PADDING_LEFT,
  });

  const marker = ctx.__arcs.find((a) => a.radius === 5.5);
  assert.ok(marker, "0時のマーカー(外側の丸)が描画されること");
  const markerBox = {
    left: marker.x - marker.radius,
    right: marker.x + marker.radius,
    top: marker.y - marker.radius,
    bottom: marker.y + marker.radius,
  };
  for (const t of [0, 10, 20, 30, 40, 50, 60]) {
    const tickLabel = ctx.__textBoxes.find((b) => b.text === `${t}℃`);
    assert.ok(
      !boxesIntersect(tickLabel, markerBox),
      `0時のマーカーが${t}℃の目盛りラベルと重ならないこと`,
    );
  }
});

test("0時台の気温が目盛りの少し上(21.8度など)でも、下に逃がした先の別の目盛りと重ならない", async () => {
  const ctx = makeCtx();
  const dataPoints = [
    { hour: 0, surfaceTemp: 21.8, weathercode: 3, precipitation: 0, meta: { chartColor: "#000" } },
    { hour: 1, surfaceTemp: 21.1, weathercode: 3, precipitation: 0, meta: { chartColor: "#000" } },
  ];

  await drawCanvasGraph({
    ctx,
    dataPoints,
    currentHourVal: 0,
    highlightCurrent: false,
    maxScrollWidth: 1200,
    canvasHeight: 200,
    hourStepWidth: 70,
    graphPaddingLeft: GRAPH_PADDING_LEFT,
  });

  const dataLabel = ctx.__textBoxes.find((b) => b.text === "21.8°");
  assert.ok(dataLabel, "21.8°のデータラベルが描画されること");
  for (const t of [0, 10, 20, 30, 40, 50, 60]) {
    const tickLabel = ctx.__textBoxes.find((b) => b.text === `${t}℃`);
    assert.ok(
      !boxesIntersect(tickLabel, dataLabel),
      `21.8°のデータラベルが${t}℃の目盛りラベルと重ならないこと`,
    );
  }
});

test("最初の点のデータラベルがマーカーの上に描画され、マーカーと重ならない", async () => {
  const ctx = makeCtx();
  const dataPoints = [
    { hour: 0, surfaceTemp: 20.6, weathercode: 3, precipitation: 0, meta: { chartColor: "#000" } },
    { hour: 1, surfaceTemp: 21.3, weathercode: 3, precipitation: 0, meta: { chartColor: "#000" } },
  ];

  await drawCanvasGraph({
    ctx,
    dataPoints,
    currentHourVal: 0,
    highlightCurrent: false,
    maxScrollWidth: 1200,
    canvasHeight: 200,
    hourStepWidth: 70,
    graphPaddingLeft: GRAPH_PADDING_LEFT,
  });

  // 同半径のマーカーが点の数だけあるため、x が最小=最初の点のものを明示的に選ぶ
  const marker = ctx.__arcs
    .filter((a) => a.radius === 5.5)
    .reduce((min, a) => (a.x < min.x ? a : min));
  const dataLabel = ctx.__textBoxes.find((b) => b.text === "20.6°");
  assert.ok(marker, "最初の点のマーカー(外側の丸)が描画されること");
  assert.ok(dataLabel, "20.6°のデータラベルが描画されること");
  const markerBox = {
    left: marker.x - marker.radius,
    right: marker.x + marker.radius,
    top: marker.y - marker.radius,
    bottom: marker.y + marker.radius,
  };
  assert.ok(
    dataLabel.bottom <= markerBox.top,
    "データラベルがマーカーより上に描画されること(横に逃がしていないこと)",
  );
  assert.ok(
    !boxesIntersect(dataLabel, markerBox),
    "データラベルとマーカーの描画範囲が重ならないこと",
  );
});

test("最初の点のデータラベルがY軸目盛り欄の右外へclampされる", async () => {
  const ctx = makeCtx();
  const dataPoints = [
    { hour: 0, surfaceTemp: 20.6, weathercode: 3, precipitation: 0, meta: { chartColor: "#000" } },
    { hour: 1, surfaceTemp: 21.3, weathercode: 3, precipitation: 0, meta: { chartColor: "#000" } },
  ];

  // フォント幅に依存せず必ずclamp分岐を通すため、左余白を意図的に詰めた入力を使う
  await drawCanvasGraph({
    ctx,
    dataPoints,
    currentHourVal: 0,
    highlightCurrent: false,
    maxScrollWidth: 1200,
    canvasHeight: 200,
    hourStepWidth: 70,
    graphPaddingLeft: 20,
  });

  const tickColumnRight = Math.max(
    ...ctx.__textBoxes.filter((b) => b.text.endsWith("℃")).map((b) => b.right),
  );
  const dataLabel = ctx.__textBoxes.find((b) => b.text === "20.6°");
  assert.ok(dataLabel, "20.6°のデータラベルが描画されること");
  assert.ok(
    dataLabel.left >= tickColumnRight + 4,
    `データラベルの左端(${dataLabel.left})が目盛り欄の右端(${tickColumnRight})から4px以上離れていること`,
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
    graphPaddingLeft: GRAPH_PADDING_LEFT,
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
