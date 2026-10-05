// 教師設定頁（#/teacher）：設定這台載具的鷹架厚度，並檢視作答紀錄。
//
// 入口用一道兩位數乘法擋住順手亂點的學生（見 utils/teacherGate.js）——
// 這不是資訊安全機制，本站沒有帳號也不該有。
// 頁面不顯示、也不儲存任何學生姓名；紀錄只有課次代號、大項代號與正確率。
import { readAsrLog, clearAsrLog, asrProblemTargets } from '../utils/asrLog.js';
import { h, clear } from '../utils/dom.js';
import { findModuleEntry } from '../activities/moduleRegistry.js';
import { SCAFFOLD_LEVELS, getScaffoldLevelKey, setScaffoldLevel, getDeviceLabel, setDeviceLabel, getSheetUrl, setSheetUrl, getScaffoldLevel, getOverride, setOverride, getShowEarlyExit, setShowEarlyExit, getShowStepJump, setShowStepJump, DETAIL_SPECS, getLastGrade, hasGradeLevel, getStudentCode, setStudentCode } from '../utils/deviceSettings.js';
import { makeTeacherChallenge, verifyTeacherChallenge } from '../utils/teacherGate.js';
import { listRecords, recordsAsTsv, clearRecords, unsyncedAttempts, syncRecords, levelAdvice, listSkills } from '../utils/records.js';
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

const GRADE_NAMES = { 1: '一年級', 2: '二年級', 3: '三年級', 4: '四年級', 5: '五年級', 6: '六年級' };

/** 技能紀錄：依技能（不是依關卡）看獨立答對、提示後答對、看答案，以及換新材料的遷移題。 */
function buildSkillsTable() {
  const rows = listSkills();
  if (!rows.length) return h('p', { class: 'meta' }, '這個學生代碼還沒有技能紀錄。');
  const head = h('tr', {}, ['技能', '題數', '自己答對', '提示後答對', '看了答案', '遷移題（新材料）自己答對'].map((t) => h('th', { scope: 'col' }, t)));
  const body = rows.map((r) => h('tr', {}, [
    h('td', {}, r.label),
    h('td', {}, String(r.total)),
    h('td', {}, String(r.firstTry)),
    h('td', {}, String(r.hinted)),
    h('td', {}, String(r.revealed)),
    h('td', {}, r.tTotal ? `${r.tFirstTry}／${r.tTotal}` : '–'),
  ]));
  return h('div', { class: 'teacher-table-wrap' }, [h('table', { class: 'teacher-table' }, [h('thead', {}, [head]), h('tbody', {}, body)])]);
}

