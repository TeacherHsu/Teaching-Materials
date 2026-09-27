/** Apply the teacher-provided G4A L09 sentence patterns as derived lesson data. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_FILE = path.join(APP_ROOT, 'public', 'data', '115AG4K', 'lesson09.json');
const SOURCE = '教師提供第九課句型教材（2026-09-27）';

function pattern(index, category, head, structure, description, guide, examples, courseSentence) {
  return {
    id: `sentence_pattern:115AG4K09:pasted:${String(index).padStart(2, '0')}`,
    category,
    pattern: head,
    head,
    structure,
    description,
    guide,
    examples,
    course_sentence: courseSentence,
    show_practice_context: true,
    practice_all_examples: true,
    examples_status: 'approved',
    status: 'ready',
    source: SOURCE,
  };
}

const lesson = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
lesson.sentence_patterns = [
  pattern(1, '短語練習', '氣候又乾又熱', '（名詞）又（形容詞）又（形容詞）', '描寫事物的兩個特色。', '先選一個人、事或物，再用兩個形容詞說明它的特色。', [
    '球員又高又壯',
    '水果又香又甜',
    '夜晚又黑又冷',
  ], '氣候又乾又熱'),
  pattern(2, '短句練習', '風車就是為了排水出海而建造的。', '（名詞）就是為了（動詞）而（動詞）的。', '描述某物出現的原因。', '先說明某物的用途，再說明為了這個用途而做了什麼。', [
    '牛奶就是為了補充體力而沖泡的。',
    '撲滿就是為了儲蓄金錢而準備的。',
    '安全帽就是為了維護安全而戴的。',
  ], '風車就是為了排水出海而建造的。'),
  pattern(3, '句型練習', '……所以……', '原因，所以結果。', '因果複句，由兩個有因果關係的分句組成；「所以」後面接事件的結果。', '先找出課文句中的原因和結果，再用「所以」連接兩個分句。', [
    '今日天氣不穩定，所以原定的爬山計畫取消了。',
    '妹妹感冒發燒，所以今天請假在家裡休息。',
    '大雨導致路面溼滑，所以走路要當心，以免滑倒。',
  ], '這裡的國土有三分之一在海平面之下，所以要築堤防潮，風車就是當初為了排水出海而建造的。'),
];

fs.writeFileSync(DATA_FILE, `${JSON.stringify(lesson, null, 2)}\n`, 'utf8');
console.log('已套用 G4A 第九課三組句型教材。');
