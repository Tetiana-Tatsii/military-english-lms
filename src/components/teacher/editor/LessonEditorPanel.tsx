"use client";

import { ArrowLeft, Target, Save } from "lucide-react";
import type { SkillType } from "@/types";
import type { EditorTabState } from "./useEditorTab";
import LessonEditorBlocks from "./LessonEditorBlocks";

interface LessonEditorPanelProps {
  state: EditorTabState;
  isDarkMode: boolean;
}

export default function LessonEditorPanel({
  state,
  isDarkMode,
}: LessonEditorPanelProps) {
  const {
    editingLesson,
    setEditingLesson,
    handleSaveDeepLesson,
  } = state;

  if (!editingLesson) return null;

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <button
        onClick={() => setEditingLesson(null)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "transparent",
          border: "none",
          color: "#8a8a45",
          cursor: "pointer",
          fontWeight: 600,
          marginBottom: 24,
          padding: 0,
        }}
      >
        <ArrowLeft size={18} /> Повернутися до структури
      </button>

      <div
        style={{
          background: isDarkMode ? "#2d2f2a" : "#fff",
          padding: "40px",
          borderRadius: 12,
          border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#8a8a45",
              marginBottom: 8,
              display: "block",
            }}
          >
            Назва уроку
          </label>
          <input
            value={editingLesson.lesson.title}
            onChange={(e) =>
              setEditingLesson({
                ...editingLesson,
                lesson: {
                  ...editingLesson.lesson,
                  title: e.target.value,
                },
              })
            }
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 8,
              border: "1px solid #d8cdb4",
              fontSize: 18,
              fontWeight: 700,
              background: isDarkMode ? "#2d2f2a" : "#faf9f6",
              color: isDarkMode ? "#e6e4dc" : "#3a3528",
            }}
          />
        </div>

        <div style={{ marginBottom: 32, maxWidth: 360 }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#7a7568",
              marginBottom: 8,
              display: "block",
            }}
          >
            <Target size={16} /> Навичка (Skill)
          </label>
          <select
            value={editingLesson.lesson.skill}
            onChange={(e) =>
              setEditingLesson({
                ...editingLesson,
                lesson: {
                  ...editingLesson.lesson,
                  skill: e.target.value as SkillType,
                },
              })
            }
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              border: "1px solid #d8cdb4",
            }}
          >
            <option value="listening">Listening</option>
            <option value="reading">Reading</option>
            <option value="speaking">Speaking</option>
            <option value="writing">Writing</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>

        <p
          style={{
            margin: "0 0 8px",
            fontSize: 13,
            color: isDarkMode ? "#a3a198" : "#7a7568",
            lineHeight: 1.5,
          }}
        >
          Заповнюйте блоки зверху вниз. Порожні або Hidden блоки не
          показуються курсанту. Estimated Time — опційно.
        </p>

        <LessonEditorBlocks state={state} isDarkMode={isDarkMode} />

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            borderTop: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
            paddingTop: 24,
            marginTop: 32,
          }}
        >
          <button
            onClick={handleSaveDeepLesson}
            style={{
              background: "#8a8a45",
              color: "#fff",
              padding: "14px 32px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            <Save
              size={20}
              style={{ display: "inline", marginRight: 6 }}
            />{" "}
            Зберегти урок
          </button>
        </div>
      </div>
    </div>
  );
}
