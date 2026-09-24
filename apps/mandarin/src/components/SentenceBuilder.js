import { h } from '../utils/dom.js';
import { SentenceOrdering } from './SentenceOrdering.js';

/**
 * SentenceBuilder 與 SentenceOrdering 共用同一套「點選詞塊組句」互動引擎，
 * 差異只在教學語意（SentenceBuilder 著重詞庫選字造句，SentenceOrdering
 * 著重既定句子的排序練習）與呈現的 prompt 文案；資料仍各自建模，
 * 未來若語意分歧（例如 SentenceBuilder 要開放自由輸入）可各自擴充不互相影響。
 * @param {{prompt: string, bank: string[], solution: string[], onBack?: () => void}} opts
 */
export function SentenceBuilder({ prompt, bank, solution, onBack }) {
  return SentenceOrdering({ prompt, parts: bank, solution, onBack });
}
