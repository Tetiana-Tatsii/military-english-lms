"use client";

import { Trash2, Target } from "lucide-react";
import { getCorrectOptionIndex } from "@/lib/quiz";
import type { QuizQuestion } from "@/types";
import type { LessonEditorSectionProps } from "./types";

export default function LessonEditorQuizSection({
  editingLesson,
  setEditingLesson,
  isDarkMode,
}: LessonEditorSectionProps) {
  const { lesson } = editingLesson;
  const questions = lesson.quiz ?? [];

  const updateQuiz = (updatedQuiz: QuizQuestion[]) => {
    setEditingLesson({
      ...editingLesson,
      lesson: { ...lesson, quiz: updatedQuiz },
    });
  };

  const handleAddQuestion = () => {
    updateQuiz([
      ...questions,
      {
        id: `q-${Date.now()}`,
        text: "",
        options: ["", "", "", ""],
        correctAnswer: "",
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    updateQuiz(questions.filter((_, i) => i !== index));
  };

  const handleUpdateQuestionText = (index: number, text: string) => {
    const updatedQuiz = [...questions];
    updatedQuiz[index] = { ...updatedQuiz[index], text };
    updateQuiz(updatedQuiz);
  };

  const handleUpdateOption = (
    questionIndex: number,
    optionIndex: number,
    value: string,
  ) => {
    const updatedQuiz = [...questions];
    const options = [...updatedQuiz[questionIndex].options];
    options[optionIndex] = value;
    updatedQuiz[questionIndex] = {
      ...updatedQuiz[questionIndex],
      options,
    };
    updateQuiz(updatedQuiz);
  };

  const handleUpdateCorrectAnswer = (index: number, correctAnswer: string) => {
    const updatedQuiz = [...questions];
    updatedQuiz[index] = { ...updatedQuiz[index], correctAnswer };
    updateQuiz(updatedQuiz);
  };

  return (
    <div
      style={{
        background: isDarkMode ? "#2a2c27" : "#faf9f6",
        padding: 24,
        borderRadius: 12,
        border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <label
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#8a8a45",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Target size={18} /> Інтерактивний тест (Quiz)
        </label>
        <button
          onClick={handleAddQuestion}
          style={{
            background: "#8a8a45",
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          + Додати питання
        </button>
      </div>
      {questions.length === 0 ? (
        <p
          style={{
            color: isDarkMode ? "#a3a198" : "#9a8f70",
            fontSize: 14,
            fontStyle: "italic",
          }}
        >
          Ще немає питань тесту.
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {questions.map((question, index) => (
            <div
              key={question.id}
              style={{
                background: isDarkMode ? "#2d2f2a" : "#fff",
                padding: 16,
                borderRadius: 8,
                border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    color: isDarkMode ? "#a3a198" : "#9a8f70",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  Питання {index + 1}
                </span>
                <button
                  onClick={() => handleRemoveQuestion(index)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#c97a4a",
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <input
                placeholder="Текст питання"
                value={question.text}
                onChange={(e) =>
                  handleUpdateQuestionText(index, e.target.value)
                }
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 6,
                  border: "1px solid #e9e1cd",
                  marginBottom: 12,
                  fontSize: 14,
                }}
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                {question.options.map((option, optIndex) => (
                  <div key={optIndex}>
                    <input
                      placeholder={`Варіант ${optIndex + 1}`}
                      value={option}
                      onChange={(e) =>
                        handleUpdateOption(index, optIndex, e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: 8,
                        borderRadius: 6,
                        border: "1px solid #e9e1cd",
                        fontSize: 13,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: isDarkMode ? "#a3a198" : "#7a7568",
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  Правильна відповідь:
                </label>
                <select
                  value={
                    getCorrectOptionIndex(question) >= 0
                      ? String(getCorrectOptionIndex(question))
                      : ""
                  }
                  onChange={(e) =>
                    handleUpdateCorrectAnswer(index, e.target.value)
                  }
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 6,
                    border: "1px solid #d8cdb4",
                    fontSize: 13,
                  }}
                >
                  <option value="">Оберіть правильну відповідь</option>
                  {question.options.map((opt, optIndex) => (
                    <option key={optIndex} value={String(optIndex)}>
                      Варіант {optIndex + 1}: {opt || "(пусто)"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
