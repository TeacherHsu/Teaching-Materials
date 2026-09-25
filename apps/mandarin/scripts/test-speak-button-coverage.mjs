// Coverage 檢查：逐一渲染各元件／活動，確認學生會讀的文字（題幹／選項／提示／
// 生字造詞／語詞例句／詞塊……）旁都掛了對應的 SpeakButton（.speak-button），
// 且喇叭鈕與「選項本身的作答按鈕」是分開的節點（不會誤觸作答）。
// 無新依賴，純 Node（scripts/fake-dom.mjs 的 DOM／speechSynthesis stub）。
// 用法：node scripts/test-speak-button-coverage.mjs
import assert from 'node:assert/strict';
import { installFakeDom, installFakeSpeechSynthesis } from './fake-dom.mjs';

installFakeDom();
installFakeSpeechSynthesis([{ lang: 'zh-TW', name: 'Meijia' }]);

const { ChoiceQuiz } = await import('../src/components/ChoiceQuiz.js');
const { DragToSlot } = await import('../src/components/DragToSlot.js');
const { SentenceOrdering } = await import('../src/components/SentenceOrdering.js');
const { MatchingGame } = await import('../src/components/MatchingGame.js');
const { HintPanel } = await import('../src/components/HintPanel.js');
const { TaskBanner } = await import('../src/components/TaskBanner.js');
const { CompletionFeedback } = await import('../src/components/CompletionFeedback.js');
const { VocabularyCard } = await import('../src/components/VocabularyCard.js');
const { CharacterCard } = await import('../src/components/CharacterCard.js');

function hasSpeakButtonNearby(node) {
  // 喇叭鈕跟文字節點放在同一個 .quiz-option-row（或元件自己的等效容器）底下，
  // 從最近的容器往下找 .speak-button；找不到就往上一層再試一次（最多兩層）。
  let container = node.parentNode;
  for (let i = 0; i < 3 && container; i += 1) {
    const found = container.findAll?.((n) => n.hasClass && n.hasClass('speak-button'));
    if (found && found.length > 0) return true;
    container = container.parentNode;
  }
  return false;
}

let checked = 0;
function assertCoverage(root, label) {
  const stems = root.findAll((n) => n.hasClass('quiz-stem'));
  const options = root.findAll((n) => n.hasClass('quiz-option'));
  for (const stem of stems) {
    checked += 1;
    assert.ok(hasSpeakButtonNearby(stem), `${label}：題幹「${stem.textContent}」旁應有朗讀鈕`);
  }
  for (const opt of options) {
    checked += 1;
    assert.ok(hasSpeakButtonNearby(opt), `${label}：選項「${opt.textContent}」旁應有獨立的朗讀鈕`);
    // 朗讀鈕不應該是選項按鈕本身（必須是分開的節點，避免誤觸作答）
    const row = opt.parentNode;
    const speakBtn = row.findAll((n) => n.hasClass('speak-button'))[0];
    assert.notEqual(speakBtn, opt, `${label}：朗讀鈕不可與作答按鈕是同一個節點`);
  }
}

// --- ChoiceQuiz ---
{
  const quiz = ChoiceQuiz({
    items: [
      { id: 'q1', stem: '「回」的注音是？', options: ['ㄏㄨㄟˊ', 'ㄏㄨㄟˇ'], answer: 'ㄏㄨㄟˊ', explanation: '解釋文字' },
    ],
  });
  assertCoverage(quiz, 'ChoiceQuiz');
}

