import {
  CANVAS_HEIGHT,
  GRAPH_PADDING_LEFT,
  HOUR_STEP_WIDTH,
} from "./constants.js";
import { getJstDateParts, getJstHour } from "./utils/date.js";
import { getWeatherLabel } from "./utils/weather.js";
import {
  calculateVerifiedSurfaceTemperature,
  getStatusMetadata,
} from "./utils/temperature.js";
import {
  getIpGeolocation,
  reverseGeocodeMunicipality,
} from "./services/geolocation.js";
import { fetchWeatherForecast } from "./services/weather.js";
import { renderResultCard } from "./render/result-card.js";
import { renderHourlyGraphDetails } from "./render/timeline.js";
import { drawCanvasGraph } from "./canvas/graph.js";

// グローバルデータ保持
let weatherForecastData = null;
let selectedDayOffset = 0; // 0: 今日, 1: 明日, 2: 明後日

// グラフ描画・スクロール用システム（DOMContentLoadedで安全に初期化）
let canvas, ctx, scrollArea, outerContainer;

// ドラッグ制御用ステート
let isDragging = false;
let startX = 0;
let scrollLeftOffset = 0; // 現在のスクロール量
let maxScrollWidth = 1200; // 24時間の幅合計
let viewportWidth = 0;
let daySyncTimer = null;

// グラフエリア（Canvasサイズ設定）
const canvasHeight = CANVAS_HEIGHT;
const hourStepWidth = HOUR_STEP_WIDTH; // 1時間あたりの幅px
const graphPaddingLeft = GRAPH_PADDING_LEFT;
let graphRenderToken = 0;

// --- DOM要素とイベントリスナーの安全な初期化処理 ---
function initDOMElements() {
  canvas = document.getElementById("line-graph-canvas");
  if (canvas) {
    ctx = canvas.getContext("2d");
  }
  scrollArea = document.getElementById("graph-scroll-area");
  outerContainer = document.querySelector(".graph-outer-container");
}

function getForecastBaseDateKey() {
  return weatherForecastData?.hourly?.time?.[0]?.slice(0, 10) || "";
}

function getCurrentForecastDayOffset() {
  const baseDateKey = getForecastBaseDateKey();
  if (!baseDateKey) return 0;

  const { year, month, day } = getJstDateParts(new Date());
  const currentDate = new Date(Date.UTC(year, month - 1, day));
  const [baseYear, baseMonth, baseDay] = baseDateKey
    .split("-")
    .map(Number);
  const baseDate = new Date(Date.UTC(baseYear, baseMonth - 1, baseDay));

  return Math.max(
    0,
    Math.round((currentDate.getTime() - baseDate.getTime()) / 86400000),
  );
}

function startDaySyncTimer() {
  if (daySyncTimer) return;

  daySyncTimer = window.setInterval(() => {
    if (!weatherForecastData) return;

    const currentOffset = getCurrentForecastDayOffset();
    if (selectedDayOffset <= currentOffset) {
      selectedDayOffset = currentOffset;
      renderActiveDayTimelineAndGraph();
    }
  }, 10000);
}

function setupEventListeners() {
  // 日付タブ
  for (let i = 0; i < 3; i++) {
    const tab = document.getElementById(`day-tab-${i}`);
    if (tab) {
      tab.addEventListener("click", () => changeActiveDay(i));
    }
  }

  // GPS取得・デモデータ
  document
    .getElementById("gps-load-button")
    ?.addEventListener("click", getGeolocatedWeather);
  document
    .getElementById("demo-data-button")
    ?.addEventListener("click", tryDemoData);

  // アコーディオン
  ["acc-logic", "acc-safety", "acc-disclaimer", "acc-faq"].forEach((id) => {
    document
      .getElementById(`${id}-button`)
      ?.addEventListener("click", () => toggleAccordion(id));
  });

  if (!scrollArea) return;

  // マウスイベント
  scrollArea.addEventListener("mousedown", (e) =>
    handleDragStart(e.clientX),
  );
  window.addEventListener("mousemove", (e) => handleDragMove(e.clientX));
  window.addEventListener("mouseup", () => handleDragEnd());

  // タッチイベント (スマホ・タブレット対応)
  scrollArea.addEventListener("touchstart", (e) => {
    handleDragStart(e.touches[0].clientX);
  });
  scrollArea.addEventListener("touchmove", (e) => {
    handleDragMove(e.touches[0].clientX);
  });
  scrollArea.addEventListener("touchend", () => {
    handleDragEnd();
  });
}

