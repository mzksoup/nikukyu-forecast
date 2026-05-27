/**
 * 高精度アスファルト路面温度推定（相当外気温度モデル準拠）
 * @param {number|string} Ta 気温 (℃)
 * @param {number|string} Rs 日射量 (W/m²)
 * @param {number|string} U 風速 (m/s)
 * @returns {number} 推定路面温度 (℃)
 */
export function calculateVerifiedSurfaceTemperature(Ta, Rs, U) {
  const tempAir = Number(Ta);
  const solarRad = Number(Rs);
  const windSpeed = Number(U);

  const absorbedSolar = solarRad * 0.85;
  const heatTransferCoeff = 5.6 + 3.9 * Math.max(0, windSpeed) + 5.0;
  const tempRise = absorbedSolar / heatTransferCoeff;

  return tempAir + tempRise;
}

export const calculateAdvancedSurfaceTemperature =
  calculateVerifiedSurfaceTemperature;

export function getStatusMetadata(surfaceTemp) {
  if (surfaceTemp <= 25) {
    return {
      label: "安全（お散歩に最適）",
      colorClass: "from-emerald-500 to-teal-600",
      borderClass: "border-emerald-200",
      textClass: "text-emerald-600",
      bgClass: "bg-emerald-50 text-emerald-800",
      indicator: "bg-emerald-500",
      chartColor: "#10b981",
      icon: "smile",
      advice:
        "路面温度が低く安全です。肉球へのダメージの心配はなく、快適にお散歩ができます。",
    };
  }

  if (surfaceTemp <= 35) {
    return {
      label: "注意（日陰を選んで）",
      colorClass: "from-yellow-400 to-amber-500 text-slate-900",
      borderClass: "border-yellow-300",
      textClass: "text-amber-600",
      bgClass: "bg-yellow-50 text-yellow-900 border border-yellow-100",
      indicator: "bg-yellow-400",
      chartColor: "#eab308",
      icon: "meh",
      advice:
        "アスファルトが温まっています。可能な限り影を歩くか、芝生・草むらルートを選択してください。",
    };
  }

  if (surfaceTemp <= 45) {
    return {
      label: "危険（日向は絶対NG）",
      colorClass: "from-orange-500 to-red-500",
      borderClass: "border-orange-300",
      textClass: "text-orange-600",
      bgClass: "bg-orange-50 text-orange-800",
      indicator: "bg-orange-500",
      chartColor: "#f97316",
      icon: "frown",
      advice:
        "数分で肉球に火傷を負う恐れがあります。アスファルトからの距離が近いワンちゃんは熱中症の危険大です。",
    };
  }

  return {
    label: "絶対NG（重大な火傷リスク）",
    colorClass: "from-rose-600 to-red-800",
    borderClass: "border-rose-400",
    textClass: "text-rose-600",
    bgClass: "bg-rose-50 text-rose-800",
    indicator: "bg-rose-600",
    chartColor: "#e11d48",
    icon: "alert-triangle",
    advice:
      "路面はフライパン状態です。一瞬の接触でも極めて危険なため、地面が完全に冷めるまで外出は控えてください。",
  };
}
