// 三層提示的階梯：第 1 層在看不到課文時給（說「去哪一塊找」），
// 第 2 層打開證據面板並給句子線索，第 3 層才用螢光筆標出答案。
// 階梯一旦反過來（第 1 層就把句子說出來），後面兩層就沒有意義了。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot = path.join(appRoot, 'public', 'data');

let withLadder = 0;
for (const volume of fs.readdirSync(dataRoot, { withFileTypes: true }).filter((e) => e.isDirectory() && /^115AG\d/.test(e.name))) {
  for (const filename of fs.readdirSync(path.join(dataRoot, volume.name)).filter((n) => /^lesson\d+\.json$/.test(n))) {
    const lesson = JSON.parse(fs.readFileSync(path.join(dataRoot, volume.name, filename), 'utf8'));
    for (const question of lesson.reading_questions || []) {
      const hints = question.hints;
      if (!Array.isArray(hints) || hints.length === 0) continue;
      const where = `${lesson.lesson_id} ${question.id}`;
      assert.deepEqual(hints.map((h) => h.level), [1, 2, 3], `${where}: 提示要剛好三層且依序`);
      assert.equal(hints[1].type, 'locate', `${where}: 第 2 層負責打開證據面板`);
      assert.equal(hints[2].type, 'evidence', `${where}: 第 3 層才標螢光筆`);
      assert.ok(hints[0].text && hints[0].text.trim(), `${where}: 第 1 層一定要有文字`);
      for (const hint of hints) {
        if (!hint.text) continue;
        // 提示不可以直接寫出答案——寫出來就不是鷹架，是給答案
        assert.ok(
          !hint.text.includes(question.answer),
          `${where}: 第 ${hint.level} 層提示直接寫出答案「${question.answer}」`,
        );
      }
      if (hints[1].text) {
        withLadder += 1;
        assert.notEqual(hints[0].text, hints[1].text, `${where}: 兩層提示不可以一樣`);
      }
    }
  }
}

// 元件要吃得到第 2、3 層的自訂文字，沒標才退回通用句
const component = fs.readFileSync(path.join(appRoot, 'src', 'components', 'ReadingQuestions.js'), 'utf8');
assert.match(component, /byLevel\(2\)\?\.text \|\|/u, '第 2 層要優先用課次標的文字');
assert.match(component, /byLevel\(3\)\?\.text \|\|/u, '第 3 層也要能自訂');

console.log(`✅ 提示階梯：${withLadder} 題有分層提示文字，沒有一題把答案寫進提示`);
