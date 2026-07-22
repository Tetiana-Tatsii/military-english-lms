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
  { id: "coffee",   name: "Coffee",         price: 0,  emoji: "☕", image: "/shop/coffee.webp",   kind: "refreshment", layer: "hand" },
  { id: "snickers", name: "Energy Bar",     price: 30, emoji: "🍫", image: "/shop/snickers.webp", kind: "refreshment", layer: "hand" },
  { id: "energy",   name: "Energy Drink",   price: 40, emoji: "🥤", image: "/shop/energy.webp",   kind: "refreshment", layer: "hand" },
  { id: "thermos",  name: "Thermo Cup",     price: 50, emoji: "🫖", image: "/shop/thermos.webp",  kind: "refreshment", layer: "hand" },
  { id: "boots",    name: "Tactical Boots", price: 60, emoji: "🥾", image: "/shop/boots.webp",    kind: "equipment",   layer: "boots" },
] as const;

/** Full equipment roadmap for art (Locked in UI until priced + assets ready). Boots already live in SHOP_ITEMS. */
export const EQUIPMENT_COMING_SOON: readonly EquipmentArtStub[] = [
  {
    id: "glasses",
    name: "Ballistic Glasses",
    nameUk: "Тактичні окуляри",
    emoji: "🕶️",
    layer: "glasses",
    artShop: "/shop/glasses.webp",
    artLayer: "/layers/glasses.webp",
  },
  {
    id: "gloves",
    name: "Tactical Gloves",
    nameUk: "Рукавички",
    emoji: "🧤",
    layer: "gloves",
    artShop: "/shop/gloves.webp",
    artLayer: "/layers/gloves.webp",
  },
  {
    id: "helmet",
    name: "Combat Helmet",
    nameUk: "Шолом",
    emoji: "⛑️",
    layer: "helmet",
    artShop: "/shop/helmet.webp",
    artLayer: "/layers/helmet.webp",
  },
  {
    id: "vest",
    name: "Plate Carrier",
    nameUk: "Бронежилет / розгрузка",
    emoji: "🦺",
    layer: "vest",
    artShop: "/shop/vest.webp",
    artLayer: "/layers/vest.webp",
  },
  {
    id: "radio",
    name: "Field Radio",
    nameUk: "Рація",
    emoji: "📻",
    layer: "radio",
    artShop: "/shop/radio.webp",
    artLayer: "/layers/radio.webp",
  },
  {
    id: "kneepads",
    name: "Knee Pads",
    nameUk: "Наколінники",
    emoji: "🦵",
    layer: "kneepads",
    artShop: "/shop/kneepads.webp",
    artLayer: "/layers/kneepads.webp",
  },
  {
    id: "belt",
    name: "Tactical Belt",
    nameUk: "Тактичний ремінь",
    emoji: "⛓️",
    layer: "belt",
    artShop: "/shop/belt.webp",
    artLayer: "/layers/belt.webp",
  },
  {
    id: "backpack",
    name: "Assault Pack",
    nameUk: "Рюкзак",
    emoji: "🎒",
    layer: "backpack",
    artShop: "/shop/backpack.webp",
    artLayer: "/layers/backpack.webp",
  },
  {
    id: "patch",
    name: "Unit Patch",
    nameUk: "Шеврон / патч",
    emoji: "🎖️",
    layer: "patch",
    artShop: "/shop/patch.webp",
    artLayer: "/layers/patch.webp",
  },
  {
    id: "headset",
    name: "Comms Headset",
    nameUk: "Гарнітура",
    emoji: "🎧",
    layer: "headset",
    artShop: "/shop/headset.webp",
    artLayer: "/layers/headset.webp",
  },
  {
    id: "watch",
    name: "Field Watch",
    nameUk: "Годинник",
    emoji: "⌚",
    layer: "watch",
    artShop: "/shop/watch.webp",
    artLayer: "/layers/watch.webp",
  },
];

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
  { id: "cat", name: "Tactical Cat", nameUk: "Тактичний кіт", emoji: "🐱", art: "/layers/companion-cat.webp", unlock: "Module 1" },
  { id: "dog", name: "Tactical Dog", nameUk: "Тактичний пес", emoji: "🐕", art: "/layers/companion-dog.webp", unlock: "Module 3" },
  { id: "drone", name: "Recon Drone", nameUk: "Дрон", emoji: "🛸", art: "/layers/companion-drone.webp", unlock: "Module 4" },
  { id: "victory", name: "Victory Cup", nameUk: "Кубок / proud Кава", emoji: "🏆", art: "/instructor/proud-victory.webp", unlock: "Module 5" },
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
    p_amount: amount,
  });

  if (error) {
    console.error("award_homework_coins RPC failed:", error.message);
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

/** Award coffee coins for a lesson quiz (1 correct answer = 1 coin). Idempotent via coin_ledger. */
export async function awardQuizCoins(
  supabase: SupabaseClient,
  lessonId: string,
): Promise<AwardQuizCoinsResult> {
  const empty: AwardQuizCoinsResult = {
    error: null,
    alreadyAwarded: false,
    coinsAwarded: 0,
    correctCount: 0,
    newCoffeeCoins: 0,
  };

  const { data, error } = await supabase.rpc("award_quiz_coins", {
    p_lesson_id: lessonId,
  });

  if (error) {
    console.error("award_quiz_coins RPC failed:", error.message);
    return { ...empty, error: error.message };
  }

  const payload = data as Record<string, unknown> | null;
  if (!payload) {
    return { ...empty, error: "empty_response" };
  }

  if (payload.error) {
    console.error("award_quiz_coins:", payload.error);
    return { ...empty, error: String(payload.error) };
  }

  return {
    error: null,
    alreadyAwarded: Boolean(payload.alreadyAwarded),
    coinsAwarded: Number(payload.coinsAwarded ?? 0),
    correctCount: Number(payload.correctCount ?? 0),
    newCoffeeCoins: Number(payload.newCoffeeCoins ?? 0),
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

// ─── Check & mark course as completed ────────────────────────────────────────
// Completion = every lesson has a reviewed answer with score, avg ≥ 60%
// Write path: mark_course_completed RPC only (C1)
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
