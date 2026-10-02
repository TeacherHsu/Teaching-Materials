// 雄老師「部件拼字」（Partdle）外連。
//
// 雄老師的部件拼字是讀同一份 Google 試算表出題：各冊共用 id＋gid，
// 用 col 指定是哪一冊（試算表的欄）、lesson=N 指定課次。
// 欄位對照由 CF 2026-10-03 提供；沒登記的冊別就不顯示入口
// （不要留一個按了會壞的按鈕）。
const BASE = 'https://gsyan888.blogspot.com/2024/06/html5-fun-partdle.html';

const SHEET_ID = '1kBueULlojPOH9E3EZYEUcUAv1HfJm_wULQT1hT2m1nM';
const SHEET_GID = '510658925';

// 冊別 → 試算表欄位
const COLUMNS = {
  '115AG1H': 'M', // 翰林一上
  '115AG2H': 'N', // 翰林二上
  '115AG3H': 'O', // 翰林三上
  '115AG4K': 'J', // 康軒四上
  '115AG6H': 'R', // 翰林六上
};

/** 回傳該課的部件拼字網址；該冊沒有登記試算表時回 null。 */
export function partdleUrl(lesson) {
  const col = lesson?.volume?.code && COLUMNS[lesson.volume.code];
  if (!col || !lesson.lesson_no) return null;
  const params = new URLSearchParams({
    by: 'gsyan',
    id: SHEET_ID,
    gid: SHEET_GID,
    autostart: '1',
    col,
    lesson: String(lesson.lesson_no),
  });
  return `${BASE}?${params.toString()}`;
}
