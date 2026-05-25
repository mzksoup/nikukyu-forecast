export function renderTimelineCards(
  container,
  timelineDisplayPoints,
  isCurrentDayView,
) {
  if (!container) return;

  container.innerHTML = "";

  timelineDisplayPoints.forEach((dp, i) => {
    const isCurrent = Boolean(dp.isCurrent);
    const isPast = Boolean(dp.isPast);
    const itemRowClass = isCurrent
      ? "bg-orange-50/50 border-orange-200 shadow-sm"
      : isPast
        ? "bg-slate-100/70 border-slate-200 text-slate-400"
        : "bg-slate-50 border-slate-100 hover:bg-slate-100/40";
    const timeTextClass = isPast ? "text-slate-500" : "text-slate-700";
    const metaTextClass = isPast ? "text-slate-300" : "text-slate-400";
    const labelBadge = isCurrent
      ? '<span class="text-[9px] bg-orange-500 text-white font-bold px-1.5 py-0.2 rounded animate-pulse">現在</span>'
      : isPast
        ? '<span class="text-[9px] bg-slate-200 text-slate-600 font-bold px-1.5 py-0.2 rounded">過去</span>'
        : "";

    const itemRow = document.createElement("div");
    itemRow.className = `flex items-center justify-between p-3.5 rounded-2xl border transition-custom ${itemRowClass}`;

    itemRow.innerHTML = `
      <div class="flex items-center space-x-3">
        <div class="w-10 text-center shrink-0">
          <span class="text-[9px] font-bold ${metaTextClass} block">時間</span>
          <span class="text-xs font-black ${timeTextClass}">${dp.hour}:00</span>
          <span class="text-[9px] font-bold ${metaTextClass} block">${dp.dateKey.slice(5).replace("-", "/")}</span>
        </div>
        <div class="w-2.5 h-10 rounded-full ${dp.meta.indicator}"></div>
        <div>
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-bold text-slate-800">${dp.meta.label}</span>
            ${labelBadge}
          </div>
          <p class="text-[9px] text-slate-400">気温 ${dp.temp.toFixed(1)}℃ / 風速 ${dp.wind.toFixed(1)}m/s / 日射 ${dp.rad.toFixed(0)}W</p>
        </div>
      </div>

      <div class="text-right shrink-0">
        <span class="text-[9px] font-bold text-slate-400 block">路面予測</span>
        <span class="text-xs font-black ${dp.meta.textClass}">${dp.surfaceTemp.toFixed(1)}℃</span>
      </div>
    `;
    container.appendChild(itemRow);
  });
}

export function renderHourlyGraphDetails(
  container,
  timelineDisplayPoints,
  isCurrentDayView,
) {
  if (!container) return;

  container.innerHTML = "";

  const getSafetyLabel = (surfaceTemp) => {
    if (surfaceTemp <= 25) return "安全";
    if (surfaceTemp <= 35) return "注意";
    if (surfaceTemp <= 45) return "危険";
    return "絶対NG";
  };

  const strip = document.createElement("div");
  strip.className = "flex items-stretch pr-[35px]";
  strip.style.width = `${timelineDisplayPoints.length * 70 + 35}px`;
  strip.style.marginLeft = "-5px";

  timelineDisplayPoints.forEach((dp) => {
    const card = document.createElement("div");
    card.className = "w-[70px] shrink-0 px-2 py-2";
    card.innerHTML = `
      <div class="space-y-1 text-center">
        <div class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full ${dp.meta.indicator} shrink-0"></span>
          <span class="text-[9px] font-bold leading-tight text-slate-700">${getSafetyLabel(dp.surfaceTemp)}</span>
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
