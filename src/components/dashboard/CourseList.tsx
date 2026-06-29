"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Award, CheckCircle, Clock } from "lucide-react";
import { Course, Answer } from "@/context/AppContext";

interface CourseListProps {
  courses: Course[];
  answers: Answer[];
  getCourseProgress: (courseId: string) => number;
  getLessonTitle: (courseId: string, lessonId: string) => string;
  onCourseClick: (courseId: string) => void;
  isDarkMode: boolean;
}

export default function CourseList({
  courses,
  answers,
  getCourseProgress,
  getLessonTitle,
  onCourseClick,
  isDarkMode,
}: CourseListProps) {
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

  const toggleCourse = (courseId: string) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId);
    } else {
      newExpanded.add(courseId);
    }
    setExpandedCourses(newExpanded);
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        {courses.map((course) => {
          const progress = getCourseProgress(course.id);
          const isExpanded = expandedCourses.has(course.id);
          return (
            <div
              key={course.id}
              className={`rounded-xl border p-4 md:p-6 ${
                isDarkMode
                  ? "bg-[#2d2f2a] border-[#3e403a]"
                  : "bg-[#f6f1e4] border-[#d8cdb4]"
              }`}
            >
              <div className="mb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <h3
                    className={`mb-1 text-base md:text-lg font-bold ${
                      isDarkMode ? "text-[#e6e4dc]" : "text-[#3a3528]"
                    }`}
                  >
                    {course.title}
                  </h3>
                  <p className="text-sm font-medium text-[#8a8a45]">
                    {course.subtitle}
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:gap-3">
                  {course.status === "active" ? (
                    <button
                      onClick={() => onCourseClick(course.id)}
                      className="rounded-lg bg-[#8a8a45] px-4 py-2 font-semibold text-white cursor-pointer hover:bg-[#6b6b36] transition-colors duration-200 text-sm md:text-base"
                    >
                      Продовжити
                    </button>
                  ) : (
                    <>
                      <span
                        className={`rounded px-3 py-1.5 text-xs font-semibold ${
                          isDarkMode
                            ? "bg-[#3e403a] text-[#a3a198]"
                            : "bg-[#e9e1cd] text-[#9a8f70]"
                        }`}
                      >
                        У РОЗРОБЦІ
                      </span>
                      <button
                        onClick={() => onCourseClick(course.id)}
                        className="rounded-lg bg-[#8a8a45] px-4 py-2 font-semibold text-white cursor-pointer hover:bg-[#6b6b36] transition-colors duration-200 text-sm md:text-base"
                      >
                        Продовжити
                      </button>
                    </>
                  )}
                </div>
              </div>

              {course.status === "active" && (
                <div>
                  <div
                    className={`mb-1.5 flex justify-between text-sm font-medium ${
                      isDarkMode ? "text-[#a3a198]" : "text-[#6b6b3a]"
                    }`}
                  >
                    <span>Прогрес курсу</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e9e1cd]">
                    <div
                      className="h-full rounded-full bg-[#8a8a45] transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {[...answers]
                .filter((ans) => ans.courseId === course.id)
                .sort((a, b) => (b.submittedAt || "").localeCompare(a.submittedAt || ""))
                .length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => toggleCourse(course.id)}
                    className={`flex items-center gap-2 text-sm font-semibold cursor-pointer hover:text-[#8a8a45] transition-colors duration-200 ${
                      isDarkMode ? "text-[#e6e4dc]" : "text-[#3a3528]"
                    }`}
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    Результати по уроках ({[...answers].filter((ans) => ans.courseId === course.id).length})
                  </button>
                  {isExpanded && (
                    <div className="mt-3 flex flex-col gap-3">
                      {[...answers]
                        .filter((ans) => ans.courseId === course.id)
                        .sort((a, b) => (b.submittedAt || "").localeCompare(a.submittedAt || ""))
                        .map((ans) => (
                        <div
                          key={ans.id}
                          className={`rounded-lg border p-3 md:p-4 ${
                            isDarkMode
                              ? "bg-[#2a2c27] border-[#3e403a]"
                              : "bg-[#e9e1cd] border-[#d8cdb4]"
                          }`}
                        >
                          <div className="mb-2 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div>
                              <p className="mb-1 text-xs font-semibold uppercase text-[#9a8f70]">
                                Відповідь на урок
                              </p>
                              <h4
                                className={`m-0 text-sm font-semibold ${
                                  isDarkMode ? "text-[#e6e4dc]" : "text-[#3a3528]"
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
                              className={`mt-2 rounded-lg p-3 ${
                                isDarkMode ? "bg-[#2d2f2a]" : "bg-[#f6f1e4]"
                              }`}
                            >
                              <p
                                className={`mb-2 text-sm ${
                                  isDarkMode ? "text-[#e6e4dc]" : "text-[#4a4435]"
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
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
