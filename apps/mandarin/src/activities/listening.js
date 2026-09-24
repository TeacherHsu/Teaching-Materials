// 「聽聽看」模組：TTS 朗讀一個生活短句／短對話，學生選答案。
// 語音不支援時顯示「此裝置不支援朗讀」並提供「顯示文字」按鈕。逐題呈現，3–5 題一組。
import { h, clear } from '../utils/dom.js';
import { AudioButton } from '../components/AudioButton.js';
import { ChoiceQuiz } from '../components/ChoiceQuiz.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { missingContentNotice } from './engine.js';
import { filterByStatus } from '../utils/preview.js';
import { speechSupported } from '../utils/speech.js';

/**
 * @param {object} lesson
 * @param {() => void} onBack
 */
export function buildListeningActivity(lesson, onBack) {
  const items = filterByStatus(lesson.listening || []).filter((l) => l.stem && l.question);

  const container = h('div', {});

  function renderStep() {
    clear(container);
    if (items.length === 0) {
      container.appendChild(missingContentNotice('聽聽看：教材審核中'));
      return;
    }

    container.appendChild(TaskBanner({ label: '仔細聽，選出正確答案', step: `共 ${items.length} 題` }));

    // 每題各自的朗讀／顯示文字按鈕，隨題目一起顯示在 ChoiceQuiz 題幹上方（見 item.extra）。
    function buildAudioRow(entry) {
      const row = h('div', { class: 'listening-audio', style: 'margin-bottom:16px' });
      if (speechSupported()) {
        row.appendChild(AudioButton({ text: entry.stem, label: '播放' }));
      } else {
        row.appendChild(h('p', { class: 'meta' }, '此裝置不支援朗讀'));
        const textEl = h('p', { class: 'quiz-stem', style: 'display:none' }, entry.stem);
        const toggleBtn = h('button', { class: 'btn', type: 'button' }, '顯示文字');
        let shown = false;
        toggleBtn.addEventListener('click', () => {
          shown = !shown;
          textEl.style.display = shown ? '' : 'none';
          toggleBtn.textContent = shown ? '隱藏文字' : '顯示文字';
        });
        row.appendChild(toggleBtn);
        row.appendChild(textEl);
      }
      return row;
    }

    container.appendChild(
      ChoiceQuiz({
        items: items.map((entry) => ({
          id: entry.id,
          stem: entry.question,
          options: entry.options,
          answer: entry.answer,
          explanation: `對照內容：${entry.stem}`,
          hints: ['再聽一次（或看看文字），注意誰做了什麼事。'],
          extra: buildAudioRow(entry),
        })),
        onBack: () => onBack(),
      }),
    );
  }

  renderStep();
  return container;
}
