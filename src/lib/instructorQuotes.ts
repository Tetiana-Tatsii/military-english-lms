export const INSTRUCTOR_MOOD_QUOTES = {
  angry:
    "My inner commander is getting impatient. Where's the homework?",
  proud: "See you in the next course! 🥲",
} as const;

export const INSTRUCTOR_ITEM_QUOTES: Record<string, string> = {
  snickers:
    "Tactical carb supply secured! Morale is maxed out, ready to take the high ground!",
  thermos:
    "Thermals show I'm the happiest soldier on this base right now!",
  energy:
    "Whoa, I can feel the turbines spooling up! I think I'm about to start seeing sounds!",
  boots:
    "Perfect grip, zero blisters — straight to the mess hall!",
};

export function getInstructorSpeechMessage(
  mood: "happy" | "angry" | "proud",
  activeItem: string,
): string | null {
  if (mood === "angry") return INSTRUCTOR_MOOD_QUOTES.angry;
  if (mood === "proud") return INSTRUCTOR_MOOD_QUOTES.proud;
  if (mood === "happy" && activeItem !== "coffee") {
    return INSTRUCTOR_ITEM_QUOTES[activeItem] ?? null;
  }
  return null;
}
