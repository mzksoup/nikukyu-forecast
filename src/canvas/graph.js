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

    if (x - labelWidth / 2 < tickColumnRight) {
      // 最初の点は目盛りラベル欄に近く、上下どちらに置いても重なるため点の右側に表示する
      ctx.textAlign = "left";
      ctx.fillText(label, x + 9, y + 3);
    } else {
      // box.left(x - labelWidth/2) >= tickColumnRight が保証されるため、
      // どの目盛りラベルとも重ならない(衝突判定は不要)
      ctx.textAlign = "center";
      ctx.fillText(label, x, y - 10);
    }
  }
}
