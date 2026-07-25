"use client";

import { normalizeLessonHtml } from "@/lib/lessonHtml";

interface CourseLessonRichHtmlProps {
  html: string;
  isDarkMode: boolean;
  transform?: (html: string) => string;
}

function plainTextToHtml(value: string): string {
  const escaped = value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .split(/\n/)
    .map((line) => `<p>${line || "<br>"}</p>`)
    .join("");
}

export default function CourseLessonRichHtml({
  html,
  isDarkMode,
  transform,
}: CourseLessonRichHtmlProps) {
  const asHtml = /<\/?[a-z][\s\S]*>/i.test(html) ? html : plainTextToHtml(html);
  const prepared = transform ? transform(asHtml) : asHtml;
  return (
    <div
      className="rich-text-content"
      dangerouslySetInnerHTML={{
        __html: normalizeLessonHtml(prepared),
      }}
      style={{
        fontSize: 15,
        lineHeight: 1.65,
        color: isDarkMode ? "rgb(250, 249, 246)" : "#4a4a4a",
      }}
    />
  );
}
