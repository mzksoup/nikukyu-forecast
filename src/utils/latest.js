/**
 * 「最後に始めた処理の結果だけを使う」ための番号札。
 * 遅れて届いた古い応答が、新しい応答を上書きするのを防ぐ。
 * @returns {() => () => boolean} newRequest()を呼ぶたびに、その処理が最新か答える関数を返す
 */
export function createLatestGuard() {
  let latest = 0;
  return () => {
    const mine = ++latest;
    return () => mine === latest;
  };
}
