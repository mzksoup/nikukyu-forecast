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
  value = -(itemSnappedIndex * hourStepWidth) || 0; // -0を0に正規化

  if (value > 0) value = 0;
  if (value < minScroll) value = minScroll;
  // minScrollはhourStepWidthの倍数とは限らないため、丸め後も端まで届かず
  // 最後の列が半端に切れて止まることがある。端に近ければ端まで詰める。
  // ただしvalue<0を条件に加えないと、スクロール可能量がhourStepWidth未満の
  // ときvalue===0(左端)でも常にminScrollへ吸着し、左端に戻れなくなる。
  if (value < 0 && value - minScroll <= hourStepWidth) {
    value = minScroll;
  }

  return value;
}

/**
 * グラフをキーボードで動かす時の、移動先のスクロールオフセット
 * @param {string} key KeyboardEvent.key
 * @param {number} offset 現在のスクロールオフセット(0以下)
 * @returns {number|null} 移動先。対象外のキーはnull
 */
export function keyboardScrollTarget(key, offset, minScroll, hourStepWidth) {
  if (key === "Home") return 0;
  if (key === "End") return minScroll;
  // →は後の時間帯を見る(内容が左へ動く)ので、オフセットは減る
  if (key === "ArrowRight") return snapScrollOffset(offset - hourStepWidth, minScroll, hourStepWidth);
  if (key === "ArrowLeft") return snapScrollOffset(offset + hourStepWidth, minScroll, hourStepWidth);
  return null;
}
