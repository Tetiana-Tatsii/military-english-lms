"use client";

import { Video } from "lucide-react";
import {
  getBlockEstimatedTime,
  isEmptyRichText,
  LESSON_BLOCKS,
} from "@/lib/lessonBlocks";
import type { Lesson } from "@/types";
import CourseLessonRichHtml from "./CourseLessonRichHtml";
import LessonBlockCard from "./LessonBlockCard";

interface CourseLessonVideoSectionProps {
  lesson: Lesson;
  isDarkMode: boolean;
}

export default function CourseLessonVideoSection({
  lesson,
  isDarkMode,
}: CourseLessonVideoSectionProps) {
  const hasVideo = Boolean(lesson.videoLabel);
  const hasIntro = !isEmptyRichText(lesson.videoIntro);
  if (!hasVideo && !hasIntro) return null;

  const def = LESSON_BLOCKS.video;

  return (
    <LessonBlockCard
      title={def.title}
      accent={def.accent}
      icon={<Video size={20} />}
      estimatedTime={getBlockEstimatedTime(lesson, "video")}
      isDarkMode={isDarkMode}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {hasIntro && lesson.videoIntro && (
          <CourseLessonRichHtml
            html={lesson.videoIntro}
            isDarkMode={isDarkMode}
          />
        )}

        {hasVideo && (
          <div
            style={{
              width: "100%",
              aspectRatio: "16/9",
              background: "#000",
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid #e0dcd0",
            }}
          >
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${lesson.videoLabel}`}
              title="Lesson video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </div>
    </LessonBlockCard>
  );
}
