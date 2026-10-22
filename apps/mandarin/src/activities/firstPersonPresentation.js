// Only event-backed states; intermediate positions describe intensity, not new emotions.
export function moodFor(act, step) {
  const level = act === 1 ? 0 : act === 2 ? Math.min(3, 1 + step) : act === 3 ? 3 : [3, 2, 1, 1, 0][Math.min(4, step)];
  return { level, label: level === 0 ? '平靜' : '十分慌張', face: level === 0 ? '🙂' : '😟' };
}
export const subtitlePlan = scene => scene.clues.flatMap(c => c.refs || []);

export function subtitlesForStep(scene, step) {
  const all = subtitlePlan(scene).flatMap(ref => ref.sentences.map(n => ({para:ref.para, n})));
  const count = scene.operation.steps.length;
  return all.slice(Math.floor(all.length * (step-1) / count), Math.floor(all.length * step / count));
}
