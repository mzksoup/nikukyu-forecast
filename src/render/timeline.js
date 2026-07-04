export function renderHourlyGraphDetails(
  container,
  timelineDisplayPoints,
  isCurrentDayView,
) {
  if (!container) return;

  container.innerHTML = "";

  const strip = document.createElement("div");
  strip.className = "flex items-stretch pr-[35px]";
  strip.style.width = `${timelineDisplayPoints.length * 70 + 35}px`;
  strip.style.marginLeft = "-5px";

  timelineDisplayPoints.forEach((dp) => {
    const isCurrent = Boolean(dp.isCurrent);
    const isCurrentClass = isCurrent ? "bg-[rgba(249,115,22,0.08)]" : "bg-transparent";
    const card = document.createElement("div");
    card.className = `w-[70px] shrink-0 px-1.5 py-2 transition-custom ${isCurrentClass}`;
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
