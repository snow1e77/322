// server/utils/censor.js
import { Filter } from 'bad-words';

/**
 * Библиотека «bad-words» знает только английский.
 * Расширяем её несколькими распространёнными русскими словами.
 * Добавь свои при необходимости.
 */
const filter = new Filter();
filter.addWords(
  'блин', 'чёрт', /* … */
);

/** Убирает лишние пробелы и переводит текст в «чистый» вид */
export function cleanText(text = '') {
  return text.replace(/\s+/g, ' ').trim();
}

/** Проверяет, есть ли в тексте нецензурные слова */
export function hasBadWords(text = '') {
  return filter.isProfane(text);
}
