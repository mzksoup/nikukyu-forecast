import {
  getMeteoconsImgTag,
  getWeatherIcon,
} from "../utils/weather.js";
import { getJstHour } from "../utils/date.js";
import {
  SURFACE_TEMP_SAFE_MAX,
  SURFACE_TEMP_CAUTION_MAX,
} from "../constants.js";

export function renderResultCard(resultCard, current, currentSurface, meta) {
  if (!resultCard) return;

  // 25〜35℃(注意帯)は背景が明るい黄系なので文字色を暗くする
  const isAttention =
    currentSurface > SURFACE_TEMP_SAFE_MAX &&
    currentSurface <= SURFACE_TEMP_CAUTION_MAX;
  const textContrastClass = isAttention ? "text-[#1A1A1A]" : "text-white";
  const subTextContrastClass = isAttention ? "text-[#1A1A1A] font-bold" : "text-white font-bold";
  const iconBgContrastClass = isAttention ? "bg-black/10 text-[#1A1A1A]" : "bg-black/20 text-white";
  const iconContrastClass = "text-[#1A1A1A]";
  const weatherCode = current.weather_code ?? current.weathercode;
  const weatherIconName = getWeatherIcon(
    weatherCode,
    current.precipitation,
    getJstHour(),
  );

  resultCard.className = `${meta.colorClass} border-2 ${meta.borderClass} p-6 ${textContrastClass} relative overflow-hidden transition-custom`;
  resultCard.innerHTML = `
    <div class="absolute -right-12 -bottom-12 text-black/5 select-none pointer-events-none">
      <i data-lucide="paw-print" class="w-56 h-56"></i>
    </div>

    <div class="relative z-10 space-y-5">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold tracking-wider bg-black/10 px-3 py-1.5 uppercase">現在のお散歩コンディション</span>
        <div class="flex items-center space-x-1.5 text-xs font-bold bg-black/10 px-2.5 py-1">
          <i data-lucide="thermometer" class="w-3.5 h-3.5"></i>
          <span>周辺気温: ${current.temperature_2m.toFixed(1)} ℃</span>
        </div>
      </div>

      <div class="flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="text-center md:text-left space-y-2">
          <h2 class="text-2xl md:text-4xl font-bold tracking-tight">${meta.label}</h2>
          <p class="text-xs ${subTextContrastClass} max-w-md leading-relaxed">${meta.advice}</p>
        </div>

        <div class="${iconBgContrastClass} p-4 flex items-center space-x-4 shrink-0 min-w-[210px] justify-center">
          <div class="w-12 h-12 bg-white flex items-center justify-center">
            <i data-lucide="${meta.icon}" class="w-6 h-6 ${iconContrastClass}"></i>
          </div>
          <div class="text-left">
            <span class="text-[10px] font-bold block">推定アスファルト温度</span>
            <div class="text-3xl font-bold tracking-tight">${currentSurface.toFixed(1)} <span class="text-lg font-normal">℃</span></div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2.5 pt-3.5 border-t border-black/10 text-xs text-center">
        <div class="bg-black/10 p-3 min-h-[84px] flex items-center justify-center">
          <div class="flex items-center justify-center gap-2">
            <div class="w-12 h-12 bg-white flex items-center justify-center overflow-hidden">
              ${getMeteoconsImgTag(weatherIconName, 48)}
            </div>
          </div>
        </div>
        <div class="bg-black/10 p-3 min-h-[84px] flex flex-col justify-center items-center">
          <span class="text-[10px] block">日射エネルギー</span>
          <span class="font-bold text-sm leading-none mt-2">${current.shortwave_radiation.toFixed(0)} W/m²</span>
        </div>
        <div class="bg-black/10 p-3 min-h-[84px] flex flex-col justify-center items-center">
          <span class="text-[10px] block">風速</span>
          <span class="font-bold text-sm leading-none mt-2">${current.wind_speed_10m.toFixed(1)} m/s</span>
        </div>
      </div>
    </div>
  `;
}
