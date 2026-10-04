#!/usr/bin/env node

/**
 * Materialise the private, source-audited G4A (康軒四上) hand-off contract.
 *
 * This script is deliberately not a Word/PDF extractor.  It consumes only
 * already reviewed derived JSON and source manifests from the private source
 * tree, removes private paths, and emits one standard lesson JSON per lesson.
 * Missing modules remain missing; this script never invents curriculum data.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const profile = {
  code: '115AG4K',
  publisher: '康軒',
  grade: 4,
  term: '上',
  title: '康軒四上國語課程',
};

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = argv[index + 1] && !argv[index + 1].startsWith('--') ? argv[++index] : true;
    args[key] = value;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const sourceRoot = path.resolve(String(args['source-root'] || ''));
const preparedRoot = path.resolve(String(args['prepared-root'] || ''));
if (!sourceRoot || sourceRoot === path.parse(sourceRoot).root || !preparedRoot || preparedRoot === path.parse(preparedRoot).root) {
  console.error('用法：node prepare_g4a.mjs --source-root <私有來源根目錄> --prepared-root <準備資料輸出目錄>');
  process.exit(2);
}

const batchRoot = path.join(sourceRoot, 'worksheet-batches', '115', '115G4A_國語 康');
const officialRoot = path.join(batchRoot, '01_本學年官方教材');
const derivedRoot = path.join(batchRoot, '04_內容資料與草案');
const outputRoot = path.join(preparedRoot, profile.code);

function derivePypinyin(chars) {
  const python = String(args.python || 'python');
  const pypinyinPath = String(args['pypinyin-path'] || '');
  if (!pypinyinPath) return new Map();
  const program = [
    'import json, sys',
    'sys.path.insert(0, sys.argv[1])',
    'from pypinyin import Style, pinyin',
    'chars = json.loads(sys.argv[2])',
    'print(json.dumps({c: pinyin(c, style=Style.BOPOMOFO, heteronym=False)[0][0] for c in chars}, ensure_ascii=False))',
  ].join('; ');
  const result = spawnSync(python, ['-c', program, pypinyinPath, JSON.stringify(chars)], {
    encoding: 'utf8',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
  });
  if (result.status !== 0) throw new Error(`pypinyin 衍生注音失敗：${String(result.stderr || '').trim()}`);
  const parsed = JSON.parse(String(result.stdout || '{}'));
  return new Map(Object.entries(parsed));
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function filesIn(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(full) : [full];
  });
}

function firstFile(directory, predicate) {
  const match = filesIn(directory).find(predicate);
  if (!match) throw new Error(`找不到來源檔案：${directory}`);
  return match;
}

function lessonCode(lessonNo) {
  return `L${String(lessonNo).padStart(2, '0')}`;
}

function stripTitle(value, lessonNo) {
  const text = String(value || '').replace(/\s+/gu, ' ').trim();
  const match = text.match(new RegExp(`(?:L|第)\\s*0?${lessonNo}\\s*[：:\\s　]*(.+?)(?:\\s+(?:語詞解釋|段落大意).*)?$`, 'u'));
  if (match) return match[1].trim();
  return text.replace(/^.*?\s+(?=\S)/u, '').trim() || `第${lessonNo}課`;
}

function sourceLabel(kind) {
  return `康軒官方教材來源整理（${kind}）`;
}

function moduleEntry(label, activity, available, note = '') {
  const result = { label, status: available ? 'available' : 'missing', activity };
  if (note) result.note = note;
  return result;
}

function sourceManifest(manifest) {
  const sources = manifest.source_documents || manifest.sources || [];
  return sources.map((item) => ({
    kind: 'official',
    locator: item.locator || 'official-source',
    sha256: String(item.sha256 || '').toUpperCase(),
  })).filter((item) => item.sha256);
}

function paragraphSourceAudit(audit = {}) {
  return [
    { kind: 'official', locator: '03 課文', sha256: String(audit.lesson_doc_sha256 || '').toUpperCase() },
    { kind: 'official', locator: '14 課文大意、段落大意', sha256: String(audit.official_outline_sha256 || '').toUpperCase() },
  ].filter((item) => item.sha256);
}

function loadCharacterManifest() {
  const candidates = [
    path.join(sourceRoot, 'sped-os-github', '30-materials', 'worksheets', 'G1_zici_meizi', 'source', '115AG4', 'lesson_characters.json'),
    path.join(sourceRoot, '30-materials', 'worksheets', 'G1_zici_meizi', 'source', '115AG4', 'lesson_characters.json'),
  ];
  const file = candidates.find((candidate) => fs.existsSync(candidate));
  if (!file) throw new Error(`找不到 G4A 生字清單：${candidates.join('、')}`);
  const data = readJson(file);
  if (!data.lessons || !data.source_sha256) throw new Error('G4A 生字清單缺少 lessons 或 source_sha256');
  return data;
}

function findVocabularyFile(lessonNo) {
  const code = lessonCode(lessonNo);
  const integrated = filesIn(path.join(derivedRoot, 'G4A語詞解釋_來源整合修正版_20260805'))
    .find((file) => file.endsWith('.json')
      && path.dirname(file).split(path.sep).some((segment) => segment.startsWith(`${code}_`)));
  if (integrated) return integrated;
  const legacy = filesIn(path.join(derivedRoot, '產線來源與成品_原混合批次', 'yuci_jieshi_low', 'source_115AG4'))
    .find((file) => path.basename(file).includes(`G4A${String(lessonNo).padStart(2, '0')}`) && file.endsWith('_data.json'));
  if (legacy) return legacy;
  throw new Error(`G4A L${String(lessonNo).padStart(2, '0')} 找不到語詞解釋準備資料`);
}

function loadVocabulary(lessonNo) {
  const file = findVocabularyFile(lessonNo);
  const data = readJson(file);
  const lesson = data.lessons?.[0];
  if (!lesson || !Array.isArray(lesson.items) || lesson.items.length < 3) {
    throw new Error(`${file} 缺少至少三筆語詞解釋`);
  }
  return { file, lesson, manifest: data };
}

function loadPronunciationManifest(lessonNo) {
  const file = path.join(derivedRoot, 'wordwall_詞語注音', `${lessonCode(lessonNo)}_source_manifest.json`);
  if (!fs.existsSync(file)) throw new Error(`找不到 G4A L${String(lessonNo).padStart(2, '0')} 語詞注音來源清單`);
  const data = readJson(file);
  const byWord = new Map((data.items || []).map((item) => [String(item.word).trim(), String(item.zhuyin || '').trim()]));
  if (byWord.size < 3) throw new Error(`${file} 語詞注音不足三筆`);
  return { file, data, byWord };
}

function loadParagraphPrep(lessonNo) {
  const root = path.join(derivedRoot, '段落大意_L01-L12_Terra備料_v2.1');
  const code = lessonCode(lessonNo);
  const file = firstFile(root, (candidate) => candidate.endsWith('_prep_v2.1.json')
    && path.dirname(candidate).split(path.sep).some((segment) => segment.startsWith(`${code}_`)));
  const data = readJson(file);
  if (!data.lesson || !Array.isArray(data.lesson.columns_zhuyin) || data.lesson.columns_zhuyin.length < 3) {
    throw new Error(`${file} 段落大意不足三段`);
  }
  return { file, data };
}

/**
 * 形似字組裡的「字」＝每個例詞都有的那個字。
 * 2026-10-04 修正：原本取「第一個例詞的第一個字」，例詞「引誘、誘人」被存成「引」（應為「誘」），
 * 四上整批錯 64 筆。共有字剛好一個才採用；不只一個（「蜜蜂、蜂蜜」）就印警告、
 * 先取第二個例詞的第一個字之外的那個，請人工確認。
 */
