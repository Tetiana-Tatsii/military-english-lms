"use client";

import {
  Trash2,
  Image as ImageIcon,
  Headphones,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import type { LessonEditorSectionProps } from "./types";

interface LessonEditorMediaSectionProps extends LessonEditorSectionProps {
  isUploadingPhoto: boolean;
  isUploadingAudio: boolean;
  isUploadingDocument: boolean;
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemovePhoto: () => void;
  handleAudioUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveAudio: () => void;
  handleDocumentUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveDocument: (docId: string) => void;
}

export default function LessonEditorMediaSection({
  editingLesson,
  isDarkMode,
  isUploadingPhoto,
  isUploadingAudio,
  isUploadingDocument,
  handlePhotoUpload,
  handleRemovePhoto,
  handleAudioUpload,
  handleRemoveAudio,
  handleDocumentUpload,
  handleRemoveDocument,
}: LessonEditorMediaSectionProps) {
  const { lesson } = editingLesson;

  return (
    <>
      <div
        style={{
          background: isDarkMode ? "#2a2c27" : "#f0ede5",
          padding: 24,
          borderRadius: 12,
          border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
          display: "flex",
          gap: 24,
        }}
      >
        <div style={{ flex: 1 }}>
          <label
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: isDarkMode ? "#e6e4dc" : "#5c574a",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ImageIcon size={16} /> 1. Додати головне фото уроку
          </label>

          {lesson.imageUrl ? (
            <div
              style={{
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <img
                src={lesson.imageUrl}
                alt="preview"
                style={{ height: "40px", borderRadius: "4px" }}
              />
              <button
                onClick={handleRemovePhoto}
                style={{
                  background: "#fdeced",
                  color: "#c97a4a",
                  border: "1px solid #facbce",
                  padding: "6px 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Trash2 size={14} /> Видалити фото
              </button>
            </div>
          ) : (
            <div>
              <label
                htmlFor="photo-upload"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#8a8a45",
                  color: "#fff",
                  padding: "10px 20px",
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  border: "none",
                }}
              >
                <ImageIcon size={16} /> Обрати фото
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={!!isUploadingPhoto}
                style={{ display: "none" }}
              />
            </div>
          )}

          {isUploadingPhoto && (
            <p
              style={{
                fontSize: 13,
                color: "#8a8a45",
                marginTop: 6,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Loader2 size={14} className="animate-spin" /> Завантаження...
            </p>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <label
            htmlFor="audio-upload"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#8a8a45",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              border: "none",
            }}
          >
            <Headphones size={16} /> Завантажити аудіо (mp3)
          </label>
          <input
            id="audio-upload"
            type="file"
            accept="audio/mp3"
            onChange={handleAudioUpload}
            disabled={!!isUploadingAudio}
            style={{ display: "none" }}
          />
          {isUploadingAudio && (
            <p
              style={{
                fontSize: 13,
                color: "#8a8a45",
                marginTop: 6,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Loader2 size={14} className="animate-spin" /> Завантаження аудіо
              на сервер...
            </p>
          )}
          {lesson.audioUrl && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 6,
              }}
            >
              <p style={{ fontSize: 12, color: "#8a8a45", margin: 0 }}>
                ✓ Аудіофайл успішно прикріплено
              </p>
              <button
                onClick={handleRemoveAudio}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#c97a4a",
                  display: "flex",
                  alignItems: "center",
                  padding: 2,
                }}
                title="Видалити аудіофайл"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          background: isDarkMode ? "#2a2c27" : "#f0ede5",
          padding: 24,
          borderRadius: 12,
          border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
        }}
      >
        <label
          htmlFor="document-upload"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "#8a8a45",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            border: "none",
          }}
        >
          <FileText size={16} /> Завантажити документи (PDF, Word)
        </label>
        <input
          id="document-upload"
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleDocumentUpload}
          disabled={!!isUploadingDocument}
          style={{ display: "none" }}
        />
        {isUploadingDocument && (
          <p
            style={{
              fontSize: 13,
              color: "#8a8a45",
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Loader2 size={14} className="animate-spin" /> Завантаження...
          </p>
        )}
        {lesson.documents && lesson.documents.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: isDarkMode ? "#a3a198" : "#7a7568",
                marginBottom: 8,
              }}
            >
              Прикріплені документи:
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {lesson.documents.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: isDarkMode ? "#2d2f2a" : "#fff",
                    padding: 10,
                    borderRadius: 6,
                    border: isDarkMode
                      ? "1px solid #3e403a"
                      : "1px solid #d8cdb4",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <FileText size={16} color="#8a8a45" />
                    <span
                      style={{
                        fontSize: 13,
                        color: isDarkMode ? "#a3a198" : "#5c574a",
                      }}
                    >
                      {doc.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveDocument(doc.id)}
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
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
