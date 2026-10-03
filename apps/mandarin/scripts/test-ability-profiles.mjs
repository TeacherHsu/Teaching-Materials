// 能力分組依個案（學生代碼）記：組別一次設定、細項跟著走、單獨改過的不被蓋掉
import assert from 'node:assert/strict';
import { installFakeDom } from './fake-dom.mjs';
installFakeDom();
const D = await import('../src/utils/deviceSettings.js');

D.setStudentCode('S01');
D.setScaffoldLevel('support');
assert.equal(D.getScaffoldLevel().label, '低組');
assert.equal(D.getScaffoldLevel().optionCount, 2, '低組細項跟著組別');
assert.equal(D.setOverride('roundSize', 8), true);
assert.equal(D.setOverride('optionCount', 99), false, '清單外的值不收');
D.setScaffoldLevel('challenge');
assert.equal(D.getScaffoldLevel().optionCount, 4, '換組別，沒改過的細項跟著變');
assert.equal(D.getScaffoldLevel().roundSize, 8, '單獨改過的細項不被蓋掉');

D.setStudentCode('S02');
assert.notEqual(D.getScaffoldLevelKey(), 'challenge', '另一個個案不受影響');
D.setScaffoldLevel('standard');
assert.equal(D.getScaffoldLevel().roundSize, 5);

D.setStudentCode('S01');
assert.equal(D.getScaffoldLevelKey(), 'challenge', '換回來還記得');
D.setOverride('roundSize', null);
assert.equal(D.getScaffoldLevel().roundSize, 5, '恢復跟著組別');
D.setFlashTimed(true);
assert.equal(D.getFlashTimed(), true, '閃現限時也是個案細項');
D.setStudentCode('S02');
assert.equal(D.getFlashTimed(), false);
console.log('✅ 能力分組依個案記、細項跟著組別、單獨調整保留');
