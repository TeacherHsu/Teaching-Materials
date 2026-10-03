// 字形與部件資料（Make Me a Hanzi，見 public/data/_index/hanzi/LICENSES/）。
// 每冊一檔、用到才載入；載入失敗就當作沒有，形似字照常可以做，只是少了部件標色。
const cache = new Map();
const ready = new Map(); // 已載完的資料，給需要同步取用的活動（字感訓練）

export function loadHanziParts(volume) {
  if (!cache.has(volume)) {
    cache.set(volume, fetch(`data/_index/hanzi/${volume}.json`, { cache: 'force-cache' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { ready.set(volume, data); return data; })
      .catch(() => null));
  }
  return cache.get(volume);
}

/** 已經載完就回傳資料，還沒載完回 null（並開始載入）。 */
export function hanziPartsIfReady(volume) {
  if (!ready.has(volume) && typeof fetch === 'function') loadHanziParts(volume);
  return ready.get(volume) || null;
}
