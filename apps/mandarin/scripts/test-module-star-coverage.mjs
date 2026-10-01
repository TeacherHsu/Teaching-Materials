// 驗證規格 §2：第 1 課「可開始」大項都有可判定題目，玩到底一定會累積
// scoreSession total > 0（不會永遠卡在 0 顆星、湊不滿最高值）。
// 用真實 public/data/115AG3H/lesson01.json 資料驅動每個大項的實際 builder，
// 用「無所不點」的通用互動驅動器（不需要事先知道正解）模擬學生作答到底：
//   - ChoiceQuiz／DragToSlot：答錯最多 2 次一定會鎖題進入下一題（不會卡住）。
//   - MatchingGame：左右欄逐一嘗試配對，保證有限步內配對完成。
//   - SentenceOrdering（讀懂課文的段落排序）：用課次資料算出的正解直接排。
// 用法：node scripts/test-module-star-coverage.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installFakeDom, FakeElement } from './fake-dom.mjs';

installFakeDom();
// celebrate.js 會摸 document.body／matchMedia，補上最小 stub（同 test-celebrate.mjs）。
document.body = new FakeElement('body');
document.getElementById = () => null;
window.matchMedia = () => ({ matches: true }); // 測試環境固定當作 reduced-motion，不需要噴粒子

const lessonPath = process.env.MANDARIN_TEST_LESSON || '../public/data/115AG3H/lesson01.json';
const lesson = JSON.parse(readFileSync(new URL(lessonPath, import.meta.url)));

const { MODULE_REGISTRY, getModuleStatus } = await import('../src/activities/moduleRegistry.js');
const { startScoreSession, endScoreSession } = await import('../src/utils/scoreSession.js');
const { computeModuleStars } = await import('../src/utils/scoring.js');

const { buildCharactersActivity } = await import('../src/activities/characters.js');
const { buildVocabularyActivity } = await import('../src/activities/vocabulary.js');
const { buildSentencePracticeActivity, splitSentenceIntoChunks } = await import('../src/activities/sentencePractice.js');
const { buildIdiomBuilderActivity } = await import('../src/components/IdiomBuilder.js');
const { buildReadingActivity } = await import('../src/activities/reading.js');
const { buildMainIdeaActivity } = await import('../src/activities/mainIdea.js');
const { buildZhuyinTypingActivity } = await import('../src/activities/zhuyinTyping.js');
const { buildPolysemyActivity } = await import('../src/activities/polysemy.js');
const { buildListeningActivity } = await import('../src/activities/listening.js');
const { buildRhetoricActivity } = await import('../src/activities/rhetoric.js');
const { buildPolyphonesActivity } = await import('../src/activities/polyphones.js');
const { buildLookalikesActivity } = await import('../src/activities/lookalikes.js');
const { buildVisualSearchActivity } = await import('../src/activities/visualSearch.js');

const BUILDERS = {
  visual_search: buildVisualSearchActivity,
  characters: buildCharactersActivity,
  vocabulary: buildVocabularyActivity,
  sentence_practice: buildSentencePracticeActivity,
  idiom_builder: buildIdiomBuilderActivity,
  reading: buildReadingActivity,
  main_idea: buildMainIdeaActivity,
  zhuyin_typing: buildZhuyinTypingActivity,
  polysemy: buildPolysemyActivity,
  polyphones: buildPolyphonesActivity,
  lookalikes: buildLookalikesActivity,
  listening: buildListeningActivity,
  rhetoric: buildRhetoricActivity,
};

// ---- 通用互動驅動器：純看 DOM 狀態決定下一步，不需要事先知道任何一題的正解 ----
const ADVANCE_RE = /^(下一題|下一組|加練下一組|看結果|回課程首頁|繼續|再來一組|完成)/;

/** fake-dom 的 h() 對 `disabled: 'disabled'` 這種初始屬性只會寫進 attrs，不會同步
 * FakeElement.disabled 這個屬性（那個屬性只有元件之後手動 `el.disabled = true` 才會更新）。
 * 判斷「是否可點」要兩邊都看，否則會把一開始就 disabled 的按鈕誤判成可點、點了沒反應而卡死。 */
function isDisabled(n) {
  return !!n.disabled || n.getAttribute('disabled') != null;
}

