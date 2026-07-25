"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  FileText,
  Target,
  ClipboardList,
  Languages,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";
import type { LessonBlockId } from "@/types";
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
import LessonProgressBar from "./LessonProgressBar";
import LessonStepConfirmModal from "./LessonStepConfirmModal";
import {
  emphasizeObjectiveLabels,
  getBlockEstimatedTime,
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
  | "lessonSteps"
  | "unlockedStepIndex"
  | "currentStepIndex"
  | "lessonStepsCompleted"
  | "filledSteps"
  | "peekNextStepGate"
  | "advanceStep"
  | "handlePrevStep"
  | "progressTheme"
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
  lessonSteps,
  unlockedStepIndex,
  currentStepIndex,
  lessonStepsCompleted,
  filledSteps,
  peekNextStepGate,
  advanceStep,
  handlePrevStep,
  progressTheme,
}: CourseLessonMainContentProps) {
  const [gateMessage, setGateMessage] = useState<string | null>(null);
  const [showReadingSkipModal, setShowReadingSkipModal] = useState(false);

  // Clear gate hint after homework arrives so "Завершити" can succeed.
  useEffect(() => {
    if (existingAnswer || isSubmitted) setGateMessage(null);
  }, [existingAnswer, isSubmitted]);

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

  const renderBlock = (blockId: LessonBlockId) => {
    switch (blockId) {
      case "objectives":
        return lesson.objectives ? (
          <LessonBlockCard
            key={blockId}
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
        ) : null;
      case "missionBrief":
        return lesson.missionBrief ? (
          <LessonBlockCard
            key={blockId}
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
        ) : null;
      case "keyInformation":
        return lesson.content ? (
          <LessonBlockCard
            key={blockId}
            title={LESSON_BLOCKS.keyInformation.title}
            accent={LESSON_BLOCKS.keyInformation.accent}
            icon={<FileText size={20} />}
            estimatedTime={getBlockEstimatedTime(lesson, "keyInformation")}
            isDarkMode={isDarkMode}
          >
            <CourseLessonRichHtml
              html={lesson.content}
              isDarkMode={isDarkMode}
            />
          </LessonBlockCard>
        ) : null;
      case "usefulPhrases":
        return lesson.usefulPhrases ? (
          <LessonBlockCard
            key={blockId}
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
        ) : null;
      case "dialogue":
        return (
          <CourseLessonDialogueSection
            key={blockId}
            lesson={lesson}
            isDarkMode={isDarkMode}
          />
        );
      case "video":
        return (
          <CourseLessonVideoSection
            key={blockId}
            lesson={lesson}
            isDarkMode={isDarkMode}
          />
        );
      case "vocabulary":
        return (
          <CourseLessonMaterialsSection
            key={blockId}
            lesson={lesson}
            isDarkMode={isDarkMode}
            flippedCards={flippedCards}
            onToggleCard={toggleCard}
            onPlayAudio={playAudio}
          />
        );
      case "reading":
        return (
          <CourseLessonReadingSection
            key={blockId}
            lesson={lesson}
            isDarkMode={isDarkMode}
            mode="reading"
            estimatedTime={getBlockEstimatedTime(lesson, "reading")}
          />
        );
      case "readingCheck":
        return (
          <CourseLessonReadingSection
            key={blockId}
            lesson={lesson}
            isDarkMode={isDarkMode}
            mode="readingCheck"
            estimatedTime={getBlockEstimatedTime(lesson, "readingCheck")}
          />
        );
      case "grammarFocus":
        return lesson.grammarContent ? (
          <LessonBlockCard
            key={blockId}
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
        ) : null;
      case "visualReference":
        return (
          <CourseLessonVisualSection
            key={blockId}
            lesson={lesson}
            isDarkMode={isDarkMode}
          />
        );
      case "additionalResources":
        return (
          <CourseLessonResourcesSection
            key={blockId}
            lesson={lesson}
            isDarkMode={isDarkMode}
          />
        );
      case "interactiveQuiz":
        return (
          <CourseLessonQuizPanel
            key={blockId}
            lesson={lesson}
            isDarkMode={isDarkMode}
            quizAnswers={quizAnswers}
            quizSubmitted={quizSubmitted}
            quizScore={quizScore}
            onAnswerChange={handleQuizAnswerChange}
            onSubmit={handleQuizSubmit}
          />
        );
      case "speakingTask":
        return (
          <CourseLessonHomeworkPanel
            key={blockId}
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
        );
      case "canDoChecklist":
        return (
          <CourseLessonCanDoSection
            key={blockId}
            lesson={lesson}
            isDarkMode={isDarkMode}
          />
        );
      default:
        return null;
    }
  };

  const visibleSteps = lessonSteps.slice(0, unlockedStepIndex + 1);
  const isLastStep = currentStepIndex >= lessonSteps.length - 1;
  const canGoBack = currentStepIndex > 0;
  const showNav = lessonSteps.length > 0;

  const handleNextClick = () => {
    const gate = peekNextStepGate();
    if (gate.type === "soft-reading-check") {
      setShowReadingSkipModal(true);
      return;
    }
    if (gate.type === "hard-quiz") {
      setGateMessage(
        "Спочатку пройдіть Interactive Quiz — після цього відкриється Speaking Task.",
      );
      return;
    }
    if (gate.type === "hard-homework") {
      setGateMessage(
        "Щоб завершити урок, спочатку надішліть домашнє завдання на перевірку.",
      );
      return;
    }
    setGateMessage(null);
    advanceStep();
  };

  return (
    <div
      className="lesson-content-area"
      style={{
        margin: "0 auto",
        animation: "fadeIn 0.4s ease",
      }}
    >
      <LessonProgressBar
        totalSteps={lessonSteps.length}
        filledSteps={filledSteps}
        currentStep={currentStepIndex}
        theme={progressTheme}
        isDarkMode={isDarkMode}
        completed={lessonStepsCompleted}
      />

      <CourseLessonTheorySection lesson={lesson} isDarkMode={isDarkMode} />

      {visibleSteps.map((step, index) => (
        <div
          key={step.id}
          id={`lesson-step-${index}`}
          style={{
            scrollMarginTop: 96,
            outline:
              index === currentStepIndex
                ? isDarkMode
                  ? "1px solid #5a5c48"
                  : "1px solid #d8cdb4"
                : "none",
            outlineOffset: 4,
            borderRadius: 12,
          }}
        >
          {step.blocks.map((blockId) => renderBlock(blockId))}
        </div>
      ))}

      {showNav && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            margin: "8px 0 40px",
          }}
        >
          {gateMessage && (
            <p
              style={{
                margin: 0,
                maxWidth: 420,
                textAlign: "center",
                fontSize: 13,
                fontWeight: 600,
                lineHeight: 1.5,
                color: "#c97a4a",
                padding: "10px 14px",
                borderRadius: 8,
                background: isDarkMode
                  ? "rgba(201, 122, 74, 0.12)"
                  : "#fdf8f5",
                border: "1px solid #facbce",
              }}
            >
              {gateMessage}
            </p>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={!canGoBack}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "transparent",
                color: canGoBack
                  ? isDarkMode
                    ? "#e6e4dc"
                    : "#3a3528"
                  : isDarkMode
                    ? "#5a584e"
                    : "#c5c0b0",
                border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
                padding: "14px 22px",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 15,
                cursor: canGoBack ? "pointer" : "not-allowed",
              }}
            >
              <ChevronLeft size={18} /> Назад
            </button>

            {!lessonStepsCompleted ? (
              <button
                type="button"
                onClick={handleNextClick}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#8a8a45",
                  color: "#fff",
                  border: "none",
                  padding: "14px 28px",
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(138, 138, 69, 0.25)",
                }}
              >
                {isLastStep ? (
                  <>
                    Завершити урок <Check size={18} />
                  </>
                ) : (
                  <>
                    Далі <ChevronRight size={18} />
                  </>
                )}
              </button>
            ) : null}
          </div>
        </div>
      )}

      {lessonStepsCompleted && (
        <p
          style={{
            textAlign: "center",
            margin: "0 0 40px",
            fontSize: 14,
            fontWeight: 600,
            color: isDarkMode ? "#a3a198" : "#7a7568",
          }}
        >
          Ви пройшли всі кроки цього уроку.
        </p>
      )}

      {lessonSteps.length === 0 && (
        <p
          style={{
            textAlign: "center",
            marginTop: 48,
            color: "#9a8f70",
            fontSize: 15,
          }}
        >
          У цьому уроці ще немає видимого контенту.
        </p>
      )}

      {showReadingSkipModal && (
        <LessonStepConfirmModal
          isDarkMode={isDarkMode}
          title="Reading Check"
          message="Ви ще не пройшли Reading Check. Впевнені, що хочете пропустити цей крок?"
          cancelLabel="Скасувати"
          confirmLabel="Пропустити"
          onCancel={() => setShowReadingSkipModal(false)}
          onConfirm={() => {
            setShowReadingSkipModal(false);
            setGateMessage(null);
            advanceStep();
          }}
        />
      )}
    </div>
  );
}
