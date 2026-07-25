"use client";

import { ImageIcon } from "lucide-react";
import {
  getBlockEstimatedTime,
  getLessonImages,
  LESSON_BLOCKS,
} from "@/lib/lessonBlocks";
import type { Lesson } from "@/types";
import LessonBlockCard from "./LessonBlockCard";

interface CourseLessonVisualSectionProps {
  lesson: Lesson;
  isDarkMode: boolean;
}

export default function CourseLessonVisualSection({
  lesson,
  isDarkMode,
}: CourseLessonVisualSectionProps) {
  const images = getLessonImages(lesson);
  if (images.length === 0) return null;
  const def = LESSON_BLOCKS.visualReference;

  return (
    <LessonBlockCard
      title={def.title}
      accent={def.accent}
      icon={<ImageIcon size={20} />}
      estimatedTime={getBlockEstimatedTime(lesson, "visualReference")}
      isDarkMode={isDarkMode}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {images.map((img) => (
          <figure key={img.id} style={{ margin: 0 }}>
            <img
              src={img.url}
              alt={img.caption || "Visual reference"}
              className="lesson-lesson-image"
              style={{ marginBottom: img.caption ? 8 : 0 }}
            />
            {img.caption?.trim() ? (
              <figcaption
                style={{
                  fontSize: 13,
                  color: isDarkMode ? "#a3a198" : "#7a7568",
                  textAlign: "center",
                }}
              >
                {img.caption}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </LessonBlockCard>
  );
}
