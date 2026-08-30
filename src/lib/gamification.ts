import type { SupabaseClient } from "@supabase/supabase-js";
import type { Course } from "@/context/AppContext";

export type ShopItemKind = "refreshment" | "equipment";

/** Visual layer key for CharacterStage (bottom → top order in CHARACTER_LAYER_ORDER). */
export type CharacterLayerKey =
  | "base"
  | "boots"
  | "kneepads"
  | "belt"
  | "vest"
  | "backpack"
  | "gloves"
  | "watch"
  | "radio"
  | "patch"
  | "glasses"
  | "headset"
  | "helmet"
  | "hand"
  | "companion"
  | "victory";

export type EquipmentArtStub = {
  id: string;
  name: string;
  /** Short UA hint for designer */
  nameUk: string;
  emoji: string;
  layer: CharacterLayerKey;
  /** Shop card icon ~300×300 */
  artShop: string;
  /** Overlay on Kava ~600×900, transparent PNG/WebP */
  artLayer: string;
};

export interface InventoryItem {
  itemId: string;
  kind: string;
  equipped: boolean;
}

export interface GamificationProfile {
  coffeeCoins: number;
  streakCount: number;
  activeInstructorItem: string;
  purchasedItems: string[];
  completedCourses: string[];
  inventory: InventoryItem[];
}

export const DEFAULT_GAMIFICATION_PROFILE: GamificationProfile = {
  coffeeCoins: 0,
  streakCount: 0,
  activeInstructorItem: "coffee",
  purchasedItems: [],
  completedCourses: [],
  inventory: [],
};

export type ShopCatalogItem = {
  id: string;
  name: string;
  price: number;
  emoji: string;
  image: string;
  kind: ShopItemKind;
  layer: CharacterLayerKey;
};

// Purchasable catalogue (prices must match buy_shop_item RPC)
export const SHOP_ITEMS: readonly ShopCatalogItem[] = [
  { id: "coffee",    name: "Like",               price: 0,  emoji: "👍", image: "/shop/like.webp",          kind: "refreshment", layer: "hand" },
  { id: "snickers",  name: "Energy Bar",         price: 30, emoji: "🍫", image: "/shop/snickers.webp",      kind: "refreshment", layer: "hand" },
  { id: "energy",    name: "Energy Drink",       price: 40, emoji: "🥤", image: "/shop/energy.webp",        kind: "refreshment", layer: "hand" },
  { id: "thermos",   name: "Thermo Cup",         price: 50, emoji: "🫖", image: "/shop/thermos.webp",       kind: "refreshment", layer: "hand" },
  { id: "boots",     name: "Tactical Boots",     price: 10, emoji: "🥾", image: "/shop/boots.webp",         kind: "equipment",   layer: "boots" },
  { id: "kneepads",  name: "Knee Pads",          price: 10, emoji: "🦵", image: "/shop/kneepads.webp",      kind: "equipment",   layer: "kneepads" },
  { id: "vest",      name: "Plate Carrier",      price: 10, emoji: "🦺", image: "/shop/vest.webp",          kind: "equipment",   layer: "vest" },
  { id: "patch",     name: "NGU Patch",          price: 10, emoji: "🎖️", image: "/shop/patch.webp",         kind: "equipment",   layer: "patch" },
  { id: "gloves",    name: "Tactical Gloves",    price: 10, emoji: "🧤", image: "/shop/gloves.webp",        kind: "equipment",   layer: "gloves" },
  { id: "watch",     name: "Field Watch",        price: 10, emoji: "⌚", image: "/shop/watch.webp",         kind: "equipment",   layer: "watch" },
  { id: "glasses",   name: "Ballistic Glasses",  price: 10, emoji: "🕶️", image: "/shop/glasses.webp",       kind: "equipment",   layer: "glasses" },
  { id: "headset",   name: "Comms Headset",      price: 10, emoji: "🎧", image: "/shop/headset.webp",      kind: "equipment",   layer: "headset" },
  { id: "radio",     name: "Field Radio",        price: 10, emoji: "📻", image: "/shop/radio.webp",         kind: "equipment",   layer: "radio" },
  { id: "helmet",    name: "Combat Helmet",      price: 10, emoji: "⛑️", image: "/shop/helmet.webp",        kind: "equipment",   layer: "helmet" },
] as const;

