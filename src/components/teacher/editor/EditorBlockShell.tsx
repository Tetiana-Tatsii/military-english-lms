"use client";

import type { ReactNode } from "react";
import { Clock, Eye, EyeOff } from "lucide-react";
import type { LessonBlockId } from "@/types";
import { LESSON_BLOCKS } from "@/lib/lessonBlocks";

interface EditorBlockShellProps {
  blockId: LessonBlockId;
  icon: ReactNode;
  estimatedTime?: string;
  hidden?: boolean;
  isDarkMode: boolean;
  onEstimatedTimeChange: (value: string) => void;
  onHiddenChange: (hidden: boolean) => void;
  children: ReactNode;
}

export default function EditorBlockShell({
  blockId,
  icon,
  estimatedTime = "",
  hidden = false,
  isDarkMode,
  onEstimatedTimeChange,
  onHiddenChange,
  children,
}: EditorBlockShellProps) {
  const def = LESSON_BLOCKS[blockId];

  return (
    <section
      className="lesson-editor-section"
      style={{
        background: isDarkMode ? "#2a2c27" : "#faf9f6",
        padding: 24,
        borderRadius: 12,
        border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
        borderLeft: `4px solid ${def.accent}`,
        opacity: hidden ? 0.72 : 1,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: def.accent,
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            {icon}
            {def.title}
          </div>
          {def.editorHint ? (
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 12,
                color: isDarkMode ? "#a3a198" : "#7a7568",
                lineHeight: 1.4,
              }}
            >
              {def.editorHint}
            </p>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: isDarkMode ? "#a3a198" : "#7a7568",
            }}
          >
            <Clock size={14} />
            <input
              value={estimatedTime}
              onChange={(e) => onEstimatedTimeChange(e.target.value)}
              placeholder="напр. 5 min"
              style={{
                width: 96,
                padding: "6px 8px",
                borderRadius: 6,
                border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
                background: isDarkMode ? "#2d2f2a" : "#fff",
                color: isDarkMode ? "#e6e4dc" : "#3a3528",
                fontSize: 12,
              }}
            />
          </label>

          <button
            type="button"
            onClick={() => onHiddenChange(!hidden)}
            title={
              hidden
                ? "Блок приховано від курсанта"
                : "Блок видимий (якщо заповнений)"
            }
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              borderRadius: 6,
              border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
              background: hidden
                ? isDarkMode
                  ? "#3e403a"
                  : "#e9e1cd"
                : isDarkMode
                  ? "#2d2f2a"
                  : "#fff",
              color: hidden ? "#c97a4a" : def.accent,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
            {hidden ? "Hidden" : "Visible"}
          </button>
        </div>
      </div>

      {children}
    </section>
  );
}
