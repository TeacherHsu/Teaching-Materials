import { h } from '../utils/dom.js';
import { SpeakButton } from './SpeakButton.js';

/**
 * 大項開頭的學習策略卡：先告訴學生「這一關在練什麼方法」。
 * 附朗讀鍵，因為讀不動字的學生最需要這句話。
 * @param {{text: string}} opts
 */
export function StrategyCard({ text }) {
  return h('aside', { class: 'strategy-card', 'aria-label': '這一關在練的方法' }, [
    h('p', { class: 'strategy-card__label' }, '這一關在練的方法'),
    h('div', { class: 'strategy-card__body quiz-option-row' }, [
      h('p', { class: 'strategy-card__text' }, text),
      SpeakButton({ text, label: '聽', variant: 'speak-button--option' }),
    ]),
  ]);
}