// --- アコーディオン展開処理 ---
function toggleAccordion(id) {
  const content = document.getElementById(`${id}-content`);
  const icon = document.getElementById(`${id}-icon`);

  if (!content || !icon) return;
  const isHidden = content.classList.contains("hidden");
  if (isHidden) {
    content.classList.remove("hidden");
    icon.classList.add("rotate-180");
  } else {
    content.classList.add("hidden");
    icon.classList.remove("rotate-180");
  }
}

// --- GPS連動およびデータ取得（ハイブリッド位置特定） ---
function getGeolocatedWeather() {
  const loader = document.getElementById("loading-state");
  const errorCard = document.getElementById("error-card");
  const loadingText = document.getElementById("loading-text");

  if (errorCard) errorCard.classList.add("hidden");
  if (loader) loader.classList.remove("hidden");
  if (loadingText) loadingText.innerText = "現在地を特定中...";

  const geoOptions = {
    enableHighAccuracy: false,
    timeout: 8000,
    maximumAge: 300000,
  };

  if (!window.isSecureContext && location.hostname !== "localhost") {
    fallbackToIPGeolocation(
      new Error("secure context required for geolocation"),
    );
    return;
  }

  if (!navigator.geolocation) {
    fallbackToIPGeolocation(new Error("geolocation unavailable"));
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      if (loadingText)
        loadingText.innerText = "都道府県・市区町村名を取得中...";

      try {
        const locationLabel = await reverseGeocodeMunicipality(lat, lon);
        document.getElementById("location-name").innerText = locationLabel
          ? `${locationLabel} (GPS現在地)`
          : `GPS現在地 (緯度:${lat.toFixed(2)} / 経度:${lon.toFixed(2)})`;
      } catch (error) {
        console.warn("GPS位置の逆ジオコーディングに失敗しました:", error);
        document.getElementById("location-name").innerText =
          `GPS現在地 (緯度:${lat.toFixed(2)} / 経度:${lon.toFixed(2)})`;
      }

      fetchPrediction(lat, lon);
    },
    (error) => {
      console.warn(
        "GPSでの位置情報特定に失敗したため、IP推定に切り替えます:",
        error,
      );
      fallbackToIPGeolocation(error);
    },
    geoOptions,
  );
}

async function fallbackToIPGeolocation(reason) {
  const loadingText = document.getElementById("loading-text");
  if (loadingText)
    loadingText.innerText = "GPSが使えないため、IPから現在地を推定中...";
  try {
    const location = await getIpGeolocation(reason);
    document.getElementById("location-name").innerText = location.label
      ? `${location.label} (IP推定)`
      : "IP推定の現在地";
    if (loadingText) {
      loadingText.innerText =
        location.source === "freeipapi"
          ? "freeipapi.com で位置を推定しました"
          : "ipapi.co で位置を推定しました";
    }
    await fetchPrediction(location.lat, location.lon);
    return true;
  } catch (error) {
    console.error(
      "すべての位置特定APIが失敗しました。デモ地点を表示します。",
      error,
    );
    tryDemoData();
    return false;
  }
}

function tryDemoData() {
  const errorCard = document.getElementById("error-card");
  if (errorCard) errorCard.classList.add("hidden");
  document.getElementById("location-name").innerText =
    "東京都 新宿区 (デモデータ)";
  fetchPrediction(35.69, 139.69);
}

function showError(msg) {
  const loader = document.getElementById("loading-state");
  if (loader) loader.classList.add("hidden");
  const errorCard = document.getElementById("error-card");
  if (errorCard) {
    errorCard.classList.remove("hidden");
    document.getElementById("error-message").innerText = msg;
  }
}

async function fetchPrediction(lat, lon) {
  const loader = document.getElementById("loading-state");
  if (loader) {
    loader.classList.remove("hidden");
    document.getElementById("loading-text").innerText =
      "最新の気象予測データを解析中...";
  }

  let responseData = null;
  try {
    responseData = await fetchWeatherForecast(lat, lon);
  } catch (error) {
    if (loader) loader.classList.add("hidden");
    showError(
      error instanceof Error
        ? error.message
        : "気象予測データのロードに失敗しました。接続状態をご確認ください。",
    );
    return;
  }

  if (loader) loader.classList.add("hidden");

  const iconBox = document.getElementById("location-icon-box");
  if (iconBox)
    iconBox.className = "p-2.5 bg-emerald-50 text-emerald-600 rounded-xl";

  weatherForecastData = responseData;
  renderAllForecasts();
}

