// 使用者明確授權後，將 G3A 第 7～12 課私有工作檔中的可用延伸教材直接發佈。
// 這支工具不把官方原始檔或未壓縮圖片帶進 repo；只寫入公開課次 JSON。
// 預設 dry-run，確定要直接公開時加上 --publish。
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const PUBLIC_STATUS = 'ready';
const EXAMPLES_STATUS = 'approved';
const DIRECT_SOURCE = '115G3A／翰林官方教材衍生資料（使用者授權直接公開，2026-09-26）';

const IDIOM_SENTENCES = {
  乘風破浪: '少年帆船隊在海上乘風破浪，終於抵達小島。',
  野心勃勃: '他野心勃勃地練習，希望將來成為優秀的發明家。',
  發人深省: '這部影片提醒大家愛護海洋，內容十分發人深省。',
  欣欣向榮: '春雨過後，校園裡的花草欣欣向榮。',
  賞心悅目: '山上的雲海和花田景色賞心悅目。',
  寄人籬下: '小鳥受傷時暫住在朋友家，不能一直寄人籬下。',
  金蟬脫殼: '小偷趁警察轉身時金蟬脫殼，逃離了現場。',
  物以類聚: '喜歡閱讀的同學常聚在一起，真是物以類聚。',
  守口如瓶: '姐姐答應替我保守祕密，對這件事守口如瓶。',
  志同道合: '小明和小華志同道合，都喜歡研究昆蟲。',
  交頭接耳: '上課時同學們交頭接耳，老師只好提醒大家安靜。',
  如影隨形: '小狗一路跟著主人，如影隨形。',
  投其所好: '他知道哥哥喜歡拼圖，便投其所好送上一盒拼圖。',
  夜以繼日: '研究團隊夜以繼日地整理資料，終於找到答案。',
  隔岸觀火: '同學遇到困難時，我們應該幫忙，不能隔岸觀火。',
  江郎才盡: '小作家寫到最後，覺得江郎才盡，想不出新的故事。',
  不同凡響: '她在比賽中的表現不同凡響，獲得大家稱讚。',
  有福同享: '好朋友一起分享獎品，約定有福同享。',
  價值連城: '博物館展示的古代玉器價值連城。',
  相敬如賓: '爺爺奶奶相處多年，仍然相敬如賓。',
  笑裡藏刀: '他表面答應幫忙，背後卻笑裡藏刀，大家要小心。',
  斬草除根: '園丁把雜草斬草除根，花圃才不會很快又長滿。',
  烏煙瘴氣: '垃圾堆放太久，讓附近的空氣變得烏煙瘴氣。',
  息息相關: '飲水和每個人的生活息息相關。',
  不修邊幅: '參加典禮前要整理儀容，不能不修邊幅。',
  幸災樂禍: '同學比賽失誤時，我們應該安慰他，不可以幸災樂禍。',
  七零八落: '大風吹過後，院子裡的落葉七零八落。',
  一團和氣: '大家在家庭聚會中互相禮讓，氣氛一團和氣。',
  潛移默化: '孩子每天閱讀好書，在潛移默化中養成良好習慣。',
  人去樓空: '多年後回到老家，熟悉的房子已人去樓空。',
  一視同仁: '老師對班上每位同學一視同仁。',
  破鏡重圓: '誤會說開後，兩位好朋友終於破鏡重圓。',
};

function parseArgs(argv) {
  const options = { publish: false, lessons: [7, 8, 9, 10, 11, 12] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--publish') options.publish = true;
    else if (arg === '--source-root') options.sourceRoot = resolve(argv[++i]);
    else if (arg === '--repo-root') options.repoRoot = resolve(argv[++i]);
    else if (arg === '--lessons') {
      options.lessons = argv[++i].split(',').flatMap((part) => {
        const [start, end = start] = part.split('-').map(Number);
        return Array.from({ length: end - start + 1 }, (_, offset) => start + offset);
      });
    } else if (arg === '--help') options.help = true;
  }
  return options;
}

function printHelp() {
  console.log(`用法：\n  node scripts/publish-g3a-extensions.mjs --source-root <G3A來源目錄> --repo-root <apps/mandarin> --publish\n\n不加 --publish 時只列出預計寫入的課次。`);
}

function hashId(value) {
  return createHash('sha1').update(value).digest('hex').slice(0, 8);
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function findLessonSourceDir(sourceRoot, lessonNo) {
  const root = join(sourceRoot, '05_樣張待確認');
  const prefix = `115翰G3A${String(lessonNo).padStart(2, '0')}`;
  const dirs = readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(prefix))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
  const preferred = dirs.find((entry) => entry.name.includes('九份學習單')) || dirs[0];
  if (!preferred) throw new Error(`找不到第 ${lessonNo} 課的 05_樣張待確認 資料夾`);
  return join(root, preferred.name);
}

function findDataFile(dir, label) {
  const file = readdirSync(dir).find((name) => name.includes(label) && name.endsWith('_data.json'));
  if (!file) throw new Error(`${dir} 找不到 ${label}_data.json`);
  return join(dir, file);
}

