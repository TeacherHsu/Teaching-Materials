// 教師設定頁（#/teacher）：設定這台載具的鷹架厚度，並檢視作答紀錄。
//
// 入口用一道兩位數乘法擋住順手亂點的學生（見 utils/teacherGate.js）——
// 這不是資訊安全機制，本站沒有帳號也不該有。
// 頁面不顯示、也不儲存任何學生姓名；紀錄只有課次代號、大項代號與正確率。
import { h, clear } from '../utils/dom.js';
import { findModuleEntry } from '../activities/moduleRegistry.js';
import { SCAFFOLD_LEVELS, getScaffoldLevelKey, setScaffoldLevel, getDeviceLabel, setDeviceLabel, getSheetUrl, setSheetUrl, getScaffoldLevel, getOverride, setOverride, getShowEarlyExit, setShowEarlyExit, getLastGrade } from '../utils/deviceSettings.js';
import { makeTeacherChallenge, verifyTeacherChallenge } from '../utils/teacherGate.js';
import { listRecords, recordsAsTsv, clearRecords, unsyncedAttempts, syncRecords } from '../utils/records.js';
import { allMistakes, clearMistakes } from '../utils/mistakes.js';
import { listSentences, markSentence, pendingSentences, clearSentences, MARKS } from '../utils/madeSentences.js';
import { reciteLessons, reciteSummary, clearRecite } from '../utils/reciteRecords.js';
import { isUnlocked, lock as lockReadings } from '../utils/classroomKey.js';

function moduleLabel(key) {
  const entry = findModuleEntry(key);
  return (entry && entry.label) || key;
}

function percent(value) {
  return `${Math.round((value || 0) * 100)}%`;
}

function buildRecordsTable() {
  const rows = listRecords();
  if (rows.length === 0) {
    return h('p', { class: 'meta' }, '這台載具還沒有作答紀錄。');
  }
  const head = h('tr', {}, ['課次', '大項', '最近日期', '最近正確率', '最佳', '次數'].map((t) => h('th', { scope: 'col' }, t)));
  const body = rows.map((r) => h('tr', {}, [
    h('td', {}, r.lessonId),
    h('td', {}, moduleLabel(r.moduleKey)),
    h('td', {}, String(r.latest.at).slice(0, 10)),
    h('td', {}, percent(r.latest.accuracy)),
    h('td', {}, percent(r.best)),
    h('td', {}, String(r.attempts)),
  ]));
  return h('div', { class: 'teacher-table-wrap' }, [
    h('table', { class: 'teacher-table' }, [h('thead', {}, [head]), h('tbody', {}, body)]),
  ]);
}