function renderAllForecasts() {
  if (!weatherForecastData) return;

  const current = weatherForecastData.current;
  const currentSurface = calculateVerifiedSurfaceTemperature(
    current.temperature_2m,
    current.shortwave_radiation,
    current.wind_speed_10m,
    current.precipitation,
  );
  const meta = getStatusMetadata(currentSurface);

  const resultCard = document.getElementById("result-card");
  renderResultCard(resultCard, current, currentSurface, meta);

  // --- 2. 3日間お散歩タイムラインの更新 ---
  const timelineSection = document.getElementById("timeline-section");
  if (timelineSection) timelineSection.classList.remove("hidden");

  initGraphSizing();
  renderActiveDayTimelineAndGraph(true);
}

function initGraphSizing() {
  if (!outerContainer || !canvas) initDOMElements();
  if (!outerContainer || !canvas) return;

  viewportWidth = outerContainer.clientWidth;
  maxScrollWidth = 2 * graphPaddingLeft + 23 * hourStepWidth;

  // 高DPI(Retina)ディスプレイ対応: Canvasのにじみを除去するスケーリング
  const dpr = window.devicePixelRatio || 1;
  canvas.width = maxScrollWidth * dpr;
  canvas.height = canvasHeight * dpr;

  // CSSによる見た目の寸法は固定
  canvas.style.width = `${maxScrollWidth}px`;
  canvas.style.height = `${canvasHeight}px`;

  // Canvas描画コンテキストをdpr倍して描画
  ctx.resetTransform();
  ctx.scale(dpr, dpr);

  scrollArea.style.width = `${maxScrollWidth}px`;
}

function getMinScroll() {
  if (!scrollArea) {
    return -(maxScrollWidth - viewportWidth);
  }

  return -(scrollArea.offsetWidth - viewportWidth);
}

function updateDayTabUI() {
  const daysText = ["本日", "明日", "明後日"];
  const indicator = document.getElementById("graph-date-indicator");
  if (indicator)
    indicator.innerText = daysText[selectedDayOffset] || "本日";

  for (let i = 0; i < 3; i++) {
    const tab = document.getElementById(`day-tab-${i}`);
    if (!tab) continue;

    if (i === selectedDayOffset) {
      tab.className =
        "day-tab px-3 py-1.5 rounded-lg transition-custom bg-white text-slate-800 shadow-sm";
    } else {
      tab.className =
        "day-tab px-3 py-1.5 rounded-lg transition-custom text-slate-400 hover:text-slate-700";
    }
  }
}

function changeActiveDay(dayOffset) {
  selectedDayOffset = dayOffset;
  updateDayTabUI();
  renderActiveDayTimelineAndGraph();
}

function scrollToX(targetX) {
  if (!scrollArea) return;
  const minScroll = getMinScroll();
  const clampedX = Math.max(minScroll, Math.min(0, targetX));
  scrollLeftOffset = clampedX;
  scrollArea.style.transform = `translateX(${scrollLeftOffset}px)`;
}

