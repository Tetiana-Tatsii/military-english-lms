"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useAppContext,
  SkillType,
  QuizletCard,
} from "../../../../../context/AppContext";
import {
  ArrowLeft,
  Play,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Mic,
  Paperclip,
  X,
  Camera,
  CheckCircle2,
  Edit2,
  Save,
  Plus,
  Trash2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// 1. Компонент Флеш-карток (Quizlet) для студента
// ---------------------------------------------------------------------------
function QuizletPanel({ cards }: { cards: QuizletCard[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!cards || cards.length === 0) return null;
  const card = cards[index];

  const next = () => {
    setIndex((i) => (i + 1) % cards.length);
    setFlipped(false);
  };
  const prev = () => {
    setIndex((i) => (i - 1 + cards.length) % cards.length);
    setFlipped(false);
  };

  // ФУНКЦІЯ ДЛЯ ОЗВУЧКИ АНГЛІЙСЬКОЮ
  const playAudio = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US"; // Американська вимова. Можна змінити на 'en-GB' для британської
      utterance.rate = 0.9; // Трохи сповільнив, щоб курсантам було краще чути
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      style={{
        background: "#f6f1e4",
        borderRadius: 12,
        padding: 20,
        border: "0.5px solid #d8cdb4",
      }}
    >
      <h3
        style={{
          fontSize: 15,
          fontWeight: 600,
          margin: "0 0 16px",
          color: "#3a3528",
        }}
      >
        Ключові терміни
      </h3>
      <div
        onClick={() => setFlipped(!flipped)}
        style={{
          background: "#7a7a8a",
          borderRadius: 8,
          padding: 24,
          textAlign: "center",
          marginBottom: 12,
          cursor: "pointer",
          minHeight: 100,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          transition: "transform 0.3s ease",
        }}
      >
        <p
          style={{
            fontSize: 12,
            color: "#e3e3ea",
            margin: "0 0 8px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {flipped ? "переклад" : "термін"}
        </p>
        <p style={{ fontSize: 18, fontWeight: 500, margin: 0, color: "#fff" }}>
          {flipped ? card.translation : card.term}
        </p>

        {/* КНОПКА ОЗВУЧКИ */}
        {!flipped && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              playAudio(card.term);
            }}
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 12,
              padding: 8,
            }}
            title="Прослухати вимову"
          >
            <Volume2 size={18} color="#eef0df" />
          </div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <button
          onClick={prev}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <ChevronLeft size={20} color="#6b6b3a" />
        </button>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#6b6b3a" }}>
          {index + 1} / {cards.length}
        </span>
        <button
          onClick={next}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <ChevronRight size={20} color="#6b6b3a" />
        </button>
      </div>
      <p
        style={{
          fontSize: 12,
          color: "#aaa18a",
          margin: 0,
          textAlign: "center",
        }}
      >
        Натисніть на картку, щоб перевернути
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Компонент Відправки Відповіді (Рапорт/Голос)
// ---------------------------------------------------------------------------
function AnswerPanel({
  courseId,
  lessonId,
}: {
  courseId: string;
  lessonId: string;
}) {
  const { submitAnswer } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files.map((f) => f.name)]);
  };

  const handleSubmit = () => {
    submitAnswer({ courseId, lessonId, text, voiceRecorded, attachments });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div
        style={{
          background: "#eef0df",
          border: "1px solid #8a8a45",
          borderRadius: 12,
          padding: 20,
          textAlign: "center",
          marginTop: 24,
        }}
      >
        <CheckCircle2
          size={24}
          color="#8a8a45"
          style={{ margin: "0 auto 8px" }}
        />
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#3a3528",
            margin: "0 0 4px",
          }}
        >
          Відповідь надіслано!
        </h3>
        <p style={{ fontSize: 13, color: "#5a5440", margin: 0 }}>
          Очікуйте на фідбек від викладача.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#f6f1e4",
        borderRadius: 12,
        padding: 20,
        border: "0.5px solid #d8cdb4",
        marginTop: 24,
      }}
    >
      <h3
        style={{
          fontSize: 16,
          fontWeight: 600,
          margin: "0 0 12px",
          color: "#3a3528",
        }}
      >
        Відповідь на завдання
      </h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Напишіть рапорт або відповідь тут..."
        rows={4}
        style={{
          width: "100%",
          borderRadius: 8,
          border: "0.5px solid #d8cdb4",
          padding: 12,
          fontSize: 14,
          color: "#3a3528",
          marginBottom: 16,
          resize: "vertical",
        }}
      />
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button
          onClick={() => setVoiceRecorded(!voiceRecorded)}
          style={{
            flex: 1,
            background: voiceRecorded ? "#eef0df" : "#fff",
            color: "#3a3528",
            border: voiceRecorded ? "1px solid #8a8a45" : "0.5px solid #d8cdb4",
            borderRadius: 8,
            padding: "10px",
            fontSize: 13,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer",
          }}
        >
          <Mic size={16} /> {voiceRecorded ? "Записано" : "PTT Аудіо"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={handleFiles}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            flex: 1,
            background: "#fff",
            color: "#3a3528",
            border: "0.5px solid #d8cdb4",
            borderRadius: 8,
            padding: "10px",
            fontSize: 13,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer",
          }}
        >
          <Paperclip size={16} /> Додати файл
        </button>
      </div>
      <button
        onClick={handleSubmit}
        disabled={!text && attachments.length === 0 && !voiceRecorded}
        style={{
          width: "100%",
          background: "#8a8a45",
          color: "#f6f1e4",
          border: "none",
          borderRadius: 8,
          padding: "12px",
          fontSize: 14,
          fontWeight: 600,
          cursor:
            !text && attachments.length === 0 && !voiceRecorded
              ? "not-allowed"
              : "pointer",
          opacity:
            !text && attachments.length === 0 && !voiceRecorded ? 0.5 : 1,
        }}
      >
        Надіслати викладачу
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Головна Сторінка Уроку
// ---------------------------------------------------------------------------
export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { user, courses, updateLesson } = useAppContext();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: "",
    section: "",
    skill: "mixed" as SkillType,
    content: "",
    quizlet: [] as QuizletCard[],
  });

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);
  if (!user) return null;

  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;

  const course = courses.find((c) => c.id === courseId);
  let lesson: any = null;
  let moduleId = "";

  course?.modules.forEach((m) => {
    const found = m.lessons.find((l) => l.id === lessonId);
    if (found) {
      lesson = found;
      moduleId = m.id;
    }
  });

  const isTeacher = user.role === "teacher";

  // Ініціалізація даних для редагування
  const handleEditToggle = () => {
    if (!isEditing) {
      setEditData({
        title: lesson.title,
        section: lesson.section,
        skill: lesson.skill,
        content: lesson.content,
        quizlet: [...lesson.quizlet],
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    updateLesson(courseId, moduleId, lessonId, editData);
    setIsEditing(false);
  };

  const handleAddCard = () => {
    setEditData({
      ...editData,
      quizlet: [...editData.quizlet, { term: "", translation: "" }],
    });
  };

  const updateCard = (
    index: number,
    field: "term" | "translation",
    value: string,
  ) => {
    const newCards = [...editData.quizlet];
    newCards[index][field] = value;
    setEditData({ ...editData, quizlet: newCards });
  };

  const removeCard = (index: number) => {
    const newCards = [...editData.quizlet];
    newCards.splice(index, 1);
    setEditData({ ...editData, quizlet: newCards });
  };

  if (!lesson) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f0e9d8",
        }}
      >
        <h2>Урок не знайдено</h2>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#f0e9d8",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
        color: "#3a3528",
      }}
    >
      {/* НАВІГАЦІЯ ТА ПАНЕЛЬ ВИКЛАДАЧА */}
      <div
        style={{
          padding: "16px 24px",
          background: "#f6f1e4",
          borderBottom: "0.5px solid #d8cdb4",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={() =>
            router.push(isTeacher ? "/teacher" : `/courses/${courseId}`)
          }
          style={{
            background: "transparent",
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            color: "#6b6b3a",
            fontWeight: 500,
            fontSize: 14,
          }}
        >
          <ArrowLeft size={18} /> Назад{" "}
          {isTeacher ? "до Редактора" : "до плану курсу"}
        </button>

        {isTeacher && (
          <div style={{ display: "flex", gap: 12 }}>
            {isEditing ? (
              <>
                <button
                  onClick={handleEditToggle}
                  style={{
                    padding: "8px 16px",
                    background: "#e9e1cd",
                    color: "#6b6b3a",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Скасувати
                </button>
                <button
                  onClick={handleSave}
                  style={{
                    padding: "8px 16px",
                    background: "#8a8a45",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Save size={16} /> Зберегти зміни
                </button>
              </>
            ) : (
              <button
                onClick={handleEditToggle}
                style={{
                  padding: "8px 16px",
                  background: "#eef0df",
                  color: "#8a8a45",
                  border: "1px solid #8a8a45",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Edit2 size={16} /> Редагувати урок
              </button>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          padding: "32px 24px",
          maxWidth: "1000px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "32px",
          alignItems: "start",
        }}
      >
        {/* ЛІВА КОЛОНКА: КОНТЕНТ УРОКУ */}
        <div>
          {isEditing ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                marginBottom: 24,
              }}
            >
              <div style={{ display: "flex", gap: 12 }}>
                <input
                  value={editData.section}
                  onChange={(e) =>
                    setEditData({ ...editData, section: e.target.value })
                  }
                  placeholder="Тема (напр. ОСНОВИ)"
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #d8cdb4",
                    textTransform: "uppercase",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                />
                <select
                  value={editData.skill}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      skill: e.target.value as SkillType,
                    })
                  }
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #d8cdb4",
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  <option value="listening">Listening</option>
                  <option value="reading">Reading</option>
                  <option value="speaking">Speaking</option>
                  <option value="writing">Writing</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
              <input
                value={editData.title}
                onChange={(e) =>
                  setEditData({ ...editData, title: e.target.value })
                }
                placeholder="Назва уроку"
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid #d8cdb4",
                  fontSize: 24,
                  fontWeight: 700,
                }}
              />
              <textarea
                value={editData.content}
                onChange={(e) =>
                  setEditData({ ...editData, content: e.target.value })
                }
                placeholder="Основний текст уроку..."
                rows={10}
                style={{
                  padding: 16,
                  borderRadius: 8,
                  border: "1px solid #d8cdb4",
                  fontSize: 16,
                  lineHeight: 1.6,
                  resize: "vertical",
                }}
              />
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "#8a8a45",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    background: "#eef0df",
                    padding: "4px 8px",
                    borderRadius: 6,
                  }}
                >
                  {lesson.section}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "#5a5440",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    border: "1px solid #d8cdb4",
                    padding: "3px 8px",
                    borderRadius: 6,
                  }}
                >
                  Навичка: {lesson.skill}
                </span>
              </div>
              <h1
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  margin: "0 0 24px",
                  color: "#3a3528",
                  lineHeight: 1.3,
                }}
              >
                {lesson.title}
              </h1>

              <div
                style={{
                  fontSize: 16,
                  lineHeight: 1.8,
                  color: "#4a4435",
                  background: "#f6f1e4",
                  padding: 24,
                  borderRadius: 12,
                  border: "0.5px solid #d8cdb4",
                  whiteSpace: "pre-wrap",
                }}
              >
                <p style={{ margin: 0 }}>{lesson.content}</p>
              </div>
            </>
          )}

          {/* ПАНЕЛЬ ВІДПОВІДІ */}
          {!isEditing && (
            <AnswerPanel courseId={courseId} lessonId={lessonId} />
          )}
        </div>

        {/* ПРАВА КОЛОНКА: ІНТЕРАКТИВ (QUIZLET) */}
        <div>
          {isEditing ? (
            <div
              style={{
                background: "#f6f1e4",
                borderRadius: 12,
                padding: 20,
                border: "0.5px solid #d8cdb4",
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
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    margin: 0,
                    color: "#3a3528",
                  }}
                >
                  Редактор карток
                </h3>
                <button
                  onClick={handleAddCard}
                  style={{
                    background: "#eef0df",
                    border: "1px solid #8a8a45",
                    color: "#8a8a45",
                    padding: "4px 8px",
                    borderRadius: 6,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <Plus size={14} /> Додати
                </button>
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {editData.quizlet.map((card, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#fff",
                      padding: 12,
                      borderRadius: 8,
                      border: "0.5px solid #d8cdb4",
                      position: "relative",
                    }}
                  >
                    <button
                      onClick={() => removeCard(idx)}
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        background: "transparent",
                        border: "none",
                        color: "#c97a4a",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                    <input
                      value={card.term}
                      onChange={(e) => updateCard(idx, "term", e.target.value)}
                      placeholder="Термін (англ)"
                      style={{
                        width: "calc(100% - 24px)",
                        padding: 8,
                        marginBottom: 8,
                        borderRadius: 4,
                        border: "1px solid #e9e1cd",
                        fontSize: 14,
                      }}
                    />
                    <input
                      value={card.translation}
                      onChange={(e) =>
                        updateCard(idx, "translation", e.target.value)
                      }
                      placeholder="Переклад (укр)"
                      style={{
                        width: "100%",
                        padding: 8,
                        borderRadius: 4,
                        border: "1px solid #e9e1cd",
                        fontSize: 14,
                      }}
                    />
                  </div>
                ))}
                {editData.quizlet.length === 0 && (
                  <p
                    style={{
                      fontSize: 13,
                      color: "#9a8f70",
                      textAlign: "center",
                    }}
                  >
                    Немає жодної картки.
                  </p>
                )}
              </div>
            </div>
          ) : lesson.quizlet && lesson.quizlet.length > 0 ? (
            <QuizletPanel cards={lesson.quizlet} />
          ) : (
            <div
              style={{
                background: "#f6f1e4",
                borderRadius: 12,
                padding: 20,
                border: "0.5px solid #d8cdb4",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 13, color: "#9a8f70", margin: 0 }}>
                У цьому уроці немає нових термінів для вивчення.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