/** Empty — all layered equipment is live in SHOP_ITEMS. Belt and backpack cards exist in /shop but are not sold. */
export const EQUIPMENT_COMING_SOON: readonly EquipmentArtStub[] = [];

/** Suggested paint order for layered character (bottom → top). */
export const CHARACTER_LAYER_ORDER: readonly CharacterLayerKey[] = [
  "base",
  "boots",
  "kneepads",
  "belt",
  "vest",
  "backpack",
  "gloves",
  "watch",
  "radio",
  "patch",
  "glasses",
  "headset",
  "helmet",
  "hand",
  "companion",
  "victory",
] as const;

/** Non-shop prestige art (module rewards) — also needed from designer later. */
export const PRESTIGE_ART_STUBS = [
  { id: "cat", name: "Tactical Cat", nameUk: "Тактичний кіт", emoji: "🐱", art: "/layers/companion-cat.png", unlock: "After module 1 (on module 2)" },
  { id: "dog", name: "Tactical Dog", nameUk: "Тактичний пес", emoji: "🐕", art: "/layers/companion-dog.png", unlock: "After module 2 (on module 3)" },
  { id: "drone", name: "Recon Drone", nameUk: "Дрон", emoji: "🛸", art: "/layers/companion-drone.png", unlock: "After module 3 (on modules 4–5)" },
  { id: "victory", name: "Victory Cup", nameUk: "Кубок", emoji: "🏆", art: "/layers/victory.png", unlock: "After all modules" },
] as const;

export const REFRESHMENT_ITEMS = SHOP_ITEMS.filter((i) => i.kind === "refreshment");
export const EQUIPMENT_ITEMS = SHOP_ITEMS.filter((i) => i.kind === "equipment");

export type ShopItemId = (typeof SHOP_ITEMS)[number]["id"];

export interface BuyShopResult {
  error: string | null;
  charged: boolean;
  coffeeCoins: number;
  purchasedItems: string[];
  activeInstructorItem: string;
}

export interface UnequipShopResult {
  error: string | null;
  coffeeCoins: number;
  purchasedItems: string[];
  activeInstructorItem: string;
}

export function getShopItem(itemId: string): ShopCatalogItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === itemId);
}

export function getEquippedInventory(profile: GamificationProfile): InventoryItem[] {
  return profile.inventory.filter((i) => i.equipped);
}

/** Active refreshment in hand (fallback to legacy activeInstructorItem). */
export function getActiveRefreshmentId(profile: GamificationProfile): string {
  const fromInv = profile.inventory.find(
    (i) => i.kind === "refreshment" && i.equipped,
  );
  if (fromInv) return fromInv.itemId;

  const legacy = getShopItem(profile.activeInstructorItem);
  if (legacy?.kind === "refreshment") return legacy.id;
  return "coffee";
}

/** JSONB from Supabase may not be a plain string[] — normalize safely. */
export function normalizePurchasedItems(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((x): x is string => typeof x === "string"))];
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === "string");
}

// Course badge definitions — one badge per course
export const COURSE_BADGES: Record<
  string,
  { name: string; image: string; emoji: string; imageOffsetY?: number }
> = {
  "military-english-stanag-2": {
    name: "Military English",
    image: "/badges/stanag.webp",
    emoji: "🎖️",
  },
  "general-english": {
    name: "General English",
    image: "/badges/general-eng.webp",
    emoji: "🏅",
    imageOffsetY: 18,
  },
  "general-english-b2": {
    name: "General English",
    image: "/badges/general-eng.webp",
    emoji: "🏅",
    imageOffsetY: 18,
  },
};

