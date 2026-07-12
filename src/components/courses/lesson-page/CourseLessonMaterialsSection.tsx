"use client";

import { BookOpen, FileText, Volume2 } from "lucide-react";
import LessonCollapsibleSection from "@/components/courses/LessonCollapsibleSection";
import { normalizeLessonHtml } from "@/lib/lessonHtml";
import type { Lesson } from "@/types";

interface CourseLessonMaterialsSectionProps {
  lesson: Lesson;
  isDarkMode: boolean;
  flippedCards: Record<number, boolean>;
  onToggleCard: (index: number) => void;
  onPlayAudio: (text: string, e: React.MouseEvent) => void;
}

export default function CourseLessonMaterialsSection({
  lesson,
  isDarkMode,
  flippedCards,
  onToggleCard,
  onPlayAudio,
}: CourseLessonMaterialsSectionProps) {
  return (
    <>
      {lesson.grammarContent && lesson.grammarContent !== "<p><br></p>" && (
        <LessonCollapsibleSection
          title="Граматичний довідник"
          icon={<BookOpen size={22} />}
          defaultOpen
          headerColor="#c97a4a"
          borderColor="#facbce"
          background="#fdf8f5"
          isDarkMode={isDarkMode}
        >
          <div
            className="rich-text-content"
            dangerouslySetInnerHTML={{
              __html: normalizeLessonHtml(lesson.grammarContent),
            }}
            style={{
              fontSize: 15,
              lineHeight: 1.65,
              color: isDarkMode ? "rgb(250, 249, 246)" : "#4a4a4a",
            }}
          />
        </LessonCollapsibleSection>
      )}

      {lesson.imageUrl && (
        <img
          src={lesson.imageUrl}
          alt="Матеріал до уроку"
          className="lesson-lesson-image"
        />
      )}

      {lesson.videoLabel && (
        <div
          style={{
            width: "100%",
            aspectRatio: "16/9",
            background: "#000",
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 40,
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            border: "1px solid #e0dcd0",
          }}
        >
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${lesson.videoLabel}`}
            title="YouTube video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {lesson.documents && lesson.documents.length > 0 && (
        <LessonCollapsibleSection
          title="Навчальні документи"
          icon={<FileText size={22} />}
          headerColor="#8a8a45"
          background="#faf9f6"
          isDarkMode={isDarkMode}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {lesson.documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 16,
                  background: isDarkMode ? "#2d2f2a" : "#fff",
                  borderRadius: 8,
                  border: "1px solid #d8cdb4",
                  textDecoration: "none",
                  color: "#4a4a4a",
                  transition: "all 0.2s",
                }}
              >
                <FileText size={20} color="#8a8a45" />
                <span style={{ fontSize: 15, fontWeight: 600 }}>{doc.name}</span>
              </a>
            ))}
          </div>
        </LessonCollapsibleSection>
      )}

      {lesson.quizlet && lesson.quizlet.length > 0 && (
        <LessonCollapsibleSection
          title="Словник уроку (клікніть, щоб перегорнути)"
          icon={<BookOpen size={22} />}
          headerColor={isDarkMode ? "rgb(250, 249, 246)" : "#3a3528"}
          isDarkMode={isDarkMode}
        >
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
                  height: "120px",
                  background: flippedCards[index]
                    ? isDarkMode
                      ? "#2a2c27"
                      : "#e0dcd0"
                    : isDarkMode
                      ? "#2d2f2a"
                      : "#fff",
                  color: isDarkMode ? "rgb(250, 249, 246)" : "#3a3528",
                  border: isDarkMode
                    ? "1px solid #3e403a"
                    : "1px solid #e0dcd0",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "20px",
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
                      transition: "background 0.2s",
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
        </LessonCollapsibleSection>
      )}
    </>
  );
}
