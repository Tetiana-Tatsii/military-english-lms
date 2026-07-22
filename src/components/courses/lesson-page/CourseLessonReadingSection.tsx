"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { BookOpen, CheckCircle } from "lucide-react";
import {
  getCorrectOptionIndex,
  getSelectedOptionIndex,
  isQuizAnswerCorrect,
} from "@/lib/quiz";
import type { Lesson } from "@/types";

interface CourseLessonReadingSectionProps {
  lesson: Lesson;
  isDarkMode: boolean;
}

function hasText(value?: string) {
  return Boolean(value && value.trim().length > 0);
}

export default function CourseLessonReadingSection({
  lesson,
  isDarkMode,
}: CourseLessonReadingSectionProps) {
  const hasReading = hasText(lesson.readingEn) || hasText(lesson.readingUk);
  const questions = (lesson.readingQuiz ?? []).slice(0, 3);
  const hasQuiz = questions.length > 0;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setAnswers({});
    setSubmitted(false);
  }, [lesson.id]);

  if (!hasReading && !hasQuiz) return null;

  const cardBg = isDarkMode ? "#2d2f2a" : "#faf9f6";
  const cardBorder = isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0";
  const titleColor = isDarkMode ? "rgb(250, 249, 246)" : "#3a3528";
  const bodyColor = isDarkMode ? "#e6e4dc" : "#4a4a4a";
  const muted = isDarkMode ? "#a3a198" : "#7a7568";

  const allAnswered =
    hasQuiz &&
    questions.every(
      (q) => answers[q.id] != null && String(answers[q.id]).length > 0,
    );

  const score = submitted
    ? questions.filter((q) => isQuizAnswerCorrect(q, answers[q.id])).length
    : null;

  return (
    <div style={{ marginBottom: 24 }}>
      {hasReading && (
        <div
          style={{
            background: cardBg,
            padding: 24,
            borderRadius: 12,
            border: cardBorder,
            marginBottom: hasQuiz ? 16 : 0,
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
          >
            <BookOpen size={20} />
            Reading
          </div>

          <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 md:gap-6">
            <div className="min-w-0">
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: muted,
                }}
              >
                English
              </p>
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  fontSize: 15,
                  lineHeight: 1.75,
                  color: bodyColor,
                }}
              >
                {lesson.readingEn?.trim() || "—"}
              </div>
            </div>
            <div
              className={`min-w-0 md:border-l md:pl-6 ${
                isDarkMode ? "md:border-[#3e403a]" : "md:border-[#e0dcd0]"
              }`}
            >
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: muted,
                }}
              >
                Українською
              </p>
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  fontSize: 15,
                  lineHeight: 1.75,
                  color: bodyColor,
                }}
              >
                {lesson.readingUk?.trim() || "—"}
              </div>
            </div>
          </div>
        </div>
      )}

      {hasQuiz && (
        <div
          style={{
            background: cardBg,
            padding: 32,
            borderRadius: 12,
            border: cardBorder,
          }}
        >
          <h3
            style={{
              fontSize: 20,
              color: titleColor,
              marginBottom: 8,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <CheckCircle size={22} color="#8a8a45" />
            Reading check
          </h3>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: muted }}>
            Перевірте розуміння прочитаного. Результат лише для вас — у журнал
            не зберігається.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {questions.map((question, index) => {
              const userAnswer = answers[question.id];
              const selectedIdx = getSelectedOptionIndex(question, userAnswer);
              const isCorrect = isQuizAnswerCorrect(question, userAnswer);
              const showFeedback = submitted;

              return (
                <div key={question.id}>
                  <p
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: titleColor,
                      marginBottom: 12,
                    }}
                  >
                    {index + 1}. {question.text}
                  </p>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {question.options.map((option, optIndex) => {
                      if (!option.trim() && !submitted) return null;

                      const isSelected = selectedIdx === optIndex;
                      const isOptionCorrect =
                        getCorrectOptionIndex(question) === optIndex;

                      let optionStyle: CSSProperties = {
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: 12,
                        background: isDarkMode ? "#2d2f2a" : "#fff",
                        borderRadius: 8,
                        border: isDarkMode
                          ? "1px solid #3e403a"
                          : "1px solid #d8cdb4",
                        cursor: submitted ? "default" : "pointer",
                        transition: "all 0.2s",
                      };

                      let icon = null;
                      let textColor = isDarkMode
                        ? "rgb(250, 249, 246)"
                        : "#4a4a4a";

                      if (showFeedback) {
                        if (isSelected && isCorrect) {
                          optionStyle = {
                            ...optionStyle,
                            background: isDarkMode
                              ? "rgba(34, 197, 94, 0.15)"
                              : "#dcfce7",
                            border: "2px solid #22c55e",
                          };
                          icon = (
                            <span style={{ color: "#22c55e", fontSize: 18 }}>
                              ✅
                            </span>
                          );
                          textColor = isDarkMode ? "#dcfce7" : "#14532d";
                        } else if (isSelected && !isCorrect) {
                          optionStyle = {
                            ...optionStyle,
                            background: isDarkMode
                              ? "rgba(239, 68, 68, 0.15)"
                              : "#fee2e2",
                            border: "2px solid #ef4444",
                          };
                          icon = (
                            <span style={{ color: "#ef4444", fontSize: 18 }}>
                              ❌
                            </span>
                          );
                          textColor = isDarkMode ? "#fee2e2" : "#7f1d1d";
                        } else if (isOptionCorrect) {
                          optionStyle = {
                            ...optionStyle,
                            background: isDarkMode
                              ? "rgba(34, 197, 94, 0.15)"
                              : "#dcfce7",
                            border: "2px solid #22c55e",
                          };
                          icon = (
                            <span style={{ color: "#22c55e", fontSize: 18 }}>
                              ✅
                            </span>
                          );
                          textColor = isDarkMode ? "#dcfce7" : "#14532d";
                        }
                      }

                      return (
                        <label key={optIndex} style={optionStyle}>
                          <input
                            type="radio"
                            name={`reading-question-${question.id}`}
                            value={String(optIndex)}
                            checked={selectedIdx === optIndex}
                            onChange={() =>
                              setAnswers((prev) => ({
                                ...prev,
                                [question.id]: String(optIndex),
                              }))
                            }
                            disabled={submitted}
                            style={{
                              width: 18,
                              height: 18,
                              accentColor: "#8a8a45",
                            }}
                          />
                          <span
                            style={{ fontSize: 15, color: textColor, flex: 1 }}
                          >
                            {option}
                          </span>
                          {icon}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {!submitted ? (
            <div style={{ marginTop: 24 }}>
              <button
                type="button"
                disabled={!allAnswered}
                onClick={() => setSubmitted(true)}
                style={{
                  background: allAnswered
                    ? "#8a8a45"
                    : isDarkMode
                      ? "#3e403a"
                      : "#d8cdb4",
                  color: allAnswered
                    ? "#fff"
                    : isDarkMode
                      ? "#6b6860"
                      : "#9a8f70",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: allAnswered ? "pointer" : "not-allowed",
                }}
              >
                Перевірити
              </button>
            </div>
          ) : (
            <div
              style={{
                marginTop: 24,
                padding: "12px 14px",
                borderRadius: 8,
                background: isDarkMode ? "rgba(34, 197, 94, 0.15)" : "#dcfce7",
                border: "1px solid #22c55e",
                color: isDarkMode ? "#dcfce7" : "#14532d",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <span>
                Результат: {score}/{questions.length}
              </span>
              <button
                type="button"
                onClick={() => {
                  setAnswers({});
                  setSubmitted(false);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: muted,
                  cursor: "pointer",
                  fontWeight: 600,
                  textDecoration: "underline",
                }}
              >
                Спробувати ще
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