export async function fetchUserInventory(
  supabase: SupabaseClient,
  userId: string,
): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from("user_inventory")
    .select("item_id, kind, equipped")
    .eq("user_id", userId);

  if (error || !data) {
    if (error) console.error("fetchUserInventory:", error.message);
    return [];
  }

  return data.map((row) => ({
    itemId: String(row.item_id),
    kind: String(row.kind ?? "equipment"),
    equipped: Boolean(row.equipped),
  }));
}

// ─── Fetch gamification profile ───────────────────────────────────────────────
export async function fetchGamificationProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<GamificationProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "coffee_coins, streak_count, active_instructor_item, purchased_items, completed_courses",
    )
    .eq("id", userId)
    .single();

  if (error || !data) return null;

  const inventory = await fetchUserInventory(supabase, userId);

  return {
    coffeeCoins:          data.coffee_coins          ?? 0,
    streakCount:          data.streak_count           ?? 0,
    activeInstructorItem: data.active_instructor_item ?? "coffee",
    purchasedItems:       normalizePurchasedItems(data.purchased_items),
    completedCourses:     normalizeStringArray(data.completed_courses),
    inventory,
  };
}

// ─── Streak helpers ───────────────────────────────────────────────────────────
type StreakResult = {
  coinsEarned: number;
  newStreak: number;
  newCoffeeCoins: number;
  isMilestone: boolean;
  wasStreakBroken: boolean;
};

function emptyStreakResult(overrides: Partial<StreakResult> = {}): StreakResult {
  return {
    coinsEarned: 0,
    newStreak: 0,
    newCoffeeCoins: 0,
    isMilestone: false,
    wasStreakBroken: false,
    ...overrides,
  };
}

function parseStreakRpc(data: Record<string, unknown>): StreakResult {
  return {
    coinsEarned: Number(data.coinsEarned ?? 0),
    newStreak: Number(data.newStreak ?? 0),
    newCoffeeCoins: Number(data.newCoffeeCoins ?? 0),
    isMilestone: Boolean(data.isMilestone),
    wasStreakBroken: Boolean(data.wasStreakBroken),
  };
}

// ─── Daily streak + login reward ──────────────────────────────────────────────
export async function processDailyStreak(
  supabase: SupabaseClient,
  userId: string,
): Promise<StreakResult> {
  const { data: { session } } = await supabase.auth.getSession();

  // Server RPC only (C1) — no client profiles.update fallback
  if (session?.user?.id !== userId) {
    console.warn(
      "processDailyStreak: no Supabase auth session for user",
      userId,
      "— streak not processed. Re-login required.",
    );
    return emptyStreakResult();
  }

  const { data, error } = await supabase.rpc("process_daily_streak");

  if (error) {
    console.error("processDailyStreak RPC failed:", error);
    return emptyStreakResult();
  }

  if (data && typeof data === "object") {
    const payload = data as Record<string, unknown>;
    if (payload.error) {
      console.error("processDailyStreak RPC:", payload.error);
      return emptyStreakResult();
    }
    return parseStreakRpc(payload);
  }

  return emptyStreakResult();
}