function lookalikeCharOf(examples, term, lessonNo) {
  const han = (w) => [...w].filter((ch) => /[\u3400-\u9fff]/u.test(ch));
  if (examples.length < 2) return han(examples[0] || term)[0];
  let common = new Set(han(examples[0]));
  for (const w of examples.slice(1)) common = new Set(han(w).filter((ch) => common.has(ch)));
  const list = [...common];
  if (list.length === 1) return list[0];
  if (list.length === 0) {
    console.warn(`[WARN] 第 ${lessonNo} 課形似字「${term}」例詞沒有共同字，暫取第一個字，請人工確認`);
    return han(examples[0])[0];
  }
  console.warn(`[WARN] 第 ${lessonNo} 課形似字「${term}」例詞共有 ${list.join('、')}，請人工確認是哪一個`);
  return list[0];
}

function loadLookalikes(lessonNo) {
  const file = path.join(derivedRoot, '形似字', `${lessonCode(lessonNo)}_形似字.json`);
  if (!fs.existsSync(file)) return { file: null, groups: [] };
  const data = readJson(file);
  const lesson = data.lessons?.[0];
  const groups = (lesson?.items || []).map((terms, index) => {
    const normalizedTerms = (terms || []).map((term) => String(term).trim()).filter(Boolean);
    if (normalizedTerms.length < 2) return null;
    return {
      id: `lookalike:${profile.code}${String(lessonNo).padStart(2, '0')}:${String(index + 1).padStart(2, '0')}`,
      group_no: String(index + 1),
      chars: normalizedTerms.map((term) => {
        const examples = term.split(/[、,，]/gu).map((item) => item.trim()).filter(Boolean);
        return { char: lookalikeCharOf(examples, term, lessonNo), example: examples.join('、') || term };
      }),
      status: 'ready',
      source: sourceLabel('06 字音字形：形似字辨別'),
    };
  }).filter(Boolean);
  return { file, groups };
}