function enabledButtons(container, predicate) {
  return container.findAll((n) => n.tagName === 'button' && !isDisabled(n) && (!predicate || predicate(n)));
}

function findAdvanceButton(container) {
  const buttons = enabledButtons(container);
  const advance = buttons.find((b) => ADVANCE_RE.test(b.textContent.trim()));
  if (advance) return advance;
  // 最後一輪完成後只有返回按鈕時，回到課程首頁才能結束星星覆蓋檢查；
  // 有候選題或「加練下一組」時仍需先完成作答／續做。
  const finish = buttons.find((b) => b.textContent.trim() === '本課先完成');
  const otherControls = buttons.filter((b) => b !== finish && !b.hasClass('speak-button'));
  return finish && otherControls.length === 0 ? finish : undefined;
}

/** 段落排序（讀懂課文第 1 步）沒有揭曉正解機制，driver 需要知道正解：
 * 直接沿用 reading.js 同一套排序邏輯（依 para_no 排序），從課次資料算出來。 */
function readingParagraphSolution(lesson) {
  const paragraphs = (lesson.paragraph_summary || [])
    .filter((p) => !p.status || p.status === 'approved' || p.status === 'ready')
    .filter((p) => p.summary);
  return [...paragraphs].sort((a, b) => a.para_no - b.para_no).map((p) => p.summary);
}

function clickWordInOrder(container, word) {
  const chip = enabledButtons(container, (n) => n.hasClass('sentence-chip') && !n.hasClass('sentence-ordering__placed-chip'))
    .find((n) => n.textContent === word);
  assert.ok(chip, `句子重組／段落排序：應該能找到文字為「${word}」且尚未選取的詞塊`);
  chip.dispatch('click');
}

function sentenceOrderingSolutions(lesson) {
  const solutions = [];
  for (const pattern of lesson.sentence_patterns || []) {
    if (!['ready', 'approved'].includes(pattern.examples_status)) continue;
    if (!Array.isArray(pattern.examples) || pattern.examples.length === 0) continue;
    for (const [index, sentence] of pattern.examples.entries()) {
      const manualParts = pattern.example_parts?.[index];
      const solution = Array.isArray(manualParts) && manualParts.length >= 2 && manualParts.join('') === sentence
        ? manualParts
        : splitSentenceIntoChunks(sentence);
      if (solution.length >= 2) solutions.push(solution);
    }
  }
  return solutions;
}

function sameWords(left, right) {
  if (left.length !== right.length) return false;
  const counts = new Map();
  for (const word of left) counts.set(word, (counts.get(word) || 0) + 1);
  for (const word of right) {
    const next = (counts.get(word) || 0) - 1;
    if (next < 0) return false;
    counts.set(word, next);
  }
  return [...counts.values()].every((count) => count === 0);
}

/** G6A 有些人工確認過的句型詞塊超過 8 個，不能用排列窮舉測試；
 * 依課次資料中的 example_parts 驗證同一個 SentenceOrdering 實際解答。 */
function driveSentenceOrderingWithLessonSolution(container, solutions) {
  const slots = container.find((n) => n.hasClass && n.hasClass('sentence-slots'));
  if (!slots) return false;
  const checkBtn = enabledButtons(container).find((b) => b.textContent.trim() === '檢查答案');
  if (!checkBtn) return false;
  const words = container.findAll((n) => n.tagName === 'button' && n.hasClass('sentence-chip')).map((n) => n.textContent);
  const solution = solutions.find((candidate) => sameWords(candidate, words));
  assert.ok(solution, `找不到目前句型詞塊的教材正解：${words.join('／')}`);
  solution.forEach((word) => clickWordInOrder(container, word));
  const btnAgain = enabledButtons(container).find((b) => b.textContent.trim() === '檢查答案');
  assert.ok(btnAgain, '排完所有詞塊後應該還能按「檢查答案」');
  btnAgain.dispatch('click');
  return true;
}

