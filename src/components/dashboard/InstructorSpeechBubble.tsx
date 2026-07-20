"use client";

import React from "react";

type BubbleVariant = "happy" | "angry" | "proud" | "item";

interface InstructorSpeechBubbleProps {
  message: string;
  variant: BubbleVariant;
  isDarkMode: boolean;
  className?: string;
}

const VARIANT_STYLES: Record<BubbleVariant, { border: string; bg: string; bgDark: string }> = {
  happy: { border: "#8a8a45", bg: "#fffef8", bgDark: "#2a3020" },
  item: { border: "#8a8a45", bg: "#fffef8", bgDark: "#2a3020" },
  angry: { border: "#c97a4a", bg: "#fff8f6", bgDark: "#2a1a1a" },
  proud: { border: "#5a7abf", bg: "#f8faff", bgDark: "#1a202e" },
};

export default function InstructorSpeechBubble({
  message,
  variant,
  isDarkMode,
  className = "",
}: InstructorSpeechBubbleProps) {
  const palette = VARIANT_STYLES[variant];
  const fill = isDarkMode ? palette.bgDark : palette.bg;

  return (
    <div className={className} aria-label={`Instructor Kava says: ${message}`}>
      <div
        className="rounded-xl border px-3 py-2.5 text-center text-[11px] sm:text-xs font-semibold leading-snug shadow-sm break-words hyphens-auto"
        style={{
          background: fill,
          color: isDarkMode ? "#e6e4dc" : "#3a3528",
          borderColor: palette.border,
        }}
      >
        {message}
      </div>
    </div>
  );
}
