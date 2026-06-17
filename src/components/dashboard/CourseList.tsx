"use client";

import React from "react";
import { BookOpen } from "lucide-react";
import { Course } from "@/context/AppContext";

interface CourseListProps {
  courses: Course[];
  getCourseProgress: (courseId: string) => number;
  onCourseClick: (courseId: string) => void;
  isDarkMode: boolean;
}

export default function CourseList({
  courses,
  getCourseProgress,
  onCourseClick,
  isDarkMode,
}: CourseListProps) {
  return (
    <>
      <h2
        className={`mb-4 flex items-center gap-2 text-lg font-semibold ${
          isDarkMode ? "text-[#f6f1e4]" : "text-[#3a3528]"
        }`}
      >
        <BookOpen size={20} color="#8a8a45" /> Доступні курси
      </h2>
      <div className="mb-10 flex flex-col gap-4">
        {courses.map((course) => {
          const progress = getCourseProgress(course.id);
          return (
            <div
              key={course.id}
              className={`rounded-xl border p-6 ${
                isDarkMode
                  ? "bg-[#3a3326] border-[#4a4231]"
                  : "bg-[#f6f1e4] border-[#d8cdb4]"
              }`}
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3
                    className={`mb-1 text-lg font-bold ${
                      isDarkMode ? "text-white" : "text-[#3a3528]"
                    }`}
                  >
                    {course.title}
                  </h3>
                  <p className="text-sm font-medium text-[#8a8a45]">
                    {course.subtitle}
                  </p>
                </div>
                {course.status === "active" ? (
                  <button
                    onClick={() => onCourseClick(course.id)}
                    className="rounded-lg bg-[#8a8a45] px-4 py-2 font-semibold text-white"
                  >
                    Продовжити
                  </button>
                ) : (
                  <span
                    className={`rounded px-3 py-1.5 text-xs font-semibold ${
                      isDarkMode
                        ? "bg-[#4a4231] text-[#d8cdb4]"
                        : "bg-[#e9e1cd] text-[#9a8f70]"
                    }`}
                  >
                    У РОЗРОБЦІ
                  </span>
                )}
              </div>

              {course.status === "active" && (
                <div>
                  <div
                    className={`mb-1.5 flex justify-between text-sm font-medium ${
                      isDarkMode ? "text-[#d8cdb4]" : "text-[#6b6b3a]"
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
            </div>
          );
        })}
      </div>
    </>
  );
}
