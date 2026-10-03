// 字形與部件資料（Make Me a Hanzi，見 public/data/_index/hanzi/LICENSES/）。
// 每冊一檔、用到才載入；載入失敗就當作沒有，形似字照常可以做，只是少了部件標色。
const cache = new Map();

export function loadHanziParts(volume) {
  if (!cache.has(volume)) {
    cache.set(volume, fetch(`data/_index/hanzi/${volume}.json`, { cache: 'force-cache' })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null));
  }
  return cache.get(volume);
}
