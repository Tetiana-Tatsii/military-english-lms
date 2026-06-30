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
        className="px-5 py-4"
        style={{ borderBottom: isDarkMode ? "1px solid #3e403a" : "1px solid #e8e2d4" }}
      >
        <span className="font-bold" style={{ color: isDarkMode ? "#e6e4dc" : "#3a3528" }}>
          🏅 Achievements & Badges
        </span>
      </div>

      <div className="flex justify-center gap-8 px-5 py-4">
        {badgeEntries.map(({ courseId, courseName, badge, completed }) => (
          <div key={courseId} className="w-72 flex flex-col items-center">
            <p
              className="h-10 flex items-end justify-center text-sm font-bold leading-tight text-center mb-1 px-0.5"
              style={{
                color: completed
                  ? (isDarkMode ? "#e6e4dc" : "#3a3528")
                  : (isDarkMode ? "#6b6860" : "#a09890"),
              }}
            >
              {courseName}
            </p>

            <div
              className="w-72 h-72 flex items-center justify-center shrink-0"
              style={{ transform: badge.imageOffsetY ? `translateY(${badge.imageOffsetY}px)` : undefined }}
            >
              <img
                src={badge.image}
                alt={badge.name}
                draggable={false}
                className={`w-full h-full object-contain transition-transform duration-300 ${
                  completed ? "hover:scale-110" : "grayscale opacity-60"
                }`}
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    parent.style.fontSize = "48px";
                    parent.textContent = badge.emoji;
                  }
                }}
              />
            </div>

            <p
              className="text-xs font-medium leading-none text-center mt-1"
              style={{ color: isDarkMode ? "#6b6860" : "#a09890" }}
            >
              {completed ? (
                <span
                  className="inline-block rounded-full px-3 py-1 text-xs font-bold leading-none"
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
