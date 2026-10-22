import { operationState, operationComplete } from './firstPersonInteraction.js';
export function freshProgress(config) {
  return { version: config.version, current: 0, scenes: config.scenes.map(() => ({ read: [], operation: { step: 0 }, found: [], done: false, hints: 0, attempts: 0, questionIndex: 0, hintUses: 0 })) };
}

// localStorage 可能過期、損壞或被教師手動清理；不可讓它跳過未完成的場景。
export function restoreProgress(config, raw) {
  const clean = freshProgress(config);
  if (raw?.version !== config.version || !Array.isArray(raw.scenes)) return clean;
  let unlocked = true;
  config.scenes.forEach((scene, i) => {
    const saved = raw.scenes[i];
    if (!unlocked || !saved) return;
    const ids = new Set(scene.clues.map((c) => c.id));
    const found = [...new Set((Array.isArray(saved.found) ? saved.found : []).filter((id) => ids.has(id)))];
    const operation = operationState(scene, saved.operation);
    const done = operationComplete(scene, operation) && saved.done === true && found.length === ids.size && (scene.stationType === 'story' || saved.questionIndex === scene.questions.length);
    const integer = (value, max) => Number.isInteger(value) ? Math.max(0, Math.min(max, value)) : 0;
    const allowed=new Set([...scene.beats.intro,...scene.beats.read].flatMap(r=>r.sentences.map(n=>`${r.para}:${n}`)));
    const read=[...new Set((Array.isArray(saved.read)?saved.read:[]).filter(k=>allowed.has(k)))];
    clean.scenes[i] = { read, operation, found: operationComplete(scene, operation) ? found : [], done, hints: integer(saved.hints, 3), attempts: integer(saved.attempts, 999), questionIndex: integer(saved.questionIndex, scene.questions.length), hintUses: integer(saved.hintUses, 999) };
    if (!done) unlocked = false;
  });
  const first = clean.scenes.findIndex((s) => !s.done);
  const lastAvailable = first < 0 ? config.scenes.length - 1 : first;
  clean.current = Number.isInteger(raw.current) ? Math.max(0, Math.min(lastAvailable, raw.current)) : lastAvailable;
  return clean;
}

export function canAnswer(scene, state) {
  return operationComplete(scene, state.operation || { step: 0 }) && scene.clues.every((clue) => state.found.includes(clue.id));
}

export function reward(state) { return Math.max(1, 3 - (state.hintUses || 0)); }
export function answerScene(scene, state, choice) {
  const q = scene.questions[state.questionIndex || 0];
  if (state.done || (!canAnswer(scene, state) && !([2,3].includes(scene.act) && operationComplete(scene, state.operation))) || !q) return null;
  const sequence = Array.isArray(q.answer);
  if (sequence ? !Array.isArray(choice) || choice.length !== q.answer.length || choice.some(i => !Number.isInteger(i) || !q.options[i]) : !Number.isInteger(choice) || !q.options[choice]) return null;
  state.attempts++;
  const correct = sequence ? choice.every((v, i) => v === q.answer[i]) : choice === q.answer;
  if (correct) {
    if ([2,3].includes(scene.act)) state.found = scene.clues.map(c => c.id);
    state.questionIndex = (state.questionIndex || 0) + 1;
    state.done = state.questionIndex === scene.questions.length;
    state.hints = 0;
  } else { state.hints = Math.min(3, state.hints + 1); state.hintUses = (state.hintUses || 0) + 1; }
  return { correct, feedback: correct ? q.explanation : sequence ? '再核對次序與人物。' + q.why[choice.find((v, i) => v !== q.answer[i])] : q.why[choice] };
}

export function readProgress(config, storage) {
  try { return restoreProgress(config, JSON.parse(storage.getItem(`mandarin:explore:${config.lessonId}`))); }
  catch { return freshProgress(config); }
}

export function saveProgress(config, progress, storage) {
  try { storage.setItem(`mandarin:explore:${config.lessonId}`, JSON.stringify(progress)); return true; }
  catch { return false; }
}
