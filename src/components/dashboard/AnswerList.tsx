"use client";

import React from "react";
import { MessageSquare, CheckCircle, Clock, Award } from "lucide-react";
import { Answer } from "@/context/AppContext";

interface AnswerListProps {
  answers: Answer[];
  getLessonTitle: (courseId: string, lessonId: string) => string;
  isDarkMode: boolean;
}

export default function AnswerList({
  answers,
  getLessonTitle,
  isDarkMode,
}: AnswerListProps) {
  return (
    <>
      <h2
        className={`mb-4 flex items-center gap-2 text-lg font-semibold ${
          isDarkMode ? "text-[#f6f1e4]" : "text-[#3a3528]"
        }`}
      >
        <MessageSquare size={20} color="#8a8a45" /> Мої результати та фідбек
      </h2>
      {answers.length === 0 ? (
        <div
          className={`rounded-xl border p-6 text-center ${
            isDarkMode
              ? "bg-[#3a3326] border-[#4a4231]"
              : "bg-[#f6f1e4] border-[#d8cdb4]"
          }`}
        >
          <p className="text-sm text-[#9a8f70]">
            Ви ще не відправили жодного завдання на перевірку.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {[...answers].reverse().map((ans) => (
            <div
              key={ans.id}
              className={`rounded-xl border p-5 ${
                isDarkMode
                  ? "bg-[#3a3326] border-[#4a4231]"
                  : "bg-[#f6f1e4] border-[#d8cdb4]"
              }`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-[#9a8f70]">
                    Відповідь на урок
                  </p>
                  <h4
                    className={`m-0 text-sm font-semibold ${
                      isDarkMode ? "text-white" : "text-[#3a3528]"
                    }`}
                  >
                    {getLessonTitle(ans.courseId, ans.lessonId)}
                  </h4>
                </div>
                {ans.status === "reviewed" ? (
                  <span className="flex items-center gap-1 rounded bg-[#eef0df] px-2 py-1 text-xs font-semibold text-[#8a8a45]">
                    <CheckCircle size={14} /> Перевірено
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded bg-[#fdeced] px-2 py-1 text-xs font-semibold text-[#c97a4a]">
                    <Clock size={14} /> Очікує перевірки
                  </span>
                )}
              </div>

              {ans.status === "reviewed" && (
                <div
                  className={`mt-3 rounded-lg p-4 ${
                    isDarkMode ? "bg-[#4a4231]" : "bg-[#e9e1cd]"
                  }`}
                >
                  <p
                    className={`mb-2 text-sm ${
                      isDarkMode ? "text-[#f6f1e4]" : "text-[#4a4435]"
                    }`}
                  >
                    <strong>Коментар викладача:</strong>{" "}
                    {ans.teacherFeedbackText || "Без коментарів"}
                  </p>
                  {ans.score && (
                    <div className="flex items-center gap-1.5 font-bold text-[#8a8a45] text-[15px]">
                      <Award size={18} /> Оцінка: {ans.score}/100
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
