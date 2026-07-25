"use client";

import { BookOpen, Volume2 } from "lucide-react";
import {
  getBlockEstimatedTime,
  LESSON_BLOCKS,
} from "@/lib/lessonBlocks";
import type { Lesson } from "@/types";
import LessonBlockCard from "./LessonBlockCard";

interface CourseLessonMaterialsSectionProps {
  lesson: Lesson;
  isDarkMode: boolean;
  flippedCards: Record<number, boolean>;
  onToggleCard: (index: number) => void;
  onPlayAudio: (text: string, e: React.MouseEvent) => void;
}

/** Vocabulary block (quizlet cards). */
export default function CourseLessonMaterialsSection({
  lesson,
  isDarkMode,
  flippedCards,
  onToggleCard,
  onPlayAudio,
}: CourseLessonMaterialsSectionProps) {
  if (!lesson.quizlet || lesson.quizlet.length === 0) return null;

  const def = LESSON_BLOCKS.vocabulary;

  return (
    <LessonBlockCard
      title={def.title}
      accent={def.accent}
      icon={<BookOpen size={20} />}
      estimatedTime={getBlockEstimatedTime(lesson, "vocabulary")}
      isDarkMode={isDarkMode}
      collapsible
    >
      <p
        style={{
          margin: "0 0 14px",
          fontSize: 13,
          color: isDarkMode ? "#a3a198" : "#7a7568",
        }}
      >
        Клікніть картку, щоб перегорнути
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {lesson.quizlet.map((card, index) => (
          <div
            key={index}
            onClick={() => onToggleCard(index)}
            style={{
              height: 120,
              background: flippedCards[index]
                ? isDarkMode
                  ? "#2a2c27"
                  : "#e0dcd0"
                : isDarkMode
                  ? "#252622"
                  : "#fff",
              color: isDarkMode ? "rgb(250, 249, 246)" : "#3a3528",
              border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
              textAlign: "center",
              cursor: "pointer",
              position: "relative",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
            }}
          >
            {!flippedCards[index] && (
              <button
                onClick={(e) => onPlayAudio(card.term, e)}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "#f0ede5",
                  border: "none",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#8a8a45",
                }}
                title="Прослухати вимову"
              >
                <Volume2 size={16} />
              </button>
            )}
            <span style={{ fontSize: 16, fontWeight: 700 }}>
              {flippedCards[index] ? card.translation : card.term}
            </span>
          </div>
        ))}
      </div>
    </LessonBlockCard>
  );
}
