import type { SupabaseClient } from "@supabase/supabase-js";
import type { Course } from "@/context/AppContext";

export interface GamificationProfile {
  coffeeCoins: number;
  streakCount: number;
  activeInstructorItem: string;
  purchasedItems: string[];
  completedCourses: string[];
}

// Shop catalogue — add new items here anytime without touching business logic
export const SHOP_ITEMS = [
  { id: "coffee",   name: "Coffee",      price: 0,  emoji: "☕", image: "/shop/coffee.webp"   },
  { id: "snickers", name: "Energy Bar",  price: 30, emoji: "🍫", image: "/shop/snickers.webp" },
  { id: "energy",   name: "Energy Drink",price: 40, emoji: "🥤", image: "/shop/energy.webp"   },
  { id: "thermos",  name: "Thermo Cup",  price: 50, emoji: "🫖", image: "/shop/thermos.webp"  },
] as const;

export type ShopItemId = (typeof SHOP_ITEMS)[number]["id"];

// Course badge definitions — one badge per course
export const COURSE_BADGES: Record<string, { name: string; image: string; emoji: string }> = {
  "military-english-stanag-2": {
    name: "STANAG 6001",
    image: "/badges/stanag-gold.webp",
    emoji: "🎖️",
  },
  "general-english": {
    name: "General English",
    image: "/badges/general-gold.webp",
    emoji: "🏅",
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
    purchasedItems:       (data.purchased_items       as string[]) ?? [],
    completedCourses:     (data.completed_courses     as string[]) ?? [],
  };
}

// ─── Daily streak + login reward ──────────────────────────────────────────────
export async function processDailyStreak(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ coinsEarned: number; newStreak: number; isMilestone: boolean; wasStreakBroken: boolean }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("last_login_date, streak_count, coffee_coins")
    .eq("id", userId)
    .single();

  if (!profile) return { coinsEarned: 0, newStreak: 0, isMilestone: false, wasStreakBroken: false };

  const today = new Date().toISOString().split("T")[0];
  const lastLogin = profile.last_login_date as string | null;

  if (lastLogin === today) {
    return { coinsEarned: 0, newStreak: profile.streak_count, isMilestone: false, wasStreakBroken: false };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const isConsecutive = lastLogin === yesterdayStr;
  const newStreak = isConsecutive ? (profile.streak_count ?? 0) + 1 : 1;
  const isMilestone = newStreak % 7 === 0;
  const coinsEarned = isMilestone ? 7 : 1;

  await supabase
    .from("profiles")
    .update({
      last_login_date: today,
      streak_count: newStreak,
      coffee_coins: (profile.coffee_coins ?? 0) + coinsEarned,
    })
    .eq("id", userId);

  return { coinsEarned, newStreak, isMilestone, wasStreakBroken: !isConsecutive && !!lastLogin };
}

// ─── Award coins (atomic-safe for low-concurrency apps) ───────────────────────
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
// If the item is already owned (or free), just activates it without charging.
export async function buyShopItemInDb(
  supabase: SupabaseClient,
  userId: string,
  itemId: string,
  price: number,
): Promise<string | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("coffee_coins, purchased_items")
    .eq("id", userId)
    .single();

  if (!profile) return "Профіль не знайдено.";

  const purchased = (profile.purchased_items as string[]) ?? [];
  const alreadyOwned = price === 0 || purchased.includes(itemId);

  if (!alreadyOwned && (profile.coffee_coins ?? 0) < price) {
    return "Недостатньо Кава-коїнів ☕";
  }

  await supabase
    .from("profiles")
    .update({
      coffee_coins: alreadyOwned ? profile.coffee_coins : (profile.coffee_coins ?? 0) - price,
      purchased_items: alreadyOwned ? purchased : [...purchased, itemId],
      active_instructor_item: itemId,
    })
    .eq("id", userId);

  return null; // success
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