const initials = ['', 'ㄅ', 'ㄆ', 'ㄇ', 'ㄈ', 'ㄉ', 'ㄊ', 'ㄋ', 'ㄌ', 'ㄍ', 'ㄎ', 'ㄏ', 'ㄐ', 'ㄑ', 'ㄒ', 'ㄓ', 'ㄔ', 'ㄕ', 'ㄖ', 'ㄗ', 'ㄘ', 'ㄙ'];
const finals = ['ㄚ', 'ㄛ', 'ㄜ', 'ㄝ', 'ㄞ', 'ㄟ', 'ㄠ', 'ㄡ', 'ㄢ', 'ㄣ', 'ㄤ', 'ㄥ', 'ㄦ', 'ㄧ', 'ㄨ', 'ㄩ', 'ㄧㄚ', 'ㄧㄛ', 'ㄧㄝ', 'ㄧㄞ', 'ㄧㄠ', 'ㄧㄡ', 'ㄧㄢ', 'ㄧㄣ', 'ㄧㄤ', 'ㄧㄥ', 'ㄧㄨㄥ', 'ㄨㄚ', 'ㄨㄛ', 'ㄨㄞ', 'ㄨㄟ', 'ㄨㄢ', 'ㄨㄣ', 'ㄨㄤ', 'ㄨㄥ', 'ㄩㄝ', 'ㄩㄢ', 'ㄩㄣ', 'ㄩㄥ'];
const tones = ['', 'ˊ', 'ˇ', 'ˋ', '˙'];
const zhuyinCandidates = [...new Set(initials.flatMap((initial) => finals.map((ending) => initial + ending)).flatMap((base) => tones.map((tone) => base + tone)))].sort((a, b) => b.length - a.length);

function parseZhuyin(raw, count) {
  const text = String(raw || '').replace(/\s+/gu, '');
  const memo = new Map();
  function visit(offset, remaining) {
    const key = `${offset}:${remaining}`;
    if (memo.has(key)) return memo.get(key);
    if (remaining === 0) return offset === text.length ? [] : null;
    if (text.length - offset < remaining || text.length - offset > remaining * 5) return null;
    for (const candidate of zhuyinCandidates) {
      if (!text.startsWith(candidate, offset)) continue;
      const tail = visit(offset + candidate.length, remaining - 1);
      if (tail) {
        const result = [candidate, ...tail];
        memo.set(key, result);
        return result;
      }
    }
    memo.set(key, null);
    return null;
  }
  return visit(0, count);
}