/** 依已知正解直接排（讀懂課文段落排序：正解可從課次資料算出來，見 readingParagraphSolution）。 */
function driveSentenceOrderingWithSolution(container, solution) {
  const slots = container.find((n) => n.hasClass && n.hasClass('sentence-slots'));
  if (!slots) return false;
  const checkBtn = enabledButtons(container).find((b) => b.textContent.trim() === '檢查答案');
  if (!checkBtn) return false;
  // 閱讀暖身先排前兩段；接著全篇排序才使用完整正解。
  solution.slice(0, slots.children.length).forEach((word) => clickWordInOrder(container, word));
  const btnAgain = enabledButtons(container).find((b) => b.textContent.trim() === '檢查答案');
  assert.ok(btnAgain, '排完所有詞塊後應該還能按「檢查答案」');
  btnAgain.dispatch('click');
  return true;
}

function* permutations(arr) {
  if (arr.length <= 1) {
    yield arr;
    return;
  }
  for (let i = 0; i < arr.length; i += 1) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) yield [arr[i], ...perm];
  }
}

const MAX_PERMUTATION_WORDS = 8; // 8! = 40320，涵蓋句型練習的詞塊數，仍在數秒內跑完

/** 沒有事先算出正解的 SentenceOrdering（句型練習的句子重組／仿寫選填）：
 * 沒有揭曉正解機制，用「窮舉排列」brute force 試到答對為止（詞塊數不多，
 * 6! = 720 步內一定會試到正解）。 */
function driveSentenceOrderingBruteForce(container) {
  const slots = container.find((n) => n.hasClass && n.hasClass('sentence-slots'));
  if (!slots) return false;
  const resetBtn = enabledButtons(container).find((b) => b.textContent.trim() === '重新排列');
  const checkBtn = enabledButtons(container).find((b) => b.textContent.trim() === '檢查答案');
  if (!resetBtn && !checkBtn) return false; // 這一輪已經排對、正在顯示完成句，交回一般驅動器
  const bank = container.findAll((n) => n.tagName === 'button' && n.hasClass('sentence-chip'));
  const words = bank.map((n) => n.textContent);
  assert.ok(
    words.length > 0 && words.length <= MAX_PERMUTATION_WORDS,
    `句型練習的句子重組／仿寫選填詞塊數應該在 1–${MAX_PERMUTATION_WORDS} 之間，實際 ${words.length}`,
  );
  for (const perm of permutations(words)) {
    perm.forEach((word) => clickWordInOrder(container, word));
    const check = enabledButtons(container).find((b) => b.textContent.trim() === '檢查答案');
    check.dispatch('click');
    // 答對的話畫面會被清空重繪成「完成句＋完成卡」，這裡的 slots／chip 節點就消失了。
    const stillHasSlots = container.find((n) => n.hasClass && n.hasClass('sentence-slots'));
    if (!stillHasSlots) return true;
    const reset = enabledButtons(container).find((b) => b.textContent.trim() === '重新排列');
    assert.ok(reset, '答錯後應該還能按「重新排列」再試一次');
    reset.dispatch('click');
  }
  throw new Error(`窮舉了所有 ${words.length}! 種排列仍未答對，可能是詞塊清單本身有誤`);
}

/** MatchingGame：左右欄各自窮舉嘗試，保證有限步內全部配對成功。
 * 全部配對完成後（左右欄按鈕都 disabled）要交回一般驅動器去點「再來一組／
 * 回課程首頁」，不能一直回傳 true，否則會在已完成的配對區卡成無窮迴圈。 */
function driveMatchingGameIfPresent(container) {
  const leftCol = container.find((n) => n.getAttribute && n.getAttribute('aria-label') === '左欄');
  const rightCol = container.find((n) => n.getAttribute && n.getAttribute('aria-label') === '右欄');
  if (!leftCol || !rightCol) return false;
  const leftBtns = leftCol.findAll((n) => n.tagName === 'button');
  const rightBtns = rightCol.findAll((n) => n.tagName === 'button');
  const hasUnmatchedLeft = leftBtns.some((b) => !isDisabled(b));
  const hasUnmatchedRight = rightBtns.some((b) => !isDisabled(b));
  if (!hasUnmatchedLeft || !hasUnmatchedRight) return false; // 全部配對完成，交給一般驅動器處理「再來一組」
  for (const lb of leftBtns) {
    if (isDisabled(lb)) continue;
    for (const rb of rightBtns) {
      if (isDisabled(rb)) continue;
      lb.dispatch('click');
      rb.dispatch('click');
      if (isDisabled(lb)) break; // 配對成功，換下一個左欄項目
    }
  }
  return true;
}

