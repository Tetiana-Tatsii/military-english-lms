import type { SupabaseClient } from "@supabase/supabase-js";
import type { Course } from "@/context/AppContext";

export interface GamificationProfile {
  coffeeCoins: number;
  streakCount: number;
  activeInstructorItem: string;
  purchasedItems: string[];
  completedCourses: string[];
}

export const DEFAULT_GAMIFICATION_PROFILE: GamificationProfile = {
  coffeeCoins: 0,
  streakCount: 0,
  activeInstructorItem: "coffee",
  purchasedItems: [],
  completedCourses: [],
};

// Shop catalogue — add new items here anytime without touching business logic
export const SHOP_ITEMS = [
  { id: "coffee",   name: "Coffee",         price: 0,  emoji: "☕", image: "/shop/coffee.webp"   },
  { id: "snickers", name: "Energy Bar",     price: 30, emoji: "🍫", image: "/shop/snickers.webp" },
  { id: "energy",   name: "Energy Drink",   price: 40, emoji: "🥤", image: "/shop/energy.webp"   },
  { id: "thermos",  name: "Thermo Cup",     price: 50, emoji: "🫖", image: "/shop/thermos.webp"  },
  { id: "boots",    name: "Tactical Boots", price: 60, emoji: "🥾", image: "/shop/boots.webp"    },
] as const;

export type ShopItemId = (typeof SHOP_ITEMS)[number]["id"];

export interface BuyShopResult {
  error: string | null;
  charged: boolean;
  coffeeCoins: number;
  purchasedItems: string[];
  activeInstructorItem: string;
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

  return {
    coffeeCoins:          data.coffee_coins          ?? 0,
    streakCount:          data.streak_count           ?? 0,
    activeInstructorItem: data.active_instructor_item ?? "coffee",
    purchasedItems:       normalizePurchasedItems(data.purchased_items),
    completedCourses:     normalizeStringArray(data.completed_courses),
  };
}

