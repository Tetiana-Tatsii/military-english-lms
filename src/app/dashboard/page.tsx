"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../../context/AppContext";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import CourseList from "../../components/dashboard/CourseList";
import ProfileStats from "../../components/dashboard/ProfileStats";

export default function DashboardPage() {
  const { user, courses, answers, logout, isInitialized } = useAppContext();
  const router = useRouter();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("darkMode");
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Зберігаємо стан темної теми в localStorage
  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    if (isInitialized) {
      if (!user) {
        router.push("/login");
      } else if (user.role === "teacher" || user.role === "admin") {
        router.push("/teacher");
      }
    }
  }, [user, router, isInitialized]);

  if (!isInitialized || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0e9d8] text-[#8a8a45] font-semibold text-lg">
        Завантаження платформи...
      </div>
    );
  }

  const myAnswers = answers.filter((a) => a.studentName === user.name);

  const getCourseProgress = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return 0;

    let totalLessons = 0;
    course.modules.forEach((m) => {
      totalLessons += m.lessons.length;
    });
    if (totalLessons === 0) return 0;

    const submittedLessonIds = new Set(
      myAnswers.filter((a) => a.courseId === courseId).map((a) => a.lessonId),
    );
    return Math.round((submittedLessonIds.size / totalLessons) * 100);
  };

  const getLessonTitle = (courseId: string, lessonId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return "Невідомий урок";
    for (const mod of course.modules) {
      const lesson = mod.lessons.find((l) => l.id === lessonId);
      if (lesson) return lesson.title;
    }
    return "Невідомий урок";
  };

  return (
    <div
      className={`min-h-screen font-sans transition-all ${
        isDarkMode ? "bg-[#1c1d1a] text-[#e6e4dc]" : "bg-[#f0e9d8] text-[#3a3528]"
      }`}
    >
      <DashboardHeader
        userName={user.name}
        isProfileOpen={isProfileOpen}
        isDarkMode={isDarkMode}
        onProfileToggle={() => setIsProfileOpen(!isProfileOpen)}
        onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
        onLogout={() => {
          logout();
          router.push("/login");
        }}
      />

      {/* ОСНОВНИЙ КОНТЕНТ */}
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-8 px-4 py-8 items-start xl:grid-cols-[1fr_320px] md:px-6">
        <div>
          <CourseList
            courses={courses}
            answers={myAnswers}
            getCourseProgress={getCourseProgress}
            getLessonTitle={getLessonTitle}
            onCourseClick={(courseId) => router.push(`/courses/${courseId}`)}
            isDarkMode={isDarkMode}
          />
        </div>

        <div>
          <ProfileStats isDarkMode={isDarkMode} />
        </div>
      </div>
    </div>
  );
}