// ─── Award coins (atomic-safe for low-concurrency apps) ───────────────────────
// ─── Award coins for homework (teacher → student via RPC) ─────────────────────
export async function awardHomeworkCoins(
  supabase: SupabaseClient,
  answerId: string,
  amount: number,
): Promise<{
  error: string | null;
  coinsAwardedAmount?: number;
  newCoffeeCoins?: number;
  studentId?: string;
}> {
  if (amount <= 0) {
    return { error: null, coinsAwardedAmount: 0 };
  }

  const { data, error } = await supabase.rpc("award_homework_coins", {
    p_answer_id: answerId,
    p_amount: Math.round(amount),
  });

  if (error) {
    console.error("award_homework_coins RPC failed:", error.message, {
      answerId,
      amount,
    });
    return { error: error.message };
  }

  const payload = data as Record<string, unknown> | null;
  if (!payload) {
    return { error: "empty_response" };
  }

  if (payload.error) {
    const code = String(payload.error);
    if (code === "already_awarded") {
      return {
        error: null,
        coinsAwardedAmount: Number(payload.coinsAwardedAmount ?? 0),
      };
    }
    console.error("award_homework_coins:", code);
    return { error: code };
  }

  return {
    error: null,
    coinsAwardedAmount: Number(payload.coinsAwardedAmount ?? amount),
    newCoffeeCoins: Number(payload.newCoffeeCoins ?? 0),
    studentId: String(payload.studentId ?? ""),
  };
}

export type AwardQuizCoinsResult = {
  error: string | null;
  alreadyAwarded: boolean;
  coinsAwarded: number;
  correctCount: number;
  newCoffeeCoins: number;
};

/**
 * @deprecated Quiz coins are awarded only inside submit_lesson_quiz (server).
 * Client EXECUTE on award_quiz_coins was revoked (P6 security hygiene).
 */
export async function awardQuizCoins(
  _supabase: SupabaseClient,
  _lessonId: string,
): Promise<AwardQuizCoinsResult> {
  console.warn(
    "awardQuizCoins is disabled (P6). Use submitLessonQuiz — coins award server-side.",
  );
  return {
    error: "use_submit_lesson_quiz",
    alreadyAwarded: false,
    coinsAwarded: 0,
    correctCount: 0,
    newCoffeeCoins: 0,
  };
}

/**
 * @deprecated Removed under C1 — direct profiles.coffee_coins UPDATE is blocked.
 * Use awardQuizCoins / awardHomeworkCoins RPCs.
 */
export async function awardCoins(
  _supabase: SupabaseClient,
  _userId: string,
  _amount: number,
): Promise<void> {
  console.warn(
    "awardCoins is disabled (C1). Use awardQuizCoins / awardHomeworkCoins.",
  );
}

// ─── Buy or activate shop item ────────────────────────────────────────────────
export function getShopItemPrice(itemId: string): number | null {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  return item ? item.price : null;
}

export async function buyShopItemInDb(
  supabase: SupabaseClient,
  userId: string,
  itemId: string,
): Promise<BuyShopResult> {
  const fail = (error: string, partial?: Partial<BuyShopResult>): BuyShopResult => ({
    error,
    charged: false,
    coffeeCoins: partial?.coffeeCoins ?? 0,
    purchasedItems: partial?.purchasedItems ?? [],
    activeInstructorItem: partial?.activeInstructorItem ?? "coffee",
  });

  if (getShopItemPrice(itemId) === null) {
    return fail("Невідомий товар.");
  }

  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user?.id !== userId) {
    console.warn("buyShopItemInDb: no Supabase auth session for", userId);
    return fail("Потрібно перелогінитись (немає Supabase Auth сесії).");
  }

  // Price is resolved server-side — never trust client price; no client fallback (C1)
  const { data, error } = await supabase.rpc("buy_shop_item", {
    p_item_id: itemId,
  });

  if (error) {
    console.error("buy_shop_item RPC failed:", error);
    return fail("Не вдалося здійснити покупку. Спробуйте перелогінитись.");
  }

  if (data && typeof data === "object") {
    const payload = data as Record<string, unknown>;
    if (payload.error === "not_authenticated") {
      return fail("Потрібно перелогінитись (немає Supabase Auth сесії).");
    }
    if (payload.error === "insufficient_coins") {
      return fail("Недостатньо Кава-коїнів ☕");
    }
    if (payload.error === "profile_not_found") {
      return fail("Профіль не знайдено.");
    }
    if (payload.error === "unknown_item") {
      return fail("Невідомий товар.");
    }
    if (payload.error) {
      return fail(String(payload.error));
    }
    return {
      error: null,
      charged: Boolean(payload.charged),
      coffeeCoins: Number(payload.coffeeCoins ?? 0),
      purchasedItems: normalizePurchasedItems(payload.purchasedItems),
      activeInstructorItem: String(payload.activeInstructorItem ?? itemId),
    };
  }

  return fail("Не вдалося здійснити покупку. Спробуйте перелогінитись.");
}

