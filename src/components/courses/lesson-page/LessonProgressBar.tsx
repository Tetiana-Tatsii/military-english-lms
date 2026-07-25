"use client";

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

const THEME_EMOJI: Record<Exclude<ProgressTheme, "coffee">, string> = {
  cat: "🐱",
  dog: "🐕",
  drone: "🛸",
  victory: "🏆",
};

function ProgressIcon({
  theme,
  filled,
  size = 28,
}: {
  theme: ProgressTheme;
  filled: boolean;
  size?: number;
}) {
  if (theme === "coffee") {
    return (
      <img
        src={
          filled
            ? "/coins/coffee-coin_open.webp"
            : "/coins/coffee-coin_locked.webp"
        }
        alt=""
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          opacity: filled ? 1 : 0.45,
          filter: filled ? "none" : "grayscale(0.35)",
          transition: "opacity 0.25s ease, transform 0.25s ease",
          transform: filled ? "scale(1.05)" : "scale(1)",
        }}
      />
    );
  }

  return (
    <span
      aria-hidden
      style={{
        fontSize: size * 0.85,
        lineHeight: 1,
        opacity: filled ? 1 : 0.35,
        filter: filled ? "none" : "grayscale(1)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
        transform: filled ? "scale(1.08)" : "scale(1)",
        display: "inline-block",
      }}
    >
      {THEME_EMOJI[theme]}
    </span>
  );
}

export default function LessonProgressBar({
  totalSteps,
  filledSteps,
  currentStep,
  theme,
  isDarkMode,
  completed,
}: LessonProgressBarProps) {
  if (totalSteps <= 0) return null;

  const pct = Math.round((filledSteps / totalSteps) * 100);

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        marginBottom: 20,
        padding: "14px 16px",
        borderRadius: 12,
        background: isDarkMode ? "rgba(37, 38, 34, 0.96)" : "rgba(250, 249, 246, 0.96)",
        border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 10,
          flexWrap: "wrap",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 700,
            color: isDarkMode ? "#e6e4dc" : "#3a3528",
          }}
        >
          {completed
            ? "Урок завершено"
            : `Крок ${Math.min(currentStep + 1, totalSteps)} з ${totalSteps}`}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 600,
            color: isDarkMode ? "#a3a198" : "#7a7568",
          }}
        >
          Lesson completed: {pct}%
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
        role="progressbar"
        aria-valuenow={filledSteps}
        aria-valuemin={0}
        aria-valuemax={totalSteps}
        aria-label={`Прогрес уроку: ${pct}%`}
      >
        {Array.from({ length: totalSteps }, (_, index) => (
          <ProgressIcon
            key={index}
            theme={theme}
            filled={index < filledSteps}
          />
        ))}
      </div>
    </div>
  );
}