function characterReadings(chars, pronunciation) {
  const readings = new Map();
  const methods = new Map();
  const sourceWords = [...pronunciation.byWord.entries()];
  for (const char of chars) {
    for (const [word, raw] of sourceWords) {
      const index = [...word].indexOf(char);
      if (index < 0) continue;
      const syllables = parseZhuyin(raw, [...word].length);
      if (syllables?.[index]) {
        readings.set(char, syllables[index]);
        methods.set(char, 'wordwall_source_manifest');
        break;
      }
    }
  }
  const missing = chars.filter((char) => !readings.has(char));
  if (missing.length) {
    const derived = derivePypinyin(missing);
    for (const char of missing) {
      if (derived.get(char)) {
        readings.set(char, derived.get(char));
        methods.set(char, 'pypinyin_0.55.0_derivation');
      }
    }
  }
  const stillMissing = chars.filter((char) => !readings.has(char));
  if (stillMissing.length) throw new Error(`生字找不到可解析的本課注音：${stillMissing.join('、')}；請提供 --pypinyin-path 或補齊官方注音來源`);
  return { readings, methods };
}

function parseQuestion(text, lessonNo, index) {
  const lines = String(text || '').split(/\n/gu).map((line) => line.trim()).filter(Boolean);
  const stem = (lines.shift() || '').replace(/^（\s*）\d+[.．]\s*/u, '').trim();
  const options = lines.join(' ').split(/(?=\(\d\))/gu).map((part) => part.replace(/^\(\d\)\s*/u, '').trim()).filter(Boolean);
  if (!stem || options.length < 2) return null;
  return {
    id: `question:${profile.code}${String(lessonNo).padStart(2, '0')}:${String(index + 1).padStart(2, '0')}`,
    stem,
    question: stem,
    options,
    answer: null,
    status: 'approved',
    source: sourceLabel('15 閱讀理解提問；保留官方選項'),
  };
}

function paragraphItems(lessonNo, prep) {
  const lesson = prep.data.lesson;
  const sectionByColumn = new Map();
  for (const section of lesson.sections || []) {
    for (const column of section.columns || []) sectionByColumn.set(Number(column), String(section.heading || '').replace(/^【|】$/gu, ''));
  }
  const paragraphs = lesson.columns_zhuyin.map((summary, index) => ({
    id: `paragraph:${profile.code}${String(lessonNo).padStart(2, '0')}:${String(index + 1).padStart(2, '0')}`,
    paragraph_no: index + 1,
    summary: String(summary).trim(),
    structure_role: sectionByColumn.get(index) || `第${index + 1}段重點`,
    status: 'approved',
    source: sourceLabel('14 課文大意、段落大意'),
  }));
  const questions = (lesson.questions || []).map((question, index) => parseQuestion(question, lessonNo, index)).filter(Boolean);
  return {
    paragraphs,
    questions,
    mainIdea: {
      gist: paragraphs[0]?.summary || '本課閱讀重點待補。',
      theme: '閱讀理解',
      status: paragraphs.length ? 'approved' : 'draft',
      source: sourceLabel('14 課文大意、段落大意'),
    },
  };
}