function buildPanel(root) {
  clear(root);
  root.appendChild(h('h1', {}, '教師設定'));
  root.appendChild(h('p', { class: 'meta' }, '這些設定只影響這一台載具，不會同步到其他裝置。本頁不顯示也不儲存學生姓名。'));

  // ---- 載具標記 ----
  root.appendChild(h('h2', {}, '載具標記'));
  const labelInput = h('input', {
    class: 'teacher-input', type: 'text', maxlength: '30',
    value: getDeviceLabel(), placeholder: '例如：三年級 1 號機',
    'aria-label': '載具標記',
  });
  const labelNote = h('p', { class: 'meta' }, '只用來標示匯出的成績是哪一台，請勿填學生姓名。');
  labelInput.addEventListener('change', () => {
    setDeviceLabel(labelInput.value);
    labelNote.textContent = '已儲存。';
  });
  root.appendChild(labelInput);
  root.appendChild(labelNote);

  // ---- 鷹架厚度 ----
  root.appendChild(h('h2', {}, '挑戰難易度'));
  root.appendChild(h('p', { class: 'meta' }, '題目內容完全相同，只調整支持的多寡。'));
  const current = getScaffoldLevelKey();
  const levelStatus = h('p', { class: 'meta' }, `目前：${SCAFFOLD_LEVELS[current].label}`);
  const levelRow = h('div', { class: 'card-grid' }, Object.values(SCAFFOLD_LEVELS).map((level) => {
    const btn = h('button', {
      class: `btn${level.key === current ? ' btn--primary' : ''}`,
      type: 'button',
      'aria-pressed': String(level.key === current),
    }, `${level.label}：${level.note}`);
    btn.addEventListener('click', () => {
      setScaffoldLevel(level.key);
      buildPanel(root);
    });
    return btn;
  }));
  root.appendChild(levelRow);
  root.appendChild(levelStatus);

  // ---- 個別調整 ----
  // null＝跟隨等級。教師手動調過的項目，之後切換等級**不會**被蓋掉；
  // 要恢復成跟著等級走，必須明確按「跟隨等級」。沒有這個區分的話，
  // 教師每次換等級都要重調一次。
  const level = getScaffoldLevel();
  root.appendChild(h('h3', {}, '個別調整'));
  root.appendChild(
    h('p', { class: 'meta' }, '沒有調整的項目會跟著上面的難易度走；調整過的項目換難易度時不會被蓋掉。'),
  );

  const OVERRIDE_UI = [
    {
      name: 'autoRead',
      label: '題目自動念出來',
      note: '閱讀困難的學生要先聽到題目才讀得下去。關掉之後喇叭鈕仍然在。',
    },
  ];

  for (const spec of OVERRIDE_UI) {
    const override = getOverride(spec.name);
    const effective = level[spec.name];
    const following = override === null;
    const choices = [
      { value: null, text: `跟隨等級（目前${SCAFFOLD_LEVELS[current][spec.name] ? '開' : '關'}）` },
      { value: true, text: '開' },
      { value: false, text: '關' },
    ];
    const row = h('div', { class: 'card teacher-override' }, [
      h('p', { class: 'teacher-override__label' }, spec.label),
      h('p', { class: 'meta' }, spec.note),
      h('div', { class: 'quiz-option-row' }, choices.map((choice) => {
        const on = choice.value === null ? following : (!following && override === choice.value);
        const btn = h('button', {
          class: `btn${on ? ' btn--primary' : ''}`,
          type: 'button',
          'aria-pressed': String(on),
        }, choice.text);
        btn.addEventListener('click', () => {
          setOverride(spec.name, choice.value);
          buildPanel(root);
        });
        return btn;
      })),
      h('p', { class: 'meta' }, `目前生效：${effective ? '開' : '關'}${following ? '' : '（已個別設定）'}`),
    ]);
    root.appendChild(row);
  }

  // ---- 課堂控制 ----
  root.appendChild(h('h3', {}, '課堂控制'));
  const earlyOn = getShowEarlyExit();
  const earlyRow = h('div', { class: 'card teacher-override' }, [
    h('p', { class: 'teacher-override__label' }, '顯示「本課先完成」按鈕'),
    h('p', { class: 'meta' },
      '預設關閉。開著的話學生可以在任何一步中途離開，為了快點拿到星星而跳過練習。'
      + '需要讓學生停下來時（下課了、要換活動）再打開。活動做完的「回課程首頁」不受影響。'),
    h('div', { class: 'quiz-option-row' }, [
      ...[['關', false], ['開', true]].map(([label, value]) => {
        const on = earlyOn === value;
        const btn = h('button', {
          class: `btn${on ? ' btn--primary' : ''}`,
          type: 'button',
          'aria-pressed': String(on),
        }, label);
        btn.addEventListener('click', () => { setShowEarlyExit(value); buildPanel(root); });
        return btn;
      }),
    ]),
    h('p', { class: 'meta' }, `目前：${earlyOn ? '會顯示' : '不顯示'}`),
  ]);
  root.appendChild(earlyRow);

  // ---- 教室密碼 ----
  // 解鎖後金鑰會記在這台載具（學生不必每次輸入），所以一定要給老師一個
  // 「鎖回去」的方法——借出去的 iPad、換班級、學期結束都需要。
  // 先前只實作了 lock() 卻沒有在畫面上露出來，等於鎖不回去。
  root.appendChild(h('h2', {}, '教室密碼'));
  const unlocked = isUnlocked();
  root.appendChild(h('p', { class: 'meta' },
    unlocked
      ? '這台載具目前**已解鎖**，課文點讀與朗讀挑戰可以直接打開。'.replace(/\*\*/g, '')
      : '這台載具目前是鎖上的，要先輸入教室密碼才能打開課文。'));
  const lockBtn = h('button', {
    class: 'btn',
    type: 'button',
    ...(unlocked ? {} : { disabled: 'disabled' }),
  }, unlocked ? '鎖上課文（下次要重新輸入密碼）' : '課文目前是鎖上的');
  if (unlocked) {
    lockBtn.addEventListener('click', () => {
      lockReadings();
      buildPanel(root);
    });
  }
  root.appendChild(h('div', { class: 'quiz-option-row' }, [lockBtn]));

  // ---- 朗讀挑戰 ----
  const recited = reciteLessons();
  root.appendChild(h('h2', {}, '朗讀挑戰'));
  if (!recited.length) {
    root.appendChild(h('p', { class: 'meta' }, '目前還沒有朗讀紀錄。'));
  } else {
    root.appendChild(h('p', { class: 'meta' },
      '正確率不比聲調、同音字算對——重點是「說得夠清楚讓機器抓得到」，不是發音標準。'
      + '少數不在字音索引裡的字會被判成念錯，所以分數是參考不是絕對。'
      + '每分鐘字數只作為和自己比較的依據，沒有對照年段常模。'));
    const tbody = h('tbody', {}, recited.map((lessonId) => {
      const s2 = reciteSummary(lessonId);
      return h('tr', {}, [
        h('td', {}, lessonId),
        h('td', {}, `${s2.units} 段`),
        h('td', {}, `${s2.averageAccuracy} 分`),
        h('td', {}, s2.averageCharsPerMinute ? `${s2.averageCharsPerMinute} 字/分` : '—'),
        h('td', {}, `${s2.attempts} 次`),
      ]);
    }));
    root.appendChild(h('table', { class: 'records' }, [
      h('thead', {}, h('tr', {}, ['課次', '念過', '平均正確率', '平均速度', '嘗試'].map((t) => h('th', {}, t)))),
      tbody,
    ]));
  }

  // ---- 學生造的句子 ----
  // 這是全站唯一需要「人看過」的產出：句子通不通順不是比對字串能決定的。
  // 打 ✗ 的句型會進學生的錯題複習，要求用同一個句型重寫。
  const sentences = listSentences();
  const pendingCount = pendingSentences().length;
  root.appendChild(h('h2', {}, `學生造的句子${pendingCount ? `（${pendingCount} 句待批改）` : ''}`));
  root.appendChild(
    h('p', { class: 'meta' },
      '句子只存在這台載具，不會同步到試算表（學生可能寫到自己或同學的名字）。'
      + '打 ✗ 的句型會進學生的錯題複習，要求重寫。'),
  );
  if (!sentences.length) {
    root.appendChild(h('p', { class: 'meta' }, '目前還沒有學生寫的句子。'));
  } else {
    for (const item of sentences) {
      const markLabel = item.mark === MARKS.OK ? '✓ 通過'
        : item.mark === MARKS.REDO ? '✗ 要重寫'
        : '還沒看';
      const card = h('div', { class: 'card teacher-sentence' }, [
        h('p', { class: 'meta' }, `${item.lessonId}　句型：${item.structure || item.patternHead || '—'}`),
        h('p', { class: 'teacher-sentence__text' }, item.text),
        h('p', { class: 'meta' }, `目前：${markLabel}`),
      ]);
      const choices = [
        { mark: MARKS.OK, text: '✓ 通過' },
        { mark: MARKS.REDO, text: '✗ 要重寫' },
      ];
      card.appendChild(h('div', { class: 'quiz-option-row' }, choices.map((choice) => {
        const on = item.mark === choice.mark;
        const btn = h('button', {
          class: `btn${on ? ' btn--primary' : ''}`,
          type: 'button',
          'aria-pressed': String(on),
        }, choice.text);
        btn.addEventListener('click', () => {
          markSentence(item.lessonId, item.patternId, on ? MARKS.PENDING : choice.mark);
          buildPanel(root);
        });
        return btn;
      })));
      root.appendChild(card);
    }
  }

  // ---- 作答紀錄 ----
  root.appendChild(h('h2', {}, '作答紀錄'));
  root.appendChild(h('p', { class: 'meta' }, '正確率＝第一次作答就答對的比率。學生答錯後會得到提示並再試，最後都會通過，所以只有第一次的判斷有診斷價值。'));
  root.appendChild(buildRecordsTable());

  const exportBox = h('textarea', { class: 'teacher-export', rows: '6', readonly: 'readonly', 'aria-label': '可貼進試算表的紀錄' });
  const exportBtn = h('button', { class: 'btn', type: 'button' }, '產生可貼進試算表的內容');
  exportBtn.addEventListener('click', () => {
    exportBox.value = recordsAsTsv(listRecords(), getDeviceLabel());
    exportBox.select?.();
  });
  root.appendChild(h('div', { class: 'quiz-option-row' }, [exportBtn]));
  root.appendChild(exportBox);

  // ---- Google 試算表同步 ----
  root.appendChild(h('h2', {}, '同步到 Google 試算表'));
  root.appendChild(h('p', { class: 'meta' }, '選用。設定後可以按一次把新紀錄送到你的試算表；不設定也不影響上課，紀錄一樣留在這台載具。設定步驟見教師操作手冊。'));
  const urlInput = h('input', {
    class: 'teacher-input', type: 'url', value: getSheetUrl(),
    placeholder: 'https://script.google.com/macros/s/.../exec', 'aria-label': 'Apps Script 網址',
  });
  const urlNote = h('p', { class: 'meta' }, '');
  urlInput.addEventListener('change', () => {
    urlNote.textContent = setSheetUrl(urlInput.value)
      ? '已儲存。'
      : '網址必須是 script.google.com 開頭的 Apps Script 網址。';
  });
  const syncStatus = h('p', { class: 'meta', role: 'status', 'aria-live': 'polite' }, `目前有 ${unsyncedAttempts().length} 筆尚未同步。`);
  const syncBtn = h('button', { class: 'btn btn--primary', type: 'button' }, '同步新紀錄');
  syncBtn.addEventListener('click', async () => {
    syncBtn.disabled = true;
    syncStatus.textContent = '同步中…';
    const result = await syncRecords(getSheetUrl(), getDeviceLabel());
    syncStatus.textContent = `${result.message}（尚未同步：${unsyncedAttempts().length} 筆）`;
    syncBtn.disabled = false;
  });
  root.appendChild(urlInput);
  root.appendChild(urlNote);
  root.appendChild(h('div', { class: 'quiz-option-row' }, [syncBtn]));
  root.appendChild(syncStatus);

  // 錯題盒狀態：教師看得到「還有幾題在練習中」，才知道學生是不是真的在複習。
  const mistakeCount = allMistakes().length;
  root.appendChild(
    h('p', { class: 'meta', style: 'margin-top:24px' },
      mistakeCount
        ? `錯題盒：${mistakeCount} 題在練習中（連續答對 4 次才會移除）。`
        : '錯題盒：目前沒有錯題。'),
  );

  const clearBtn = h('button', { class: 'btn', type: 'button' }, '清除這台載具的紀錄');
  let armed = false;
  clearBtn.addEventListener('click', () => {
    if (!armed) {
      armed = true;
      clearBtn.textContent = '再按一次確認清除（含錯題盒、學生寫的句子、朗讀成績，無法復原）';
      return;
    }
    clearRecords();
    clearMistakes();
    clearSentences();
    clearRecite();
    lockReadings();
    buildPanel(root);
  });
  root.appendChild(h('div', { class: 'quiz-option-row', style: 'margin-top:24px' }, [clearBtn]));
  // 回到老師進來之前的那一冊，不是整站首頁——不然每次調完設定都要重新點三層。
  const lastGrade = getLastGrade();
  root.appendChild(h('a', {
    class: 'btn',
    href: lastGrade ? `#/grade/${lastGrade}` : '#/',
    style: 'margin-top:16px',
  }, lastGrade ? '回到課本' : '回首頁'));
}

