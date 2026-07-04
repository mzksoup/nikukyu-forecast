import {
  getMeteoconsImgTag,
  getWeatherIcon,
} from "../utils/weather.js";

function getJstHour() {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tokyo", hour: "2-digit", hour12: false,
  });
  return Number(formatter.format(new Date()));
}

export function renderResultCard(resultCard, current, currentSurface, meta) {
  if (!resultCard) return;

  // 25〜35℃は背景が明るい黄系なので文字色を暗くする
  const isAttention = currentSurface > 25 && currentSurface <= 35;
  const textContrastClass = isAttention ? "text-slate-900" : "text-white";
  const subTextContrastClass = isAttention
    ? "text-slate-750 font-semibold"
    : "text-white/90 font-medium";
  const iconBgContrastClass = isAttention
    ? "bg-black/10 text-slate-900"
    : "bg-white/15 text-white";
  const iconContrastClass = isAttention ? "text-slate-900" : "text-orange-500";
  const weatherCode = current.weather_code ?? current.weathercode;
  const weatherIconName = getWeatherIcon(
    weatherCode,
    current.precipitation,
    getJstHour(),
  );

  resultCard.className = `bg-gradient-to-br ${meta.colorClass} border ${meta.borderClass} rounded-[2.5rem] p-6 ${textContrastClass} relative overflow-hidden shadow-lg transition-custom`;
  resultCard.innerHTML = `
    <div class="absolute -right-12 -bottom-12 text-black/5 select-none pointer-events-none transform rotate-12">
      <i data-lucide="paw-print" class="w-56 h-56"></i>
    </div>

    <div class="relative z-10 space-y-5">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-black tracking-wider bg-black/10 px-3 py-1.5 rounded-full uppercase">現在のお散歩コンディション</span>
        <div class="flex items-center space-x-1.5 text-xs font-bold bg-black/10 px-2.5 py-1 rounded-lg">
          <i data-lucide="wind" class="w-3.5 h-3.5"></i>
          <span>風速: ${current.wind_speed_10m.toFixed(1)} m/s</span>
        </div>
      </div>

      <div class="flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="text-center md:text-left space-y-2">
          <h2 class="text-2xl md:text-4xl font-black tracking-tight">${meta.label}</h2>
          <p class="text-xs ${subTextContrastClass} max-w-md leading-relaxed">${meta.advice}</p>
        </div>

        <div class="${iconBgContrastClass} backdrop-blur-md rounded-3xl p-4 flex items-center space-x-4 shrink-0 min-w-[210px] justify-center border border-white/10 shadow-inner">
          <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
            <i data-lucide="${meta.icon}" class="w-6 h-6 ${iconContrastClass}"></i>
          </div>
          <div class="text-left">
            <span class="text-[10px] font-bold block opacity-80">推定アスファルト温度</span>
            <div class="text-3xl font-black tracking-tight">${currentSurface.toFixed(1)} <span class="text-lg font-normal">℃</span></div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2.5 pt-3.5 border-t border-black/10 text-xs text-center">
        <div class="bg-black/5 p-3 rounded-xl min-h-[84px] flex flex-col justify-center items-center">
          <span class="text-[10px] block opacity-60">周辺気温</span>
          <span class="font-bold text-sm leading-none mt-2">${current.temperature_2m.toFixed(1)} ℃</span>
        </div>
        <div class="bg-black/5 p-3 rounded-xl min-h-[84px] flex flex-col justify-center items-center">
          <span class="text-[10px] block opacity-60">日射エネルギー</span>
          <span class="font-bold text-sm leading-none mt-2">${current.shortwave_radiation.toFixed(0)} W/m²</span>
        </div>
        <div class="bg-black/5 p-3 rounded-xl min-h-[84px] flex items-center justify-center">
          <div class="flex items-center justify-center gap-2">
            <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm overflow-hidden">
              ${getMeteoconsImgTag(weatherIconName, 48)}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