function buildRecordsTable() {
  const rows = listRecords();
  if (rows.length === 0) {
    return h('p', { class: 'meta' }, '這台載具還沒有作答紀錄。');
  }
  const head = h('tr', {}, ['學生', '課次', '大項', '最近日期', '最近正確率', '最近一次：自己／提示後／揭曉', '最佳', '次數'].map((t) => h('th', { scope: 'col' }, t)));
  const body = rows.map((r) => h('tr', {}, [
    h('td', {}, r.student || '（未填）'),
    h('td', {}, r.lessonId),
    h('td', {}, moduleLabel(r.moduleKey)),
    h('td', {}, String(r.latest.at).slice(0, 10)),
    h('td', {}, percent(r.latest.accuracy)),
    // 「最近正確率」只算獨立答對；拆開看才知道其餘是靠提示完成，還是被直接告知答案
    h('td', {}, r.latest.total ? `${r.latest.firstTry ?? '–'}／${r.latest.hinted ?? '–'}／${r.latest.revealed ?? '–'}（共 ${r.latest.total} 題）` : '–'),
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

  // ---- 學生代碼 ----
  // 共用載具換人時，老師在這裡改代碼；之後的作答紀錄都記在這個代碼下。
  root.appendChild(h('h2', {}, '目前使用的學生代碼'));
  const codeInput = h('input', {
    class: 'teacher-input', type: 'text', maxlength: '8', autocomplete: 'off',
    value: getStudentCode(), placeholder: '例如：S03',
    'aria-label': '學生代碼',
  });
  const codeNote = h('p', { class: 'meta' }, '只能填英文字母、數字與「-」，最多 8 碼；請勿填姓名。代碼與姓名的對照表請老師自行保管。');
  codeInput.addEventListener('change', () => {
    const ok = setStudentCode(codeInput.value);
    codeNote.textContent = ok
      ? (getStudentCode() ? `已儲存：之後的作答都記在 ${getStudentCode()}。` : '已清除：之後的作答不記學生代碼。')
      : '格式不對：只能用英文字母、數字與「-」，最多 8 碼。';
    if (ok) codeInput.value = getStudentCode();
  });
  root.appendChild(codeInput);
  root.appendChild(codeNote);

  // ---- 支持程度（CF 2026-10-04：每個個案設定一次，細項跟著走，需要時再單獨改）----
  root.appendChild(h('h2', {}, '支持程度'));
  const code = getStudentCode();
  const current = getScaffoldLevelKey();
  const gradeNow = getLastGrade();
  root.appendChild(h('p', { class: 'teacher-grade-scope' }, code
    ? `正在設定：學生代碼 ${code} 的支持程度（換人時先在上面改代碼）`
    : (gradeNow
      ? `還沒填學生代碼：正在設定${GRADE_NAMES[gradeNow] || `${gradeNow} 年級`}的預設分組`
      : '還沒填學生代碼：正在設定這台載具的預設分組')));
  root.appendChild(h('p', { class: 'meta' }, '題目內容完全相同，只調整支持的多寡。選好組別，下面的細項會跟著改；個案需要時再單獨調整某一項。'));
  const levelRow = h('div', { class: 'quiz-option-row' }, Object.values(SCAFFOLD_LEVELS).map((lv) => {
    const on = lv.key === current;
    const btn = h('button', { class: `btn${on ? ' btn--primary' : ''}`, type: 'button', 'aria-pressed': String(on) }, lv.label);
    btn.addEventListener('click', () => { setScaffoldLevel(lv.key); buildPanel(root); });
    return btn;
  }));
  root.appendChild(levelRow);
  root.appendChild(h('p', { class: 'meta' }, `${SCAFFOLD_LEVELS[current].label}：${SCAFFOLD_LEVELS[current].note}${!code && gradeNow && !hasGradeLevel(gradeNow) ? '（跟著整台預設）' : ''}`));

  // 升降級建議：依這個年級最近的獨立答對率（不用提示、第一次就答對）
  if (gradeNow) {
    const advice = levelAdvice(gradeNow, current);
    const who = getStudentCode() ? `學生代碼 ${getStudentCode()}：` : '（未填學生代碼的作答）';
    const order = ['support', 'standard', 'challenge'];
    const idx = order.indexOf(current);
    let text;
    if (advice.rate === null) {
      text = `${who}最近三週在「${SCAFFOLD_LEVELS[current].label}」只有 ${advice.items} 題作答紀錄，滿 ${advice.minItems} 題後會給升降級建議。`;
    } else {
      const pct = Math.round(advice.rate * 100);
      const target = advice.advice === 'up' ? order[idx + 1] : advice.advice === 'down' ? order[idx - 1] : null;
      text = `${who}最近三週在「${SCAFFOLD_LEVELS[current].label}」${advice.items} 題，獨立答對 ${pct}%。`
        + (target ? `建議${advice.advice === 'up' ? '升' : '降'}到「${SCAFFOLD_LEVELS[target].label}」。` : '建議維持目前等級。')
        + '（低於 5 成降一級、5～8 成維持、8 成以上升一級）';
    }
    text += '　這只是調整練習難度的參考，題目難度、讀題語音、選項數都會影響答對率，不能直接當作 IEP 目標的進展證據。';
    root.appendChild(h('p', { class: `teacher-advice teacher-advice--${advice.advice || 'none'}` }, text));
  }

  // ---- 細項（全部列出；沒改過的跟著組別）----
  const level = getScaffoldLevel();
  root.appendChild(h('h3', {}, '細項'));
  root.appendChild(h('p', { class: 'meta' }, '「跟著組別」的項目換組別時會自動改；單獨改過的項目換組別時不會被蓋掉，要恢復請按「跟著組別」。'));
  const fmt = (spec, v) => (spec.choices.find(([x]) => x === v) || [v, String(v)])[1];
  const detailTable = h('div', { class: 'teacher-details' }, DETAIL_SPECS.map((spec) => {
    const override = getOverride(spec.name);
    const following = override === null;
    const groupValue = SCAFFOLD_LEVELS[current][spec.name];
    const select = h('select', { class: 'teacher-input', 'aria-label': spec.label }, [
      h('option', { value: '__follow' }, `跟著組別（${fmt(spec, groupValue)}）`),
      ...spec.choices.map(([v, text]) => h('option', { value: JSON.stringify(v) }, text)),
    ]);
    select.value = following ? '__follow' : JSON.stringify(override);
    select.addEventListener('change', () => {
      setOverride(spec.name, select.value === '__follow' ? null : JSON.parse(select.value));
      buildPanel(root);
    });
    return h('div', { class: 'teacher-detail-row' }, [
      h('span', { class: 'teacher-detail-row__label' }, spec.label),
      select,
      h('span', { class: 'meta' }, following ? '' : `已單獨調整（目前 ${fmt(spec, level[spec.name])}）`),
    ]);
  }));
  root.appendChild(detailTable);

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
  const jumpOn = getShowStepJump();
  root.appendChild(h('div', { class: 'card teacher-override' }, [
    h('p', { class: 'teacher-override__label' }, '關卡上方的「題組」跳轉列'),
    h('p', { class: 'meta' }, '一個關卡有好幾組題目時（例如認識生字：生字卡／字音／找部首），可以直接跳到想練的那一組。'
      + '學生會為了拿星星而跳過練習時，可以先關掉。'),
    h('div', { class: 'quiz-option-row' }, [['顯示', true], ['不顯示', false]].map(([label, value]) => {
      const on = jumpOn === value;
      const btn = h('button', { class: `btn${on ? ' btn--primary' : ''}`, type: 'button', 'aria-pressed': String(on) }, label);
      btn.addEventListener('click', () => { setShowStepJump(value); buildPanel(root); });
      return btn;
    })),
  ]));

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
  root.appendChild(h('h3', {}, `技能紀錄${getStudentCode() ? `（${getStudentCode()}）` : '（未填代碼）'}`));
  root.appendChild(h('p', { class: 'meta' }, '同一個方法在不同關卡、不同課都算在同一列。「遷移題」是學生學完方法後，換新材料、少一層幫忙時自己答對的情形；只能當教學參考，不是 IEP 進展證據。'));
  root.appendChild(buildSkillsTable());

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
  root.appendChild(asrLogSection(root));
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

/** 語音辨識紀錄（只有文字，不存聲音）：最常被判錯的字詞＋最近 30 筆，可複製成表格或清除。 */
function asrLogSection(root) {
  const log = readAsrLog();
  const box = h('section', { class: 'card teacher-asr' }, [h('h3', {}, `語音辨識紀錄（${log.length} 筆，只存文字）`)]);
  if (!log.length) {
    box.appendChild(h('p', { class: 'meta' }, '還沒有紀錄。學生用念讀語詞、朗讀挑戰的麥克風後，這裡會記下「要念的／電腦聽到的」。'));
    return box;
  }
  const misses = log.filter((e) => !e.ok).length;
  box.appendChild(h('p', { class: 'meta' }, `判成沒念對：${misses}／${log.length} 筆。常被判錯的字詞可能是辨識器聽不準，不一定是學生念錯。`));
  const top = asrProblemTargets(log);
  if (top.length) {
    box.appendChild(h('div', { class: 'info-page__table-wrap' }, h('table', { class: 'teacher-table' }, [
      h('thead', {}, h('tr', {}, ['最常判錯', '判錯／次數', '電腦常聽成'].map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, top.map((t) => h('tr', {}, [h('td', {}, t.target.slice(0, 20)), h('td', {}, `${t.misses}／${t.tries}`), h('td', {}, t.heard.join('、'))]))),
    ])));
  }
  const recent = log.slice(-30).reverse();
  box.appendChild(h('details', {}, [
    h('summary', {}, '最近 30 筆'),
    h('div', { class: 'info-page__table-wrap' }, h('table', { class: 'teacher-table' }, [
      h('thead', {}, h('tr', {}, ['時間', '代碼', '課', '要念的', '電腦聽到', '判定'].map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, recent.map((e) => h('tr', {}, [e.at, e.code, e.lessonId.slice(5), e.target.slice(0, 20), (e.heard[0] || '').slice(0, 20), e.ok ? '念對' : (e.accuracy != null ? `${e.accuracy} 分` : '沒念對')].map((t) => h('td', {}, t))))),
    ])),
  ]));
  const copy = h('button', { class: 'btn', type: 'button' }, '複製成表格');
  copy.addEventListener('click', () => {
    const rows = [['時間', '代碼', '課', '模組', '要念的', '電腦聽到（候選）', '判定', '分數']]
      .concat(log.map((e) => [e.at, e.code, e.lessonId, e.module, e.target, e.heard.join(' / '), e.ok ? '對' : '錯', e.accuracy ?? '']));
    navigator.clipboard?.writeText(rows.map((r) => r.join('\t')).join('\n'));
    copy.textContent = '已複製';
  });
  const clearIt = h('button', { class: 'btn btn--ghost', type: 'button' }, '清除辨識紀錄');
  clearIt.addEventListener('click', () => { clearAsrLog(); buildPanel(root); });
  box.appendChild(h('div', { class: 'quiz-option-row' }, [copy, clearIt]));
  return box;
}
