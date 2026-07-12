"use client";

import { ArrowLeft, Target, Video, Save } from "lucide-react";
import type { SkillType } from "@/types";
import type { EditorTabState } from "./useEditorTab";
import LessonEditorMediaSection from "./LessonEditorMediaSection";
import LessonEditorContentSection from "./LessonEditorContentSection";
import LessonEditorQuizletSection from "./LessonEditorQuizletSection";
import LessonEditorQuizSection from "./LessonEditorQuizSection";

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
    isUploadingPhoto,
    isUploadingAudio,
    isUploadingDocument,
    handleSaveDeepLesson,
    handleYouTubeChange,
    handlePhotoUpload,
    handleRemovePhoto,
    handleAudioUpload,
    handleRemoveAudio,
    handleDocumentUpload,
    handleRemoveDocument,
    handleAddQuizletCard,
    handleUpdateQuizletCard,
    handleRemoveQuizletCard,
  } = state;

  if (!editingLesson) return null;

  const sectionProps = {
    editingLesson,
    setEditingLesson,
    isDarkMode,
  };

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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            marginBottom: 32,
          }}
        >
          <div>
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
          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#7a7568",
                marginBottom: 8,
                display: "block",
              }}
            >
              <Video size={16} /> YouTube Посилання
            </label>
            <input
              placeholder="Вставте повне посилання з YouTube..."
              value={editingLesson.lesson.videoLabel}
              onChange={(e) => handleYouTubeChange(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: "1px solid #d8cdb4",
              }}
            />
          </div>
        </div>

        <div className="lesson-editor-sections">
          <LessonEditorMediaSection
            {...sectionProps}
            isUploadingPhoto={isUploadingPhoto}
            isUploadingAudio={isUploadingAudio}
            isUploadingDocument={isUploadingDocument}
            handlePhotoUpload={handlePhotoUpload}
            handleRemovePhoto={handleRemovePhoto}
            handleAudioUpload={handleAudioUpload}
            handleRemoveAudio={handleRemoveAudio}
            handleDocumentUpload={handleDocumentUpload}
            handleRemoveDocument={handleRemoveDocument}
          />
          <LessonEditorContentSection {...sectionProps} />
          <LessonEditorQuizletSection
            {...sectionProps}
            handleAddQuizletCard={handleAddQuizletCard}
            handleUpdateQuizletCard={handleUpdateQuizletCard}
            handleRemoveQuizletCard={handleRemoveQuizletCard}
          />
          <LessonEditorQuizSection {...sectionProps} />
        </div>

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
