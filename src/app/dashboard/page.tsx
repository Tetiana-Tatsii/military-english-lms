"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../../context/AppContext";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import CourseList from "../../components/dashboard/CourseList";
import ProfileStats from "../../components/dashboard/ProfileStats";
import InstructorCard from "../../components/dashboard/InstructorCard";
import InstructorSpeechBubble from "../../components/dashboard/InstructorSpeechBubble";
import Voentorg from "../../components/dashboard/Voentorg";
import Achievements from "../../components/dashboard/Achievements";
import { DEFAULT_GAMIFICATION_PROFILE } from "@/lib/gamification";
import { getInstructorSpeechMessage } from "@/lib/instructorQuotes";

export default function DashboardPage() {
  const { user, courses, answers, logout, isInitialized, gamification, instructorMood, buyShopItem, refreshGamification } = useAppContext();
  const router = useRouter();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showPxStore, setShowPxStore] = useState(false);
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

  const myAnswers = user
    ? answers.filter((a) => a.studentName === user.name)
    : [];

  useEffect(() => {
    if (!user?.id) return;
    const totalAwarded = myAnswers.reduce(
      (sum, a) => sum + (a.coins_awarded_amount ?? 0),
      0,
    );
    if (totalAwarded > 0) {
      refreshGamification();
    }
  }, [myAnswers, refreshGamification, user?.id]);

  if (!isInitialized || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0e9d8] text-[#8a8a45] font-semibold text-lg">
        Завантаження платформи...
      </div>
    );
  }

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

  const activeGamification = gamification ?? DEFAULT_GAMIFICATION_PROFILE;
  const instructorSpeech = getInstructorSpeechMessage(
    instructorMood,
    activeGamification.activeInstructorItem,
  );
  const speechVariant =
    instructorMood === "angry"
      ? "angry"
      : instructorMood === "proud"
        ? "proud"
        : "item";

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
      <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-6">

        {/* Заголовок над усією сіткою — обидві колонки стартують на одному рівні */}
        <h2
          className="text-lg font-semibold leading-none mb-4"
          style={{ color: isDarkMode ? "#e6e4dc" : "#3a3528" }}
        >
          Available courses
        </h2>

        <div className="grid grid-cols-1 gap-6 items-start xl:grid-cols-[1fr_300px]">

        {/* ЛІВА КОЛОНКА */}
        <div className="flex flex-col gap-6 overflow-visible">
          <CourseList
            courses={courses}
            answers={myAnswers}
            userId={user.id}
            studentName={user.name}
            getCourseProgress={getCourseProgress}
            getLessonTitle={getLessonTitle}
            onCourseClick={(courseId) => router.push(`/courses/${courseId}`)}
            isDarkMode={isDarkMode}
          />

          {/* Offset right + gap above card so bubble clears the instructor head on mobile */}
          {instructorSpeech && (
            <div className="relative z-20 pl-[132px] sm:pl-[140px] md:pl-[150px] lg:pl-[180px] mb-3 sm:mb-2">
              <InstructorSpeechBubble
                message={instructorSpeech}
                variant={speechVariant}
                isDarkMode={isDarkMode}
                className="w-full max-w-xl"
              />
            </div>
          )}

          <div className="relative z-10 overflow-visible mt-1 sm:mt-0">
            <InstructorCard
              gamification={activeGamification}
              mood={instructorMood}
              isDarkMode={isDarkMode}
              isPxStoreOpen={showPxStore}
              onPxStoreToggle={() => setShowPxStore((v) => !v)}
            />
          </div>

          {showPxStore && (
            <Voentorg
              gamification={activeGamification}
              isDarkMode={isDarkMode}
              onBuy={buyShopItem}
              defaultOpen={true}
            />
          )}

          {/* Mobile/tablet: SLP before Achievements */}
          <div className="xl:hidden">
            <ProfileStats isDarkMode={isDarkMode} />
          </div>

          <Achievements
            gamification={activeGamification}
            courses={courses}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Desktop: SLP in right column */}
        <div className="hidden xl:flex flex-col gap-6">
          <ProfileStats isDarkMode={isDarkMode} />
        </div>

        </div>{/* end grid */}
      </div>{/* end max-w container */}
    </div>
  );
}
