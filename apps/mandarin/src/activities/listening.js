// 「聽聽看」模組：TTS 朗讀一個生活短句／短對話，學生選答案。
// 語音不支援時顯示「此裝置不支援朗讀」並提供「顯示文字」按鈕。逐題呈現，3–5 題一組。
import { h, clear } from '../utils/dom.js';
import { resolveSpots } from '../components/EvidencePanel.js';
import { SpeakButton } from '../components/SpeakButton.js';
import { ChoiceQuiz } from '../components/ChoiceQuiz.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { missingContentNotice } from './engine.js';
import { filterByStatus } from '../utils/preview.js';
import { speechSupported } from '../utils/speech.js';
import { chunkRounds } from '../utils/chunk.js';
import { hasPlayableAnswer } from '../utils/answerGate.js';

/**
 * @param {object} lesson
 * @param {() => void} onBack
 */
// 單課小考用：只出題、不畫面。和下面的 build*Activity 共用同一份出題邏輯，
// 題目才不會兩邊長得不一樣。
// 注意：不帶 extra（音檔播放列）——小考是混題測驗，不重播音檔。
export function buildListeningQuizItems(lesson) {
  return filterByStatus(lesson.listening || [])
    .filter((l) => l.stem && l.question && hasPlayableAnswer(l))
    .map((entry) => ({
      id: entry.id,
      stem: entry.question,
      options: entry.options,
      answer: entry.answer,
      explanation: entry.explanation || `對照內容：${entry.stem}`,
      hints: ['再想一想，注意誰做了什麼事。'],
    }));
}

/** 依句號、問號、驚嘆號、分號切句；太短的併到前一句。 */
export function splitForReplay(passage) {
  const raw = String(passage || '').match(/[^。！？；!?;]+[。！？；!?;」』]*/g) || [];
  const out = [];
  for (const piece of raw.map((x) => x.trim()).filter(Boolean)) {
    if (out.length && piece.replace(/[^\u3400-\u9fff]/g, '').length < 4) out[out.length - 1] += piece;
    else out.push(piece);
  }
  return out;
}

export function buildListeningActivity(lesson, onBack) {
  const items = filterByStatus(lesson.listening || []).filter((l) => l.stem && l.question && hasPlayableAnswer(l));
  const rounds = chunkRounds(items);
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
      // 聽聽看要念的那段話就是課文：不存明碼，改存索引參照，這裡從解密後的
      // 課文取回來。沒解鎖就沒有短文——這和課文點讀、朗讀挑戰一致。
      const passage = entry.passage
        || resolveSpots(lesson.lesson_id, entry.passage_ref);
      // 沒有段落就明說，不拿題目 stem 頂替——那會變成「聽題目」而不是「聽課文」。
      if (!passage) {
        return h('p', { class: 'meta listening-audio' }, '這段要聽的課文還沒備妥：請老師先輸入教室密碼解鎖課文。');
      }
      if (speechSupported()) {
        row.appendChild(
          SpeakButton({
            text: passage,
            label: '先聽一聽',
            showLabel: true,
            ariaLabel: '先聽一聽：課文段落',
          }),
        );
        // 分句重播（2026-10-03 審查建議）：整段聽完記不住的學生，可以只重聽某一句。
        // 只給「第 N 句」按鈕、不顯示文字——這一關練的是聽，不是讀。
        const parts = splitForReplay(passage);
        if (parts.length >= 2) {
          row.appendChild(h('div', { class: 'listening-replay', role: 'group', 'aria-label': '分句重播' },
            parts.map((text, i) => SpeakButton({
              text,
              label: `第 ${i + 1} 句`,
              showLabel: true,
              ariaLabel: `重聽第 ${i + 1} 句`,
              variant: 'speak-button--option speak-button--audio-label',
            }))));
        }
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
          explanation: entry.explanation || `對照內容：${entry.stem}`,
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