function buildLesson(lessonNo, characterManifest) {
  const code = lessonCode(lessonNo);
  const vocabulary = loadVocabulary(lessonNo);
  const pronunciation = loadPronunciationManifest(lessonNo);
  const paragraph = loadParagraphPrep(lessonNo);
  const lookalikes = loadLookalikes(lessonNo);
  const chars = String(characterManifest.lessons[code] || '').split('').filter(Boolean);
  if (chars.length < 3) throw new Error(`G4A ${code} 生字不足三字`);
  const readingInfo = characterReadings(chars, pronunciation);
  const readings = readingInfo.readings;
  const words = vocabulary.lesson.items.map((item, index) => ({
    id: `word:${profile.code}${String(lessonNo).padStart(2, '0')}:${String(index + 1).padStart(2, '0')}`,
    word: String(item.word).trim(),
    zhuyin: pronunciation.byWord.get(String(item.word).trim()) || null,
    meaning: String(item.definition || '').trim() || null,
    example_sentence: null,
    example_status: 'todo_rewrite',
    level: 'basic',
    image: null,
    status: 'ready',
    source: sourceLabel('05 詞語解釋及例句'),
  }));
  const paragraphs = paragraphItems(lessonNo, paragraph);
  const questions = paragraphs.questions;
  const characters = chars.map((char) => ({
    char,
    zhuyin: readings.get(char),
    zhuyin_source: readingInfo.methods.get(char),
    stroke_count: null,
    radical: null,
    type: '習寫字',
    level: 'basic',
    examples: words.filter((item) => item.word.includes(char)).slice(0, 3).map((item) => item.word),
    examples_source: sourceLabel('05 詞語解釋及例句；常用度前三項於匯入階段補齊'),
    image: null,
    audio_override: null,
    pedia_url: `https://pedia.cloud.edu.tw/Entry/Detail?title=${encodeURIComponent(char)}`,
    source: sourceLabel('01 生字表'),
    status: 'ready',
  }));
  const title = stripTitle(paragraph.data.lesson.title || vocabulary.lesson.title, lessonNo);
  const sourceAudit = [
    { kind: 'official', locator: '01 生字表', sha256: String(characterManifest.source_sha256).toUpperCase() },
    ...sourceManifest(vocabulary.manifest),
    ...sourceManifest(pronunciation.data),
    ...paragraphSourceAudit(paragraph.data.lesson.source_audit),
  ].filter((item, index, list) => item.sha256 && list.findIndex((other) => other.sha256 === item.sha256 && other.locator === item.locator) === index);
  const hasParagraphs = paragraphs.paragraphs.length >= 3;
  const hasLookalikes = lookalikes.groups.length > 0;
  return {
    lesson_id: `${profile.code}${String(lessonNo).padStart(2, '0')}`,
    volume: { code: profile.code, publisher: profile.publisher, grade: profile.grade, term: profile.term },
    unit: { no: 1, title: profile.title },
    lesson_no: lessonNo,
    title,
    author: '',
    blurb: `透過〈${title}〉整理生字、語詞與閱讀重點，練習把課文內容連結到生活。`,
    source_audit: sourceAudit,
    characters,
    words,
    word_meanings: [],
    sentences: [],
    idioms: [],
    idiom_sentences: [],
    sentence_patterns: [],
    rhetoric: [],
    paragraph_summary: paragraphs.paragraphs,
    main_idea: paragraphs.mainIdea,
    reading_questions: questions,
    polysemy: [],
    polysemy_senses: [],
    polyphones: [],
    lookalikes: lookalikes.groups,
    listening: [],
    review_words: {},
    extensions: [],
    modules: {
      characters: moduleEntry('認識生字', 'character-cards', true),
      vocabulary: moduleEntry('學會語詞', 'vocabulary-cards', words.length >= 3),
      reading: moduleEntry('讀懂課文', 'reading', hasParagraphs, '課文全文不放入公開網站。'),
      sentence_practice: moduleEntry('練習句子', 'sentence-practice', false, '句型來源尚未完成來源核對。'),
      application: moduleEntry('我會應用', 'application', false, '應用任務來源尚未完成來源核對。'),
      idiom_builder: moduleEntry('生字變成語', 'idiom-builder', false, '成語資料尚未完成來源核對。'),
      polysemy: moduleEntry('一字多義', 'polysemy', false, '一字多義資料尚未完成來源核對。'),
      polyphones: moduleEntry('一字多音', 'polyphones', false, '一字多音資料尚未完成來源核對。'),
      lookalikes: moduleEntry('形似字', 'lookalikes', hasLookalikes),
      structure_map: moduleEntry('課文地圖', 'structure-map', hasParagraphs),
      listening: moduleEntry('聽聽看', 'listening-quiz', false, '題幹與選項已整理；答案尚待官方資料核對。'),
      rhetoric: moduleEntry('修辭小偵探', 'rhetoric', false, '修辭資料尚未完成來源核對。'),
      review: moduleEntry('舊字新詞', 'review', false, '跨課複習資料由整批匯入後建立。'),
    },
  };
}

if (!fs.existsSync(officialRoot)) throw new Error(`找不到 G4A 官方教材根目錄：${officialRoot}`);
const characterManifest = loadCharacterManifest();
fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(outputRoot, { recursive: true });
for (let lessonNo = 1; lessonNo <= 12; lessonNo += 1) {
  const lesson = buildLesson(lessonNo, characterManifest);
  writeJson(path.join(outputRoot, `lesson${String(lessonNo).padStart(2, '0')}.json`), lesson);
  console.log(`[OK] prepared ${lesson.lesson_id} chars=${lesson.characters.length} words=${lesson.words.length} paragraphs=${lesson.paragraph_summary.length} lookalikes=${lesson.lookalikes.length}`);
}
console.log(`[OK] G4A prepared lessons: ${outputRoot}`);
