"use client";

import React, { useEffect, useState } from "react";
import {
  Inbox,
  CheckCircle,
  Headphones,
  FileText,
  Lock,
} from "lucide-react";
import { Answer, Course } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";

interface AnswersTabProps {
  answers: Answer[];
  courses: Course[];
  userId: string | undefined;
  isDarkMode: boolean;
  provideFeedback: (
    answerId: string,
    feedback: string,
    isAudio: boolean,
    score?: number,
    coinsToAward?: number,
  ) => void;
}

export default function AnswersTab({
  answers,
  courses,
  userId,
  isDarkMode,
  provideFeedback,
}: AnswersTabProps) {
  const [feedbackTexts, setFeedbackTexts] = useState<{ [key: string]: string }>({});
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [coinsMap, setCoinsMap] = useState<{ [key: string]: number }>({});
  const [answerFilter, setAnswerFilter] = useState<"pending" | "reviewed">("pending");
  const [lockedAnswers, setLockedAnswers] = useState<{ [key: string]: string | null }>({});
  const [isLocking, setIsLocking] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (answers.length > 0) {
      const loadLockedAnswers = async () => {
        const { data, error } = await supabase
          .from("answers")
          .select("id, locked_by_teacher_id")
          .in("id", answers.map((a) => a.id));

        if (!error && data) {
          const lockedMap: { [key: string]: string | null } = {};
          data.forEach((item) => {
            lockedMap[item.id] = item.locked_by_teacher_id;
          });
          setLockedAnswers(lockedMap);
        }
      };
      loadLockedAnswers();
    }
  }, [answers]);

  useEffect(() => {
    const channel = supabase
      .channel("answers-locked-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "answers" },
        (payload) => {
          setLockedAnswers((prev) => {
            const next = { ...prev };
            if (payload.eventType === "DELETE" && payload.old) {
              next[payload.old.id as string] = null;
            } else if (
              (payload.eventType === "UPDATE" || payload.eventType === "INSERT") &&
              payload.new
            ) {
              next[payload.new.id as string] =
                (payload.new.locked_by_teacher_id as string | null) ?? null;
            }
            return next;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const lockAnswer = async (answerId: string) => {
    if (!userId) return;
    setIsLocking((prev) => ({ ...prev, [answerId]: true }));

    const { data: currentAnswer, error: fetchError } = await supabase
      .from("answers")
      .select("locked_by_teacher_id")
      .eq("id", answerId)
      .maybeSingle();

    if (fetchError || !currentAnswer) {
      console.error("Помилка при перевірці статусу блокування:", fetchError);
      setIsLocking((prev) => ({ ...prev, [answerId]: false }));
      return;
    }

    if (
      currentAnswer.locked_by_teacher_id &&
      currentAnswer.locked_by_teacher_id !== userId
    ) {
      // Синхронізуємо актуальний стан з БД
      const { data, error } = await supabase
        .from("answers")
        .select("id, locked_by_teacher_id")
        .in("id", answers.map((a) => a.id));

      if (!error && data) {
        const lockedMap: { [key: string]: string | null } = {};
        data.forEach((item) => { lockedMap[item.id] = item.locked_by_teacher_id; });
        setLockedAnswers(lockedMap);
      }
      setIsLocking((prev) => ({ ...prev, [answerId]: false }));
      return;
    }

    const { error } = await supabase
      .from("answers")
      .update({ locked_by_teacher_id: userId })
      .eq("id", answerId);

    if (!error) {
      setLockedAnswers((prev) => ({ ...prev, [answerId]: userId ?? null }));
    } else {
      console.error("Помилка при блокуванні відповіді:", error);
    }
    setIsLocking((prev) => ({ ...prev, [answerId]: false }));
  };

  const unlockAnswer = async (answerId: string) => {
    setIsLocking((prev) => ({ ...prev, [answerId]: true }));

    const { error } = await supabase
      .from("answers")
      .update({ locked_by_teacher_id: null })
      .eq("id", answerId);

    if (!error) {
      setLockedAnswers((prev) => ({ ...prev, [answerId]: null }));
    } else {
      console.error("Помилка при розблокуванні відповіді:", error);
    }
    setIsLocking((prev) => ({ ...prev, [answerId]: false }));
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2
          style={{
            fontSize: 24,
            fontWeight: 700,
            margin: 0,
            color: isDarkMode ? "#e6e4dc" : "#3a3528",
          }}
        >
          <Inbox size={24} style={{ display: "inline", marginRight: 8 }} />
          Роботи на перевірку
        </h2>
        
        {/* Компактні перемикачі (Сегментований контроль) */}
        <div className={`flex w-full rounded-lg p-1 sm:w-auto ${isDarkMode ? "bg-[#252622] border border-[#3e403a]" : "bg-[#e0dcd0]/60 border border-[#e0dcd0]"}`}>
          <button
            onClick={() => setAnswerFilter("pending")}
            className={`flex-1 cursor-pointer rounded-md py-1.5 text-center text-sm font-semibold transition-all sm:flex-none sm:px-4 border-none ${
              answerFilter === "pending"
                ? "bg-[#8a8a45] text-white shadow-sm"
                : `bg-transparent ${isDarkMode ? "text-[#a3a198] hover:text-[#e6e4dc]" : "text-[#7a7568] hover:text-[#3a3528]"}`
            }`}
          >
            Очікують ({answers.filter((a) => a.status === "pending").length})
          </button>
          <button
            onClick={() => setAnswerFilter("reviewed")}
            className={`flex-1 cursor-pointer rounded-md py-1.5 text-center text-sm font-semibold transition-all sm:flex-none sm:px-4 border-none ${
              answerFilter === "reviewed"
                ? "bg-[#8a8a45] text-white shadow-sm"
                : `bg-transparent ${isDarkMode ? "text-[#a3a198] hover:text-[#e6e4dc]" : "text-[#7a7568] hover:text-[#3a3528]"}`
            }`}
          >
            Перевірені ({answers.filter((a) => a.status === "reviewed").length})
          </button>
        </div>
      </div>
      
      {answers.filter((a) => a.status === answerFilter).length === 0 ? (
        <div
          style={{
            background: isDarkMode ? "#2d2f2a" : "#fff",
            padding: 40,
            borderRadius: 12,
            border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
            textAlign: "center",
          }}
        >
          <p style={{ color: isDarkMode ? "#a3a198" : "#9a8f70", fontSize: 16 }}>
            {answerFilter === "pending"
              ? "Немає робіт на перевірку."
              : "Немає перевірених робіт."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {answers
            .filter((a) => a.status === answerFilter)
            .map((ans) => (
              <div
                key={ans.id}
                style={{
                  background: isDarkMode ? "#2d2f2a" : "#fff",
                  padding: 24,
                  borderRadius: 12,
                  border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                {/* Адаптивна шапка картки з Tailwind */}
                <div
                  className="mb-4 grid grid-cols-1 gap-4 border-b pb-4 md:grid-cols-3"
                  style={{
                    borderColor: isDarkMode ? "#3e403a" : "#e0dcd0",
                  }}
                >
                  <div className="text-left">
                    <p
                      style={{
                        fontSize: 12,
                        color: isDarkMode ? "#a3a198" : "#9a8f70",
                        textTransform: "uppercase",
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      Курсант
                    </p>
                    <p
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: isDarkMode ? "#e6e4dc" : "#3a3528",
                        margin: 0,
                      }}
                    >
                      {ans.studentName}
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: isDarkMode ? "#a3a198" : "#7a7568",
                        margin: "4px 0 0",
                      }}
                    >
                      {ans.squadId}
                    </p>
                  </div>
                  <div className="text-left md:text-center">
                    <p
                      style={{
                        fontSize: 12,
                        color: isDarkMode ? "#a3a198" : "#9a8f70",
                        textTransform: "uppercase",
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      Курс та урок
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: isDarkMode ? "#a3a198" : "#5c574a",
                        margin: 0,
                        fontWeight: 600,
                      }}
                    >
                      {courses.find((c) => c.id === ans.courseId)?.title || "Невідомий курс"}
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: isDarkMode ? "#a3a198" : "#7a7568",
                        margin: "4px 0 0",
                      }}
                    >
                      {(() => {
                        const course = courses.find((c) => c.id === ans.courseId);
                        if (!course) return "Невідомий урок";
                        for (const mod of course.modules) {
                          const lesson = mod.lessons.find((l) => l.id === ans.lessonId);
                          if (lesson) return lesson.title;
                        }
                        return "Невідомий урок";
                      })()}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p
                      style={{
                        fontSize: 12,
                        color: isDarkMode ? "#a3a198" : "#9a8f70",
                        textTransform: "uppercase",
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      Відправлено
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: isDarkMode ? "#a3a198" : "#5c574a",
                        margin: 0,
                      }}
                    >
                      {new Date(ans.submittedAt).toLocaleString("uk-UA")}
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <p
                    style={{
                      fontSize: 12,
                      color: "#9a8f70",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Відповідь на урок
                  </p>
                  <p
                    style={{
                      fontSize: 15,
                      color: isDarkMode ? "#e6e4dc" : "#4a4a4a",
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {ans.text}
                  </p>
                </div>

                {/* Аудіо та документи */}
                {(ans.voiceRecorded || ans.attachments.length > 0) && (
                  <div
                    style={{
                      background: isDarkMode ? "#2a2c27" : "#faf9f6",
                      padding: 16,
                      borderRadius: 8,
                      marginBottom: 16,
                    }}
                  >
                    {ans.voiceRecorded && (
                      <div style={{ marginBottom: 12 }}>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: isDarkMode ? "#a3a198" : "#7a7568",
                            marginBottom: 8,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Headphones size={16} /> Голосова відповідь
                        </p>
                        <audio
                          controls
                          style={{ width: "100%", height: 40 }}
                          src={ans.audioUrl}
                        >
                          Ваш браузер не підтримує аудіо.
                        </audio>
                      </div>
                    )}
                    {ans.attachments.length > 0 && (
                      <div>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: isDarkMode ? "#a3a198" : "#7a7568",
                            marginBottom: 8,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <FileText size={16} /> Прикріплені документи
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {ans.attachments
                            .filter((a) => !a.endsWith(".webm"))
                            .map((att, idx) => (
                            <a
                              key={idx}
                              href={att}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "#8a8a45",
                                textDecoration: "underline",
                                fontSize: 14,
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: 8,
                                background: isDarkMode ? "#2d2f2a" : "#fff",
                                borderRadius: 6,
                                border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
                              }}
                            >
                              <FileText size={16} />
                              {att.split("/").pop()}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Форма оцінювання або відображення результату */}
                {answerFilter === "pending" ? (
                  <div
                    style={{
                      background: isDarkMode ? "#2a2c27" : "#f0ede5",
                      padding: 20,
                      borderRadius: 8,
                    }}
                  >
                    {/* Lock status and actions */}
                    {lockedAnswers[ans.id] ? (
                      lockedAnswers[ans.id] === userId ? (
                        <div
                          className="mb-4 flex flex-col gap-3 rounded-md p-3 sm:flex-row sm:items-center sm:justify-between"
                          style={{
                            background: isDarkMode ? "#2d2f2a" : "#fff",
                            border: "1px solid #8a8a45",
                          }}
                        >
                          <span style={{ fontSize: 13, color: isDarkMode ? "#e6e4dc" : "#3a3528" }}>
                            🔒 Ви перевіряєте цю роботу
                          </span>
                          <button
                            onClick={() => unlockAnswer(ans.id)}
                            disabled={!!isLocking[ans.id]}
                            className="w-full rounded px-4 py-1.5 text-[13px] font-semibold transition-colors sm:w-auto"
                            style={{
                              background: "#c97a4a",
                              color: "#fff",
                              border: "none",
                              cursor: isLocking[ans.id] ? "not-allowed" : "pointer",
                            }}
                          >
                            {isLocking[ans.id] ? "..." : "Скасувати"}
                          </button>
                        </div>
                      ) : (
                        <div
                          style={{
                            marginBottom: 16,
                            padding: 12,
                            background: isDarkMode ? "#2d2f2a" : "#fff",
                            borderRadius: 6,
                            border: "1px solid #c97a4a",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span style={{ fontSize: 13, color: isDarkMode ? "#e6e4dc" : "#3a3528" }}>
                            🔒 Перевіряється іншим викладачем
                          </span>
                        </div>
                      )
                    ) : (
                      <button
                        onClick={() => lockAnswer(ans.id)}
                        disabled={!!(isLocking[ans.id] || (lockedAnswers[ans.id] && lockedAnswers[ans.id] !== userId))}
                        className="mb-4 flex w-full items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition-opacity sm:w-auto sm:justify-start"
                        style={{
                          background: (lockedAnswers[ans.id] && lockedAnswers[ans.id] !== userId) ? "#ccc" : "#8a8a45",
                          color: "#fff",
                          border: "none",
                          cursor: (isLocking[ans.id] || (lockedAnswers[ans.id] && lockedAnswers[ans.id] !== userId)) ? "not-allowed" : "pointer",
                        }}
                      >
                        {isLocking[ans.id] ? "..." : <Lock size={14} />} Взяти на перевірку
                      </button>
                    )}

                    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="w-full">
                        <label
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: isDarkMode ? "#a3a198" : "#7a7568",
                            marginBottom: 8,
                            display: "block",
                          }}
                        >
                          Оцінка (0–100)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={scores[ans.id] || ""}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setScores({ ...scores, [ans.id]: Math.min(100, Math.max(0, value)) });
                          }}
                          className="w-full rounded-md border border-[#d8cdb4] p-2 text-sm"
                          style={{
                            background: isDarkMode ? "#2d2f2a" : "#fff",
                            color: isDarkMode ? "#e6e4dc" : "#3a3528",
                          }}
                        />
                      </div>
                      <div className="w-full">
                        <label
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: isDarkMode ? "#a3a198" : "#7a7568",
                            marginBottom: 8,
                            display: "block",
                          }}
                        >
                          {ans.coins_awarded
                            ? "☕ Коїни вже нараховані"
                            : "☕ Кава-коїни (0–20)"}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          disabled={!!ans.coins_awarded}
                          value={coinsMap[ans.id] ?? ""}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setCoinsMap({ ...coinsMap, [ans.id]: Math.min(20, Math.max(0, value)) });
                          }}
                          className="w-full rounded-md border border-[#d8cdb4] p-2 text-sm"
                          style={{
                            background: ans.coins_awarded
                              ? (isDarkMode ? "#1e2019" : "#f0ede5")
                              : (isDarkMode ? "#2d2f2a" : "#fff"),
                            color: isDarkMode ? "#e6e4dc" : "#3a3528",
                            opacity: ans.coins_awarded ? 0.6 : 1,
                          }}
                          placeholder={ans.coins_awarded ? "—" : "0"}
                        />
                      </div>
                    </div>
                    <div className="mb-4 w-full">
                      <label
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: isDarkMode ? "#a3a198" : "#7a7568",
                          marginBottom: 8,
                          display: "block",
                        }}
                      >
                        Фідбек
                      </label>
                      <textarea
                        value={feedbackTexts[ans.id] || ""}
                        onChange={(e) =>
                          setFeedbackTexts({
                            ...feedbackTexts,
                            [ans.id]: e.target.value,
                          })
                        }
                        placeholder="Введіть коментар до роботи..."
                        className="min-h-[80px] w-full resize-y rounded-md border border-[#d8cdb4] p-2 text-sm"
                        style={{
                          background: isDarkMode ? "#2d2f2a" : "#fff",
                          color: isDarkMode ? "#e6e4dc" : "#3a3528",
                        }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        provideFeedback(
                          ans.id,
                          feedbackTexts[ans.id] || "",
                          false,
                          scores[ans.id],
                          coinsMap[ans.id] ?? 0,
                        );
                        setFeedbackTexts({ ...feedbackTexts, [ans.id]: "" });
                        setScores({ ...scores, [ans.id]: 0 });
                        setCoinsMap({ ...coinsMap, [ans.id]: 0 });
                      }}
                      disabled={!!(lockedAnswers[ans.id] && lockedAnswers[ans.id] !== userId)}
                      className="flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-opacity sm:w-auto sm:justify-start"
                      style={{
                        background: (lockedAnswers[ans.id] && lockedAnswers[ans.id] !== userId) ? "#ccc" : "#8a8a45",
                        color: "#fff",
                        border: "none",
                        cursor: (lockedAnswers[ans.id] && lockedAnswers[ans.id] !== userId) ? "not-allowed" : "pointer",
                      }}
                    >
                      <CheckCircle size={16} /> {lockedAnswers[ans.id] && lockedAnswers[ans.id] !== userId ? "🔒 Заблоковано" : "Зберегти оцінку"}
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      background: isDarkMode ? "#2a2c27" : "#f0ede5",
                      padding: 20,
                      borderRadius: 8,
                    }}
                  >
                    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="w-full">
                        <label
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: isDarkMode ? "#a3a198" : "#7a7568",
                            marginBottom: 8,
                            display: "block",
                          }}
                        >
                          Оцінка
                        </label>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: "#8a8a45",
                            padding: 10,
                            background: isDarkMode ? "#2d2f2a" : "#fff",
                            borderRadius: 6,
                            border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
                          }}
                        >
                          {ans.score || 0}/100
                        </div>
                      </div>
                    </div>
                    {ans.teacherFeedbackText && (
                      <div>
                        <label
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: isDarkMode ? "#a3a198" : "#7a7568",
                            marginBottom: 8,
                            display: "block",
                          }}
                        >
                          Фідбек
                        </label>
                        <div
                          style={{
                            fontSize: 14,
                            color: isDarkMode ? "#e6e4dc" : "#4a4a4a",
                            padding: 10,
                            background: isDarkMode ? "#2d2f2a" : "#fff",
                            borderRadius: 6,
                            border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
                            lineHeight: 1.6,
                          }}
                        >
                          {ans.teacherFeedbackText}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}