// --- DragToSlot（含 speakText） ---
{
  const drag = DragToSlot({
    items: [
      {
        id: 'd1',
        context: '成語：入木＿分',
        speakText: '成語：入木＿分',
        options: [{ id: 'a', label: '三' }, { id: 'b', label: '二' }],
        answerId: 'a',
      },
    ],
  });
  const stemRows = drag.findAll((n) => n.hasClass('quiz-stem'));
  assert.ok(stemRows.length > 0, 'DragToSlot：應該渲染題目文字');
  for (const stem of stemRows) {
    checked += 1;
    assert.ok(hasSpeakButtonNearby(stem), `DragToSlot：題目「${stem.textContent}」旁應有朗讀鈕`);
  }

  // 候選卡（sentence-chip）本身也要各自有獨立朗讀鈕，且不是同一個節點
  const optionChips = drag.findAll((n) => n.hasClass('sentence-chip') && n.tagName === 'button' && !n.hasClass('drag-to-slot__slot'));
  assert.equal(optionChips.length, 2, 'DragToSlot：應該渲染兩張候選卡');
  for (const chip of optionChips) {
    checked += 1;
    const row = chip.parentNode;
    const speakBtn = row.findAll((n) => n.hasClass('speak-button'))[0];
    assert.ok(speakBtn, `DragToSlot：候選卡「${chip.textContent}」旁應有朗讀鈕`);
    assert.notEqual(speakBtn, chip, `DragToSlot：候選卡「${chip.textContent}」的朗讀鈕不可與卡片是同一個節點`);
  }

  // 點喇叭不會觸發候選卡的選取（click 是選取行為的觸發點，喇叭要 stopPropagation）
  const firstChip = optionChips[0];
  const firstRow = firstChip.parentNode;
  const firstSpeakBtn = firstRow.findAll((n) => n.hasClass('speak-button'))[0];
  assert.equal(firstChip.getAttribute('aria-pressed'), 'false', 'DragToSlot：候選卡初始未選取');
  firstSpeakBtn.dispatch('pointerdown');
  firstSpeakBtn.dispatch('click');
  assert.equal(firstChip.getAttribute('aria-pressed'), 'false', 'DragToSlot：點喇叭不應該選取候選卡');
  assert.equal(firstChip.disabled, false, 'DragToSlot：點喇叭不應該把候選卡設為已選取（disabled）');
  checked += 1;
}

// --- SentenceOrdering：每個詞塊都可朗讀，且與選字按鈕分開 ---
{
  const ordering = SentenceOrdering({
    prompt: '請把下面的詞語排成一句通順的句子',
    parts: ['小狗', '回家了', '今天'],
    solution: ['今天', '小狗', '回家了'],
  });
  const chips = ordering.findAll((n) => n.hasClass('sentence-chip') && n.tagName === 'button');
  assert.ok(chips.length >= 3, 'SentenceOrdering：應該有詞塊可選');
  for (const chip of chips) {
    checked += 1;
    assert.ok(hasSpeakButtonNearby(chip), `SentenceOrdering：詞塊「${chip.textContent}」旁應有朗讀鈕`);
  }
}

// --- MatchingGame ---
{
  const game = MatchingGame({
    pairs: [
      { left: '快樂', right: '心情很好' },
      { left: '難過', right: '心情不好' },
      { left: '生氣', right: '很不高興' },
    ],
  });
  const items = game.findAll((n) => n.hasClass('matching-item'));
  assert.ok(items.length >= 6, 'MatchingGame：左右欄應各有項目');
  for (const item of items) {
    checked += 1;
    assert.ok(hasSpeakButtonNearby(item), `MatchingGame：項目「${item.textContent}」旁應有朗讀鈕`);
  }
}

// --- HintPanel／TaskBanner／CompletionFeedback ---
{
  const hint = HintPanel({ message: '再看看題目，仔細比對一下再選。' });
  assert.ok(hint.findAll((n) => n.hasClass('speak-button')).length > 0, 'HintPanel 應有朗讀鈕');
  checked += 1;

  const banner = TaskBanner({ label: '看字選出正確的注音' });
  assert.ok(banner.findAll((n) => n.hasClass('speak-button')).length > 0, 'TaskBanner 應有朗讀鈕');
  checked += 1;

  const done = CompletionFeedback({ correct: 3, total: 5 });
  assert.ok(done.findAll((n) => n.hasClass('speak-button')).length > 0, 'CompletionFeedback 應有朗讀鈕');
  checked += 1;
}

// --- VocabularyCard／CharacterCard ---
{
  const card = VocabularyCard({ word: '快樂', zhuyin: 'ㄎㄨㄞˋㄌㄜˋ', meaning: '心情很好', example_sentence: '我今天很快樂。' });
  assert.ok(card.findAll((n) => n.hasClass('speak-button')).length >= 3, 'VocabularyCard 正反面都應有朗讀鈕（詞／解釋／例句）');
  checked += 1;

  const charCard = CharacterCard({ char: '回', zhuyin: 'ㄏㄨㄟˊ', radical: '囗', stroke_count: 6, type: '習寫字', examples: ['回家', '回答'] });
  assert.ok(charCard.findAll((n) => n.hasClass('speak-button')).length >= 2, 'CharacterCard 應有朗讀鈕（字音／造詞）');
  checked += 1;
}

assert.ok(checked > 15, `檢查筆數應該足夠涵蓋主要元件，實際 ${checked}`);
console.log(`PASS: SpeakButton coverage 掃描通過，共檢查 ${checked} 個節點，皆有對應朗讀鈕且與作答按鈕分開。`);
