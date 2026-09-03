"use client";

import React from "react";

type BubbleVariant = "happy" | "angry" | "proud" | "item";

interface InstructorSpeechBubbleProps {
  message: string;
  variant: BubbleVariant;
  isDarkMode: boolean;
  className?: string;
  /** Larger copy on sm+ — mobile stays compact. */
  prominent?: boolean;
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
  prominent = false,
}: InstructorSpeechBubbleProps) {
  const palette = VARIANT_STYLES[variant];
  const fill = isDarkMode ? palette.bgDark : palette.bg;

  const textClasses = prominent
    ? "text-[11px] sm:text-sm md:text-base lg:text-lg font-semibold leading-snug sm:leading-relaxed"
    : "text-[11px] sm:text-xs font-semibold leading-snug";

  const padClasses = prominent
    ? "px-3 py-2.5 sm:px-5 sm:py-4 md:px-6 md:py-5"
    : "px-3 py-2.5";

  return (
    <div className={className} aria-label={`Instructor Kava says: ${message}`}>
      <div
        className={`rounded-xl border text-center shadow-sm break-words hyphens-auto ${padClasses} ${textClasses}`}
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