export function TeacherPage() {
  const root = h('div', { class: 'container teacher-page' }, []);
  let challenge = makeTeacherChallenge();

  function buildGate() {
    clear(root);
    root.appendChild(h('h1', {}, '教師設定'));
    root.appendChild(h('p', {}, '請先算出這一題，確認是老師在操作：'));
    const question = h('p', { class: 'teacher-challenge' }, challenge.question);
    const input = h('input', { class: 'teacher-input', type: 'text', inputmode: 'numeric', 'aria-label': '算式答案' });
    const error = h('p', { class: 'meta', role: 'alert' }, '');
    const submit = h('button', { class: 'btn btn--primary', type: 'button' }, '確認');
    const check = () => {
      if (verifyTeacherChallenge(challenge, input.value)) {
        buildPanel(root);
        return;
      }
      challenge = makeTeacherChallenge();
      question.textContent = challenge.question;
      input.value = '';
      error.textContent = '答案不對，換一題再試。';
    };
    submit.addEventListener('click', check);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
    root.appendChild(question);
    root.appendChild(input);
    root.appendChild(h('div', { class: 'quiz-option-row' }, [submit]));
    root.appendChild(error);
    // 回到老師進來之前的那一冊，不是整站首頁——不然每次調完設定都要重新點三層。
  const lastGrade = getLastGrade();
  root.appendChild(h('a', {
    class: 'btn',
    href: lastGrade ? `#/grade/${lastGrade}` : '#/',
    style: 'margin-top:16px',
  }, lastGrade ? '回到課本' : '回首頁'));
  }

  buildGate();
  return root;
}