function readLessonSource(sourceDir, label) {
  const data = readJson(findDataFile(sourceDir, label));
  const lesson = data.lessons?.[0];
  if (!lesson) throw new Error(`${label} 沒有 lessons[0]`);
  return lesson;
}

function makeSentencePatternId(lessonId, key) {
  return `sentence_pattern:${lessonId}:${hashId(key)}`;
}

function sentencePatterns(lesson, source, lessonId) {
  const output = [];
  for (const item of source.word_practice || []) {
    if (!item.word || !item.example) continue;
    output.push({
      id: makeSentencePatternId(lessonId, `word:${item.word}`),
      category: '造句練習',
      head: item.word,
      structure: item.word,
      description: item.definition || `練習使用「${item.word}」造句。`,
      guide: item.sentence_stem || '',
      analysis: '',
      examples: [item.example, ...(item.reorder_parts?.length ? [item.reorder_parts.join('')] : [])],
      example_parts: [item.example_parts, item.reorder_parts].filter((parts) => Array.isArray(parts) && parts.length >= 2),
      examples_status: EXAMPLES_STATUS,
      status: PUBLIC_STATUS,
      source: `${DIRECT_SOURCE}（08各課短語句型練習／造句）`,
    });
  }

  for (const item of source.patterns || []) {
    const examples = (item.reorder_items || [])
      .filter((parts) => Array.isArray(parts) && parts.length >= 2)
      .map((parts) => parts.join(''));
    if (!item.short_title || !item.pattern || examples.length === 0) continue;
    output.push({
      id: makeSentencePatternId(lessonId, `pattern:${item.short_title}:${item.pattern}`),
      category: '句型練習',
      head: item.short_title,
      structure: item.pattern,
      description: item.independent_prompt || item.pattern,
      guide: item.independent_prompt || '',
      analysis: item.source || '',
      examples,
      example_parts: item.reorder_items,
      color_legend: item.color_legend || [],
      examples_status: EXAMPLES_STATUS,
      status: PUBLIC_STATUS,
      source: `${DIRECT_SOURCE}（08各課短語句型練習／句型）`,
    });
  }
  return output;
}

function idiomsAndSentences(source, lessonId) {
  const idioms = [];
  const sentences = [];
  for (const item of source.items || []) {
    if (!item.idiom || !item.target || !item.idiom.includes(item.target) || !item.definition) continue;
    const id = `idiom:${lessonId}:${hashId(`${item.idiom}:${item.target}`)}`;
    idioms.push({
      id,
      idiom: item.idiom,
      definition: item.definition,
      related_char: item.target,
      // 原始 PNG 尚未壓成符合公開容量規則的 WebP/AVIF，因此不直接引用私有絕對路徑。
      image: null,
      status: PUBLIC_STATUS,
      source: `${DIRECT_SOURCE}（07生字衍生成語）`,
    });
    const rewritten = IDIOM_SENTENCES[item.idiom];
    if (!rewritten) throw new Error(`缺少成語「${item.idiom}」的具體情境句`);
    sentences.push({
      id: `idiom_sentence:${lessonId}:${hashId(item.idiom)}`,
      idiom_id: id,
      rewritten,
      status: EXAMPLES_STATUS,
      source: `${DIRECT_SOURCE}（成語具體情境句，使用者授權直出）`,
    });
  }
  return { idioms, sentences };
}

function hanCharacters(text) {
  return [...String(text).matchAll(/\p{Script=Han}/gu)].map((match) => match[0]);
}

function sharedCharacter(phraseGroup) {
  const phrases = String(phraseGroup).split(/[、,，]/u).map((phrase) => phrase.trim()).filter(Boolean);
  if (phrases.length === 0) return null;
  let candidates = [...new Set(hanCharacters(phrases[0]))];
  for (const phrase of phrases.slice(1)) {
    const chars = new Set(hanCharacters(phrase));
    candidates = candidates.filter((char) => chars.has(char));
  }
  if (candidates.length === 0) return null;
  // 例詞可能不是以目標字開頭，例如「一盞燈、燈盞」；
  // 取各詞中平均位置較前者，避免把量詞或前綴誤當答案。
  return candidates.sort((a, b) => {
    const position = (char) => phrases.reduce((sum, phrase) => sum + phrase.indexOf(char), 0) / phrases.length;
    return position(a) - position(b);
  })[0];
}

function lookalikeGroups(source, lessonId) {
  const groups = [];
  for (const [index, rawGroup] of (source.items || []).entries()) {
    const byChar = new Map();
    for (const phraseGroup of rawGroup || []) {
      const example = String(phraseGroup).trim();
      const char = sharedCharacter(example);
      if (!char) continue;
      byChar.set(char, byChar.has(char) ? `${byChar.get(char)}、${example}` : example);
    }
    const chars = [...byChar.entries()].map(([char, example]) => ({ char, zhuyin: null, example }));
    if (chars.length < 2) continue;
    groups.push({
      id: `lookalike:${lessonId}:${index + 1}`,
      group_no: String(index + 1),
      chars,
      status: PUBLIC_STATUS,
      source: `${DIRECT_SOURCE}（05形音輕鬆學／形似字）`,
    });
  }
  return groups;
}

