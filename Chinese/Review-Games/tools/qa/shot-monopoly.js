/* 交給 cdp.mjs 注入；只在 QA 執行環境固定亂數，正式頁面不引用。 */
async function shotMonopoly() {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const until = async (fn, label, timeout = 30000) => {
    const end = performance.now() + timeout;
    while (performance.now() < end) { const value = fn(); if (value) return value; await wait(100); }
    throw Error('QA 等待逾時：' + label);
  };
  let seed = 271828;
  const originalRandom = Math.random;
  const seeded = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const api = window.RG3DMonopoly, originalMount = api?.mount;
  let view;
  Math.random = seeded;
  try {
    if (api) api.mount = opts => { view = originalMount(opts); return view; };
    const choose = (name, value) => {
      const select = document.querySelector(`select[aria-label="${name}"]`) || [...document.querySelectorAll('label')].find(l => l.querySelector('strong')?.textContent === name)?.querySelector('select');
      if (select) { select.value = value; select.dispatchEvent(new Event('change', { bubbles: true })); }
    };
    choose('隊伍數', '4'); choose('作答時間', '0');
    document.querySelectorAll('.setup input[type="checkbox"]').forEach(input => {
      const text = input.parentElement.textContent;
      const desired = !text.includes('減少動態') && !text.includes('自動朗讀') && !text.includes('投影模式');
      if (input.checked !== desired) { input.checked = desired; input.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    const start = await until(() => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '開始遊戲'), '開始遊戲'); start.click();
    if (view) await view.ready;
    const results = [];
    for (const n of [1, 4, 2]) {
      const roll = await until(() => [...document.querySelectorAll('button')].find(b => b.textContent === '擲骰子' && !b.disabled), '擲骰子');
      // play() 在第一個 await 之前同步取骰值；其餘出題與選項排列維持 seeded RNG。
      Math.random = () => (n - .5) / 6; roll.click(); Math.random = seeded;
      const mask = await until(() => document.querySelector('.qmask .qstem'), '題目');
      const stem = mask.textContent;
      const answers = window.REVIEW_BANK.questions.filter(q => q.stem === stem).map(q => q.answer);
      const answer = [...document.querySelectorAll('.qopt:not([disabled])')].find(b => answers.includes(b.dataset.v));
      if (!answer) throw Error('QA 題庫找不到唯一可用答案：' + stem);
      answer.click();
      const next = await until(() => document.querySelector('.qfoot .btn'), '繼續'); next.click();
      await until(() => !roll.disabled, '本回合結束'); await wait(1150);
      results.push({ dice: n, stem, answer: answer.dataset.v, log: document.querySelector('.log')?.textContent });
    }
    if (view && view.owners.size !== 3) throw Error('前三回合必須買下三塊地');
    const state = { fixture: 'T1B-first-three-purchases', active3d: !!view?.active, viewport: [innerWidth, innerHeight],
      overflowX: document.documentElement.scrollWidth > innerWidth, results, tokens: view ? [...view.tokens] : [], owners: view ? [...view.owners] : [],
      stats: view?.stats(), teams: [...document.querySelectorAll('.side .team')].map(n => n.textContent), mode: document.querySelector('.rg3d-status')?.textContent };
    window.RG_T1B_QA = { view, state }; return state;
  } finally { Math.random = originalRandom; if (api) api.mount = originalMount; }
}
return shotMonopoly();
