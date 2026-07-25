"use client";

import type { CSSProperties } from "react";
import { Trash2 } from "lucide-react";
import { getCorrectOptionIndex } from "@/lib/quiz";
import type { QuizQuestion } from "@/types";
import type { LessonEditorSectionProps } from "./types";

const MAX_READING_QUESTIONS = 3;

interface Props extends LessonEditorSectionProps {
  mode?: "reading" | "readingCheck" | "both";
  bare?: boolean;
}

export default function LessonEditorReadingSection({
  editingLesson,
  setEditingLesson,
  isDarkMode,
  mode = "both",
  bare = false,
}: Props) {
  const { lesson } = editingLesson;
  const questions = lesson.readingQuiz ?? [];

  const patchLesson = (partial: Partial<typeof lesson>) => {
    setEditingLesson({
      ...editingLesson,
      lesson: { ...lesson, ...partial },
    });
  };

  const updateQuiz = (readingQuiz: QuizQuestion[]) => {
    patchLesson({ readingQuiz });
  };

  const handleAddQuestion = () => {
    if (questions.length >= MAX_READING_QUESTIONS) return;
    updateQuiz([
      ...questions,
      {
        id: `rq-${Date.now()}`,
        text: "",
        options: ["", "", "", ""],
        correctAnswer: "0",
      },
    ]);
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
    background: isDarkMode ? "#2d2f2a" : "#fff",
    color: isDarkMode ? "rgb(250, 249, 246)" : "#3a3528",
    fontSize: 14,
    lineHeight: 1.5,
  };

  const showReading = mode === "reading" || mode === "both";
  const showCheck = mode === "readingCheck" || mode === "both";

  const body = (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {showReading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6,
                color: isDarkMode ? "#a3a198" : "#5c574a",
              }}
            >
              English
            </label>
            <textarea
              value={lesson.readingEn || ""}
              onChange={(e) => patchLesson({ readingEn: e.target.value })}
              placeholder="Reading text in English..."
              rows={12}
              style={{ ...inputStyle, resize: "vertical", whiteSpace: "pre-wrap" }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6,
                color: isDarkMode ? "#a3a198" : "#5c574a",
              }}
            >
              Українською
            </label>
            <textarea
              value={lesson.readingUk || ""}
              onChange={(e) => patchLesson({ readingUk: e.target.value })}
              placeholder="Той самий текст українською..."
              rows={12}
              style={{ ...inputStyle, resize: "vertical", whiteSpace: "pre-wrap" }}
            />
          </div>
        </div>
      )}

      {showCheck && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <label style={{ fontSize: 14, fontWeight: 700, color: "#8a8a45" }}>
              Питання ({questions.length}/{MAX_READING_QUESTIONS})
            </label>
            <button
              type="button"
              onClick={handleAddQuestion}
              disabled={questions.length >= MAX_READING_QUESTIONS}
              style={{
                background:
                  questions.length >= MAX_READING_QUESTIONS
                    ? "#c5c0b0"
                    : "#8a8a45",
                color: "#fff",
                border: "none",
                padding: "8px 14px",
                borderRadius: 6,
                cursor:
                  questions.length >= MAX_READING_QUESTIONS
                    ? "not-allowed"
                    : "pointer",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              + Питання
            </button>
          </div>

          {questions.length === 0 ? (
            <p
              style={{
                margin: 0,
                color: isDarkMode ? "#a3a198" : "#9a8f70",
                fontSize: 14,
                fontStyle: "italic",
              }}
            >
              Додайте до 3 питань на розуміння прочитаного.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {questions.map((q, index) => {
                const correctIdx = getCorrectOptionIndex(q);
                return (
                  <div
                    key={q.id}
                    style={{
                      padding: 16,
                      borderRadius: 8,
                      border: isDarkMode
                        ? "1px solid #3e403a"
                        : "1px solid #e0dcd0",
                      background: isDarkMode ? "#2d2f2a" : "#fff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: "#8a8a45",
                        }}
                      >
                        Питання {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuiz(questions.filter((_, i) => i !== index))
                        }
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "#c97a4a",
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <input
                      value={q.text}
                      onChange={(e) => {
                        const next = [...questions];
                        next[index] = { ...next[index], text: e.target.value };
                        updateQuiz(next);
                      }}
                      placeholder="Текст питання..."
                      style={{ ...inputStyle, marginBottom: 10 }}
                    />
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {q.options.map((opt, optIndex) => (
                        <div
                          key={optIndex}
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          <input
                            type="radio"
                            name={`reading-correct-${q.id}`}
                            checked={correctIdx === optIndex}
                            onChange={() => {
                              const next = [...questions];
                              next[index] = {
                                ...next[index],
                                correctAnswer: String(optIndex),
                              };
                              updateQuiz(next);
                            }}
                          />
                          <input
                            value={opt}
                            onChange={(e) => {
                              const next = [...questions];
                              const options = [...next[index].options];
                              options[optIndex] = e.target.value;
                              next[index] = { ...next[index], options };
                              updateQuiz(next);
                            }}
                            placeholder={`Варіант ${optIndex + 1}`}
                            style={inputStyle}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (bare) return body;

  return (
    <div
      style={{
        background: isDarkMode ? "#2a2c27" : "#faf9f6",
        padding: 24,
        borderRadius: 12,
        border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
      }}
    >
      {body}
    </div>
  );
}
