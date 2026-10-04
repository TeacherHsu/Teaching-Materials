import { h } from '../utils/dom.js';
import { SpeakButton } from './SpeakButton.js';

/**
 * 大項開頭的學習策略卡。
 *
 * 標題用「我可以學到」這種正向、以學生為主詞的說法，而不是「這一關在練的方法」
 * ——後者聽起來像在指出學生不足；前者把同一句話變成可以帶走的收穫，
 * 對長期挫折的孩子差別很大。
 * 附朗讀鍵，因為讀不動字的學生最需要這句話。
 * @param {{text: string}} opts
 */
export function StrategyCard({ text }) {
  return h('aside', { class: 'strategy-card', 'aria-label': '學習策略：我可以學到' }, [
    h('p', { class: 'strategy-card__label' }, [
      h('span', { class: 'strategy-card__tag' }, '學習策略'),
      h('span', {}, '我可以學到'),
    ]),
    h('div', { class: 'strategy-card__body quiz-option-row' }, [
      h('p', { class: 'strategy-card__text' }, text),
      SpeakButton({ text, label: '聽', variant: 'speak-button--option' }),
    ]),
  ]);
}

/**
 * 收合版（2026-10-04 第二版審查 A4／A5）：手機首屏先給任務，方法收成一行「本關小方法」，
 * 想看再點開；完整的方法教學在「學方法」示範裡，不在題目上方重複印一次。
 */
export function StrategyCardCompact({ text }) {
  return h('details', { class: 'strategy-card strategy-card--compact' }, [
    h('summary', { class: 'strategy-card__summary' }, [
      h('span', { class: 'strategy-card__tag' }, '本關小方法'),
      h('span', {}, '點開看'),
    ]),
    h('div', { class: 'strategy-card__body quiz-option-row' }, [
      h('p', { class: 'strategy-card__text' }, text),
      SpeakButton({ text, label: '聽', variant: 'speak-button--option' }),
    ]),
  ]);
}
