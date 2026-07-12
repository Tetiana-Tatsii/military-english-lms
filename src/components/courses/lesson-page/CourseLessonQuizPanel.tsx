"use client";

import { CheckCircle } from "lucide-react";
import {
  getCorrectOptionIndex,
  getSelectedOptionIndex,
  isQuizAnswerCorrect,
} from "@/lib/quiz";
import type { Lesson } from "@/types";

interface CourseLessonQuizPanelProps {
  lesson: Lesson;
  isDarkMode: boolean;
  quizAnswers: Record<string, string>;
  quizSubmitted: boolean;
  quizScore: number | null;
  onAnswerChange: (questionId: string, answer: string) => void;
  onSubmit: () => void;
}

export default function CourseLessonQuizPanel({
  lesson,
  isDarkMode,
  quizAnswers,
  quizSubmitted,
  quizScore,
  onAnswerChange,
  onSubmit,
}: CourseLessonQuizPanelProps) {
  if (!lesson.quiz?.length) return null;

  return (
    <div
      style={{
        background: isDarkMode ? "#2d2f2a" : "#faf9f6",
        padding: 32,
        borderRadius: 12,
        border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
        marginBottom: 40,
      }}
    >
      <h3
        style={{
          fontSize: 20,
          color: isDarkMode ? "rgb(250, 249, 246)" : "#3a3528",
          marginBottom: 20,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <CheckCircle size={22} color="#8a8a45" /> Практичний тест
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {lesson.quiz.map((question, index) => {
          const userAnswer = quizAnswers[question.id];
          const selectedIdx = getSelectedOptionIndex(question, userAnswer);
          const isCorrect = isQuizAnswerCorrect(question, userAnswer);
          const showFeedback = quizSubmitted;

          return (
            <div key={question.id}>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: isDarkMode ? "rgb(250, 249, 246)" : "#3a3528",
                  marginBottom: 12,
                }}
              >
                {index + 1}. {question.text}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {question.options.map((option, optIndex) => {
                  const isSelected = selectedIdx === optIndex;
                  const isOptionCorrect =
                    getCorrectOptionIndex(question) === optIndex;

                  let optionStyle: React.CSSProperties = {
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 12,
                    background: isDarkMode ? "#2d2f2a" : "#fff",
                    borderRadius: 8,
                    border: isDarkMode
                      ? "1px solid #3e403a"
                      : "1px solid #d8cdb4",
                    cursor: quizSubmitted ? "default" : "pointer",
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
                        name={`question-${question.id}`}
                        value={String(optIndex)}
                        checked={selectedIdx === optIndex}
                        onChange={() =>
                          onAnswerChange(question.id, String(optIndex))
                        }
                        disabled={quizSubmitted}
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
      {!quizSubmitted ? (
        <button
          onClick={onSubmit}
          style={{
            marginTop: 24,
            background: "#8a8a45",
            color: "#fff",
            border: "none",
            padding: "12px 24px",
            borderRadius: 8,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          Завершити тест
        </button>
      ) : (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: "#eef0df",
            borderRadius: 8,
            border: "1px solid #8a8a45",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: "#8a8a45",
            }}
          >
            Практичний тест пройдено
          </p>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 15,
              color: "#6b6b3a",
            }}
          >
            {quizScore}% (
            {Math.round(((quizScore || 0) / 100) * lesson.quiz.length)}/
            {lesson.quiz.length} правильних відповідей)
          </p>
        </div>
      )}
    </div>
  );
}
