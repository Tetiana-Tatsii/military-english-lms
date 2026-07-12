"use client";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import CourseLessonMobileBar from "@/components/courses/lesson-page/CourseLessonMobileBar";
import { CourseLessonSidebarStyles } from "@/components/courses/lesson-page/CourseLessonSidebarStyles";
import CourseLessonSidebar from "@/components/courses/lesson-page/CourseLessonSidebar";
import CourseLessonMainContent from "@/components/courses/lesson-page/CourseLessonMainContent";
import { useCourseLessonPage } from "@/components/courses/lesson-page/useCourseLessonPage";

export default function CoursePage() {
  const page = useCourseLessonPage();

  if (!page.isReady) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: page.isDarkMode ? "#2d2f2a" : "#faf9f6",
          color: "#8a8a45",
          fontWeight: 600,
        }}
      >
        Завантаження курсу...
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        background: page.isDarkMode ? "#2d2f2a" : "#faf9f6",
        color: page.isDarkMode ? "rgb(250, 249, 246)" : "#4a4a4a",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <DashboardHeader
        userName={page.user.name}
        isProfileOpen={page.isProfileOpen}
        isDarkMode={page.isDarkMode}
        onProfileToggle={() => page.setIsProfileOpen(!page.isProfileOpen)}
        onDarkModeToggle={() => page.setIsDarkMode(!page.isDarkMode)}
        onLogout={page.logout}
      />

      <CourseLessonMobileBar
        isDarkMode={page.isDarkMode}
        onOpenSidebar={() => page.setIsSidebarOpen(true)}
        onBackToDashboard={() => page.router.push("/dashboard")}
      />

      <div className="flex flex-1 overflow-hidden">
        <CourseLessonSidebarStyles />

        {page.isSidebarOpen && (
          <div
            onClick={() => page.setIsSidebarOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              zIndex: 40,
            }}
            className="xl:hidden"
          />
        )}

        <CourseLessonSidebar
          course={page.course}
          user={page.user}
          answers={page.answers}
          activeLessonId={page.activeLessonId}
          isDarkMode={page.isDarkMode}
          isSidebarOpen={page.isSidebarOpen}
          onCloseSidebar={() => page.setIsSidebarOpen(false)}
          onBackToDashboard={() => page.router.push("/dashboard")}
          onSelectLesson={page.selectLesson}
        />

        <div
          className="flex-1 min-w-0 overflow-y-auto"
          style={{
            padding: "20px 16px",
            background: page.isDarkMode ? "#2d2f2a" : "#fff",
          }}
        >
          <CourseLessonMainContent
            activeLesson={page.activeLesson}
            isDarkMode={page.isDarkMode}
            flippedCards={page.flippedCards}
            playAudio={page.playAudio}
            toggleCard={page.toggleCard}
            quizAnswers={page.quizAnswers}
            quizSubmitted={page.quizSubmitted}
            quizScore={page.quizScore}
            handleQuizAnswerChange={page.handleQuizAnswerChange}
            handleQuizSubmit={page.handleQuizSubmit}
            existingAnswer={page.existingAnswer}
            homeworkText={page.homeworkText}
            setHomeworkText={page.setHomeworkText}
            isSubmitted={page.isSubmitted}
            isSubmitting={page.isSubmitting}
            audioResetKey={page.audioResetKey}
            setAudioBlob={page.setAudioBlob}
            attachedFiles={page.attachedFiles}
            handleFileChange={page.handleFileChange}
            handleRemoveFile={page.handleRemoveFile}
            handleSendHomework={page.handleSendHomework}
          />
        </div>
      </div>
    </div>
  );
}
