import { h } from '../utils/dom.js';

export const PRONUNCIATION_NOTICE_TEXT =
  '提醒：多音字在不同語境或詞語中的注音可能不同，卡片上的注音請留意，並以課本與課文標示為準。';

/** 生字卡／語詞解釋卡共用的多音字提醒。 */
export function PronunciationNotice() {
  return h('p', { class: 'pronunciation-notice', role: 'note' }, PRONUNCIATION_NOTICE_TEXT);
}
