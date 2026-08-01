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
  const strokes = [];
  let path = [];
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
    beginPath() {
      path = [];
    },
    moveTo(x, y) {
      path.push({ x, y });
    },
    lineTo(x, y) {
      path.push({ x, y });
    },
    stroke() {
      strokes.push({ points: [...path], lineWidth: this.lineWidth });
    },
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
    __strokes: strokes,
  };
}

// 気温の折れ線は lineWidth 3 で一筆書きされる(罫線は 1)
function getTemperaturePolyline(ctx) {
  return ctx.__strokes.find((s) => s.lineWidth === 3)?.points ?? [];
}

function segmentIntersectsBox(p1, p2, box) {
  // 線分を十分細かく刻んで矩形内に入る点があるか判定する(テスト側は素朴な実装でよい)
  const steps = 2000;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = p1.x + (p2.x - p1.x) * t;
    const y = p1.y + (p2.y - p1.y) * t;
    if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) {
      return true;
    }
  }
  return false;
}

function polylineIntersectsBox(points, box) {
  return points.some((p, i) => i > 0 && segmentIntersectsBox(points[i - 1], p, box));
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

// --- 路面温度の急変時にラベルが折れ線と重ならないこと(#28) ---

function makeSteepPoints(temps) {
  return temps.map((t, i) => ({
    hour: i,
    surfaceTemp: t,
    weathercode: 3,
    precipitation: 0,
    meta: { chartColor: "#000" },
  }));
}

async function drawTemps(temps) {
  const ctx = makeCtx();
  await drawCanvasGraph({
    ctx,
    dataPoints: makeSteepPoints(temps),
    currentHourVal: 0,
    highlightCurrent: false,
    maxScrollWidth: 1200,
    canvasHeight: 200,
    hourStepWidth: 70,
    graphPaddingLeft: GRAPH_PADDING_LEFT,
  });
  return ctx;
}

// 弱風＋雲が晴れる時間帯など、日射の急変で路面温度は 20〜30℃/時 上昇しうる
const STEEP_CASES = [
  { name: "急上昇(弱風で雲が晴れる想定)", temps: [25.1, 47.5, 49.0], target: "25.1°" },
  { name: "急上昇(極端)", temps: [20.6, 60.0, 58.0], target: "20.6°" },
  // 左から急降下してきた点は、上に置くと降りてくる線がラベルを横切る
  { name: "急降下", temps: [30.0, 55.0, 24.0], target: "24.0°" },
  { name: "谷(前後とも急上昇)", temps: [50.0, 22.0, 50.0], target: "22.0°" },
  { name: "山(前後とも急降下)", temps: [22.0, 52.0, 22.0], target: "52.0°" },
  // 内部の点なら左へ寄せて逃げられる(最初の点はclampで潰れるためこの経路を通らない)
  { name: "右へ急上昇(内部の点)", temps: [25.0, 30.0, 60.0], target: "30.0°" },
  // 氷点下で点がグラフ枠の下に出ても、上側の候補は制限せず衝突回避を効かせる
  { name: "氷点下からの急上昇", temps: [-12.0, -10.0, 20.0], target: "-10.0°" },
];

for (const { name, temps, target } of STEEP_CASES) {
  test(`${name}でもデータラベルが折れ線と重ならない`, async () => {
    const ctx = await drawTemps(temps);
    const polyline = getTemperaturePolyline(ctx);
    const dataLabel = ctx.__textBoxes.find((b) => b.text === target);

    assert.ok(polyline.length >= 2, "気温の折れ線が描画されること");
    assert.ok(dataLabel, `${target}のデータラベルが描画されること`);
    assert.ok(
      !polylineIntersectsBox(polyline, dataLabel),
      `${target}のデータラベルが折れ線と重ならないこと`,
    );
  });
}

test("急上昇時もデータラベルはY軸目盛り欄と自身のマーカーを避ける", async () => {
  const ctx = await drawTemps([25.1, 47.5, 49.0]);
  const dataLabel = ctx.__textBoxes.find((b) => b.text === "25.1°");
  const marker = ctx.__arcs
    .filter((a) => a.radius === 5.5)
    .reduce((min, a) => (a.x < min.x ? a : min));
  const tickColumnRight = Math.max(
    ...ctx.__textBoxes.filter((b) => b.text.endsWith("℃")).map((b) => b.right),
  );

  assert.ok(
    dataLabel.left >= tickColumnRight + 4,
    `データラベルの左端(${dataLabel.left})が目盛り欄の右端(${tickColumnRight})から4px以上離れていること`,
  );
  assert.ok(
    !boxesIntersect(dataLabel, {
      left: marker.x - marker.radius,
      right: marker.x + marker.radius,
      top: marker.y - marker.radius,
      bottom: marker.y + marker.radius,
    }),
    "データラベルが自身のマーカーと重ならないこと",
  );
});