function renderActiveDayTimelineAndGraph() {
  if (!weatherForecastData) return;

  const hourly = weatherForecastData.hourly;
  const current = weatherForecastData.current;
  const renderToken = ++graphRenderToken;
  const currentDayOffset = getCurrentForecastDayOffset();
  if (selectedDayOffset <= currentDayOffset) {
    selectedDayOffset = currentDayOffset;
  }
  updateDayTabUI();
  const now = new Date();
  const currentHourVal = getJstHour(now);
  const isCurrentDayView = selectedDayOffset === currentDayOffset;
  const startIndex = selectedDayOffset * 24;
  const endIndex = startIndex + 24;

  const dayDataPoints = [];
  let currentHourIndex = 0;

  for (let idx = startIndex; idx < endIndex; idx++) {
    if (idx >= hourly.time.length) break;

    const timeStr = hourly.time[idx];
    const dateObj = new Date(timeStr);
    const hour = dateObj.getHours();
    // 「現在」セルは正時の予報値でなく、上部カードと同じcurrent(実測)値を使い、両者の表示を一致させる
    const isNowCell = isCurrentDayView && hour === currentHourVal;
    const temp = isNowCell ? current.temperature_2m : hourly.temperature_2m[idx];
    const rad = isNowCell ? current.shortwave_radiation : hourly.shortwave_radiation[idx];
    const wind = isNowCell ? current.wind_speed_10m : hourly.wind_speed_10m[idx];
    const precipitation = isNowCell
      ? (current.precipitation ?? 0)
      : (hourly.precipitation?.[idx] ?? 0);
    const weathercode = isNowCell
      ? (current.weather_code ?? current.weathercode ?? null)
      : (hourly.weather_code?.[idx] ?? hourly.weathercode?.[idx] ?? null);
    const calculatedTs = calculateVerifiedSurfaceTemperature(
      temp,
      rad,
      wind,
      precipitation,
    );
    const weatherLabel = getWeatherLabel(precipitation, weathercode, hour);

    dayDataPoints.push({
      hour,
      temp,
      rad,
      wind,
      precipitation,
      weathercode,
      surfaceTemp: calculatedTs,
      meta: getStatusMetadata(calculatedTs),
      weatherLabel: weatherLabel.label,
    });

    if (isCurrentDayView && hour === currentHourVal) {
      currentHourIndex = idx - startIndex;
    }
  }

  const timelineDisplayPoints = dayDataPoints.map((dp) => ({
    ...dp,
    isCurrent: isCurrentDayView && dp.hour === currentHourVal,
    isPast: isCurrentDayView && dp.hour < currentHourVal,
  }));

  const graphDetailsContainer = document.getElementById(
    "graph-hourly-details",
  );
  renderHourlyGraphDetails(graphDetailsContainer, timelineDisplayPoints);
  const graphDrawPromise = drawCanvasGraph({
    ctx,
    dataPoints: dayDataPoints,
    currentHourVal,
    highlightCurrent: isCurrentDayView,
    maxScrollWidth,
    canvasHeight,
    hourStepWidth,
    graphPaddingLeft,
    shouldAbort: () => renderToken !== graphRenderToken,
  });
  if (graphDrawPromise?.catch) {
    graphDrawPromise.catch((error) => {
      console.error("キャンバス描画に失敗しました:", error);
    });
  }

  const isCompactViewport =
    window.matchMedia("(max-width: 640px)").matches;
  if (isCurrentDayView) {
    const targetPixel = isCompactViewport
      ? currentHourIndex * hourStepWidth - graphPaddingLeft
      : currentHourIndex * hourStepWidth -
        viewportWidth / 2 +
        graphPaddingLeft;
    scrollToX(-targetPixel);
  } else {
    scrollToX(0);
  }

  lucide.createIcons();
}

// --- ドラッグ ＆ スワイプ操作用インタラクション設計 ---
let startClientX = 0;

function handleDragStart(clientX) {
  if (!scrollArea) return;
  isDragging = true;
  startClientX = clientX;
  startX = scrollLeftOffset;
  scrollArea.style.transition = "none";
}

// ラバーバンド効果付きドラッグ
function handleDragMove(clientX) {
  if (!isDragging || !scrollArea) return;
  const deltaX = clientX - startClientX;
  let targetX = startX + deltaX;

  const minScroll = getMinScroll();
  if (targetX > 0) {
    targetX = targetX * 0.3;
  } else if (targetX < minScroll) {
    targetX = minScroll + (targetX - minScroll) * 0.3;
  }

  scrollLeftOffset = targetX;
  scrollArea.style.transform = `translateX(${scrollLeftOffset}px)`;
}

// 滑らかなスナップ補正
function handleDragEnd() {
  if (!isDragging || !scrollArea) return;
  isDragging = false;

  scrollArea.style.transition =
    "transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)";

  const minScroll = getMinScroll();
  if (scrollLeftOffset > 0) {
    scrollLeftOffset = 0;
  } else if (scrollLeftOffset < minScroll) {
    scrollLeftOffset = minScroll;
  }

  const itemSnappedIndex = Math.round(
    Math.abs(scrollLeftOffset) / hourStepWidth,
  );
  scrollLeftOffset = -(itemSnappedIndex * hourStepWidth);

  if (scrollLeftOffset > 0) scrollLeftOffset = 0;
  if (scrollLeftOffset < minScroll) scrollLeftOffset = minScroll;
  // minScrollはhourStepWidthの倍数とは限らないため、丸め後も端まで届かず
  // 最後の列が半端に切れて止まることがある。端に近ければ端まで詰める。
  if (scrollLeftOffset - minScroll <= hourStepWidth) {
    scrollLeftOffset = minScroll;
  }

  scrollArea.style.transform = `translateX(${scrollLeftOffset}px)`;
}

// 画面幅変化時の自動リサイズ
window.addEventListener("resize", () => {
  if (weatherForecastData) {
    initGraphSizing();
    renderActiveDayTimelineAndGraph();
  }
});

// DOM構築完了後に安全に起動
document.addEventListener("DOMContentLoaded", () => {
  initDOMElements();
  setupEventListeners();
  lucide.createIcons();
  startDaySyncTimer();

  // 起動時に白紙画面を防ぐため、自動で東京の天気予測をロード（親切なUX設計）
  tryDemoData();
});
