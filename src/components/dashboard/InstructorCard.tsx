"use client";

import React from "react";
import type { GamificationProfile } from "@/context/AppContext";

interface InstructorCardProps {
  gamification: GamificationProfile;
  mood: "happy" | "angry" | "proud";
  isDarkMode: boolean;
}

// Items that have a dedicated happy variant image
const HAPPY_ITEM_IMAGES: Record<string, string> = {
  coffee:   "/instructor/happy.png",
  snickers: "/instructor/happy-snickers.png",
  energy:   "/instructor/happy-energy.png",
  thermos:  "/instructor/happy-thermos.png",
  statute:  "/instructor/happy-statute.png",
};

const MOOD_CONFIG = {
  happy: {
    emoji: "😊",
    fallbackEmoji: "😊",
    borderColor: "#8a8a45",
    bgColor: "#eef0df",
    bgDark: "#2a3020",
    message: null,
  },
  angry: {
    emoji: "😠",
    fallbackEmoji: "😠",
    borderColor: "#c97a4a",
    bgColor: "#fdeced",
    bgDark: "#2a1a1a",
    message: "Мій внутрішній командир починає тупати ніжкою. Де домашка?",
  },
  proud: {
    emoji: "🥲",
    fallbackEmoji: "🥲",
    borderColor: "#5a7abf",
    bgColor: "#e8edf8",
    bgDark: "#1a202e",
    message: "До зустрічі на новому курсі 🥲",
  },
} as const;

const EQUIPPED_EMOJI: Record<string, string> = {
  coffee:   "☕",
  snickers: "🍫",
  energy:   "🥤",
  thermos:  "🫖",
  statute:  "📕",
};

function getInstructorImage(mood: "happy" | "angry" | "proud", activeItem: string): string {
  if (mood === "angry") return "/instructor/angry.png";
  if (mood === "proud") return "/instructor/proud.png";
  // happy — показуємо предмет який він тримає
  return HAPPY_ITEM_IMAGES[activeItem] ?? HAPPY_ITEM_IMAGES.coffee;
}

export default function InstructorCard({ gamification, mood, isDarkMode }: InstructorCardProps) {
  const { streakCount, activeInstructorItem, coffeeCoins } = gamification;
  const config = MOOD_CONFIG[mood];
  const filledCups = streakCount === 0 ? 0 : ((streakCount - 1) % 7) + 1;
  const equippedEmoji = EQUIPPED_EMOJI[activeInstructorItem] ?? "☕";
  const imageSrc = getInstructorImage(mood, activeInstructorItem);

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: isDarkMode ? "#2d2f2a" : "#f6f1e4",
        borderColor: isDarkMode ? "#3e403a" : "#d8cdb4",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 pt-4 pb-2"
        style={{ borderBottom: isDarkMode ? "1px solid #3e403a" : "1px solid #e8e2d4" }}
      >
        <span className="text-sm font-bold" style={{ color: isDarkMode ? "#e6e4dc" : "#3a3528" }}>
          🪖 Інструктор Тарас {equippedEmoji}
        </span>
        <span className="text-sm font-bold" style={{ color: "#8a8a45" }}>
          {coffeeCoins} ☕
        </span>
      </div>

      <div className="flex flex-col items-center gap-4 p-4">
        {/* Instructor portrait — full body */}
        <div
          className="relative flex items-end justify-center overflow-hidden rounded-xl transition-all duration-500 w-full"
          style={{
            height: 380,
            background: isDarkMode ? config.bgDark : config.bgColor,
            border: `2px solid ${config.borderColor}`,
          }}
        >
          <img
            src={imageSrc}
            alt={`Інструктор — ${mood}`}
            className="h-full w-full object-contain object-bottom"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = "none";
              const parent = target.parentElement;
              if (parent) {
                parent.style.fontSize = "120px";
                parent.style.display = "flex";
                parent.style.alignItems = "center";
                parent.style.justifyContent = "center";
                parent.textContent = config.fallbackEmoji;
              }
            }}
          />
        </div>

        {/* Mood message or streak */}
        {config.message ? (
          <div
            className="w-full rounded-lg px-4 py-3 text-center text-sm font-semibold leading-snug"
            style={{
              background: isDarkMode ? config.bgDark : config.bgColor,
              color: isDarkMode ? "#e6e4dc" : "#3a3528",
              border: `1px solid ${config.borderColor}`,
            }}
          >
            {config.message}
          </div>
        ) : (
          <div className="w-full text-center">
            <p className="mb-2 text-lg font-bold" style={{ color: isDarkMode ? "#e6e4dc" : "#3a3528" }}>
              {streakCount} {streakCount === 1 ? "день" : streakCount < 5 ? "дні" : "днів"} поспіль!
            </p>

            {/* 7 coffee cups streak tracker */}
            <div className="flex justify-center gap-1.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <span
                  key={i}
                  className="text-xl transition-all"
                  style={{ opacity: i < filledCups ? 1 : 0.2 }}
                >
                  ☕
                </span>
              ))}
            </div>

            {streakCount > 0 && streakCount % 7 === 0 && (
              <p className="mt-1 text-xs font-semibold" style={{ color: "#c97a4a" }}>
                🎉 Тижневий бонус! +7 коїнів
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
