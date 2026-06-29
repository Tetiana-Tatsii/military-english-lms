"use client";

import React from "react";
import { ShoppingCart } from "lucide-react";
import type { GamificationProfile } from "@/context/AppContext";

interface InstructorCardProps {
  gamification: GamificationProfile;
  mood: "happy" | "angry" | "proud";
  isDarkMode: boolean;
  isPxStoreOpen: boolean;
  onPxStoreToggle: () => void;
}

const HAPPY_ITEM_IMAGES: Record<string, string> = {
  coffee:   "/instructor/happy.webp",
  snickers: "/instructor/happy-snickers.webp",
  energy:   "/instructor/happy-energy.webp",
  thermos:  "/instructor/happy-thermos.webp",
};

const MOOD_CONFIG = {
  happy: {
    fallbackEmoji: "😊",
    borderColor: "#8a8a45",
    bgColor: "#eef0df",
    bgDark: "#2a3020",
    message: null,
  },
  angry: {
    fallbackEmoji: "😠",
    borderColor: "#c97a4a",
    bgColor: "#fdeced",
    bgDark: "#2a1a1a",
    message: "My inner commander is getting impatient. Where's the homework?",
  },
  proud: {
    fallbackEmoji: "🥲",
    borderColor: "#5a7abf",
    bgColor: "#e8edf8",
    bgDark: "#1a202e",
    message: "See you in the next course! 🥲",
  },
} as const;

const EQUIPPED_EMOJI: Record<string, string> = {
  coffee:   "☕",
  snickers: "🍫",
  energy:   "🥤",
  thermos:  "🫖",
};

function getInstructorImage(mood: "happy" | "angry" | "proud", activeItem: string): string {
  if (mood === "angry") return "/instructor/angry.webp";
  if (mood === "proud") return "/instructor/proud.webp";
  return HAPPY_ITEM_IMAGES[activeItem] ?? HAPPY_ITEM_IMAGES.coffee;
}

const COIN_OPEN   = "/coins/coffee-coin_open.webp";
const COIN_LOCKED = "/coins/coffee-coin_locked.webp";

function CoinImg({ filled }: { filled: boolean }) {
  return (
    <img
      src={filled ? COIN_OPEN : COIN_LOCKED}
      alt={filled ? "completed" : "locked"}
      // 72 px coins
      className="w-[72px] h-[72px] object-contain flex-shrink-0 transition-all duration-300"
      style={{ opacity: filled ? 1 : 0.55 }}
    />
  );
}

export default function InstructorCard({
  gamification,
  mood,
  isDarkMode,
  isPxStoreOpen,
  onPxStoreToggle,
}: InstructorCardProps) {
  const { streakCount, activeInstructorItem, coffeeCoins } = gamification;
  const config = MOOD_CONFIG[mood];
  const filledCups = streakCount === 0 ? 0 : ((streakCount - 1) % 7) + 1;
  const equippedEmoji = mood === "happy" ? (EQUIPPED_EMOJI[activeInstructorItem] ?? "☕") : null;
  const imageSrc = getInstructorImage(mood, activeInstructorItem);

  return (
    // paddingTop: 0 as requested; head may naturally peek into gap above
    <div
      className="rounded-2xl border flex flex-row overflow-visible"
      style={{
        background: isDarkMode ? "#2d2f2a" : "#f6f1e4",
        borderColor: isDarkMode ? "#3e403a" : "#d8cdb4",
        minHeight: 210,
      }}
    >
      {/* ── LEFT: Instructor image — no background, head slightly overflows ── */}
      <div
        className="flex-shrink-0"
        style={{ width: 210, position: "relative", minHeight: 240 }}
      >
        <img
          src={imageSrc}
          alt={`Instructor — ${mood}`}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: 210,
            height: 340,
            objectFit: "contain",
            objectPosition: "bottom",
          }}
          onError={(e) => {
            const t = e.currentTarget;
            t.style.display = "none";
            const p = t.parentElement;
            if (p) {
              p.style.fontSize = "72px";
              p.style.display = "flex";
              p.style.alignItems = "flex-end";
              p.style.justifyContent = "center";
              p.textContent = config.fallbackEmoji;
            }
          }}
        />
      </div>

      {/* ── RIGHT: Content ── */}
      <div className="flex flex-col flex-1 px-5 py-4 gap-3 min-w-0">

        {/* Header: PX button right, title centred */}
        <div className="relative flex items-center justify-center">
          <span
            className="text-sm font-bold text-center"
            style={{ color: isDarkMode ? "#e6e4dc" : "#3a3528" }}
          >
            🪖 Your Instructor Kava{equippedEmoji ? ` ${equippedEmoji}` : ""}
          </span>
          <button
            onClick={onPxStoreToggle}
            className="absolute right-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
            style={{
              background: isPxStoreOpen
                ? "#3a3528"
                : (isDarkMode ? "#2a3020" : "#eef0df"),
              color: isPxStoreOpen ? "#fff" : (isDarkMode ? "#c4c89a" : "#8a8a45"),
              border: `1px solid ${isDarkMode ? "#4a5030" : "#c4c27a"}`,
            }}
          >
            <ShoppingCart size={13} />
            PX Store {isPxStoreOpen ? "↑" : "→"}
          </button>
        </div>

        {/* Mood message OR streak coins */}
        {config.message ? (
          <div
            className="rounded-lg px-4 py-3 text-sm font-semibold leading-snug"
            style={{
              background: isDarkMode ? config.bgDark : config.bgColor,
              color: isDarkMode ? "#e6e4dc" : "#3a3528",
              border: `1px solid ${config.borderColor}`,
            }}
          >
            {config.message}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Row 1: coins 1–4, close together, centred */}
            <div className="flex justify-center items-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <CoinImg key={i} filled={i < filledCups} />
              ))}
            </div>

            {/* Row 2: coins 5–7, same gap, centred */}
            <div className="flex justify-center items-center gap-3">
              {[4, 5, 6].map((i) => (
                <CoinImg key={i} filled={i < filledCups} />
              ))}
            </div>

            {/* Streak text — centred */}
            <div className="text-center mt-1">
              <p
                className="text-sm font-bold"
                style={{ color: isDarkMode ? "#e6e4dc" : "#3a3528" }}
              >
                Well done!&nbsp;
                {streakCount} {streakCount === 1 ? "day" : "days"} in a row
              </p>

              {streakCount > 0 && streakCount % 7 === 0 ? (
                <p
                  className="text-xs font-bold animate-pulse mt-0.5"
                  style={{ color: "#c97a4a" }}
                >
                  🎉 +7 coins bonus!
                </p>
              ) : (
                <p
                  className="text-xs mt-0.5"
                  style={{ color: isDarkMode ? "#6b6860" : "#a09890" }}
                >
                  {7 - filledCups}{" "}
                  {(7 - filledCups) === 1 ? "day" : "days"} to weekly bonus
                </p>
              )}
            </div>
          </div>
        )}

        {/* Coin balance — bottom right */}
        <div className="flex justify-end items-center gap-1.5 mt-auto">
          <span className="text-base font-bold" style={{ color: "#8a8a45" }}>
            {coffeeCoins}
          </span>
          <img src={COIN_OPEN} alt="coins" className="w-7 h-7 object-contain" />
        </div>

      </div>
    </div>
  );
}
