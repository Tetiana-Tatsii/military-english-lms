"use client";

import type { Lesson } from "@/types";

interface CourseLessonTheorySectionProps {
  lesson: Lesson;
  isDarkMode: boolean;
}

/** Lesson header only (skill + title). Content lives in block cards below. */
export default function CourseLessonTheorySection({
  lesson,
  isDarkMode,
}: CourseLessonTheorySectionProps) {
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
          margin: "0 0 24px",
          color: isDarkMode ? "rgb(250, 249, 246)" : "#3a3528",
          fontWeight: 800,
        }}
        className="md:fontSize-[32px] md:margin-[0_0_32px]"
      >
        {lesson.title}
      </h1>
    </>
  );
}
