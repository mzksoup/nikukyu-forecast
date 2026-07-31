import { GRAPH_PADDING_LEFT, HOUR_STEP_WIDTH } from "../constants.js";

export function renderHourlyGraphDetails(container, timelineDisplayPoints) {
  if (!container) return;

  container.innerHTML = "";

  // カード中心をcanvas側の点の位置(GRAPH_PADDING_LEFT + i*HOUR_STEP_WIDTH)に合わせる
  const halfStep = HOUR_STEP_WIDTH / 2;
  const leftOffset = GRAPH_PADDING_LEFT - halfStep;

  const strip = document.createElement("div");
  strip.className = "flex items-stretch";
  strip.style.width = `${timelineDisplayPoints.length * HOUR_STEP_WIDTH + halfStep}px`;
  strip.style.marginLeft = `${leftOffset}px`;
  strip.style.paddingRight = `${halfStep}px`;

  timelineDisplayPoints.forEach((dp) => {
    const isCurrent = Boolean(dp.isCurrent);
    const isCurrentClass = isCurrent ? "bg-[rgba(249,115,22,0.08)]" : "bg-transparent";
    const card = document.createElement("div");
    card.className = `shrink-0 px-1.5 py-2 transition-custom ${isCurrentClass}`;
    card.style.width = `${HOUR_STEP_WIDTH}px`;
    card.innerHTML = `
      <div class="space-y-1.5 text-center ${isCurrent ? "text-orange-700" : ""}">
        <div class="flex items-center justify-center gap-1.5">
          <span class="w-2 h-2 rounded-full ${dp.meta.indicator} shrink-0"></span>
          <span class="text-[9px] font-bold leading-tight text-slate-700">${dp.meta.shortLabel}</span>
        </div>
        <p class="text-[8px] leading-tight text-slate-500">
          気温 ${dp.temp.toFixed(1)}℃<br />
          風速 ${dp.wind.toFixed(1)}m/s<br />
          日射 ${dp.rad.toFixed(0)}W
        </p>
      </div>
    `;
    strip.appendChild(card);
  });

  container.appendChild(strip);
}
