"use client";

import type { CourseLessonPageState } from "./useCourseLessonPage";
import CourseLessonTheorySection from "./CourseLessonTheorySection";
import CourseLessonMaterialsSection from "./CourseLessonMaterialsSection";
import CourseLessonQuizPanel from "./CourseLessonQuizPanel";
import CourseLessonHomeworkPanel from "./CourseLessonHomeworkPanel";

type CourseLessonMainContentProps = Pick<
  CourseLessonPageState,
  | "activeLesson"
  | "isDarkMode"
  | "flippedCards"
  | "playAudio"
  | "toggleCard"
  | "quizAnswers"
  | "quizSubmitted"
  | "quizScore"
  | "handleQuizAnswerChange"
  | "handleQuizSubmit"
  | "existingAnswer"
  | "homeworkText"
  | "setHomeworkText"
  | "isSubmitted"
  | "isSubmitting"
  | "audioResetKey"
  | "setAudioBlob"
  | "attachedFiles"
  | "handleFileChange"
  | "handleRemoveFile"
  | "handleSendHomework"
>;

export default function CourseLessonMainContent({
  activeLesson,
  isDarkMode,
  flippedCards,
  playAudio,
  toggleCard,
  quizAnswers,
  quizSubmitted,
  quizScore,
  handleQuizAnswerChange,
  handleQuizSubmit,
  existingAnswer,
  homeworkText,
  setHomeworkText,
  isSubmitted,
  isSubmitting,
  audioResetKey,
  setAudioBlob,
  attachedFiles,
  handleFileChange,
  handleRemoveFile,
  handleSendHomework,
}: CourseLessonMainContentProps) {
  if (!activeLesson) {
    return (
      <div
        style={{
          textAlign: "center",
          color: "#9a8f70",
          marginTop: 100,
          fontSize: 16,
        }}
      >
        Оберіть урок з меню зліва.
      </div>
    );
  }

  return (
    <div
      className="lesson-content-area"
      style={{
        margin: "0 auto",
        animation: "fadeIn 0.4s ease",
      }}
    >
      <CourseLessonTheorySection lesson={activeLesson} isDarkMode={isDarkMode} />
      <CourseLessonMaterialsSection
        lesson={activeLesson}
        isDarkMode={isDarkMode}
        flippedCards={flippedCards}
        onToggleCard={toggleCard}
        onPlayAudio={playAudio}
      />
      <CourseLessonQuizPanel
        lesson={activeLesson}
        isDarkMode={isDarkMode}
        quizAnswers={quizAnswers}
        quizSubmitted={quizSubmitted}
        quizScore={quizScore}
        onAnswerChange={handleQuizAnswerChange}
        onSubmit={handleQuizSubmit}
      />
      <CourseLessonHomeworkPanel
        lesson={activeLesson}
        isDarkMode={isDarkMode}
        existingAnswer={existingAnswer}
        homeworkText={homeworkText}
        onHomeworkTextChange={setHomeworkText}
        isSubmitted={isSubmitted}
        isSubmitting={isSubmitting}
        audioResetKey={audioResetKey}
        onAudioChange={setAudioBlob}
        attachedFiles={attachedFiles}
        onFileChange={handleFileChange}
        onRemoveFile={handleRemoveFile}
        onSendHomework={handleSendHomework}
      />
    </div>
  );
}
