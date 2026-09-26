// 將 G6A 形似字選項同步為官方形似字辨別題庫核定的字形群組。
// 私有官方資料只在本機讀取，不會寫入公開網站；執行時傳入 sped-os 根目錄。
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const privateRoot = resolve(process.argv[2] || resolve(repoRoot, '../../../'));
const batchRoot = resolve(privateRoot, 'worksheet-batches/115/115G6A_國語 翰');
const wordwallRoot = resolve(batchRoot, '04_內容資料與草案/wordwall_形似字辨別_電子遊戲');
const sourceRoot = resolve(
  batchRoot,
  '04_內容資料與草案/99_退件隔離_20260730/成果/全課重建_待QA_20260729/02_JSON/形似字',
);
const correctedRoot = resolve(batchRoot, '05_樣張待確認/前一版定點修正_20260801/02_JSON/形似字');
const publicRoot = resolve(repoRoot, 'public/data/115AG6H');
const approvedManifestPath = resolve(repoRoot, 'docs/lookalike-approved-groups.json');

const fallbackExamples = {
  垠: '無垠', 很: '很好', 恨: '仇恨', 殆: '殆盡', 紈: '紈絝', 悌: '孝悌', 孰: '孰是孰非',
  溉: '灌溉', 貽: '貽笑大方', 跆: '跆拳道', 葷: '葷食', 誆: '誆騙', 飴: '飴糖', 滲: '滲透',
  墳: '墳墓', 辦: '辦法', 瓣: '花瓣', 辮: '辮子', 表: '表格', 毒: '毒藥', 殉: '殉職',
  責: '責任', 勝: '勝利', 詢: '詢問', 謄: '謄寫', 阻: '阻止', 祖: '祖先', 租: '租借',
  組: '組合', 啼: '啼哭', 蹄: '馬蹄', 檻: '門檻', 藍: '藍天', 籃: '籃球',
};

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function addExample(map, char, example) {
  if (!map.has(char) && example?.includes(char)) map.set(char, example);
}

function collectSourceExamples(map, path) {
  try {
    const data = readJson(path);
    for (const lesson of data.lessons || []) {
      for (const row of lesson.items || []) {
        for (const cell of row) {
          for (const term of String(cell).split('、')) {
            for (const char of term) addExample(map, char, cell);
          }
        }
      }
    }
  } catch {
    // 某些課沒有定點修正檔，使用全課官方快照即可。
  }
}

function officialGroups(lessonNo) {
  const file = resolve(wordwallRoot, `L${String(lessonNo).padStart(2, '0')}_形似字辨別_Quiz.json`);
  const data = readJson(file);
  const groups = [];
  const seen = new Set();
  for (const item of data.items || []) {
    const chars = [...new Set(item.official_shape_group || [])];
    const key = [...chars].sort().join('');
    if (chars.length >= 2 && !seen.has(key)) {
      seen.add(key);
      groups.push(chars);
    }
  }
  return groups;
}

const approvedGroups = { '115AG1H': {}, '115AG3H': {}, '115AG6H': {} };

for (let lessonNo = 1; lessonNo <= 12; lessonNo += 1) {
  const lessonPath = resolve(publicRoot, `lesson${String(lessonNo).padStart(2, '0')}.json`);
  const lesson = readJson(lessonPath);
  const examples = new Map();
  for (const item of lesson.lookalikes || []) {
    for (const charItem of item.chars || []) addExample(examples, charItem.char, charItem.example);
  }
  for (const charItem of lesson.characters || []) {
    for (const example of charItem.examples || []) addExample(examples, charItem.char, example);
  }
  collectSourceExamples(examples, resolve(sourceRoot, `115G6A_L${String(lessonNo).padStart(2, '0')}_形似字_官方.json`));
  collectSourceExamples(examples, resolve(correctedRoot, `115G6A_L${String(lessonNo).padStart(2, '0')}_形似字_官方直抽修正.json`));
  for (const [char, example] of Object.entries(fallbackExamples)) addExample(examples, char, example);

  const groups = officialGroups(lessonNo);
  lesson.lookalikes = groups.map((chars, index) => ({
    id: `lookalike:115AG6H${String(lessonNo).padStart(2, '0')}:${String(index + 1).padStart(2, '0')}`,
    group_no: String(index + 1),
    chars: chars.map((char) => {
      const example = examples.get(char);
      if (!example) throw new Error(`L${lessonNo}: 缺少「${char}」的官方例詞`);
      return { char, example };
    }),
    status: 'ready',
    source: '115G6A／翰林六上官方教材與教師確認資料（05形音輕鬆學：字形辨別；官方形似字辨別題庫核對）',
  }));
  approvedGroups['115AG6H'][`lesson${String(lessonNo).padStart(2, '0')}`] = groups;
  writeFileSync(lessonPath, `${JSON.stringify(lesson, null, 2)}\n`, 'utf8');
  console.log(`同步 G6A 第${lessonNo}課：${groups.length} 組`);
}

for (let lessonNo = 1; lessonNo <= 12; lessonNo += 1) {
  const lessonPath = resolve(repoRoot, `public/data/115AG3H/lesson${String(lessonNo).padStart(2, '0')}.json`);
  try {
    const lesson = readJson(lessonPath);
    approvedGroups['115AG3H'][`lesson${String(lessonNo).padStart(2, '0')}`] =
      (lesson.lookalikes || []).map((group) => group.chars.map((item) => item.char));
  } catch {
    approvedGroups['115AG3H'][`lesson${String(lessonNo).padStart(2, '0')}`] = [];
  }
}

for (let lessonNo = 1; lessonNo <= 7; lessonNo += 1) {
  const lessonPath = resolve(repoRoot, `public/data/115AG1H/lesson${String(lessonNo).padStart(2, '0')}.json`);
  try {
    const lesson = readJson(lessonPath);
    approvedGroups['115AG1H'][`lesson${String(lessonNo).padStart(2, '0')}`] =
      (lesson.lookalikes || []).map((group) => group.chars.map((item) => item.char));
  } catch {
    approvedGroups['115AG1H'][`lesson${String(lessonNo).padStart(2, '0')}`] = [];
  }
}

writeFileSync(
  approvedManifestPath,
  `${JSON.stringify({
    version: 1,
    description: '由私有官方形似字辨別題庫核對後產生的公開回歸基準；不含官方原始教材。',
    grades: approvedGroups,
  }, null, 2)}\n`,
  'utf8',
);
