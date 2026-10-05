// 語音辨識紀錄（2026-10-06 CF）：只存文字，不存聲音。
// 每次辨識記下「目標／電腦聽到的候選／判定」，累積一段時間就看得出哪些字詞最常被誤判，
// 再針對那些字調整。存在這台載具的瀏覽器，教師頁可以看、複製、清除。最多留 500 筆。
import { getStudentCode } from './deviceSettings.js';

const KEY = 'mandarin.asrLog';
const MAX = 500;

export function readAsrLog() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

/** @param {{lessonId:string, module:string, target:string, heard:string[], ok:boolean, accuracy?:number}} entry */
export function logAsr(entry) {
  try {
    const all = readAsrLog();
    all.push({
      at: new Date().toISOString().slice(0, 16).replace('T', ' '),
      code: getStudentCode() || '',
      lessonId: entry.lessonId || '',
      module: entry.module,
      target: entry.target,
      heard: (entry.heard || []).slice(0, 5),
      ok: Boolean(entry.ok),
      accuracy: entry.accuracy ?? null,
    });
    localStorage.setItem(KEY, JSON.stringify(all.slice(-MAX)));
  } catch { /* 無痕模式記不住，不影響操作 */ }
}

export function clearAsrLog() {
  try { localStorage.removeItem(KEY); } catch { /* 無痕 */ }
}

/** 最常被判錯的目標（給老師看哪些字詞要調整）。 */
export function asrProblemTargets(log = readAsrLog(), top = 10) {
  const stat = new Map();
  log.forEach((e) => {
    const s = stat.get(e.target) || { target: e.target, tries: 0, misses: 0, heard: new Set() };
    s.tries += 1;
    if (!e.ok) { s.misses += 1; if (e.heard[0]) s.heard.add(e.heard[0]); }
    stat.set(e.target, s);
  });
  return [...stat.values()].filter((s) => s.misses).sort((a, b) => b.misses - a.misses).slice(0, top)
    .map((s) => ({ ...s, heard: [...s.heard].slice(0, 3) }));
}
