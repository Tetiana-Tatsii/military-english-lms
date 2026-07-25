"use client";

import {
  Target,
  ClipboardList,
  FileText,
  Languages,
  MessageSquare,
  Headphones,
  BookOpen,
  CheckCircle,
  Image as ImageIcon,
  FolderOpen,
  Mic,
  ListChecks,
  Video,
  Loader2,
  Trash2,
  Plus,
  X,
} from "lucide-react";
import type { Lesson, LessonBlockId, LessonImage } from "@/types";
import { getLessonImages } from "@/lib/lessonBlocks";
import type { EditorTabState } from "./useEditorTab";
import EditorBlockShell from "./EditorBlockShell";
import LessonEditorReadingSection from "./LessonEditorReadingSection";
import LessonEditorQuizletSection from "./LessonEditorQuizletSection";
import LessonEditorQuizSection from "./LessonEditorQuizSection";
import LessonQuillField from "./LessonQuillField";

interface LessonEditorBlocksProps {
  state: EditorTabState;
  isDarkMode: boolean;
}

export default function LessonEditorBlocks({
  state,
  isDarkMode,
}: LessonEditorBlocksProps) {
  const {
    editingLesson,
    setEditingLesson,
    isUploadingPhoto,
    isUploadingAudio,
    isUploadingDocument,
    handleYouTubeChange,
    handleAudioUpload,
    handleRemoveAudio,
    handleDocumentUpload,
    handleRemoveDocument,
    handleAddQuizletCard,
    handleUpdateQuizletCard,
    handleRemoveQuizletCard,
    handleAddImage,
    handleRemoveImage,
    handleUpdateImageCaption,
    patchBlockMeta,
  } = state;

  if (!editingLesson) return null;

  const { lesson } = editingLesson;
  const sectionProps = { editingLesson, setEditingLesson, isDarkMode };

  const patchLesson = (partial: Partial<Lesson>) => {
    setEditingLesson((prev) => {
      if (!prev) return prev;
      const keys = Object.keys(partial) as (keyof Lesson)[];
      const changed = keys.some((key) => prev.lesson[key] !== partial[key]);
      if (!changed) return prev;
      return {
        ...prev,
        lesson: { ...prev.lesson, ...partial },
      };
    });
  };

  const metaControls = (blockId: LessonBlockId) => ({
    estimatedTime: lesson.blockMeta?.[blockId]?.estimatedTime || "",
    hidden: Boolean(lesson.blockMeta?.[blockId]?.hidden),
    onEstimatedTimeChange: (value: string) =>
      patchBlockMeta(blockId, { estimatedTime: value }),
    onHiddenChange: (hidden: boolean) => patchBlockMeta(blockId, { hidden }),
  });

  const quill = (
    value: string | undefined,
    field: keyof Lesson,
    heightClass: string,
  ) => (
    <LessonQuillField
      value={value}
      heightClass={heightClass}
      isDarkMode={isDarkMode}
      onChange={(val) => patchLesson({ [field]: val } as Partial<Lesson>)}
    />
  );

  const inputStyle = {
    width: "100%" as const,
    padding: 10,
    borderRadius: 8,
    border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
    background: isDarkMode ? "#2d2f2a" : "#fff",
    color: isDarkMode ? "rgb(250, 249, 246)" : "#3a3528",
    fontSize: 14,
  };

  const images = getLessonImages(lesson);

  return (
    <div className="lesson-editor-sections">
      <EditorBlockShell
        blockId="objectives"
        icon={<Target size={18} />}
        isDarkMode={isDarkMode}
        {...metaControls("objectives")}
      >
        {quill(lesson.objectives, "objectives", "editor-quill--reading")}
      </EditorBlockShell>

      <EditorBlockShell
        blockId="missionBrief"
        icon={<ClipboardList size={18} />}
        isDarkMode={isDarkMode}
        {...metaControls("missionBrief")}
      >
        {quill(lesson.missionBrief, "missionBrief", "editor-quill--reading")}
      </EditorBlockShell>

      <EditorBlockShell
        blockId="keyInformation"
        icon={<FileText size={18} />}
        isDarkMode={isDarkMode}
        {...metaControls("keyInformation")}
      >
        {quill(lesson.content, "content", "editor-quill--grammar")}
      </EditorBlockShell>

      <EditorBlockShell
        blockId="usefulPhrases"
        icon={<Languages size={18} />}
        isDarkMode={isDarkMode}
        {...metaControls("usefulPhrases")}
      >
        {quill(lesson.usefulPhrases, "usefulPhrases", "editor-quill--reading")}
      </EditorBlockShell>

      <EditorBlockShell
        blockId="dialogue"
        icon={<MessageSquare size={18} />}
        isDarkMode={isDarkMode}
        {...metaControls("dialogue")}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                display: "block",
                marginBottom: 8,
              }}
            >
              Текст діалогу
            </label>
            {quill(lesson.dialogue, "dialogue", "editor-quill--reading")}
          </div>

          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                display: "block",
                marginBottom: 8,
              }}
            >
              Аудіо до діалогу
            </label>
            {lesson.audioUrl ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <audio
                  controls
                  src={lesson.audioUrl}
                  style={{ height: 36, maxWidth: 280 }}
                />
                <button
                  type="button"
                  onClick={handleRemoveAudio}
                  style={{
                    background: "#fdeced",
                    color: "#c97a4a",
                    border: "1px solid #facbce",
                    padding: "6px 12px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  <Trash2 size={14} /> Видалити
                </button>
              </div>
            ) : (
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#8a8a45",
                  color: "#fff",
                  padding: "10px 16px",
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {isUploadingAudio ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Headphones size={16} />
                )}
                Завантажити аудіо
                <input
                  type="file"
                  accept="audio/*"
                  hidden
                  onChange={handleAudioUpload}
                  disabled={isUploadingAudio}
                />
              </label>
            )}
          </div>

          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                display: "block",
                marginBottom: 8,
              }}
            >
              Transcript (опційно)
            </label>
            {quill(
              lesson.listeningTranscript,
              "listeningTranscript",
              "editor-quill--reading",
            )}
          </div>
        </div>
      </EditorBlockShell>

      <EditorBlockShell
        blockId="video"
        icon={<Video size={18} />}
        isDarkMode={isDarkMode}
        {...metaControls("video")}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                display: "block",
                marginBottom: 8,
              }}
            >
              Текст перед відео (опційно)
            </label>
            {quill(lesson.videoIntro, "videoIntro", "editor-quill--reading")}
          </div>

          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                display: "block",
                marginBottom: 8,
              }}
            >
              YouTube посилання
            </label>
            <input
              placeholder="Вставте повне посилання з YouTube..."
              value={lesson.videoLabel || ""}
              onChange={(e) => handleYouTubeChange(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      </EditorBlockShell>

      <EditorBlockShell
        blockId="vocabulary"
        icon={<BookOpen size={18} />}
        isDarkMode={isDarkMode}
        {...metaControls("vocabulary")}
      >
        <LessonEditorQuizletSection
          {...sectionProps}
          handleAddQuizletCard={handleAddQuizletCard}
          handleUpdateQuizletCard={handleUpdateQuizletCard}
          handleRemoveQuizletCard={handleRemoveQuizletCard}
          bare
        />
      </EditorBlockShell>

      <EditorBlockShell
        blockId="reading"
        icon={<BookOpen size={18} />}
        isDarkMode={isDarkMode}
        {...metaControls("reading")}
      >
        <LessonEditorReadingSection
          {...sectionProps}
          mode="reading"
          bare
        />
      </EditorBlockShell>

      <EditorBlockShell
        blockId="readingCheck"
        icon={<CheckCircle size={18} />}
        isDarkMode={isDarkMode}
        {...metaControls("readingCheck")}
      >
        <LessonEditorReadingSection
          {...sectionProps}
          mode="readingCheck"
          bare
        />
      </EditorBlockShell>

      <EditorBlockShell
        blockId="grammarFocus"
        icon={<BookOpen size={18} />}
        isDarkMode={isDarkMode}
        {...metaControls("grammarFocus")}
      >
        {quill(
          lesson.grammarContent,
          "grammarContent",
          "editor-quill--grammar",
        )}
      </EditorBlockShell>

      <EditorBlockShell
        blockId="visualReference"
        icon={<ImageIcon size={18} />}
        isDarkMode={isDarkMode}
        {...metaControls("visualReference")}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {images.map((img: LessonImage) => (
            <div
              key={img.id}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                padding: 12,
                borderRadius: 8,
                border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
                background: isDarkMode ? "#2d2f2a" : "#fff",
              }}
            >
              <img
                src={img.url}
                alt=""
                style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 6 }}
              />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  placeholder="Підпис (опційно)"
                  value={img.caption || ""}
                  onChange={(e) =>
                    handleUpdateImageCaption(img.id, e.target.value)
                  }
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(img.id)}
                  style={{
                    alignSelf: "flex-start",
                    background: "#fdeced",
                    color: "#c97a4a",
                    border: "1px solid #facbce",
                    padding: "6px 12px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 13,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Trash2 size={14} /> Видалити
                </button>
              </div>
            </div>
          ))}

          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#8a8a45",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              alignSelf: "flex-start",
            }}
          >
            {isUploadingPhoto ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            Додати зображення
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleAddImage}
              disabled={isUploadingPhoto}
            />
          </label>
        </div>
      </EditorBlockShell>

      <EditorBlockShell
        blockId="additionalResources"
        icon={<FolderOpen size={18} />}
        isDarkMode={isDarkMode}
        {...metaControls("additionalResources")}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {(lesson.documents || []).map((doc) => (
            <div
              key={doc.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: 12,
                borderRadius: 8,
                border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600 }}>{doc.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveDocument(doc.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#c97a4a",
                }}
              >
                <X size={16} />
              </button>
            </div>
          ))}

          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#8a8a45",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              alignSelf: "flex-start",
            }}
          >
            {isUploadingDocument ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            Завантажити файл (PDF, Word, PPT, Excel…)
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
              hidden
              onChange={handleDocumentUpload}
              disabled={isUploadingDocument}
            />
          </label>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
              Зовнішні посилання
            </label>
            {(lesson.resourceLinks || []).map((link, index) => (
              <div
                key={link.id}
                style={{ display: "flex", gap: 8, marginBottom: 8 }}
              >
                <input
                  placeholder="Назва"
                  value={link.label}
                  onChange={(e) => {
                    const next = [...(lesson.resourceLinks || [])];
                    next[index] = { ...link, label: e.target.value };
                    patchLesson({ resourceLinks: next });
                  }}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <input
                  placeholder="https://..."
                  value={link.url}
                  onChange={(e) => {
                    const next = [...(lesson.resourceLinks || [])];
                    next[index] = { ...link, url: e.target.value };
                    patchLesson({ resourceLinks: next });
                  }}
                  style={{ ...inputStyle, flex: 2 }}
                />
                <button
                  type="button"
                  onClick={() =>
                    patchLesson({
                      resourceLinks: (lesson.resourceLinks || []).filter(
                        (l) => l.id !== link.id,
                      ),
                    })
                  }
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#c97a4a",
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                patchLesson({
                  resourceLinks: [
                    ...(lesson.resourceLinks || []),
                    {
                      id: `link-${Date.now()}`,
                      label: "",
                      url: "",
                    },
                  ],
                })
              }
              style={{
                background: "transparent",
                border: "1px dashed #8a8a45",
                color: "#8a8a45",
                padding: "8px 12px",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              + Додати посилання
            </button>
          </div>
        </div>
      </EditorBlockShell>

      <EditorBlockShell
        blockId="interactiveQuiz"
        icon={<CheckCircle size={18} />}
        isDarkMode={isDarkMode}
        {...metaControls("interactiveQuiz")}
      >
        <LessonEditorQuizSection {...sectionProps} bare />
      </EditorBlockShell>

      <EditorBlockShell
        blockId="speakingTask"
        icon={<Mic size={18} />}
        isDarkMode={isDarkMode}
        {...metaControls("speakingTask")}
      >
        {quill(
          lesson.homeworkInstruction,
          "homeworkInstruction",
          "editor-quill--grammar",
        )}
      </EditorBlockShell>

      <EditorBlockShell
        blockId="canDoChecklist"
        icon={<ListChecks size={18} />}
        isDarkMode={isDarkMode}
        {...metaControls("canDoChecklist")}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(lesson.canDoItems || []).map((item, index) => (
            <div key={index} style={{ display: "flex", gap: 8 }}>
              <input
                value={item}
                onChange={(e) => {
                  const next = [...(lesson.canDoItems || [])];
                  next[index] = e.target.value;
                  patchLesson({ canDoItems: next });
                }}
                placeholder="I can…"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() =>
                  patchLesson({
                    canDoItems: (lesson.canDoItems || []).filter(
                      (_, i) => i !== index,
                    ),
                  })
                }
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#c97a4a",
                }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              patchLesson({
                canDoItems: [...(lesson.canDoItems || []), ""],
              })
            }
            style={{
              alignSelf: "flex-start",
              background: "transparent",
              border: "1px dashed #8a8a45",
              color: "#8a8a45",
              padding: "8px 12px",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            + Додати пункт
          </button>
        </div>
      </EditorBlockShell>
    </div>
  );
}
