// Vite discovers lesson files; Node-only legacy tests use the compatibility fallback.
import cooking from './115AG3H04.js';
let files;
try {
  files = import.meta.glob(['./*.js', '!./index.js', '!./schema.js'], { eager: true, import: 'default' });
} catch (error) {
  if (typeof import.meta.glob === 'function') throw error;
  files = { './115AG3H04.js': cooking };
}
export const situationLessons = Object.fromEntries(Object.values(files).map(lesson => [lesson.lessonId, lesson]));
export const getSituationLesson = id => situationLessons[id] || null;
