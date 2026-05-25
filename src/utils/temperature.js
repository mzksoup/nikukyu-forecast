export function calculateAdvancedSurfaceTemperature(Ta, Rs, U) {
  const absorbedSolar = Rs * 0.85;
  const heatTransferCoeff = 10.0 + 4.0 * Math.max(0.1, U);

  let longwaveCooling = 0;
  if (Rs < 10) {
    longwaveCooling = -3.5 * (1.0 - U * 0.05);
  }

  let tempRise = 0;
  if (absorbedSolar > 0) {
    tempRise = absorbedSolar / heatTransferCoeff;
    if (tempRise > 25) {
      tempRise = 25 + (tempRise - 25) * 0.5;
    }
  }

  const estimatedTs = Ta + tempRise + longwaveCooling;
  return Math.max(-15, Math.min(75, estimatedTs));
}

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
