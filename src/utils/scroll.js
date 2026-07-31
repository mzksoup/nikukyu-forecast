/**
 * ドラッグ終了時のグラフスクロール位置を、列(hourStepWidth)単位にスナップする
 * @param {number} offset 現在のスクロールオフセット(0以下)
 * @param {number} minScroll スクロール可能な左限界(0以下、必ずしもhourStepWidthの倍数ではない)
 * @param {number} hourStepWidth 1列あたりの幅(px)
 * @returns {number} スナップ後のオフセット
 */
export function snapScrollOffset(offset, minScroll, hourStepWidth) {
  let value = offset;
  if (value > 0) {
    value = 0;
  } else if (value < minScroll) {
    value = minScroll;
  }

  const itemSnappedIndex = Math.round(Math.abs(value) / hourStepWidth);
  value = -(itemSnappedIndex * hourStepWidth);

  if (value > 0) value = 0;
  if (value < minScroll) value = minScroll;
  // minScrollはhourStepWidthの倍数とは限らないため、丸め後も端まで届かず
  // 最後の列が半端に切れて止まることがある。端に近ければ端まで詰める。
  if (value - minScroll <= hourStepWidth) {
    value = minScroll;
  }

  return value;
}
