import type { Course } from "@/types";
import {
  getActiveRefreshmentId,
  type GamificationProfile,
} from "@/lib/gamification";

export type InstructorMood = "happy" | "angry" | "proud";

export type CharacterLayer = {
  key: string;
  src: string;
  /** Extra CSS transform so a prop can sit beside Kava, not on his boot. */
  transform?: string;
};

const HEAD_SRC: Record<InstructorMood, string> = {
  happy: "/layers/head-happy.png",
  angry: "/layers/head-angry.png",
  proud: "/layers/head-proud.png",
};

const HAND_SRC: Record<string, string> = {
  coffee: "/layers/hand-coffee.png",
  snickers: "/layers/hand-snickers.png",
  energy: "/layers/hand-energy.png",
  thermos: "/layers/hand-thermos.png",
};

const EQUIPMENT_SRC: Record<string, string> = {
  boots: "/layers/boots.png",
  kneepads: "/layers/kneepads.png",
  belt: "/layers/belt.png",
  vest: "/layers/vest.png",
  backpack: "/layers/backpack.png",
  gloves: "/layers/gloves.png",
  watch: "/layers/watch.png",
  radio: "/layers/radio.png",
  glasses: "/layers/glasses.png",
  headset: "/layers/headset.png",
  helmet: "/layers/helmet.png",
};

/** Full plate-carrier layer with the NGU chevron — replaces plain vest. */
const VEST_PATCH_SRC = "/layers/vest-patch.png";

const PRESTIGE_SRC: Record<string, string> = {
  cat: "/layers/companion-cat.png",
  dog: "/layers/companion-dog.png",
  drone: "/layers/companion-drone.png",
  victory: "/layers/victory.png",
};

/** Body-worn gear paint order (bottom → top), before head / arms / companions. */
const BODY_EQUIP_ORDER = [
  "boots",
  "kneepads",
  "vest",
] as const;

const HEAD_EQUIP_ORDER = ["glasses", "headset", "helmet"] as const;

function resolveHandSrc(
  _mood: InstructorMood,
  handId: string,
  previewAll: boolean,
): string {
  if (previewAll) return "/layers/hand-coffee.png";
  if (handId !== "coffee") {
    return HAND_SRC[handId] ?? "/layers/hand-thumbs-up.png";
  }
  // Mood swaps only the head — keep the default thumbs-up (and any equipped gear).
  return "/layers/hand-thumbs-up.png";
}

function pushLayer(
  layers: CharacterLayer[],
  key: string,
  src: string | undefined,
  extra?: Pick<CharacterLayer, "transform">,
) {
  if (src) layers.push({ key, src, ...extra });
}

function equippedItemIds(profile: GamificationProfile): Set<string> {
  const ids = new Set<string>();
  for (const row of profile.inventory) {
    if (row.equipped) ids.add(row.itemId);
  }
  // Legacy: boots bought before user_inventory existed
  if (
    profile.purchasedItems.includes("boots") &&
    !profile.inventory.some((i) => i.itemId === "boots")
  ) {
    ids.add("boots");
  }
  return ids;
}

/**
 * One companion at a time (they replace each other):
 *   1 module done  → cat  (shown while studying module 2)
 *   2 modules done → dog  (shown while studying module 3)
 *   3+ modules done, course not finished → drone (modules 4–5)
 *   all lessons / course complete → victory cup only
 */
function isCourseFullyComplete(
  course: Course,
  doneLessonIds: Set<string>,
  completedCourseIds: string[],
): boolean {
  const lessons = (course.modules ?? []).flatMap((mod) => mod.lessons ?? []);
  if (lessons.length === 0) return completedCourseIds.includes(course.id);
  // Stale completed_courses must not hide cat/dog/drone after progress is reset.
  return lessons.every((lesson) => doneLessonIds.has(lesson.id));
}

function countDoneModules(course: Course, doneLessonIds: Set<string>): number {
  let n = 0;
  for (const mod of course.modules ?? []) {
    const lessons = mod.lessons ?? [];
    if (lessons.length === 0) continue;
    if (lessons.every((lesson) => doneLessonIds.has(lesson.id))) n += 1;
  }
  return n;
}