function readingQuestions(source, lessonId) {
  const strategies = ['提取訊息', '提取訊息', '整合訊息', '語詞理解', '反思評鑑', '推論訊息'];
  return (source.cells || []).flatMap((cell, index) => {
    const [label, prompt, answer] = cell || [];
    if (!prompt || !answer) return [];
    const stem = index === 0
      ? `本課文的文體和主要內容是什麼？`
      : index === 1
        ? `「${prompt}」是什麼意思？`
        : prompt;
    return [{
      id: `reading_question:${lessonId}:${String(index + 1).padStart(2, '0')}`,
      stem,
      strategy_tag: strategies[index] || '理解課文',
      answer_hint: index === 0 ? `${prompt}；${answer}` : answer,
      status: EXAMPLES_STATUS,
      source: `${DIRECT_SOURCE}（15閱讀理解提問／聚焦理解）${label ? `／${label}` : ''}`,
    }];
  });
}

function applyModuleStatuses(lesson) {
  const modules = lesson.modules || {};
  if ((lesson.sentence_patterns || []).length >= 3) modules.sentence_practice = {
    ...(modules.sentence_practice || { label: '練習句子', activity: 'sentence-practice' }),
    status: 'available',
  };
  if ((lesson.idioms || []).length >= 3) modules.idiom_builder = {
    ...(modules.idiom_builder || { label: '生字變成語', activity: 'idiom-builder' }),
    status: 'available',
  };
  if ((lesson.lookalikes || []).flatMap((group) => group.chars || []).length >= 3) modules.lookalikes = {
    ...(modules.lookalikes || { label: '形似字', activity: 'lookalikes' }),
    status: 'available',
  };
  if ((lesson.reading_questions || []).length >= 1) modules.reading = {
    ...(modules.reading || { label: '讀懂課文', activity: 'reading' }),
    status: 'available',
  };
  lesson.modules = modules;
}

function updateManifest(repoRoot, published) {
  const manifestPath = join(repoRoot, 'docs', 'lookalike-approved-groups.json');
  const manifest = readJson(manifestPath);
  manifest.description = '使用者授權直接公開的形似字衍生基準；後續可依回報修正，不含官方原始檔。';
  manifest.grades['115AG3H'] ||= {};
  for (const item of published) {
    manifest.grades['115AG3H'][`lesson${String(item.lessonNo).padStart(2, '0')}`] = item.lesson.lookalikes.map((group) => group.chars.map((char) => char.char));
  }
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) return printHelp();
  if (!options.sourceRoot || !options.repoRoot) {
    printHelp();
    process.exitCode = 2;
    return;
  }
  const published = [];
  for (const lessonNo of options.lessons) {
    const lessonPath = join(options.repoRoot, 'public', 'data', '115AG3H', `lesson${String(lessonNo).padStart(2, '0')}.json`);
    if (!existsSync(lessonPath)) throw new Error(`找不到公開課次：${lessonPath}`);
    const lesson = readJson(lessonPath);
    const sourceDir = findLessonSourceDir(options.sourceRoot, lessonNo);
    const sentenceSource = readLessonSource(sourceDir, '造句與句型練習');
    const idiomSource = readLessonSource(sourceDir, '生字衍生成語補充資料');
    const lookalikeSource = readLessonSource(sourceDir, '形似字');
    const readingSource = readLessonSource(sourceDir, '聚焦理解');
    const sentenceData = sentencePatterns(lesson, sentenceSource, lesson.lesson_id);
    const idiomData = idiomsAndSentences(idiomSource, lesson.lesson_id);
    const shapeData = lookalikeGroups(lookalikeSource, lesson.lesson_id);
    const readingData = readingQuestions(readingSource, lesson.lesson_id);
    lesson.sentence_patterns = sentenceData;
    lesson.idioms = idiomData.idioms;
    lesson.idiom_sentences = idiomData.sentences;
    lesson.lookalikes = shapeData;
    lesson.reading_questions = readingData;
    applyModuleStatuses(lesson);
    published.push({ lessonNo, lesson, lessonPath, sourceDir });
    console.log(`${options.publish ? '[直出]' : '[預覽]'} 第${lessonNo}課：句型 ${sentenceData.length}、成語 ${idiomData.idioms.length}、形似字 ${shapeData.length} 組、閱讀提問 ${readingData.length}`);
  }
  if (!options.publish) return;
  for (const item of published) writeFileSync(item.lessonPath, `${JSON.stringify(item.lesson, null, 2)}\n`, 'utf8');
  updateManifest(options.repoRoot, published);
  console.log(`已直接公開 ${published.length} 課；未將私有來源檔與原始 PNG 帶入 repo。`);
}

main();
