"use client";

import {
  BookOpen,
  FileText,
  Target,
  ClipboardList,
  Languages,
} from "lucide-react";
import type { CourseLessonPageState } from "./useCourseLessonPage";
import CourseLessonTheorySection from "./CourseLessonTheorySection";
import CourseLessonReadingSection from "./CourseLessonReadingSection";
import CourseLessonMaterialsSection from "./CourseLessonMaterialsSection";
import CourseLessonQuizPanel from "./CourseLessonQuizPanel";
import CourseLessonHomeworkPanel from "./CourseLessonHomeworkPanel";
import CourseLessonDialogueSection from "./CourseLessonDialogueSection";
import CourseLessonVideoSection from "./CourseLessonVideoSection";
import CourseLessonVisualSection from "./CourseLessonVisualSection";
import CourseLessonResourcesSection from "./CourseLessonResourcesSection";
import CourseLessonCanDoSection from "./CourseLessonCanDoSection";
import CourseLessonRichHtml from "./CourseLessonRichHtml";
import LessonBlockCard from "./LessonBlockCard";
import {
  emphasizeObjectiveLabels,
  getBlockEstimatedTime,
  isBlockVisibleOnStudent,
  LESSON_BLOCKS,
} from "@/lib/lessonBlocks";

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

  const lesson = activeLesson;
  const show = (id: Parameters<typeof isBlockVisibleOnStudent>[1]) =>
    isBlockVisibleOnStudent(lesson, id);

  return (
    <div
      className="lesson-content-area"
      style={{
        margin: "0 auto",
        animation: "fadeIn 0.4s ease",
      }}
    >
      <CourseLessonTheorySection lesson={lesson} isDarkMode={isDarkMode} />

      {show("objectives") && lesson.objectives && (
        <LessonBlockCard
          title={LESSON_BLOCKS.objectives.title}
          accent={LESSON_BLOCKS.objectives.accent}
          icon={<Target size={20} />}
          estimatedTime={getBlockEstimatedTime(lesson, "objectives")}
          isDarkMode={isDarkMode}
        >
          <CourseLessonRichHtml
            html={lesson.objectives}
            isDarkMode={isDarkMode}
            transform={emphasizeObjectiveLabels}
          />
        </LessonBlockCard>
      )}

      {show("missionBrief") && lesson.missionBrief && (
        <LessonBlockCard
          title={LESSON_BLOCKS.missionBrief.title}
          accent={LESSON_BLOCKS.missionBrief.accent}
          icon={<ClipboardList size={20} />}
          estimatedTime={getBlockEstimatedTime(lesson, "missionBrief")}
          isDarkMode={isDarkMode}
        >
          <CourseLessonRichHtml
            html={lesson.missionBrief}
            isDarkMode={isDarkMode}
          />
        </LessonBlockCard>
      )}

      {show("keyInformation") && lesson.content && (
        <LessonBlockCard
          title={LESSON_BLOCKS.keyInformation.title}
          accent={LESSON_BLOCKS.keyInformation.accent}
          icon={<FileText size={20} />}
          estimatedTime={getBlockEstimatedTime(lesson, "keyInformation")}
          isDarkMode={isDarkMode}
        >
          <CourseLessonRichHtml html={lesson.content} isDarkMode={isDarkMode} />
        </LessonBlockCard>
      )}

      {show("usefulPhrases") && lesson.usefulPhrases && (
        <LessonBlockCard
          title={LESSON_BLOCKS.usefulPhrases.title}
          accent={LESSON_BLOCKS.usefulPhrases.accent}
          icon={<Languages size={20} />}
          estimatedTime={getBlockEstimatedTime(lesson, "usefulPhrases")}
          isDarkMode={isDarkMode}
        >
          <CourseLessonRichHtml
            html={lesson.usefulPhrases}
            isDarkMode={isDarkMode}
          />
        </LessonBlockCard>
      )}

      {show("dialogue") && (
        <CourseLessonDialogueSection
          lesson={lesson}
          isDarkMode={isDarkMode}
        />
      )}

      {show("video") && (
        <CourseLessonVideoSection lesson={lesson} isDarkMode={isDarkMode} />
      )}

      {show("vocabulary") && (
        <CourseLessonMaterialsSection
          lesson={lesson}
          isDarkMode={isDarkMode}
          flippedCards={flippedCards}
          onToggleCard={toggleCard}
          onPlayAudio={playAudio}
        />
      )}

      {show("reading") && (
        <CourseLessonReadingSection
          lesson={lesson}
          isDarkMode={isDarkMode}
          mode="reading"
          estimatedTime={getBlockEstimatedTime(lesson, "reading")}
        />
      )}

      {show("readingCheck") && (
        <CourseLessonReadingSection
          lesson={lesson}
          isDarkMode={isDarkMode}
          mode="readingCheck"
          estimatedTime={getBlockEstimatedTime(lesson, "readingCheck")}
        />
      )}

      {show("grammarFocus") && lesson.grammarContent && (
        <LessonBlockCard
          title={LESSON_BLOCKS.grammarFocus.title}
          accent={LESSON_BLOCKS.grammarFocus.accent}
          icon={<BookOpen size={20} />}
          estimatedTime={getBlockEstimatedTime(lesson, "grammarFocus")}
          isDarkMode={isDarkMode}
          collapsible
        >
          <CourseLessonRichHtml
            html={lesson.grammarContent}
            isDarkMode={isDarkMode}
          />
        </LessonBlockCard>
      )}

      {show("visualReference") && (
        <CourseLessonVisualSection lesson={lesson} isDarkMode={isDarkMode} />
      )}

      {show("additionalResources") && (
        <CourseLessonResourcesSection
          lesson={lesson}
          isDarkMode={isDarkMode}
        />
      )}

      {show("interactiveQuiz") && (
        <CourseLessonQuizPanel
          lesson={lesson}
          isDarkMode={isDarkMode}
          quizAnswers={quizAnswers}
          quizSubmitted={quizSubmitted}
          quizScore={quizScore}
          onAnswerChange={handleQuizAnswerChange}
          onSubmit={handleQuizSubmit}
        />
      )}

      {(show("speakingTask") || Boolean(existingAnswer)) && (
        <CourseLessonHomeworkPanel
          lesson={lesson}
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
      )}

      {show("canDoChecklist") && (
        <CourseLessonCanDoSection lesson={lesson} isDarkMode={isDarkMode} />
      )}
    </div>
  );
}
