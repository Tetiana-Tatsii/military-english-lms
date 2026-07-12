"use client";

import { FileText, Headphones } from "lucide-react";
import { normalizeLessonHtml } from "@/lib/lessonHtml";
import type { Lesson } from "@/types";

interface CourseLessonTheorySectionProps {
  lesson: Lesson;
  isDarkMode: boolean;
}

export default function CourseLessonTheorySection({
  lesson,
  isDarkMode,
}: CourseLessonTheorySectionProps) {
  const hasContent = lesson.content && lesson.content !== "<p><br></p>";

  return (
    <>
      <span
        style={{
          background: "#f0ede5",
          color: "#8a8a45",
          padding: "4px 8px",
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          marginBottom: 12,
          display: "inline-block",
        }}
        className="md:padding-[6px_12px] md:fontSize-[12px] md:marginBottom-[16px]"
      >
        Skill: {lesson.skill}
      </span>
      <h1
        style={{
          fontSize: 24,
          margin: "0 0 20px",
          color: isDarkMode ? "rgb(250, 249, 246)" : "#3a3528",
          fontWeight: 800,
        }}
        className="md:fontSize-[32px] md:margin-[0_0_32px]"
      >
        {lesson.title}
      </h1>

      {hasContent && (
        <div
          className="lesson-content-card md:padding-[32px] md:marginBottom-[40px]"
          style={{
            background: "#faf9f6",
            padding: 24,
            borderRadius: 12,
            border: "1px solid #e0dcd0",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
              color: "#8a8a45",
              fontWeight: 700,
              fontSize: 16,
            }}
            className="md:marginBottom-[20px] md:fontSize-[18px]"
          >
            <FileText size={20} className="md:size-[22px]" /> Теоретичний
            матеріал
          </div>
          <div
            className="rich-text-content"
            dangerouslySetInnerHTML={{
              __html: normalizeLessonHtml(lesson.content),
            }}
            style={{
              fontSize: 15,
              lineHeight: 1.65,
              color: isDarkMode ? "rgb(250, 249, 246)" : "#4a4a4a",
            }}
          />
        </div>
      )}

      {lesson.audioUrl && (
        <div
          style={{
            background: "#f0ede5",
            padding: 24,
            borderRadius: 12,
            marginBottom: 24,
            border: "1px solid #e0dcd0",
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              background: "#8a8a45",
              padding: 12,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Headphones size={24} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: "0 0 8px",
                fontWeight: 700,
                color: "#3a3528",
                fontSize: 15,
              }}
            >
              Аудіоматеріал до уроку
            </p>
            <audio
              controls
              style={{ width: "100%", height: "40px" }}
              src={lesson.audioUrl}
            >
              Ваш браузер не підтримує аудіо елемент.
            </audio>
          </div>
        </div>
      )}
    </>
  );
}
