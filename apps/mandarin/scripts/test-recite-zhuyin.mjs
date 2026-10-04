// 朗讀挑戰注音：預設依年級與組別，教師可單獨覆寫；學生端沒有切換鈕
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { installFakeDom } from './fake-dom.mjs';
installFakeDom();
const D = await import('../src/utils/deviceSettings.js');
D.setScaffoldLevel('standard');
assert.equal(D.reciteZhuyinOn(1), true, '低年級預設開');
assert.equal(D.reciteZhuyinOn(4), false, '中高年級標準組預設關');
D.setScaffoldLevel('challenge');
assert.equal(D.reciteZhuyinOn(6), false);
D.setScaffoldLevel('support');
assert.equal(D.reciteZhuyinOn(6), true, '中高年級支持組開');
D.setOverride('reciteZhuyin', false);
assert.equal(D.reciteZhuyinOn(1), false, '教師覆寫優先');
D.setOverride('reciteZhuyin', null);
const src = fs.readFileSync(new URL('../src/pages/RecitePage.js', import.meta.url), 'utf8');
assert.ok(!src.includes('注音：顯示'), '學生端不能切換注音');
console.log('✅ 朗讀挑戰注音：依年級組別預設、教師可覆寫、學生端不可切');
