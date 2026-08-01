import { getWeatherIcon } from "../utils/weather.js";
import {
  SURFACE_TEMP_SAFE_MAX,
  SURFACE_TEMP_CAUTION_MAX,
  SURFACE_TEMP_DANGER_MAX,
} from "../constants.js";

const METEOCONS_CDN_BASE = "https://cdn.meteocons.com/3.0.0-next.10/svg/fill";
const meteoconsIconCache = new Map();

function loadMeteoconsIcon(iconName) {
  if (!iconName) return Promise.resolve(null);

  if (meteoconsIconCache.has(iconName)) {
    return meteoconsIconCache.get(iconName);
  }

  const promise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      meteoconsIconCache.delete(iconName);
      resolve(null);
    };
    img.src = `${METEOCONS_CDN_BASE}/${iconName}.svg`;
  });

  meteoconsIconCache.set(iconName, promise);
  return promise;
}

// データラベルの描画範囲(ベースラインからの相対値)。bold 10px sans-serif の
// 実測に合わせた概算で、衝突判定とテストのボックス計算で同じ値を使う。
const LABEL_ASCENT = 8;
const LABEL_DESCENT = 3;

/**
 * 線分と軸平行矩形が交差するか(Liang-Barsky)
 * @returns {boolean}
 */
function segmentIntersectsRect(x1, y1, x2, y2, rect) {
  let tMin = 0;
  let tMax = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;

  // 各境界について、線分の媒介変数 t の可視区間を絞り込む
  const clip = (p, q) => {
    if (p === 0) return q >= 0; // 境界と平行。外側なら交差しない
    const r = q / p;
    if (p < 0) {
      if (r > tMax) return false;
      if (r > tMin) tMin = r;
    } else {
      if (r < tMin) return false;
      if (r < tMax) tMax = r;
    }
    return true;
  };

  return (
    clip(-dx, x1 - rect.left) &&
    clip(dx, rect.right - x1) &&
    clip(-dy, y1 - rect.top) &&
    clip(dy, rect.bottom - y1)
  );
}

