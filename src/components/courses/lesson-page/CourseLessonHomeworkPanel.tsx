"use client";

import {
  CheckCircle,
  Clock,
  ClipboardList,
  FileText,
  Headphones,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import LessonCollapsibleSection from "@/components/courses/LessonCollapsibleSection";
import VoiceHomeworkRecorder from "@/components/courses/VoiceHomeworkRecorder";
import { isUrlUnplayableOnIOS } from "@/lib/voiceRecording";
import type { Answer, Lesson } from "@/types";

interface CourseLessonHomeworkPanelProps {
  lesson: Lesson;
  isDarkMode: boolean;
  existingAnswer?: Answer;
  homeworkText: string;
  onHomeworkTextChange: (text: string) => void;
  isSubmitted: boolean;
  isSubmitting: boolean;
  audioResetKey: number;
  onAudioChange: (blob: Blob | null) => void;
  attachedFiles: File[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onSendHomework: () => void;
}

export default function CourseLessonHomeworkPanel({
  lesson,
  isDarkMode,
  existingAnswer,
  homeworkText,
  onHomeworkTextChange,
  isSubmitted,
  isSubmitting,
  audioResetKey,
  onAudioChange,
  attachedFiles,
  onFileChange,
  onRemoveFile,
  onSendHomework,
}: CourseLessonHomeworkPanelProps) {
  return (
    <>
      {lesson.homeworkInstruction && (
        <LessonCollapsibleSection
          title="Інструкція до домашнього завдання"
          icon={<ClipboardList size={22} />}
          defaultOpen
          headerColor={isDarkMode ? "#dcfce7" : "#c97a4a"}
          borderColor="#facbce"
          background={isDarkMode ? "#2d2f2a" : "#fdf8f5"}
          isDarkMode={isDarkMode}
        >
          <div
            style={{
              fontSize: 16,
              lineHeight: 1.8,
              color: isDarkMode ? "rgb(250, 249, 246)" : "#4a4a4a",
              whiteSpace: "pre-wrap",
              wordBreak: "normal",
              overflowWrap: "normal",
            }}
          >
            {lesson.homeworkInstruction}
          </div>
        </LessonCollapsibleSection>
      )}

      {existingAnswer ? (
        <div style={{ marginBottom: 60 }}>
          <div
            style={{
              background: isDarkMode ? "#2d2f2a" : "#f0ede5",
              padding: 32,
              borderRadius: 12,
              border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
              textAlign: "center",
            }}
          >
            <CheckCircle
              size={48}
              color="#8a8a45"
              style={{ marginBottom: 16 }}
            />
            <h3
              style={{
                margin: "0 0 12px",
                color: isDarkMode ? "rgb(250, 249, 246)" : "#3a3528",
                fontSize: 20,
              }}
            >
              ДЗ здано
            </h3>
            <p
              style={{
                margin: 0,
                color: isDarkMode ? "#9a8f70" : "#5c574a",
                fontSize: 15,
              }}
            >
              {existingAnswer.status === "reviewed"
                ? `Перевірено. Оцінка: ${existingAnswer.score || 0}/100`
                : "Очікуйте на перевірку або перегляньте фідбек нижче"}
            </p>
          </div>

          <div
            style={{
              background: isDarkMode ? "#2d2f2a" : "#fff",
              padding: 20,
              borderRadius: 8,
              border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
              marginTop: 24,
            }}
          >
            <p
              style={{
                margin: "0 0 12px",
                color:
                  existingAnswer.status === "reviewed" ? "#8a8a45" : "#c97a4a",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {existingAnswer.status === "reviewed" ? (
                <CheckCircle size={18} />
              ) : (
                <Clock size={18} />
              )}
              {existingAnswer.status === "reviewed"
                ? `Перевірено. Оцінка: ${existingAnswer.score || 0}/100`
                : "Остання відповідь очікує перевірки"}
            </p>
            <p
              style={{
                margin: 0,
                fontStyle: "italic",
                color: "#5c574a",
                fontSize: 15,
              }}
            >
              Ваша відповідь: {existingAnswer.text}
            </p>
            {existingAnswer.audioUrl && (
              <div style={{ marginTop: 12 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#7a7568",
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Headphones size={16} /> Голосова відповідь
                </p>
                {isUrlUnplayableOnIOS(existingAnswer.audioUrl) ? (
                  <p
                    style={{
                      margin: 0,
                      padding: "10px 12px",
                      borderRadius: 6,
                      background: isDarkMode
                        ? "rgba(138, 138, 69, 0.15)"
                        : "#eef0df",
                      border: "1px solid #8a8a45",
                      color: isDarkMode ? "#d8cdb4" : "#6b6b3a",
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}
                  >
                    Файл збережено. На iPhone цей формат не відтворюється — це
                    нормально. Викладач прослухає на комп&apos;ютері.
                  </p>
                ) : (
                  <audio
                    controls
                    playsInline
                    preload="metadata"
                    style={{ width: "100%", height: 40 }}
                    src={existingAnswer.audioUrl}
                  >
                    Ваш браузер не підтримує аудіо.
                  </audio>
                )}
              </div>
            )}
            {existingAnswer.teacherFeedbackText && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  background: "#faf9f6",
                  borderRadius: 8,
                  borderLeft: "4px solid #8a8a45",
                }}
              >
                <strong
                  style={{
                    color: "#3a3528",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Відгук викладача:
                </strong>
                <span style={{ color: "#4a4a4a" }}>
                  {existingAnswer.teacherFeedbackText}
                </span>
                {(existingAnswer.coins_awarded_amount ?? 0) > 0 && (
                  <p
                    style={{
                      marginTop: 12,
                      padding: "10px 12px",
                      background: "#eef0df",
                      borderRadius: 6,
                      color: "#8a8a45",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    ☕ Вам надано {existingAnswer.coins_awarded_amount}{" "}
                    кава-коїнів за сумлінне виконання домашнього завдання!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            background: isDarkMode ? "#2d2f2a" : "#f0ede5",
            padding: 32,
            borderRadius: 12,
            border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
            marginBottom: 60,
          }}
        >
          <h3
            style={{
              margin: "0 0 20px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: isDarkMode ? "rgb(250, 249, 246)" : "#3a3528",
              fontSize: 20,
            }}
          >
            <Send size={22} color="#8a8a45" /> Практичне завдання
          </h3>

          <textarea
            value={homeworkText}
            onChange={(e) => onHomeworkTextChange(e.target.value)}
            placeholder="Введіть вашу відповідь, есе або коментар до файлів тут..."
            rows={5}
            style={{
              width: "100%",
              padding: 16,
              borderRadius: 8,
              border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
              marginBottom: 16,
              fontFamily: "inherit",
              fontSize: 15,
              background: isDarkMode ? "#2d2f2a" : "#fff",
              color: isDarkMode ? "rgb(250, 249, 246)" : "#3a3528",
            }}
          />

          <VoiceHomeworkRecorder
            isDarkMode={isDarkMode}
            onAudioChange={onAudioChange}
            resetKey={audioResetKey}
          />

          <div
            style={{
              background: isDarkMode ? "#2d2f2a" : "#fff",
              padding: 16,
              borderRadius: 8,
              border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
              marginBottom: 16,
            }}
          >
            <p
              style={{
                margin: "0 0 12px",
                fontSize: 14,
                fontWeight: 600,
                color: isDarkMode ? "rgb(250, 249, 246)" : "#5c574a",
              }}
            >
              <FileText
                size={16}
                style={{ display: "inline", marginRight: 6 }}
              />
              Прикріпити файли (PDF, Word, фото)
            </p>
            <p
              style={{
                margin: "0 0 12px",
                fontSize: 12,
                color: isDarkMode ? "#a3a198" : "#7a7568",
                lineHeight: 1.4,
              }}
            >
              Фото автоматично стискаються для економії місця, але лишаються
              читабельними.
            </p>
            <input
              type="file"
              id="file-input"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,image/*"
              onChange={onFileChange}
              style={{ display: "none" }}
            />
            <label
              htmlFor="file-input"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                background: "#8a8a45",
                color: "#fff",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#7a7a3d";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#8a8a45";
              }}
            >
              <Paperclip size={16} />
              📎 Обрати файли
            </label>
            {attachedFiles.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p
                  style={{ fontSize: 13, color: "#8a8a45", marginBottom: 8 }}
                >
                  Обрано файлів: {attachedFiles.length}
                </p>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  {attachedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: 12,
                        color: "#5c574a",
                        padding: "4px 8px",
                        background: "#f0ede5",
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 6,
                      }}
                    >
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 6 }}
                      >
                        <FileText size={12} />
                        {file.name}
                        <span style={{ opacity: 0.7 }}>
                          ({Math.max(1, Math.round(file.size / 1024))} КБ)
                        </span>
                      </div>
                      <button
                        onClick={() => onRemoveFile(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#c97a4a",
                          padding: 2,
                          display: "flex",
                          alignItems: "center",
                        }}
                        title="Видалити файл"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <p style={{ margin: 0, fontSize: 12, color: "#9a8f70" }}>
              *Ви можете прикріпити файли та/або записати голосову відповідь
            </p>
            <button
              onClick={onSendHomework}
              disabled={isSubmitted || isSubmitting}
              style={{
                background: isSubmitted
                  ? "#8a8a45"
                  : isSubmitting
                    ? "#c97a4a"
                    : "#3a3528",
                color: "#fff",
                border: "none",
                padding: "12px 24px",
                borderRadius: 8,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "background 0.3s",
              }}
            >
              {isSubmitting
                ? "⏳ Відправлення..."
                : isSubmitted
                  ? "Відправлено!"
                  : "Надіслати на перевірку"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
