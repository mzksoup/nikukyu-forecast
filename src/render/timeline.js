export function renderTimelineCards(container, timelineDisplayPoints, isCurrentDayView) {
  if (!container) return;

  container.innerHTML = "";

  timelineDisplayPoints.forEach((dp, i) => {
    const isCurrent = isCurrentDayView && i === 0;
    const itemRow = document.createElement("div");
    itemRow.className = `flex items-center justify-between p-3.5 rounded-2xl border transition-custom ${
      isCurrent
        ? "bg-orange-50/50 border-orange-200 shadow-sm"
        : "bg-slate-50 border-slate-100 hover:bg-slate-100/40"
    }`;

    itemRow.innerHTML = `
      <div class="flex items-center space-x-3">
        <div class="w-10 text-center shrink-0">
          <span class="text-[9px] font-bold text-slate-400 block">時間</span>
          <span class="text-xs font-black text-slate-700">${dp.hour}:00</span>
          <span class="text-[9px] font-bold text-slate-400 block">${dp.dateKey.slice(5).replace("-", "/")}</span>
        </div>
        <div class="w-2.5 h-10 rounded-full ${dp.meta.indicator}"></div>
        <div>
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-bold text-slate-800">${dp.meta.label}</span>
            ${isCurrent ? '<span class="text-[9px] bg-orange-500 text-white font-bold px-1.5 py-0.2 rounded animate-pulse">現在</span>' : ""}
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
