"use client";

import React from "react";
import dynamic from "next/dynamic";
import {
  Trash2,
  ArrowLeft,
  BookOpen,
  Image as ImageIcon,
  Headphones,
  FileText,
  ClipboardList,
  Clock,
  Award,
  Loader2,
  Save,
  Video,
  Target,
  Layers,
  X,
} from "lucide-react";
import { getCorrectOptionIndex } from "@/lib/quiz";
import { quillModules } from "./utils";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

import type { EditorTabState } from "./useEditorTab";

interface LessonEditorPanelProps {
  state: EditorTabState;
  isDarkMode: boolean;
}

export default function LessonEditorPanel({ state, isDarkMode }: LessonEditorPanelProps) {
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
                  skill: e.target.value as any,
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
      {/* АКТИВОВАНЕ ЗАВАНТАЖЕННЯ ФАЙЛІВ З КОМП'ЮТЕРА */}
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

          {/* Якщо фото вже є, показуємо його і кнопку видалення */}
          {(editingLesson.lesson as any).imageUrl ? (
            <div
              style={{
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <img
                src={(editingLesson.lesson as any).imageUrl}
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
              <Loader2 size={14} className="animate-spin" />{" "}
              Завантаження...
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
              <Loader2 size={14} className="animate-spin" />{" "}
              Завантаження аудіо на сервер...
            </p>
          )}
          {(editingLesson.lesson as any).audioUrl && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
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

      {/* ЗАВАНТАЖЕННЯ ДОКУМЕНТІВ */}
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
        {(editingLesson.lesson as any).documents &&
          (editingLesson.lesson as any).documents.length > 0 && (
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
                {(editingLesson.lesson as any).documents.map(
                  (doc: any) => (
                    <div
                      key={doc.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: isDarkMode ? "#2d2f2a" : "#fff",
                        padding: 10,
                        borderRadius: 6,
                        border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <FileText size={16} color="#8a8a45" />
                        <span style={{ fontSize: 13, color: isDarkMode ? "#a3a198" : "#5c574a" }}>
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
                  ),
                )}
              </div>
            </div>
          )}
      </div>

      {/* ТЕКСТ / READING */}
      <div className="lesson-editor-section">
        <label
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#8a8a45",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FileText size={18} /> Основний текст / Reading
        </label>
        <div className={`editor-quill editor-quill--reading ${isDarkMode ? "dark-quill" : ""}`}>
          <ReactQuill
            theme="snow"
            modules={quillModules}
            value={editingLesson.lesson.content}
            onChange={(val: string) =>
              setEditingLesson({
                ...editingLesson,
                lesson: { ...editingLesson.lesson, content: val },
              })
            }
          />
        </div>
      </div>

      {/* ГРАМАТИКА */}
      <div className="lesson-editor-section">
        <label
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#c97a4a",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <BookOpen size={18} /> Граматичний довідник
        </label>
        <div className={`editor-quill editor-quill--grammar ${isDarkMode ? "dark-quill" : ""}`}>
          <ReactQuill
            theme="snow"
            modules={quillModules}
            value={(editingLesson.lesson as any).grammarContent || ""}
            onChange={(val: string) =>
              setEditingLesson({
                ...editingLesson,
                lesson: {
                  ...editingLesson.lesson,
                  grammarContent: val,
                } as any,
              })
            }
          />
        </div>
      </div>

      {/* ІНСТРУКЦІЯ ДО ДОМАШНЬОГО ЗАВДАННЯ */}
      <div
        style={{
          background: isDarkMode ? "#2a2c27" : "#faf9f6",
          padding: 24,
          borderRadius: 12,
          border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
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
          <ClipboardList size={18} /> Інструкція до домашнього завдання
        </label>
        <textarea
          value={(editingLesson.lesson as any).homeworkInstruction || ""}
          onChange={(e) =>
            setEditingLesson({
              ...editingLesson,
              lesson: {
                ...editingLesson.lesson,
                homeworkInstruction: e.target.value,
              } as any,
            })
          }
          placeholder="Опишіть детально, що курсант має зробити в рамках домашнього завдання..."
          style={{
            width: "100%",
            minHeight: 120,
            padding: 12,
            borderRadius: 8,
            border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
            fontSize: 14,
            lineHeight: 1.6,
            resize: "vertical",
            background: isDarkMode ? "#2d2f2a" : "#fff",
            color: isDarkMode ? "rgb(250, 249, 246)" : "#3a3528",
          }}
        />
      </div>

      {/* СЛОВНИК (КАРТКИ) */}
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
        {!editingLesson.lesson.quizlet ||
        editingLesson.lesson.quizlet.length === 0 ? (
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
            {editingLesson.lesson.quizlet.map((card, index) => (
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
                <span style={{ color: isDarkMode ? "#a3a198" : "#9a8f70", fontWeight: 700 }}>
                  {index + 1}.
                </span>
                <input
                  placeholder="Слово"
                  value={card.term}
                  onChange={(e) =>
                    handleUpdateQuizletCard(
                      index,
                      "term",
                      e.target.value,
                    )
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
                    handleUpdateQuizletCard(
                      index,
                      "translation",
                      e.target.value,
                    )
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

      {/* ІНТЕРАКТИВНИЙ ТЕСТ (QUIZ) */}
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
            onClick={() => {
              if (!editingLesson) return;
              const currentQuiz = (editingLesson.lesson as any).quiz || [];
              setEditingLesson({
                ...editingLesson,
                lesson: {
                  ...editingLesson.lesson,
                  quiz: [
                    ...currentQuiz,
                    {
                      id: `q-${Date.now()}`,
                      text: "",
                      options: ["", "", "", ""],
                      correctAnswer: "",
                    },
                  ],
                } as any,
              });
            }}
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
        {!(editingLesson.lesson as any).quiz ||
        (editingLesson.lesson as any).quiz.length === 0 ? (
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
            {(editingLesson.lesson as any).quiz.map(
              (question: any, index: number) => (
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
                      onClick={() => {
                        if (!editingLesson) return;
                        const updatedQuiz = (editingLesson.lesson as any).quiz.filter(
                          (_: any, i: number) => i !== index,
                        );
                        setEditingLesson({
                          ...editingLesson,
                          lesson: {
                            ...editingLesson.lesson,
                            quiz: updatedQuiz,
                          } as any,
                        });
                      }}
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
                    onChange={(e) => {
                      if (!editingLesson) return;
                      const updatedQuiz = [...(editingLesson.lesson as any).quiz];
                      updatedQuiz[index] = {
                        ...updatedQuiz[index],
                        text: e.target.value,
                      };
                      setEditingLesson({
                        ...editingLesson,
                        lesson: {
                          ...editingLesson.lesson,
                          quiz: updatedQuiz,
                        } as any,
                      });
                    }}
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
                    {question.options.map((option: string, optIndex: number) => (
                      <div key={optIndex}>
                        <input
                          placeholder={`Варіант ${optIndex + 1}`}
                          value={option}
                          onChange={(e) => {
                            if (!editingLesson) return;
                            const updatedQuiz = [...(editingLesson.lesson as any).quiz];
                            updatedQuiz[index].options[optIndex] = e.target.value;
                            setEditingLesson({
                              ...editingLesson,
                              lesson: {
                                ...editingLesson.lesson,
                                quiz: updatedQuiz,
                              } as any,
                            });
                          }}
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
                      onChange={(e) => {
                        if (!editingLesson) return;
                        const updatedQuiz = [...(editingLesson.lesson as any).quiz];
                        updatedQuiz[index].correctAnswer = e.target.value;
                        setEditingLesson({
                          ...editingLesson,
                          lesson: {
                            ...editingLesson.lesson,
                            quiz: updatedQuiz,
                          } as any,
                        });
                      }}
                      style={{
                        width: "100%",
                        padding: 8,
                        borderRadius: 6,
                        border: "1px solid #d8cdb4",
                        fontSize: 13,
                      }}
                    >
                      <option value="">Оберіть правильну відповідь</option>
                      {question.options.map((opt: string, optIndex: number) => (
                        <option key={optIndex} value={String(optIndex)}>
                          Варіант {optIndex + 1}: {opt || "(пусто)"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
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
