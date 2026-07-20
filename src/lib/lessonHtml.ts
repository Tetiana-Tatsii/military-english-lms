/**
 * Підготовка HTML з Quill/Word перед показом курсанту.
 * 1) Нормалізація пробілів / таблиць (UX)
 * 2) DOMPurify — захист від XSS у theory / grammar HTML
 */
import DOMPurify from "isomorphic-dompurify";

const PURIFY_CONFIG = {
  USE_PROFILES: { html: true },
  // Quill: class/style для форматування; target для посилань
  ADD_ATTR: ["target", "class", "style"],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: [
    "script",
    "iframe",
    "object",
    "embed",
    "form",
    "input",
    "link",
    "meta",
    "base",
  ],
  FORBID_ATTR: [
    "onerror",
    "onload",
    "onclick",
    "onmouseover",
    "onfocus",
    "onblur",
  ],
};

function normalizeSpacingAndTables(html: string): string {
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
      return cleaned
        ? `${prefix}${cleaned}${suffix}`
        : `${prefix}${suffix}`.replace('style=""', "");
    },
  );

  return normalized;
}

/** Normalize + sanitize HTML for safe student rendering. */
export function normalizeLessonHtml(html: string): string {
  if (!html || html === "<p><br></p>") return html;

  const normalized = normalizeSpacingAndTables(html);
  return DOMPurify.sanitize(normalized, PURIFY_CONFIG);
}
