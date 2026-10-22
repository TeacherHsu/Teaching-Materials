export function freshProgress(config) {
  return { version: config.version, current: 0, scenes: config.scenes.map(() => ({ found: [], done: false, hints: 0, attempts: 0 })) };
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
    const done = saved.done === true && found.length === ids.size;
    const integer = (value, max) => Number.isInteger(value) ? Math.max(0, Math.min(max, value)) : 0;
    clean.scenes[i] = { found, done, hints: integer(saved.hints, 3), attempts: integer(saved.attempts, 999) };
    if (!done) unlocked = false;
  });
  const first = clean.scenes.findIndex((s) => !s.done);
  const lastAvailable = first < 0 ? config.scenes.length - 1 : first;
  clean.current = Number.isInteger(raw.current) ? Math.max(0, Math.min(lastAvailable, raw.current)) : lastAvailable;
  return clean;
}

export function canAnswer(scene, state) {
  return scene.clues.every((clue) => state.found.includes(clue.id));
}

export function answerScene(scene, state, choice) {
  if (state.done || !canAnswer(scene, state) || !Number.isInteger(choice) || !scene.question.options[choice]) return null;
  state.attempts += 1;
  const correct = choice === scene.question.answer;
  if (correct) state.done = true;
  else state.hints = Math.min(3, state.hints + 1);
  return { correct, feedback: scene.question.why[choice] };
}

export function readProgress(config, storage) {
  try { return restoreProgress(config, JSON.parse(storage.getItem(`mandarin:explore:${config.lessonId}`))); }
  catch { return freshProgress(config); }
}

export function saveProgress(config, progress, storage) {
  try { storage.setItem(`mandarin:explore:${config.lessonId}`, JSON.stringify(progress)); return true; }
  catch { return false; }
}
