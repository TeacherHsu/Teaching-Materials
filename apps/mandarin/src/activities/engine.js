// Activity engine：把 lesson JSON 的 quiz/characters 資料接到對應元件，
// 元件本身完全不含教材內容，只吃資料。新增一課不需要碰這支檔案。

import { ChoiceQuiz } from '../components/ChoiceQuiz.js';
import { MatchingGame } from '../components/MatchingGame.js';

/**
 * @param {object} lesson 單課 JSON
 * @param {() => void} onBack
 */
export function buildChallengeActivity(lesson, onBack) {
  const choiceItems = (lesson.quiz || []).filter((q) => q.type === 'choice' && q.status === 'ready');
  const matchingItem = (lesson.quiz || []).find((q) => q.type === 'matching' && q.status === 'ready');

  const wrap = document.createElement('div');

  if (choiceItems.length > 0) {
    wrap.appendChild(document.createElement('h2')).textContent = '選擇題';
    wrap.appendChild(ChoiceQuiz({ items: choiceItems, onBack }));
  }
  if (matchingItem) {
    const h2 = document.createElement('h2');
    h2.textContent = matchingItem.stem || '配對挑戰';
    h2.style.marginTop = '24px';
    wrap.appendChild(h2);
    wrap.appendChild(MatchingGame({ pairs: matchingItem.pairs, onBack }));
  }
  if (choiceItems.length === 0 && !matchingItem) {
    wrap.appendChild(missingContentNotice());
  }
  return wrap;
}

export function missingContentNotice(text = '此部分教材待補') {
  const div = document.createElement('div');
  div.className = 'missing-content';
  div.textContent = text;
  return div;
}