function companionForProgress(completedModules: number): string | null {
  if (completedModules >= 3) return "drone";
  if (completedModules >= 2) return "dog";
  if (completedModules >= 1) return "cat";
  return null;
}

/** Returns at most one prestige id — companions never stack. */
export function getActivePrestigeIds(
  courses: Course[],
  lessonIdsWithAnswers: Iterable<string>,
  completedCourseIds: string[],
): string[] {
  const done = new Set(lessonIdsWithAnswers);
  const inProgress: { completedModules: number }[] = [];
  let anyCourseComplete = false;

  for (const course of courses) {
    if (isCourseFullyComplete(course, done, completedCourseIds)) {
      anyCourseComplete = true;
      continue;
    }
    const completedModules = countDoneModules(course, done);
    if (completedModules > 0) inProgress.push({ completedModules });
  }

  if (inProgress.length > 0) {
    const best = Math.max(...inProgress.map((c) => c.completedModules));
    const id = companionForProgress(best);
    return id ? [id] : [];
  }

  if (anyCourseComplete) return ["victory"];
  return [];
}

/** Paper-doll stack: mood swaps only the head; items stack on the same body. */
export function getCharacterLayerStack(opts: {
  gamification: GamificationProfile;
  mood: InstructorMood;
  prestigeIds: string[];
  previewAll?: boolean;
}): CharacterLayer[] {
  const { gamification, mood, previewAll = false } = opts;
  const equipped = equippedItemIds(gamification);
  const show = (itemId: string) => previewAll || equipped.has(itemId);

  const layers: CharacterLayer[] = [];
  pushLayer(layers, "base", "/layers/base.png");

  // Mood only swaps the head. Cup vs companion comes from progress, not proud.
  const prestigeId = opts.prestigeIds[0];

  // Cup goes on the floor beside him: under the boots, shifted left off the toe.
  if (prestigeId === "victory") {
    pushLayer(layers, "prestige-victory", PRESTIGE_SRC.victory, {
      transform: "translateX(-8%)",
    });
  }

  for (const id of BODY_EQUIP_ORDER) {
    if (id === "vest") {
      // Patch is not a small overlay — it swaps in the vest-with-chevron art.
      if (show("patch")) pushLayer(layers, "vest", VEST_PATCH_SRC);
      else if (show("vest")) pushLayer(layers, "vest", EQUIPMENT_SRC.vest);
      continue;
    }
    if (show(id)) pushLayer(layers, id, EQUIPMENT_SRC[id]);
  }

  pushLayer(layers, "head", HEAD_SRC[mood]);

  for (const id of HEAD_EQUIP_ORDER) {
    if (show(id)) pushLayer(layers, id, EQUIPMENT_SRC[id]);
  }

  pushLayer(layers, "right-arm", "/layers/right-arm.png");

  const handId = getActiveRefreshmentId(gamification);
  const snackInHand =
    !previewAll &&
    (handId === "snickers" || handId === "energy" || handId === "thermos");
  const showRadio = show("radio") && !snackInHand;

  // Radio layer includes its own gripping hand — skip the drink / thumbs-up pose.
  if (!showRadio) {
    pushLayer(layers, "hand", resolveHandSrc(mood, handId, previewAll));
  }
  if (showRadio) {
    pushLayer(layers, "radio", EQUIPMENT_SRC.radio);
  }

  // Snack or radio occupies the hand; gloves are a thumbs-up pose.
  if (show("gloves") && !snackInHand && !showRadio) {
    pushLayer(layers, "gloves", EQUIPMENT_SRC.gloves);
  }
  // Watch after gloves so the cuff does not bury it.
  if (show("watch")) pushLayer(layers, "watch", EQUIPMENT_SRC.watch);

  if (prestigeId && prestigeId !== "victory") {
    const nudge =
      prestigeId === "cat" ? { transform: "translateX(-72%)" } : undefined;
    pushLayer(
      layers,
      `prestige-${prestigeId}`,
      PRESTIGE_SRC[prestigeId],
      nudge,
    );
  }

  return layers;
}
