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

  // Only show badges for courses that exist in the system
  const badgeEntries = courses
    .map((course) => ({
      courseId: course.id,
      courseName: course.title,
      badge: COURSE_BADGES[course.id],
      completed: completedCourses.includes(course.id),
    }))
    .filter((entry) => entry.badge); // only courses that have a defined badge

  if (badgeEntries.length === 0) return null;

  return (
    <div
      className="rounded-xl border"
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
          🏅 Досягнення та Коїни
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
        {badgeEntries.map(({ courseId, courseName, badge, completed }) => (
          <div
            key={courseId}
            className="flex flex-col items-center gap-2 text-center"
          >
            {/* Badge image */}
            <div
              className="relative flex items-center justify-center overflow-hidden rounded-full"
              style={{
                width: 80,
                height: 80,
                background: completed
                  ? (isDarkMode ? "#2a3020" : "#eef0df")
                  : (isDarkMode ? "#252622" : "#e8e4db"),
                border: completed
                  ? "3px solid #8a8a45"
                  : (isDarkMode ? "3px solid #3e403a" : "3px solid #d0ccbf"),
                filter: completed ? "none" : "grayscale(100%)",
                opacity: completed ? 1 : 0.45,
              }}
            >
              <img
                src={badge.image}
                alt={badge.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    parent.style.fontSize = "36px";
                    parent.textContent = badge.emoji;
                  }
                }}
              />
              {/* Lock overlay */}
              {!completed && (
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-full text-2xl"
                  style={{ background: "rgba(0,0,0,0.35)" }}
                >
                  🔒
                </div>
              )}
            </div>

            <p
              className="text-xs font-bold leading-tight"
              style={{
                color: completed
                  ? (isDarkMode ? "#e6e4dc" : "#3a3528")
                  : (isDarkMode ? "#6b6860" : "#a09890"),
              }}
            >
              {courseName.length > 20 ? courseName.slice(0, 18) + "…" : courseName}
            </p>

            {completed ? (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-bold"
                style={{ background: "#8a8a45", color: "#fff" }}
              >
                Завершено ✓
              </span>
            ) : (
              <span
                className="text-xs"
                style={{ color: isDarkMode ? "#6b6860" : "#a09890" }}
              >
                Не завершено
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
