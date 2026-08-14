"use client";

import React from "react";
import type { GamificationProfile } from "@/lib/gamification";
import {
  getCharacterLayerStack,
  type InstructorMood,
} from "@/lib/characterLayers";

interface CharacterStageProps {
  gamification: GamificationProfile;
  mood: InstructorMood;
  prestigeIds?: string[];
  previewAll?: boolean;
  className?: string;
}

/**
 * Paper doll: static body + head (mood) + transparent item layers.
 */
export default function CharacterStage({
  gamification,
  mood,
  prestigeIds = [],
  previewAll = false,
  className = "",
}: CharacterStageProps) {
  const layers = getCharacterLayerStack({
    gamification,
    mood,
    prestigeIds,
    previewAll,
  });

  return (
    <div
      className={`relative h-full w-full pointer-events-none ${className}`}
      aria-label="Instructor Kava character stage"
    >
      {layers.map((layer, index) => (
        <img
          key={layer.key}
          src={layer.src}
          alt=""
          className="absolute bottom-0 left-0 h-full w-auto max-w-none object-contain object-bottom"
          style={{
            zIndex: index + 1,
            transform: layer.transform,
          }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ))}
    </div>
  );
}
