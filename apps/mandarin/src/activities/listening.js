// 「聽聽看」模組：TTS 朗讀一個生活短句／短對話，學生選答案。
// 語音不支援時顯示「此裝置不支援朗讀」並提供「顯示文字」按鈕。逐題呈現，3–5 題一組。
import { h, clear } from '../utils/dom.js';
import { SpeakButton } from '../components/SpeakButton.js';
import { ChoiceQuiz } from '../components/ChoiceQuiz.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { missingContentNotice } from './engine.js';
import { filterByStatus } from '../utils/preview.js';
import { speechSupported } from '../utils/speech.js';
import { chunkRounds } from '../utils/chunk.js';

/**
 * @param {object} lesson
 * @param {() => void} onBack
 */
// 單課小考用：只出題、不畫面。和下面的 build*Activity 共用同一份出題邏輯，
// 題目才不會兩邊長得不一樣。
// 注意：不帶 extra（音檔播放列）——小考是混題測驗，不重播音檔。
export function buildListeningQuizItems(lesson) {
  return filterByStatus(lesson.listening || [])
    .filter((l) => l.stem && l.question)
    .map((entry) => ({
      id: entry.id,
      stem: entry.question,
      options: entry.options,
      answer: entry.answer,
      explanation: `對照內容：${entry.stem}`,
      hints: ['再想一想，注意誰做了什麼事。'],
    }));
}

export function buildListeningActivity(lesson, onBack) {
  const items = filterByStatus(lesson.listening || []).filter((l) => l.stem && l.question);
  const rounds = chunkRounds(items, { min: 3, max: 5 });
  let roundIndex = 0;

  const container = h('div', {});

  function renderStep() {
    clear(container);
    if (items.length === 0) {
      container.appendChild(missingContentNotice('聽聽看：教材審核中'));
      return;
    }

    const isLastRound = roundIndex === rounds.length - 1;
    container.appendChild(TaskBanner({ label: '仔細聽，選出正確答案', step: roundIndex === 0 ? '' : '加練挑戰' }));

    // 每題先提供對應課文段落的「先聽一聽」按鈕；段落只作為語音來源，不在畫面全文列出。
    function buildAudioRow(entry) {
      const row = h('div', { class: 'listening-audio', style: 'margin-bottom:16px' });
      const passage = entry.passage || entry.stem;
      if (speechSupported()) {
        row.appendChild(
          SpeakButton({
            text: passage,
            label: '先聽一聽',
            showLabel: true,
            ariaLabel: '先聽一聽：課文段落',
          }),
        );
      } else {
        row.appendChild(h('p', { class: 'meta' }, '此裝置不支援朗讀'));
        const textEl = h('p', { class: 'quiz-stem', style: 'display:none' }, passage);
        const toggleBtn = h('button', { class: 'btn', type: 'button' }, '顯示課文段落');
        let shown = false;
        toggleBtn.addEventListener('click', () => {
          shown = !shown;
          textEl.style.display = shown ? '' : 'none';
          toggleBtn.textContent = shown ? '隱藏課文段落' : '顯示課文段落';
        });
        row.appendChild(toggleBtn);
        row.appendChild(textEl);
      }
      return row;
    }

    container.appendChild(
      ChoiceQuiz({
        items: rounds[roundIndex].map((entry) => ({
          id: entry.id,
          stem: entry.question,
          options: entry.options,
          answer: entry.answer,
          explanation: `對照內容：${entry.stem}`,
          hints: ['再聽一次（或看看文字），注意誰做了什麼事。'],
          extra: buildAudioRow(entry),
        })),
        backLabel: isLastRound ? '回課程首頁' : '本課先完成',
        onBack: () => onBack(),
        onContinue: isLastRound ? null : () => {
          roundIndex += 1;
          renderStep();
        },
      }),
    );
  }

  renderStep();
  return container;
}