/** 一步互動：優先推進（下一題／回課程首頁…），否則嘗試 DragToSlot／ChoiceQuiz 的候選項。
 * 回傳 true 代表這一步有動作，false 代表這個畫面沒有通用驅動器認得的元素
 * （呼叫端會先試 MatchingGame／SentenceOrdering 專用驅動器）。 */
function driveOneGenericStep(container) {
  // 純資料卡片要逐張點過才放行（CardWalkthrough）。這一段必須排在
  // findAdvanceButton 之前：卡片沒點完時「繼續」是停用的，驅動器會誤以為
  // 只剩「本課先完成」而直接結束，星星覆蓋就會驗不到任何題目。
  const unseen = [];
  (function collect(node) {
    if (node.hasClass && node.hasClass('walkthrough__item') && !node.hasClass('walkthrough__item--seen')) unseen.push(node);
    (node.children || []).forEach(collect);
  })(container);
  if (unseen.length) {
    unseen[0].dispatch('click');
    return true;
  }

  const advanceBtn = findAdvanceButton(container);
  if (advanceBtn) {
    advanceBtn.dispatch('click');
    return true;
  }
  const checkBtn = enabledButtons(container).find((b) => b.textContent.trim() === '確認答案');
  if (checkBtn) {
    checkBtn.dispatch('click');
    return true;
  }
  // ReadingQuestions：依「找哪段／哪張圖 → 指出關鍵詞 → 看答案提示」逐步揭露。
  const revealBtn = enabledButtons(container).find((b) => /^(看提示|找哪段／哪張圖|指出關鍵詞|看答案提示)$/.test(b.textContent.trim()));
  if (revealBtn) {
    revealBtn.dispatch('click');
    return true;
  }
  const chip = enabledButtons(container, (n) => n.hasClass('sentence-chip') && !n.hasClass('drag-to-slot__slot'))[0];
  if (chip) {
    chip.dispatch('click');
    return true;
  }
  const quizOpt = enabledButtons(container, (n) => n.hasClass('quiz-option'))[0];
  if (quizOpt) {
    quizOpt.dispatch('click');
    return true;
  }
  // 字感訓練：字陣裡要點的是「目標字」，通用驅動器不知道哪一格是答案，
  // 所以從任務說明「找出所有的「X」」取出目標字再點。
  const cells = enabledButtons(container, (n) => n.hasClass('vsearch__cell'));
  if (cells.length) {
    const banner = container.find((n) => n.hasClass && n.hasClass('task-banner__label'));
    const target = (banner?.textContent || '').match(/找出所有的「(.+?)」/)?.[1];
    const hit = target ? cells.find((c) => c.textContent.trim() === target) : null;
    if (hit) {
      hit.dispatch('click');
      return true;
    }
  }
  return false;
}

function driveActivityToCompletion(container, isFinished, { maxIterations = 3000, readingSolution, sentenceSolutions } = {}) {
  let iterations = 0;
  while (!isFinished() && iterations < maxIterations) {
    iterations += 1;
    if (readingSolution && driveSentenceOrderingWithSolution(container, readingSolution)) continue;
    if (sentenceSolutions && driveSentenceOrderingWithLessonSolution(container, sentenceSolutions)) continue;
    if (driveMatchingGameIfPresent(container)) continue;
    if (driveSentenceOrderingBruteForce(container)) continue;
    if (driveOneGenericStep(container)) continue;
    throw new Error(`卡住了，第 ${iterations} 次迭代找不到任何可互動的元素，DOM 摘要：${summarize(container)}`);
  }
  assert.ok(isFinished(), `驅動 ${iterations} 步後仍未完成這個大項（可能有畫面沒有任何可判定題目）`);
}

function summarize(container) {
  const buttons = container.findAll((n) => n.tagName === 'button').map((b) => `[${b.textContent.trim()}${b.disabled ? '/disabled' : ''}]`);
  return buttons.slice(0, 20).join(' ');
}

