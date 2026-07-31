export const CANVAS_HEIGHT = 260;
export const HOUR_STEP_WIDTH = 70;
// 目盛りラベル欄(0℃〜60℃の文字幅)と最初の点(マーカー含む)が重ならないだけの余白が必要
export const GRAPH_PADDING_LEFT = 44;

// 路面温度の危険度境界(℃)。安全/注意/危険/絶対NGの4段階を分ける値で、
// 状態判定(temperature.js)・カード文字色(result-card.js)・グラフ背景帯(graph.js)が
// 同じ境界を参照する
export const SURFACE_TEMP_SAFE_MAX = 25;
export const SURFACE_TEMP_CAUTION_MAX = 35;
export const SURFACE_TEMP_DANGER_MAX = 45;
