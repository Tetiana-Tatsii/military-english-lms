"use client";

import React from "react";
import {
  type GamificationProfile,
  getActiveRefreshmentId,
  getShopItem,
} from "@/lib/gamification";

type Mood = "happy" | "angry" | "proud";

interface CharacterStageProps {
  gamification: GamificationProfile;
  mood: Mood;
  className?: string;
}

const HAPPY_REFRESHMENT_IMAGES: Record<string, string> = {
  coffee: "/instructor/happy.webp",
  snickers: "/instructor/happy-snickers.webp",
  energy: "/instructor/happy-energy.webp",
  thermos: "/instructor/happy-thermos.webp",
};

/**
 * Character stage: mood + refreshment art for now.
 * Equipment / companion PNG layers will stack here later — no emoji on the figure.
 */
export default function CharacterStage({
  gamification,
  mood,
  className = "",
}: CharacterStageProps) {
  const handId = getActiveRefreshmentId(gamification);

  let src = "/instructor/happy.webp";
  if (mood === "angry") src = "/instructor/angry.webp";
  else if (mood === "proud") src = "/instructor/proud.webp";
  else src = HAPPY_REFRESHMENT_IMAGES[handId] ?? HAPPY_REFRESHMENT_IMAGES.coffee;

  return (
    <div
      className={`relative h-full w-full pointer-events-none ${className}`}
      aria-label="Instructor Kava character stage"
    >
      <img
        src={src}
        alt={`Instructor — ${mood}`}
        className="absolute bottom-0 left-0 z-[1] h-full w-auto max-w-none object-contain object-bottom"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}

/** Compact equipped summary for UI (not drawn on the character art). */
export function EquippedLayersSummary({
  gamification,
  isDarkMode,
}: {
  gamification: GamificationProfile;
  isDarkMode: boolean;
}) {
  const handId = getActiveRefreshmentId(gamification);
  const hand = getShopItem(handId);

  const equipment = gamification.inventory.filter(
    (i) => i.kind === "equipment" && i.equipped,
  );

  const hasBoots =
    equipment.some((i) => i.itemId === "boots") ||
    gamification.purchasedItems.includes("boots");

  const chips: string[] = [];
  if (hand) chips.push(`${hand.emoji} ${hand.name}`);
  if (hasBoots) chips.push("🥾 Boots");
  for (const row of equipment) {
    if (row.itemId === "boots") continue;
    const item = getShopItem(row.itemId);
    if (item) chips.push(`${item.emoji} ${item.name}`);
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {chips.map((label) => (
        <span
          key={label}
          className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
          style={{
            background: isDarkMode ? "#3e403a" : "#e8e2d4",
            color: isDarkMode ? "#e6e4dc" : "#5a5340",
          }}
        >
          {label}
        </span>
      ))}
    </div>
  );
}