// ---- 逐一驅動目前課次所有可開始的大項，確認每項都能累積 total>0（不會永遠湊不滿星星） ----
const results = [];
for (const entry of MODULE_REGISTRY) {
  const status = getModuleStatus(lesson, entry);
  if (status.code === 'locked') continue; // 舊字新詞第 1 課本來就鎖著，不在本次驗收範圍
  if (entry.key === 'review') continue; // 舊字新詞需要非同步載入前課資料，另有專測，不在本 DOM driver 範圍
  if (status.code !== 'available' && status.code !== 'done') continue; // 教材審核中／即將推出：沒有可玩內容，不驅動
  // 例：一字多音（polyphones）第 1 課大補帖端注音無法可靠抽取、pedia 也沒有
  // 語詞多讀音層級的注音，資料層暫時 0 筆可用題目，屬預期中的「教材審核中」。
  const builder = BUILDERS[entry.key];
  assert.ok(builder, `${entry.key}：應該要有對應的 activity builder`);

  startScoreSession();
  let finished = false;
  const container = builder(lesson, () => {
    finished = true;
  });

  // 注音高手要「打字」才走得下去，通用驅動器看 DOM 找不到解答，
  // 改用活動提供的測試掛勾把每一題做完。
  if (entry.key === 'zhuyin_typing') {
    let guard = 0;
    while (!finished && guard < 200) {
      guard += 1;
      const keys = container.findAll((n) => n.tagName === 'button');
      // 全部做完會換成完成小卡，要按「回課程首頁」才會回報整個大項結束
      const back = keys.find((b) => /^(回課程首頁|看結果|完成)/.test(b.textContent.trim()));
      const solution = container.__solution;
      if (back && !container.find((n) => n.hasClass('zt__slot'))) { back.dispatch('click'); continue; }
      if (!solution) break;
      const chooser = keys.filter((b) => b.hasClass('zt__candidate') && !b.disabled);
      const doneSlots = container.findAll((n) => n.hasClass('zt__slot--done')).length;
      if (chooser.length > 0) {
        const want = solution.chars[doneSlots];
        (chooser.find((b) => b.textContent === want) || chooser[0]).dispatch('click');
        continue;
      }
      const target = solution.syllables[doneSlots] || '';
      const currentSlot = container.find((n) => n.hasClass('zt__slot--current'));
      const typedNode = currentSlot && currentSlot.find((n) => n.hasClass('zt__slot-zhuyin'));
      const typed = (typedNode ? typedNode.textContent : '').trim().replace(/\u3000/g, '');
      const next = [...target][typed.length];
      const key = keys.find((b) => b.getAttribute('data-symbol') === next);
      if (!key) break;
      key.dispatch('click');
    }
    const meta0 = endScoreSession();
    assert.ok(finished, `${entry.label}（${entry.key}）應該可以一路做到完成`);
    assert.ok(meta0.total > 0, `${entry.label}（${entry.key}）完成後應該要有可判定題目`);
    results.push({ key: entry.key, label: entry.label, total: meta0.total, stars: computeModuleStars(meta0) });
    continue;
  }
  const readingSolution = entry.key === 'reading' ? readingParagraphSolution(lesson) : undefined;
  const sentenceSolutions = entry.key === 'sentence_practice' ? sentenceOrderingSolutions(lesson) : undefined;
  driveActivityToCompletion(container, () => finished, { readingSolution, sentenceSolutions });
  const meta = endScoreSession();
  const stars = computeModuleStars(meta);

  assert.ok(
    meta.total > 0,
    `「${entry.label}」（${entry.key}）玩到完成後 scoreSession.total 應該 > 0，實際 ${meta.total}` +
      '——代表這個大項沒有任何可判定題目，學生永遠湊不滿星星。',
  );
  assert.ok(stars >= 1 && stars <= 3, `「${entry.label}」算出的星星數應該在 1–3 之間，實際 ${stars}`);
  results.push({ key: entry.key, label: entry.label, total: meta.total, stars });
}

const expectedResults = MODULE_REGISTRY.filter((entry) => {
  const status = getModuleStatus(lesson, entry);
  return status.code !== 'locked'
    && entry.key !== 'review'
    && (status.code === 'available' || status.code === 'done');
}).length;
assert.equal(results.length, expectedResults, `應該驗證所有可開始的大項，預期 ${expectedResults} 個，實際 ${results.length}`);

console.log(`PASS: 第 ${lesson.lesson_no} 課 ${results.length} 個可開始大項逐一驗證，全部都有可判定題目、玩到底都能累積 1–3 顆星：`);
for (const r of results) {
  console.log(`  - ${r.label}（${r.key}）：total=${r.total}，stars=${r.stars}`);
}