export async function drawCanvasGraph({
  ctx,
  dataPoints,
  currentHourVal,
  highlightCurrent = false,
  maxScrollWidth,
  canvasHeight,
  hourStepWidth,
  graphPaddingLeft,
  shouldAbort = () => false,
}) {
  if (!ctx) return;

  const iconImages = await Promise.all(
    dataPoints.map((dp) =>
      loadMeteoconsIcon(getWeatherIcon(dp.weathercode, dp.precipitation, dp.hour)),
    ),
  );

  if (shouldAbort()) return;
  ctx.clearRect(0, 0, maxScrollWidth, canvasHeight);

  const paddingLeft = graphPaddingLeft;
  const graphHeight = 150;
  const startY = 40;
  const minTemp = -5;
  const maxTemp = 60;
  const tempRange = maxTemp - minTemp;

  const getCanvasY = (temp) => {
    const ratio = (temp - minTemp) / tempRange;
    return startY + graphHeight - ratio * graphHeight;
  };

  const bandColors = [
    "rgba(16, 185, 129, 0.05)",
    "rgba(250, 204, 21, 0.08)",
    "rgba(249, 115, 22, 0.05)",
    "rgba(225, 29, 72, 0.05)",
  ];

  ctx.fillStyle = bandColors[0];
  ctx.fillRect(
    0,
    getCanvasY(SURFACE_TEMP_SAFE_MAX),
    maxScrollWidth,
    getCanvasY(minTemp) - getCanvasY(SURFACE_TEMP_SAFE_MAX),
  );
  ctx.fillStyle = bandColors[1];
  ctx.fillRect(
    0,
    getCanvasY(SURFACE_TEMP_CAUTION_MAX),
    maxScrollWidth,
    getCanvasY(SURFACE_TEMP_SAFE_MAX) - getCanvasY(SURFACE_TEMP_CAUTION_MAX),
  );
  ctx.fillStyle = bandColors[2];
  ctx.fillRect(
    0,
    getCanvasY(SURFACE_TEMP_DANGER_MAX),
    maxScrollWidth,
    getCanvasY(SURFACE_TEMP_CAUTION_MAX) - getCanvasY(SURFACE_TEMP_DANGER_MAX),
  );
  ctx.fillStyle = bandColors[3];
  ctx.fillRect(0, 0, maxScrollWidth, getCanvasY(SURFACE_TEMP_DANGER_MAX));

  ctx.strokeStyle = "rgba(226, 232, 240, 0.8)";
  ctx.lineWidth = 1;
  ctx.font = "bold 9px sans-serif";
  ctx.textAlign = "left";
  const tickLabelBoxes = [0, 10, 20, 30, 40, 50, 60].map((t) => {
    const y = getCanvasY(t);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(maxScrollWidth, y);
    ctx.stroke();

    const text = `${t}℃`;
    const width = ctx.measureText(text).width;
    ctx.fillStyle = "rgba(100, 116, 139, 0.7)";
    ctx.fillText(text, 8, y - 4);
    return { left: 8, right: 8 + width, top: y - 4 - 8, bottom: y - 4 + 3 };
  });

  for (let i = 0; i < dataPoints.length; i++) {
    if (shouldAbort()) return;
    const dp = dataPoints[i];
    const x = paddingLeft + i * hourStepWidth;

    ctx.strokeStyle = "rgba(241, 245, 249, 0.9)";
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, startY + graphHeight);
    ctx.stroke();

    if (highlightCurrent && dp.hour === currentHourVal) {
      ctx.fillStyle = "rgba(249, 115, 22, 0.08)";
      ctx.fillRect(x - hourStepWidth / 2, 0, hourStepWidth, canvasHeight);
    }

    ctx.fillStyle = "rgba(100, 116, 139, 1)";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    const hourLabelY = startY + graphHeight + 10;
    ctx.fillText(`${dp.hour}:00`, x, hourLabelY);

    const iconImage = iconImages[i];
    if (iconImage) {
      const iconSize = 24;
      const iconX = x - iconSize / 2;
      const iconY = hourLabelY + 6;
      ctx.drawImage(iconImage, iconX, iconY, iconSize, iconSize);
    }

    if (dp.weatherLabel) {
      ctx.fillStyle = "rgba(71, 85, 105, 1)";
      ctx.font = "bold 9px sans-serif";
      ctx.fillText(dp.weatherLabel, x, hourLabelY + 38);
    }

    if (highlightCurrent && dp.hour === currentHourVal) {
      ctx.fillStyle = "rgba(249, 115, 22, 1)";
      ctx.font = "bold 8px sans-serif";
      ctx.fillText("現在", x, startY - 22);
    }
  }

  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(71, 85, 105, 0.85)";

  for (let i = 0; i < dataPoints.length; i++) {
    if (shouldAbort()) return;
    const dp = dataPoints[i];
    const x = paddingLeft + i * hourStepWidth;
    const y = getCanvasY(dp.surfaceTemp);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  const tickColumnRight = Math.max(...tickLabelBoxes.map((tick) => tick.right));

  for (let i = 0; i < dataPoints.length; i++) {
    if (shouldAbort()) return;
    const dp = dataPoints[i];
    const x = paddingLeft + i * hourStepWidth;
    const y = getCanvasY(dp.surfaceTemp);

    ctx.fillStyle = dp.meta.chartColor;
    ctx.beginPath();
    ctx.arc(x, y, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "bold 10px sans-serif";
    const label = `${dp.surfaceTemp.toFixed(1)}°`;
    const labelWidth = ctx.measureText(label).width;
    ctx.fillStyle = "rgba(15, 23, 42, 1)";

    // ラベルは基本マーカーの真上に置く。ただし路面温度が急変する時間帯では
    // 隣接する折れ線がラベルを横切るため、交差しない候補位置を順に探す。
    // 左端は常に目盛りラベル欄(0℃〜60℃)の右外へ clamp する。
    const labelGap = 4;
    const minLeft = tickColumnRight + labelGap;
    const aboveBaseline = y - 10;
    const belowBaseline = y + 18;

    const candidates = [
      // 真上(中央) → 上・左寄せ(右へ急上昇時) → 上・右寄せ(左から急降下時) → 真下(谷)
      { left: x - labelWidth / 2, baseline: aboveBaseline },
      { left: x - labelGap - labelWidth, baseline: aboveBaseline },
      { left: x + labelGap, baseline: aboveBaseline },
      { left: x - labelWidth / 2, baseline: belowBaseline },
    ]
      .map((c) => ({ left: Math.max(c.left, minLeft), baseline: c.baseline }))
      // 真下の候補はグラフ枠(時刻ラベル欄)を突き抜ける場合のみ除外する
      .filter((c) => c.baseline + LABEL_DESCENT <= startY + graphHeight);

    const neighborSegments = [];
    if (i > 0) {
      neighborSegments.push([
        x - hourStepWidth,
        getCanvasY(dataPoints[i - 1].surfaceTemp),
      ]);
    }
    if (i < dataPoints.length - 1) {
      neighborSegments.push([
        x + hourStepWidth,
        getCanvasY(dataPoints[i + 1].surfaceTemp),
      ]);
    }

    const isClear = (c) => {
      const rect = {
        left: c.left,
        right: c.left + labelWidth,
        top: c.baseline - LABEL_ASCENT,
        bottom: c.baseline + LABEL_DESCENT,
      };
      return neighborSegments.every(
        ([nx, ny]) => !segmentIntersectsRect(x, y, nx, ny, rect),
      );
    };

    // どの候補も交差する場合は従来どおり真上(中央)にフォールバックする
    const placement = candidates.find(isClear) ?? {
      left: Math.max(x - labelWidth / 2, minLeft),
      baseline: aboveBaseline,
    };

    ctx.textAlign = "left";
    ctx.fillText(label, placement.left, placement.baseline);
  }
}
