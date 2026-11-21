// CSSの元になるクラス名を探す場所。クラス名は、完成した文字列としてコードに書く
// (例: `bg-${color}-500` のような組み立ては、見つからずCSSが作られない)
module.exports = {
  content: ["./index.html", "./src/**/*.js"],
  theme: { extend: {} },
  plugins: [],
};
