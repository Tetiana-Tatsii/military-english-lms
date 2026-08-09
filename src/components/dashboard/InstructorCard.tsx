"use client";

import React from "react";
import { ShoppingCart } from "lucide-react";
import type { GamificationProfile } from "@/context/AppContext";
import CoffeeCoinIcon from "@/components/ui/CoffeeCoinIcon";
import StreakCoinIcon from "@/components/ui/StreakCoinIcon";
import CharacterStage, {
  EquippedLayersSummary,
} from "@/components/dashboard/CharacterStage";

function streakBonusLabel(streakCount: number, filledCups: number): string {
  if (streakCount > 0 && streakCount % 7 === 0) {
    return "Weekly bonus unlocked!🎉";
  }
  const daysLeft = 7 - filledCups;
  return daysLeft === 1
    ? "1 day to weekly bonus"
    : `${daysLeft} days to weekly bonus`;
}

interface InstructorCardProps {
  gamification: GamificationProfile;
  mood: "happy" | "angry" | "proud";
  isDarkMode: boolean;
  isPxStoreOpen: boolean;
  onPxStoreToggle: () => void;
}

export default function InstructorCard({
  gamification,
  mood,
  isDarkMode,
  isPxStoreOpen,
  onPxStoreToggle,
}: InstructorCardProps) {
  const { streakCount, coffeeCoins } = gamification;
  const filledCups = streakCount === 0 ? 0 : ((streakCount - 1) % 7) + 1;
  const showStreak = mood === "happy";

  return (
    <div
      className="relative w-full rounded-2xl border flex flex-row overflow-visible mt-6"
      style={{
        background: isDarkMode ? "#2d2f2a" : "#f6f1e4",
        borderColor: isDarkMode ? "#3e403a" : "#d8cdb4",
        minHeight: 210,
      }}
    >
      {/* Mobile gutter wider so figure does not cover the title; size of figure unchanged */}
      <div
        className="relative flex-shrink-0 w-[132px] sm:w-[140px] md:w-[150px] lg:w-[180px] self-stretch"
        aria-hidden
      >
        <div className="absolute bottom-0 left-1 sm:left-4 z-10 h-[calc(100%+56px)] w-[calc(100%-4px)] sm:w-[calc(100%-8px)]">
          <CharacterStage gamification={gamification} mood={mood} />
        </div>
      </div>

      <div className="flex flex-col flex-1 min-w-0 pl-1 pr-2 sm:px-4 md:px-5 py-4 gap-2 sm:gap-3">
        <div className="flex flex-col items-center justify-center sm:justify-center gap-1.5">
          <span
            className="text-base sm:text-xl font-bold text-center leading-tight max-w-[11rem] sm:max-w-none"
            style={{ color: isDarkMode ? "#e6e4dc" : "#3a3528" }}
          >
            Your Instructor Kava
          </span>
          <EquippedLayersSummary
            gamification={gamification}
            isDarkMode={isDarkMode}
          />
        </div>

        {showStreak ? (
          <div className="flex flex-col gap-2">
            <div className="flex justify-center items-center gap-1 sm:gap-2 md:gap-3">
              {[0, 1, 2, 3].map((i) => (
                <StreakCoinIcon key={i} filled={i < filledCups} />
              ))}
            </div>

            <div className="flex justify-center items-center gap-1 sm:gap-2 md:gap-3">
              {[4, 5, 6].map((i) => (
                <StreakCoinIcon key={i} filled={i < filledCups} />
              ))}
            </div>

            <div className="flex flex-col items-center w-full mt-4 sm:mt-6 gap-3">
              <div className="text-center">
                <p
                  className="text-xs font-bold"
                  style={{ color: isDarkMode ? "#e6e4dc" : "#3a3528" }}
                >
                  Well done! {streakCount}-day streak!
                </p>
                <p
                  className={`text-xs mt-0.5 ${
                    streakCount > 0 && streakCount % 7 === 0
                      ? "font-bold animate-pulse"
                      : ""
                  }`}
                  style={{
                    color:
                      streakCount > 0 && streakCount % 7 === 0
                        ? "#c97a4a"
                        : isDarkMode
                          ? "#6b6860"
                          : "#a09890",
                  }}
                >
                  {streakBonusLabel(streakCount, filledCups)}
                </p>
              </div>

              <div className="flex items-center gap-3 self-end">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold" style={{ color: "#8a8a45" }}>
                    {coffeeCoins}
                  </span>
                  <CoffeeCoinIcon />
                </div>
                <button
                  onClick={onPxStoreToggle}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white font-medium bg-[#8a8a45] hover:opacity-90 transition-opacity cursor-pointer text-sm"
                >
                  <ShoppingCart size={16} className="text-white shrink-0" />
                  <span className="text-white">
                    {isPxStoreOpen ? "PX Store ↑" : "PX Store →"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-end justify-end pb-1">
            <button
              onClick={onPxStoreToggle}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white font-medium bg-[#8a8a45] hover:opacity-90 transition-opacity cursor-pointer text-sm"
            >
              <ShoppingCart size={16} className="text-white shrink-0" />
              <span className="text-white">
                {isPxStoreOpen ? "PX Store ↑" : "PX Store →"}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
