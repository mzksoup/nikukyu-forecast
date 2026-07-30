import { getWeatherIcon } from "../utils/weather.js";

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
    getCanvasY(25),
    maxScrollWidth,
    getCanvasY(minTemp) - getCanvasY(25),
  );
  ctx.fillStyle = bandColors[1];
  ctx.fillRect(
    0,
    getCanvasY(35),
    maxScrollWidth,
    getCanvasY(25) - getCanvasY(35),
  );
  ctx.fillStyle = bandColors[2];
  ctx.fillRect(
    0,
    getCanvasY(45),
    maxScrollWidth,
    getCanvasY(35) - getCanvasY(45),
  );
  ctx.fillStyle = bandColors[3];
  ctx.fillRect(0, 0, maxScrollWidth, getCanvasY(45));

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
    ctx.textAlign = "center";
    const label = `${dp.surfaceTemp.toFixed(1)}°`;
    const labelWidth = ctx.measureText(label).width;
    const above = { top: y - 10 - 8, bottom: y - 10 + 3 };
    const box = { left: x - labelWidth / 2, right: x + labelWidth / 2 };
    const collidesAbove = tickLabelBoxes.some(
      (tick) =>
        box.left < tick.right &&
        box.right > tick.left &&
        above.top < tick.bottom &&
        above.bottom > tick.top,
    );
    const labelY = collidesAbove ? y + 18 : y - 10;
    ctx.fillStyle = "rgba(15, 23, 42, 1)";
    ctx.fillText(label, x, labelY);
  }
}
