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
const { buildSentencePracticeActivity } = await import('../src/activities/sentencePractice.js');
const { buildIdiomBuilderActivity } = await import('../src/components/IdiomBuilder.js');
const { buildReadingActivity } = await import('../src/activities/reading.js');
const { buildPolysemyActivity } = await import('../src/activities/polysemy.js');
const { buildListeningActivity } = await import('../src/activities/listening.js');
const { buildRhetoricActivity } = await import('../src/activities/rhetoric.js');
const { buildStructureMapActivity } = await import('../src/activities/structureMap.js');
const { buildPolyphonesActivity } = await import('../src/activities/polyphones.js');
const { buildLookalikesActivity } = await import('../src/activities/lookalikes.js');

const BUILDERS = {
  characters: buildCharactersActivity,
  vocabulary: buildVocabularyActivity,
  sentence_practice: buildSentencePracticeActivity,
  idiom_builder: buildIdiomBuilderActivity,
  reading: buildReadingActivity,
  polysemy: buildPolysemyActivity,
  polyphones: buildPolyphonesActivity,
  lookalikes: buildLookalikesActivity,
  listening: buildListeningActivity,
  rhetoric: buildRhetoricActivity,
  structure_map: buildStructureMapActivity,
};

// ---- 通用互動驅動器：純看 DOM 狀態決定下一步，不需要事先知道任何一題的正解 ----
const ADVANCE_RE = /^(下一題|下一組|看結果|回課程首頁|繼續|再來一組|完成)/;

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
  return enabledButtons(container).find((b) => ADVANCE_RE.test(b.textContent.trim()));
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
  const chip = enabledButtons(container, (n) => n.hasClass('sentence-chip')).find((n) => n.textContent === word);
  assert.ok(chip, `句子重組／段落排序：應該能找到文字為「${word}」且尚未選取的詞塊`);
  chip.dispatch('click');
}

/** 依已知正解直接排（讀懂課文段落排序：正解可從課次資料算出來，見 readingParagraphSolution）。 */
function driveSentenceOrderingWithSolution(container, solution) {
  const slots = container.find((n) => n.hasClass && n.hasClass('sentence-slots'));
  if (!slots) return false;
  const checkBtn = enabledButtons(container).find((b) => b.textContent.trim() === '檢查答案');
  if (!checkBtn) return false;
  solution.forEach((word) => clickWordInOrder(container, word));
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
  // ReadingQuestions（開放式閱讀提問）：不判對錯，「看提示」後才會出現「下一題／看結果」。
  const revealBtn = enabledButtons(container).find((b) => b.textContent.trim() === '看提示');
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
  return false;
}

function driveActivityToCompletion(container, isFinished, { maxIterations = 3000, readingSolution } = {}) {
  let iterations = 0;
  while (!isFinished() && iterations < maxIterations) {
    iterations += 1;
    if (readingSolution && driveSentenceOrderingWithSolution(container, readingSolution)) continue;
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

// ---- 逐一驅動 9 個可開始的大項，確認每項都能累積 total>0（不會永遠湊不滿星星） ----
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
  const readingSolution = entry.key === 'reading' ? readingParagraphSolution(lesson) : undefined;
  driveActivityToCompletion(container, () => finished, { readingSolution });
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

assert.equal(results.length, 11, `應該驗證了 11 個可開始的大項（原 9 個＋形似字＋一字多音），實際 ${results.length}`);

console.log(`PASS: 第 ${lesson.lesson_no} 課 11 個可開始大項逐一驗證，全部都有可判定題目、玩到底都能累積 1–3 顆星：`);
for (const r of results) {
  console.log(`  - ${r.label}（${r.key}）：total=${r.total}，stars=${r.stars}`);
}