// ─── Date helpers (UTC — збігається з CURRENT_DATE у Supabase RPC) ─────────────
function toLocalDateStr(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function normalizeDate(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

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

  // Prefer server RPC — atomic, bypasses RLS, uses auth.uid()
  if (session?.user?.id === userId) {
    const { data, error } = await supabase.rpc("process_daily_streak");

    if (!error && data && typeof data === "object") {
      const payload = data as Record<string, unknown>;
      if (payload.error) {
        console.error("processDailyStreak RPC:", payload.error);
      } else {
        return parseStreakRpc(payload);
      }
    }

    if (error?.code !== "PGRST202") {
      // PGRST202 = function not found (migration not applied yet) → fallback below
      console.error("processDailyStreak RPC failed:", error);
    }
  } else {
    console.warn(
      "processDailyStreak: no Supabase auth session for user",
      userId,
      "— streak not processed. Re-login required.",
    );
  }

  // Client fallback (requires RLS UPDATE on profiles)
  const { data: profile, error: readError } = await supabase
    .from("profiles")
    .select("last_login_date, streak_count, coffee_coins")
    .eq("id", userId)
    .single();

  const currentCoins = profile?.coffee_coins ?? 0;
  const currentStreak = profile?.streak_count ?? 0;

  if (readError || !profile) {
    console.error("processDailyStreak: failed to read profile:", readError);
    return emptyStreakResult();
  }

  const today = toLocalDateStr();
  const lastLogin = normalizeDate(profile.last_login_date as string | null);

  if (lastLogin === today) {
    return emptyStreakResult({
      newStreak: currentStreak,
      newCoffeeCoins: currentCoins,
      isMilestone: currentStreak > 0 && currentStreak % 7 === 0,
    });
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toLocalDateStr(yesterday);

  const isConsecutive = lastLogin === yesterdayStr;
  const newStreak = isConsecutive ? currentStreak + 1 : 1;
  const isMilestone = newStreak % 7 === 0;
  const coinsEarned = isMilestone ? 7 : 1;
  const newCoffeeCoins = currentCoins + coinsEarned;

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update({
      last_login_date: today,
      streak_count: newStreak,
      coffee_coins: newCoffeeCoins,
    })
    .eq("id", userId)
    .select("coffee_coins, streak_count")
    .single();

  if (updateError || !updated) {
    console.error(
      "processDailyStreak: update blocked or failed (check RLS / auth session):",
      updateError,
    );
    return emptyStreakResult({
      newStreak: currentStreak,
      newCoffeeCoins: currentCoins,
    });
  }

  return {
    coinsEarned,
    newStreak: updated.streak_count ?? newStreak,
    newCoffeeCoins: updated.coffee_coins ?? newCoffeeCoins,
    isMilestone,
    wasStreakBroken: !isConsecutive && !!lastLogin,
  };
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

/** @deprecated Use awardHomeworkCoins — direct profile update blocked by RLS for teachers */
export async function awardCoins(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
): Promise<void> {
  if (amount <= 0) return;
  const { data } = await supabase
    .from("profiles")
    .select("coffee_coins")
    .eq("id", userId)
    .single();
  if (!data) return;
  await supabase
    .from("profiles")
    .update({ coffee_coins: (data.coffee_coins ?? 0) + amount })
    .eq("id", userId);
}

// ─── Buy or activate shop item ────────────────────────────────────────────────
export async function buyShopItemInDb(
  supabase: SupabaseClient,
  userId: string,
  itemId: string,
  price: number,
): Promise<BuyShopResult> {
  const fail = (error: string, partial?: Partial<BuyShopResult>): BuyShopResult => ({
    error,
    charged: false,
    coffeeCoins: partial?.coffeeCoins ?? 0,
    purchasedItems: partial?.purchasedItems ?? [],
    activeInstructorItem: partial?.activeInstructorItem ?? "coffee",
  });

  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user?.id === userId) {
    const { data, error } = await supabase.rpc("buy_shop_item", {
      p_item_id: itemId,
      p_price: price,
    });

    if (!error && data && typeof data === "object") {
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

    if (error?.code !== "PGRST202") {
      console.error("buy_shop_item RPC failed:", error);
    }
  } else {
    console.warn("buyShopItemInDb: no Supabase auth session for", userId);
  }

  const { data: profile, error: readError } = await supabase
    .from("profiles")
    .select("coffee_coins, purchased_items, active_instructor_item")
    .eq("id", userId)
    .single();

  if (readError || !profile) {
    return fail("Профіль не знайдено.");
  }

  const purchased = normalizePurchasedItems(profile.purchased_items);
  const alreadyOwned = price === 0 || purchased.includes(itemId);
  const currentCoins = profile.coffee_coins ?? 0;

  if (!alreadyOwned && currentCoins < price) {
    return fail("Недостатньо Кава-коїнів ☕", {
      coffeeCoins: currentCoins,
      purchasedItems: purchased,
      activeInstructorItem: profile.active_instructor_item ?? "coffee",
    });
  }

  const newCoins = alreadyOwned ? currentCoins : currentCoins - price;
  const newPurchased = alreadyOwned ? purchased : [...purchased, itemId];

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update({
      coffee_coins: newCoins,
      purchased_items: newPurchased,
      active_instructor_item: itemId,
    })
    .eq("id", userId)
    .select("coffee_coins, purchased_items, active_instructor_item")
    .single();

  if (updateError || !updated) {
    console.error("buyShopItemInDb: update blocked (check RLS / auth session):", updateError);
    return fail("Не вдалося здійснити покупку. Спробуйте перелогінитись.", {
      coffeeCoins: currentCoins,
      purchasedItems: purchased,
      activeInstructorItem: profile.active_instructor_item ?? "coffee",
    });
  }

  return {
    error: null,
    charged: !alreadyOwned && price > 0,
    coffeeCoins: updated.coffee_coins ?? newCoins,
    purchasedItems: normalizePurchasedItems(updated.purchased_items),
    activeInstructorItem: updated.active_instructor_item ?? itemId,
  };
}

// ─── Check & mark course as completed ────────────────────────────────────────
// Completion = every lesson has a reviewed answer with score, avg ≥ 60%
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

  const { data: reviewedAnswers } = await supabase
    .from("answers")
    .select("lesson_id, score")
    .eq("user_id", studentId)
    .eq("course_id", courseId)
    .eq("status", "reviewed")
    .not("score", "is", null);

  if (!reviewedAnswers || reviewedAnswers.length === 0) return false;

  const reviewedLessonIds = new Set(reviewedAnswers.map((a) => a.lesson_id as string));
  const allReviewed = allLessonIds.every((id) => reviewedLessonIds.has(id));
  if (!allReviewed) return false;

  const scores = reviewedAnswers.map((a) => a.score as number);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (avgScore < 60) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("completed_courses")
    .eq("id", studentId)
    .single();

  if (!profile) return false;

  const completed = (profile.completed_courses as string[]) ?? [];
  if (completed.includes(courseId)) return true;

  await supabase
    .from("profiles")
    .update({ completed_courses: [...completed, courseId] })
    .eq("id", studentId);

  return true;
}
