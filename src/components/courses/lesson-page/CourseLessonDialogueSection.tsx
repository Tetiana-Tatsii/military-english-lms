"use client";

import { Headphones, MessageSquare } from "lucide-react";
import {
  getBlockEstimatedTime,
  isEmptyRichText,
  LESSON_BLOCKS,
} from "@/lib/lessonBlocks";
import type { Lesson } from "@/types";
import CourseLessonRichHtml from "./CourseLessonRichHtml";
import LessonBlockCard from "./LessonBlockCard";

interface CourseLessonDialogueSectionProps {
  lesson: Lesson;
  isDarkMode: boolean;
}

/** Combined Dialogue text + audio (+ optional transcript). */
export default function CourseLessonDialogueSection({
  lesson,
  isDarkMode,
}: CourseLessonDialogueSectionProps) {
  const hasDialogue = !isEmptyRichText(lesson.dialogue);
  const hasAudio = Boolean(lesson.audioUrl);
  const hasTranscript = !isEmptyRichText(lesson.listeningTranscript);
  if (!hasDialogue && !hasAudio && !hasTranscript) return null;

  const def = LESSON_BLOCKS.dialogue;

  return (
    <LessonBlockCard
      title={def.title}
      accent={def.accent}
      icon={<MessageSquare size={20} />}
      estimatedTime={getBlockEstimatedTime(lesson, "dialogue")}
      isDarkMode={isDarkMode}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {hasDialogue && lesson.dialogue && (
          <CourseLessonRichHtml html={lesson.dialogue} isDarkMode={isDarkMode} />
        )}

        {hasAudio && (
          <div
            style={{
              background: isDarkMode ? "#252622" : "#f0ede5",
              padding: 16,
              borderRadius: 10,
              border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
            }}
          >
            <p
              style={{
                margin: "0 0 8px",
                fontWeight: 700,
                fontSize: 14,
                color: isDarkMode ? "#e6e4dc" : "#3a3528",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Headphones size={16} color={def.accent} />
              Audio
            </p>
            <audio
              controls
              style={{ width: "100%", height: 40 }}
              src={lesson.audioUrl}
            >
              Ваш браузер не підтримує аудіо елемент.
            </audio>
          </div>
        )}

        {hasTranscript && lesson.listeningTranscript && (
          <div>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: 13,
                fontWeight: 700,
                color: isDarkMode ? "#a3a198" : "#7a7568",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Transcript
            </p>
            <CourseLessonRichHtml
              html={lesson.listeningTranscript}
              isDarkMode={isDarkMode}
            />
          </div>
        )}
      </div>
    </LessonBlockCard>
  );
}
