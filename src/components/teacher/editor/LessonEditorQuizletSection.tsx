"use client";

import { Trash2, Layers } from "lucide-react";
import type { LessonEditorSectionProps } from "./types";

interface LessonEditorQuizletSectionProps extends LessonEditorSectionProps {
  handleAddQuizletCard: () => void;
  handleUpdateQuizletCard: (
    index: number,
    field: "term" | "translation",
    value: string,
  ) => void;
  handleRemoveQuizletCard: (index: number) => void;
}

export default function LessonEditorQuizletSection({
  editingLesson,
  isDarkMode,
  handleAddQuizletCard,
  handleUpdateQuizletCard,
  handleRemoveQuizletCard,
}: LessonEditorQuizletSectionProps) {
  const { lesson } = editingLesson;
  const cards = lesson.quizlet ?? [];

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
          <Layers size={18} /> Словник уроку (Картки)
        </label>
        <button
          onClick={handleAddQuizletCard}
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
          + Додати слово
        </button>
      </div>
      {cards.length === 0 ? (
        <p
          style={{
            color: isDarkMode ? "#a3a198" : "#9a8f70",
            fontSize: 14,
            fontStyle: "italic",
          }}
        >
          Ще немає слів.
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {cards.map((card, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                background: isDarkMode ? "#2d2f2a" : "#fff",
                padding: 12,
                borderRadius: 8,
                border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
              }}
            >
              <span
                style={{
                  color: isDarkMode ? "#a3a198" : "#9a8f70",
                  fontWeight: 700,
                }}
              >
                {index + 1}.
              </span>
              <input
                placeholder="Слово"
                value={card.term}
                onChange={(e) =>
                  handleUpdateQuizletCard(index, "term", e.target.value)
                }
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 6,
                  border: "1px solid #e9e1cd",
                }}
              />
              <input
                placeholder="Переклад"
                value={card.translation}
                onChange={(e) =>
                  handleUpdateQuizletCard(index, "translation", e.target.value)
                }
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 6,
                  border: "1px solid #e9e1cd",
                }}
              />
              <button
                onClick={() => handleRemoveQuizletCard(index)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#c97a4a",
                  cursor: "pointer",
                }}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
