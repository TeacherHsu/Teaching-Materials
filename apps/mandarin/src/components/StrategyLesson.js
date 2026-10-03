// 「學方法」：先看示範 → 一起做一步 → 再到正式題目用同一個方法（遷移）。
// 2026-10-04 試做（CF 指定挑兩個關卡）：讀懂課文「找線索」、認識生字「找部首」。
//
// 為什麼這樣排：學障、閱讀困難的學生常常「知道要找線索」卻不知道怎麼找。
// 示範把思考過程一步一步說出來（放聲思考），一起做讓學生自己按下關鍵的一步、
// 馬上看到結果，最後才到本課的新題目自己用——那就是遷移。
import { h, clear } from '../utils/dom.js';
import { SpeakButton } from './SpeakButton.js';
import { speak } from '../utils/speech.js';

/**
 * @param {{
 *   title: string,                       // 例：學方法：找線索
 *   goal: string,                        // 一句話說這個方法
 *   frames: Array<{ render: () => Node, say: string }>,  // 示範的每一步
 *   guided: (done: () => void) => Node,  // 一起做：學生做對後呼叫 done
 *   onDone: () => void,                  // 進到正式題目
 *   doneLabel?: string,
 * }} opts
 */
export function StrategyLesson({ title, goal, frames, guided, onDone, doneLabel = '用這個方法做本課的題目' }) {
  const root = h('div', { class: 'strategy-lesson' });
  let stage = 'demo';
  let index = 0;

  function header(stepText) {
    return h('div', { class: 'strategy-lesson__head' }, [
      h('p', { class: 'strategy-lesson__stage' }, stepText),
      h('h2', { class: 'strategy-lesson__title' }, title),
      h('div', { class: 'quiz-option-row' }, [
        h('p', { class: 'strategy-lesson__goal' }, goal),
        SpeakButton({ text: goal, label: '聽', variant: 'speak-button--option' }),
      ]),
    ]);
  }

  function render() {
    clear(root);
    if (stage === 'demo') {
      const frame = frames[index];
      root.appendChild(header(`看示範（${index + 1}／${frames.length}）`));
      root.appendChild(h('div', { class: 'strategy-lesson__board' }, [frame.render()]));
      root.appendChild(h('div', { class: 'strategy-lesson__think quiz-option-row' }, [
        h('p', {}, frame.say),
        SpeakButton({ text: frame.say, label: '聽', variant: 'speak-button--option' }),
      ]));
      const next = h('button', { class: 'btn btn--primary', type: 'button' },
        index + 1 < frames.length ? '下一步' : '換我試試看');
      next.addEventListener('click', () => {
        if (index + 1 < frames.length) index += 1;
        else stage = 'guided';
        render();
      });
      root.appendChild(h('div', { class: 'quiz-option-row' }, [next]));
      speak(frame.say);
    } else if (stage === 'guided') {
      root.appendChild(header('一起做一次'));
      const go = h('button', { class: 'btn btn--primary', type: 'button', hidden: true }, doneLabel);
      go.addEventListener('click', () => onDone());
      root.appendChild(guided(() => { go.hidden = false; go.focus?.(); }));
      root.appendChild(h('div', { class: 'quiz-option-row' }, [go]));
    }
  }

  render();
  return root;
}

/** 一組可以點的選項；點對了呼叫 onRight，點錯顯示 why 並讓學生再選。 */
export function TapChoices({ items, isRight, onRight, why, label }) {
  const wrap = h('div', { class: 'strategy-tap', role: 'group', 'aria-label': label });
  const feedback = h('p', { class: 'strategy-tap__feedback', role: 'status', 'aria-live': 'polite' });
  items.forEach((item, i) => {
    const btn = h('button', { class: 'strategy-tap__item', type: 'button' }, item.render ? item.render() : item.text);
    if (item.aria) btn.setAttribute('aria-label', item.aria);
    btn.addEventListener('click', () => {
      if (isRight(item, i)) {
        btn.classList.add('strategy-tap__item--right');
        wrap.querySelectorAll?.('button').forEach((b) => { b.disabled = true; });
        feedback.textContent = '對了！';
        onRight(item, i);
      } else {
        btn.classList.add('strategy-tap__item--wrong');
        btn.disabled = true;
        feedback.textContent = why(item, i);
        speak(feedback.textContent);
      }
    });
    wrap.appendChild(btn);
  });
  return h('div', {}, [wrap, feedback]);
}
