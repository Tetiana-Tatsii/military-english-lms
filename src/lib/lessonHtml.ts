/**
 * Підготовка HTML з Quill/Word перед показом курсанту.
 * Quill часто зберігає &nbsp; — браузер не переносить рядок на таких «пробілах»,
 * і текст рветься посередині слова через overflow-wrap.
 */
export function normalizeLessonHtml(html: string): string {
  if (!html || html === "<p><br></p>") return html;

  let normalized = html
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00A0/g, " ")
    .replace(/\u202F/g, " ")
    .replace(/\u2007/g, " ")
    .replace(/white-space\s*:\s*nowrap/gi, "white-space:normal");

  // Прибираємо фіксовані ширини таблиць (Word/Quill paste) — вони лamaють колонки
  normalized = normalized
    .replace(/(<table[^>]*)\swidth="[^"]*"/gi, "$1")
    .replace(/(<col[^>]*)\swidth="[^"]*"/gi, "$1")
    .replace(/(<td[^>]*)\swidth="[^"]*"/gi, "$1")
    .replace(/(<th[^>]*)\swidth="[^"]*"/gi, "$1");

  normalized = normalized.replace(
    /(<(?:table|td|th|col)[^>]*style=")([^"]*)(")/gi,
    (_match, prefix: string, style: string, suffix: string) => {
      const cleaned = style
        .replace(/(?:^|;\s*)width\s*:\s*[^;]+;?/gi, "")
        .replace(/(?:^|;\s*)white-space\s*:\s*nowrap;?/gi, "")
        .replace(/;\s*;/g, ";")
        .replace(/^;|;$/g, "")
        .trim();
      return cleaned ? `${prefix}${cleaned}${suffix}` : `${prefix}${suffix}`.replace('style=""', "");
    },
  );

  return normalized;
}