// ─── Unequip shop item (equipment layer or refreshment → coffee) ──────────────
export async function unequipShopItemInDb(
  supabase: SupabaseClient,
  userId: string,
  itemId: string,
): Promise<UnequipShopResult> {
  const fail = (
    error: string,
    partial?: Partial<UnequipShopResult>,
  ): UnequipShopResult => ({
    error,
    coffeeCoins: partial?.coffeeCoins ?? 0,
    purchasedItems: partial?.purchasedItems ?? [],
    activeInstructorItem: partial?.activeInstructorItem ?? "coffee",
  });

  if (getShopItemPrice(itemId) === null) {
    return fail("Невідомий товар.");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user?.id !== userId) {
    console.warn("unequipShopItemInDb: no Supabase auth session for", userId);
    return fail("Потрібно перелогінитись (немає Supabase Auth сесії).");
  }

  const { data, error } = await supabase.rpc("unequip_shop_item", {
    p_item_id: itemId,
  });

  if (error) {
    console.error("unequip_shop_item RPC failed:", error);
    return fail("Не вдалося зняти предмет. Спробуйте перелогінитись.");
  }

  if (data && typeof data === "object") {
    const payload = data as Record<string, unknown>;
    if (payload.error === "not_authenticated") {
      return fail("Потрібно перелогінитись (немає Supabase Auth сесії).");
    }
    if (payload.error === "profile_not_found") {
      return fail("Профіль не знайдено.");
    }
    if (payload.error === "unknown_item") {
      return fail("Невідомий товар.");
    }
    if (payload.error === "not_unequippable") {
      return fail("Цей предмет не можна зняти.");
    }
    if (payload.error === "not_owned") {
      return fail("Предмет не у власності.");
    }
    if (payload.error) {
      return fail(String(payload.error));
    }
    return {
      error: null,
      coffeeCoins: Number(payload.coffeeCoins ?? 0),
      purchasedItems: normalizePurchasedItems(payload.purchasedItems),
      activeInstructorItem: String(payload.activeInstructorItem ?? "coffee"),
    };
  }

  return fail("Не вдалося зняти предмет. Спробуйте перелогінитись.");
}

// ─── Check & mark course as completed ────────────────────────────────────────
// Completion = every lesson has a reviewed answer with score, avg ≥ 60%
// Write path: mark_course_completed RPC only (C1 / P7)
// Server derives lesson ids from lms_lessons; p_lesson_ids kept for RPC signature.
export async function checkAndCompleteCourse(
  supabase: SupabaseClient,
  studentId: string,
  courseId: string,
  courses: Course[],
): Promise<boolean> {
  const course = courses.find((c) => c.id === courseId);
  if (!course) return false;

  const allLessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
  if (allLessonIds.length === 0) return false;

  const { data, error } = await supabase.rpc("mark_course_completed", {
    p_user_id: studentId,
    p_course_id: courseId,
    // Ignored by P7 RPC (DB is source of truth); still sent for signature compat.
    p_lesson_ids: allLessonIds,
  });

  if (error) {
    console.error("mark_course_completed RPC failed:", error);
    return false;
  }

  const payload = data as {
    error?: string;
    ok?: boolean;
    alreadyCompleted?: boolean;
  } | null;

  if (!payload || payload.error) {
    if (
      payload?.error &&
      payload.error !== "incomplete" &&
      payload.error !== "avg_too_low"
    ) {
      console.error("mark_course_completed:", payload.error);
    }
    return false;
  }

  return Boolean(payload.ok);
}
