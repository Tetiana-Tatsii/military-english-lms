"use client";

import dynamic from "next/dynamic";
import { BookOpen, FileText, ClipboardList } from "lucide-react";
import { quillModules } from "./utils";
import type { LessonEditorSectionProps } from "./types";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export default function LessonEditorContentSection({
  editingLesson,
  setEditingLesson,
  isDarkMode,
}: LessonEditorSectionProps) {
  const { lesson } = editingLesson;

  return (
    <>
      <div className="lesson-editor-section">
        <label
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#8a8a45",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FileText size={18} /> Основний текст / Reading
        </label>
        <div
          className={`editor-quill editor-quill--reading ${isDarkMode ? "dark-quill" : ""}`}
        >
          <ReactQuill
            theme="snow"
            modules={quillModules}
            value={lesson.content}
            onChange={(val: string) =>
              setEditingLesson({
                ...editingLesson,
                lesson: { ...lesson, content: val },
              })
            }
          />
        </div>
      </div>

      <div className="lesson-editor-section">
        <label
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#c97a4a",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <BookOpen size={18} /> Граматичний довідник
        </label>
        <div
          className={`editor-quill editor-quill--grammar ${isDarkMode ? "dark-quill" : ""}`}
        >
          <ReactQuill
            theme="snow"
            modules={quillModules}
            value={lesson.grammarContent || ""}
            onChange={(val: string) =>
              setEditingLesson({
                ...editingLesson,
                lesson: { ...lesson, grammarContent: val },
              })
            }
          />
        </div>
      </div>

      <div
        style={{
          background: isDarkMode ? "#2a2c27" : "#faf9f6",
          padding: 24,
          borderRadius: 12,
          border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
        }}
      >
        <label
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#8a8a45",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <ClipboardList size={18} /> Інструкція до домашнього завдання
        </label>
        <textarea
          value={lesson.homeworkInstruction || ""}
          onChange={(e) =>
            setEditingLesson({
              ...editingLesson,
              lesson: { ...lesson, homeworkInstruction: e.target.value },
            })
          }
          placeholder="Опишіть детально, що курсант має зробити в рамках домашнього завдання..."
          style={{
            width: "100%",
            minHeight: 120,
            padding: 12,
            borderRadius: 8,
            border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
            fontSize: 14,
            lineHeight: 1.6,
            resize: "vertical",
            background: isDarkMode ? "#2d2f2a" : "#fff",
            color: isDarkMode ? "rgb(250, 249, 246)" : "#3a3528",
          }}
        />
      </div>
    </>
  );
}
