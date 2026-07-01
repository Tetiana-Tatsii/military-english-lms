"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface LessonCollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  headerColor?: string;
  borderColor?: string;
  background?: string;
  isDarkMode?: boolean;
}

export default function LessonCollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  children,
  headerColor = "#8a8a45",
  borderColor = "#e0dcd0",
  background = "#faf9f6",
  isDarkMode = false,
}: LessonCollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        background: isDarkMode ? "#2d2f2a" : background,
        borderRadius: 12,
        border: isDarkMode ? "1px solid #3e403a" : `1px solid ${borderColor}`,
        marginBottom: 24,
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "20px 24px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: headerColor,
            fontWeight: 700,
            fontSize: 17,
          }}
        >
          {icon}
          {title}
        </span>
        <ChevronDown
          size={20}
          color={headerColor}
          style={{
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        />
      </button>
      {open && (
        <div
          style={{
            padding: "16px 24px 24px",
            borderTop: isDarkMode ? "1px solid #3e403a" : `1px solid ${borderColor}`,
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
