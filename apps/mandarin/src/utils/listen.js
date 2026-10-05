// 收音（2026-10-06 CF：語音辨識不夠理想，調整收音方式）。念讀字詞、朗讀挑戰共用。
//
// 原本的問題：
// - 單次模式（continuous=false）一停頓就結束，念到一半被切斷。
// - 「再按一次結束」用 abort()，會把已經念的內容整個丟掉。
// - 只拿 1 個候選，聽成同音別字的機會大。
// 現在：
// - continuous＋interimResults：一路收到學生按「念完了」，邊念邊顯示「聽到：……」。
// - 結束用 stop()（會送出最後結果），不用 abort()。
// - 安靜 SILENCE_MS 沒有新聲音自動結束；最長 MAX_MS。
// - maxAlternatives 5，回傳多個候選讓評分挑最好的。
// iPad Safari 的 continuous 有時會自己提早結束：onend 時有收到東西就照樣交卷。
const SILENCE_MS = 3500;
const MAX_MS = 60000;

export function recognitionSupported() {
  return typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/** 由每一段的候選組出整句候選：第一個是各段最佳，之後每次只換一段。 */
export function combineAlternatives(segments) {
  if (!segments.length) return [];
  const best = segments.map((alts) => alts[0] || '');
  const out = [best.join('')];
  segments.forEach((alts, i) => alts.slice(1).forEach((alt) => {
    const c = [...best]; c[i] = alt; out.push(c.join(''));
  }));
  return [...new Set(out)];
}

/**
 * @param {{ onInterim?: (text:string)=>void, onDone: (r:{heard:string[], error?:string})=>void }} opts
 * @returns {{ stop: () => void, cancel: () => void }}
 */
export function listen({ onInterim, onDone }) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new Recognition();
  rec.lang = 'zh-TW';
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 5;
  const finals = [];
  let interim = '';
  let done = false;
  let silenceTimer = null;
  const maxTimer = setTimeout(() => stop(), MAX_MS);

  const finish = (error) => {
    if (done) return;
    done = true;
    clearTimeout(silenceTimer); clearTimeout(maxTimer);
    const heard = combineAlternatives(finals);
    if (!heard.length && interim) heard.push(interim);
    if (heard.length) onDone({ heard });
    else onDone({ heard: [], error: error || '沒有聽到聲音，再按一次念念看。' });
  };
  const bumpSilence = () => {
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => stop(), SILENCE_MS);
  };

  rec.onresult = (event) => {
    interim = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const r = event.results[i];
      if (r.isFinal) finals[i] = [...r].map((a) => a.transcript || '');
      else interim += r[0]?.transcript || '';
    }
    onInterim?.(finals.map((a) => a?.[0] || '').join('') + interim);
    bumpSilence();
  };
  rec.onerror = (event) => {
    if (event.error === 'no-speech' || event.error === 'aborted') return; // 交給 onend
    finish(event.error === 'not-allowed' ? '這台裝置不能用麥克風，請檢查權限。' : '聽不清楚，再按一次念念看。');
  };
  rec.onend = () => finish();
  function stop() {
    try { rec.stop(); } catch { finish(); }
  }
  try { rec.start(); bumpSilence(); } catch { finish('這台裝置不能用麥克風，請檢查權限。'); }
  return {
    stop,
    cancel() { done = true; clearTimeout(silenceTimer); clearTimeout(maxTimer); try { rec.abort(); } catch { /* 已停 */ } },
  };
}
