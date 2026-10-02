// 雄老師「部件拼字」（Partdle）外連。
//
// 雄老師的部件拼字是讀 Google 試算表出題：同一冊共用一份試算表（id＋gid），
// 用 lesson=N 指定課次。所以只要知道每一冊的試算表，就能給每一課產生連結。
// 目前只有翰林六上的表（CF 2026-10-03 提供）；其他冊拿到網址後加一行即可，
// 沒登記的冊別就不顯示入口（不要留一個按了會壞的按鈕）。
const BASE = 'https://gsyan888.blogspot.com/2024/06/html5-fun-partdle.html';

const SHEETS = {
  '115AG6H': { id: '1kBueULlojPOH9E3EZYEUcUAv1HfJm_wULQT1hT2m1nM', gid: '510658925', col: 'R' },
};

/** 回傳該課的部件拼字網址；該冊沒有登記試算表時回 null。 */
export function partdleUrl(lesson) {
  const sheet = lesson?.volume?.code && SHEETS[lesson.volume.code];
  if (!sheet || !lesson.lesson_no) return null;
  const params = new URLSearchParams({
    by: 'gsyan',
    id: sheet.id,
    gid: sheet.gid,
    autostart: '1',
    col: sheet.col,
    lesson: String(lesson.lesson_no),
  });
  return `${BASE}?${params.toString()}`;
}
