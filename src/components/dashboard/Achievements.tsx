"use client";

import React from "react";
import { COURSE_BADGES } from "@/lib/gamification";
import type { Course, GamificationProfile } from "@/context/AppContext";

interface AchievementsProps {
  gamification: GamificationProfile;
  courses: Course[];
  isDarkMode: boolean;
}

export default function Achievements({ gamification, courses, isDarkMode }: AchievementsProps) {
  const { completedCourses } = gamification;

  const badgeEntries = courses
    .map((course) => {
      const badge = COURSE_BADGES[course.id];
      if (!badge) return null;
      return {
        courseId: course.id,
        courseName: badge.name,
        badge,
        completed: completedCourses.includes(course.id),
      };
    })
    .filter((entry) => entry !== null);

  if (badgeEntries.length === 0) return null;

  return (
    <div
      className="w-full rounded-2xl border"
      style={{
        background: isDarkMode ? "#2d2f2a" : "#f6f1e4",
        borderColor: isDarkMode ? "#3e403a" : "#d8cdb4",
      }}
    >
      <div
        className="px-4 py-3 sm:px-5 sm:py-4"
        style={{ borderBottom: isDarkMode ? "1px solid #3e403a" : "1px solid #e8e2d4" }}
      >
        <span className="font-bold text-sm sm:text-base" style={{ color: isDarkMode ? "#e6e4dc" : "#3a3528" }}>
          🏅 Achievements & Badges
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 px-3 py-4 sm:flex sm:flex-wrap sm:justify-center sm:gap-8 sm:px-5">
        {badgeEntries.map(({ courseId, courseName, badge, completed }) => (
          <div
            key={courseId}
            className="flex w-full min-w-0 flex-col items-center sm:w-56"
          >
            <p
              className="mb-1.5 flex min-h-[2.5rem] items-end justify-center px-0.5 text-center text-xs font-bold leading-tight sm:mb-2 sm:min-h-[2.5rem] sm:text-sm"
              style={{
                color: completed
                  ? isDarkMode
                    ? "#e6e4dc"
                    : "#3a3528"
                  : isDarkMode
                    ? "#6b6860"
                    : "#a09890",
              }}
            >
              {courseName}
            </p>

            <div className="flex aspect-square w-full max-w-[8.75rem] shrink-0 items-center justify-center overflow-hidden sm:h-56 sm:w-56 sm:max-w-none">
              <img
                src={badge.image}
                alt={badge.name}
                draggable={false}
                className={`max-h-full max-w-full object-contain object-center transition-transform duration-300 ${
                  completed ? "sm:hover:scale-105" : "grayscale opacity-60"
                }`}
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    parent.style.fontSize = "2rem";
                    parent.textContent = badge.emoji;
                  }
                }}
              />
            </div>

            <p
              className="mt-1.5 text-center text-[11px] font-medium leading-none sm:mt-2 sm:text-xs"
              style={{ color: isDarkMode ? "#6b6860" : "#a09890" }}
            >
              {completed ? (
                <span
                  className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold leading-none sm:px-3 sm:py-1 sm:text-xs"
                  style={{ background: "#8a8a45", color: "#fff" }}
                >
                  Completed ✓
                </span>
              ) : (
                "Not completed"
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
