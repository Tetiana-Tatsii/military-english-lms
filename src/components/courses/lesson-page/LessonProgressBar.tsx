"use client";

import type { CSSProperties } from "react";
import type { ProgressTheme } from "@/lib/lessonSteps";

interface LessonProgressBarProps {
  totalSteps: number;
  /** How many steps are fully done (0…totalSteps) */
  filledSteps: number;
  currentStep: number;
  theme: ProgressTheme;
  isDarkMode: boolean;
  completed: boolean;
}

const THEME_ART: Record<ProgressTheme, string> = {
  coffee: "/coins/coffee-coin_open.webp",
  cat: "/progress/cat.png",
  dog: "/progress/dog.png",
  drone: "/progress/drone.png",
  victory: "/progress/victory.png",
};

const FRAME = 200;

export default function LessonProgressBar({
  totalSteps,
  filledSteps,
  currentStep,
  theme,
  isDarkMode,
  completed,
}: LessonProgressBarProps) {
  if (totalSteps <= 0) return null;

  const pct = Math.max(0, Math.min(100, Math.round((filledSteps / totalSteps) * 100)));
  const src = THEME_ART[theme];
  const imgStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
  };

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        marginBottom: 20,
        padding: "16px 18px",
        borderRadius: 12,
        background: isDarkMode ? "rgba(37, 38, 34, 0.96)" : "rgba(250, 249, 246, 0.96)",
        border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
        backdropFilter: "blur(8px)",
      }}
    >
      <p
        style={{
          margin: "0 0 14px",
          fontSize: 13,
          fontWeight: 700,
          color: isDarkMode ? "#e6e4dc" : "#3a3528",
        }}
      >
        {completed
          ? "Урок завершено"
          : `Крок ${Math.min(currentStep + 1, totalSteps)} з ${totalSteps}`}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Прогрес уроку: ${pct}%`}
      >
        <div
          style={{
            position: "relative",
            flexShrink: 0,
            width: FRAME,
            height: FRAME,
          }}
        >
          <img
            src={src}
            alt=""
            style={{
              ...imgStyle,
              filter: "grayscale(1)",
              opacity: 0.5,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              clipPath: `inset(${100 - pct}% 0 0 0)`,
              transition: "clip-path 0.45s ease",
            }}
          >
            <img src={src} alt="" style={imgStyle} />
          </div>
        </div>

        <span
          style={{
            fontSize: 44,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            color: pct >= 100 ? "#8a8a45" : isDarkMode ? "#e6e4dc" : "#3a3528",
            minWidth: "3.2ch",
          }}
        >
          {pct}%
        </span>
      </div>
    </div>
  );
}
