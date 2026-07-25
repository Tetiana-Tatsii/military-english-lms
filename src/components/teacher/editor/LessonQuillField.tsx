"use client";

import dynamic from "next/dynamic";
import { quillModules } from "./utils";
import { isEmptyRichText } from "@/lib/lessonBlocks";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface LessonQuillFieldProps {
  value?: string;
  onChange: (value: string) => void;
  heightClass: string;
  isDarkMode: boolean;
}

function normalizeEmpty(value?: string): string {
  if (!value || isEmptyRichText(value)) return "";
  return value;
}

export default function LessonQuillField({
  value,
  onChange,
  heightClass,
  isDarkMode,
}: LessonQuillFieldProps) {
  return (
    <div
      className={`editor-quill ${heightClass} ${isDarkMode ? "dark-quill" : ""}`}
    >
      <ReactQuill
        theme="snow"
        modules={quillModules}
        value={value || ""}
        onChange={(next) => {
          // Quill often fires on mount / remount with equivalent empty HTML.
          // Skip no-op updates to avoid setState loops.
          if (normalizeEmpty(next) === normalizeEmpty(value)) return;
          if (next === (value || "")) return;
          onChange(next);
        }}
      />
    </div>
  );
}
