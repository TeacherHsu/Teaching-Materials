// 入口卡片（課文點讀、錯題複習、朗讀挑戰、單課小考、舊字新詞）的朗讀鈕。
// 卡片本身是連結：按喇叭只朗讀，不要跟著跳頁。
import { SpeakButton } from './SpeakButton.js';

export function withEntrySpeak(card) {
  const title = card.querySelector?.('.entry-card__title')?.textContent || '';
  const desc = card.querySelector?.('.entry-card__desc')?.textContent || '';
  const text = [title, desc].filter(Boolean).join('。');
  if (!text) return card;
  const btn = SpeakButton({ text, label: '聽', variant: 'speak-button--option entry-card__speak' });
  btn.addEventListener('click', (e) => e.preventDefault());
  card.appendChild(btn);
  return card;
}
