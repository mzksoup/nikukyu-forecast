export function drawCanvasGraph({
  ctx,
  dataPoints,
  currentHourVal,
  highlightCurrent = false,
  maxScrollWidth,
  canvasHeight,
  hourStepWidth,
  graphPaddingLeft,
}) {
  if (!ctx) return;

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
  [0, 10, 20, 30, 40, 50, 60].forEach((t) => {
    const y = getCanvasY(t);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(maxScrollWidth, y);
    ctx.stroke();

    ctx.fillStyle = "rgba(100, 116, 139, 0.7)";
    ctx.font = "bold 9px sans-serif";
    ctx.fillText(`${t}℃`, 8, y - 4);
  });

  dataPoints.forEach((dp, i) => {
    const x = paddingLeft + i * hourStepWidth;

    ctx.strokeStyle = "rgba(241, 245, 249, 0.9)";
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, startY + graphHeight);
    ctx.stroke();

    ctx.fillStyle = "rgba(100, 116, 139, 1)";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${dp.hour}:00`, x, startY + graphHeight + 18);

    if (highlightCurrent && dp.hour === currentHourVal) {
      ctx.fillStyle = "rgba(249, 115, 22, 0.08)";
      ctx.fillRect(x - hourStepWidth / 2, 0, hourStepWidth, canvasHeight);

      ctx.strokeStyle = "rgba(249, 115, 22, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, startY + graphHeight + 30);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(249, 115, 22, 1)";
      ctx.font = "bold 8px sans-serif";
      ctx.fillText("現在", x, startY - 22);
    }
  });

  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(71, 85, 105, 0.85)";

  dataPoints.forEach((dp, i) => {
    const x = paddingLeft + i * hourStepWidth;
    const y = getCanvasY(dp.surfaceTemp);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  dataPoints.forEach((dp, i) => {
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

    ctx.fillStyle = "rgba(15, 23, 42, 1)";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${dp.surfaceTemp.toFixed(1)}°`, x, y - 10);
  });
}
