// Compatibility exports for existing scene tests and the retired 3D renderer.
import lesson from './situationLessons/115AG3H04.js';
export { getSituationLesson as getFirstPersonLesson } from './situationLessons/index.js';
export const FIRST_PERSON_LESSON = lesson;
export const FIRST_PERSON_ILLUSTRATIONS = Object.fromEntries(lesson.scenes.map(s => [s.act, s.art]));
export function clueRefs(clue, scene, lesson) {
 if (!clue.questionEvidence) return clue.refs;
 return [...(scene.questions[0].extraEvidence || []), ...scene.questions[0].basis.flatMap(id => lesson.reading_questions.find(q => q.id === id)?.evidence || [])];
}
