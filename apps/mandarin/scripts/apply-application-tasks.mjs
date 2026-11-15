#!/usr/bin/env node
/**
 * 把「我會應用」的生活任務寫進課次資料（tools/application-tasks/<冊別>.json → lesson.application）。
 *
 * 任務是新編內容，正本放在清單裡、不直接手改課次 JSON：重新匯入課次會把 application 洗掉，
 * 重跑這支就補回來。清單的 status 是 draft 時以草稿寫入（只有預覽模式看得到，正式建置會濾掉）；
 * CF 核准後把清單（或個別任務）的 status 改成 approved、補 approved_by／approved_on 再跑一次。
 *
 * 清單寫法（為了好讀好審，題目用陣列）：
 *   q: [題目, 正確答案, 錯誤選項…, 說明]　　最後一項是說明，第二項一定是正解
 *   keys: { q1: ["字詞"], response: [...] }　選填，手動指定答錯時要畫顏色的關鍵字詞（預設自動找）
 *   write.pattern: 本課句型 id 的結尾（例如 "04"、"6d3aae08"）；沒有合適句型就不寫 write
 * 一年級是「看圖選一句話」：items: [{ word, q: [正確的句子, 錯誤的句子…] }]，圖用該語詞的語詞圖。
 *
 *   node scripts/apply-application-tasks.mjs          # 只報告
 *   node scripts/apply-application-tasks.mjs --write  # 實際改寫
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dataRoot = fileURLToPath(new URL('../public/data/', import.meta.url));
const taskRoot = fileURLToPath(new URL('../tools/application-tasks/', import.meta.url));
const write = process.argv.includes('--write');
let changed = 0;
let problems = 0;
const fail = (msg) => { console.error(`  [有問題] ${msg}`); problems += 1; };

const lcs = (a, b) => {
  let best = '';
  for (let i = 0; i < a.length; i += 1) {
    for (let j = i + best.length + 1; j <= a.length; j += 1) {
      if (b.includes(a.slice(i, j))) best = a.slice(i, j); else break;
    }
  }
  return best;
};

/**
 * 答錯一次時要在短文上畫顏色的關鍵字詞（CF 2026-11-15）。
 * 先找「正確答案和短文重疊的那一段」（答案是「晚上九點」，短文裡就畫「晚上九點」）；
 * 找不到（答案是換句話說的）就用說明裡引用的短文原句。清單可以用 keys 手動指定。
 */
const evidenceFor = (passage, answer, explanation, manual) => {
  const text = passage.replace(/\n/g, '');
  if (manual) return manual;
  const overlap = lcs(answer, text).replace(/^[，。、！？\s]+|[，。、！？\s]+$/gu, '');
  if ([...overlap].length >= 3 || ([...overlap].length === 2 && [...answer].length <= 4)) return [overlap];
  const quoted = [...explanation.matchAll(/「([^「」]+)」/gu)]
    .map((m) => m[1].replace(/[。！？]$/u, ''))
    .filter((q) => [...q].length >= 3 && text.includes(q));
  return quoted;
};

const choice = (id, row, passage = '', manual = null) => {
  const [question, answer, ...rest] = row;
  const explanation = rest.pop();
  const item = { id, question, options: [answer, ...rest], answer, explanation };
  if (passage) {
    const evidence = evidenceFor(passage, answer, explanation, manual);
    for (const phrase of evidence) if (!passage.replace(/\n/g, '').includes(phrase)) fail(`${id} 的關鍵字詞「${phrase}」不在短文卡上`);
    if (evidence.length) item.evidence = evidence;
  }
  return item;
};

for (const name of readdirSync(taskRoot).filter((f) => f.endsWith('.json')).sort()) {
  const set = JSON.parse(readFileSync(join(taskRoot, name), 'utf8'));
  let count = 0;
  for (const task of set.tasks) {
    const path = join(dataRoot, set.volume, `lesson${String(task.lesson).padStart(2, '0')}.json`);
    const data = JSON.parse(readFileSync(path, 'utf8'));
    const label = `${set.volume} 第 ${task.lesson} 課`;
    const status = (task.status || set.status) === 'approved' ? 'approved' : 'draft';
    const id = `application:${data.lesson_id}`;
    const words = new Map((data.words || []).map((w) => [w.word, w]));
    const base = {
      id,
      status,
      source: status === 'approved'
        ? `original（${set.drafted_by}，${task.approved_by || set.approved_by} ${task.approved_on || set.approved_on} 核准；自編內容，非課文）`
        : `original:draft（${set.drafted_on} ${set.drafted_by}，待 CF 審核；自編內容，非課文）`,
    };
    if (status === 'approved') {
      base.approved_by = task.approved_by || set.approved_by;
      base.approved_on = task.approved_on || set.approved_on;
    }
    let application;
    if (task.items) {
      // 看圖選一句話
      const items = [];
      for (const [i, item] of task.items.entries()) {
        const word = words.get(item.word);
        if (!word?.image) { fail(`${label}「${item.word}」沒有語詞圖`); continue; }
        const [answer, ...wrong] = item.q;
        if (!answer.includes(item.word)) fail(`${label}「${item.word}」的正確句子沒有用到這個語詞`);
        items.push({ id: `${id}:p${i + 1}`, word: item.word, image: word.image, options: [answer, ...wrong], answer });
      }
      application = { ...base, kind: '看圖選一句話', variant: 'picture', items };
    } else {
      for (const w of task.lesson_words) {
        if (!words.has(w) || !task.passage.includes(w)) fail(`${label}「${w}」不是本課語詞，或沒有出現在短文裡`);
      }
      // 關鍵字詞可以落在標題或署名（「誰寫給誰」的線索就在那裡），所以拿整張卡的文字來找
      const cardText = [task.title, task.passage, task.signature].filter(Boolean).join('\n');
      application = {
        ...base,
        kind: task.kind,
        situation: task.situation,
        title: task.title,
        passage: task.passage,
        signature: task.signature,
        lesson_words: task.lesson_words,
        questions: task.questions.map((row, i) => choice(`${id}:q${i + 1}`, row, cardText, task.keys?.[`q${i + 1}`])),
        response: choice(`${id}:response`, task.response, cardText, task.keys?.response),
      };
      if (task.write) {
        const pattern = (data.sentence_patterns || []).find((p) => p.id.endsWith(`:${task.write.pattern}`));
        if (!pattern) fail(`${label} 找不到句型 ${task.write.pattern}`);
        else application.write = { prompt: task.write.prompt, model: task.write.model, pattern_id: pattern.id };
      }
    }
    const moduleEntry = status === 'approved'
      ? { label: '我會應用', status: 'available', activity: 'application' }
      : { label: '我會應用', status: 'missing', activity: 'application', note: '生活任務已草擬，待 CF 審核。' };
    const before = JSON.stringify([data.application, data.modules.application]);
    data.application = application;
    data.modules.application = moduleEntry;
    if (JSON.stringify([data.application, data.modules.application]) !== before) {
      changed += 1;
      if (write) writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
    }
    count += 1;
  }
  console.log(`  ${set.volume}：${count} 課`);
}
console.log(`${write ? '已改寫' : '需要改寫'} ${changed} 課的生活任務；有問題 ${problems} 筆。`);
if (problems) process.exit(1);
