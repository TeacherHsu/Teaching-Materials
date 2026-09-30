// 教師設定頁（#/teacher）：設定這台載具的鷹架厚度，並檢視作答紀錄。
//
// 入口用一道兩位數乘法擋住順手亂點的學生（見 utils/teacherGate.js）——
// 這不是資訊安全機制，本站沒有帳號也不該有。
// 頁面不顯示、也不儲存任何學生姓名；紀錄只有課次代號、大項代號與正確率。
import { h, clear } from '../utils/dom.js';
import { findModuleEntry } from '../activities/moduleRegistry.js';
import { SCAFFOLD_LEVELS, getScaffoldLevelKey, setScaffoldLevel, getDeviceLabel, setDeviceLabel } from '../utils/deviceSettings.js';
import { makeTeacherChallenge, verifyTeacherChallenge } from '../utils/teacherGate.js';
import { listRecords, recordsAsTsv, clearRecords } from '../utils/records.js';

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

  const clearBtn = h('button', { class: 'btn', type: 'button' }, '清除這台載具的紀錄');
  let armed = false;
  clearBtn.addEventListener('click', () => {
    if (!armed) {
      armed = true;
      clearBtn.textContent = '再按一次確認清除（無法復原）';
      return;
    }
    clearRecords();
    buildPanel(root);
  });
  root.appendChild(h('div', { class: 'quiz-option-row', style: 'margin-top:24px' }, [clearBtn]));
  root.appendChild(h('a', { class: 'btn', href: '#/', style: 'margin-top:16px' }, '回首頁'));
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
    root.appendChild(h('a', { class: 'btn', href: '#/', style: 'margin-top:16px' }, '回首頁'));
  }

  buildGate();
  return root;
}
