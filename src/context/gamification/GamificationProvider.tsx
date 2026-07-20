"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import {
  type GamificationProfile,
  fetchGamificationProfile,
  processDailyStreak,
  buyShopItemInDb,
  DEFAULT_GAMIFICATION_PROFILE,
  type BuyShopResult,
} from "@/lib/gamification";
import { useAuth } from "@/context/auth";

export type InstructorMood = "happy" | "angry" | "proud";

interface GamificationContextValue {
  gamification: GamificationProfile | null;
  instructorMood: InstructorMood;
  setInstructorMood: React.Dispatch<React.SetStateAction<InstructorMood>>;
  refreshGamification: (uid?: string) => Promise<void>;
  buyShopItem: (itemId: string) => Promise<BuyShopResult>;
}

const GamificationContext = createContext<GamificationContextValue | undefined>(
  undefined,
);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { user, authReady, registerPostLoginHandler } = useAuth();
  const [gamification, setGamification] = useState<GamificationProfile | null>(
    null,
  );
  const [instructorMood, setInstructorMood] =
    useState<InstructorMood>("happy");

  const refreshGamification = useCallback(async (uid?: string) => {
    const id = uid ?? user?.id;
    if (!id) return;
    const profile = await fetchGamificationProfile(supabase, id);
    setGamification(profile ?? DEFAULT_GAMIFICATION_PROFILE);
  }, [user?.id]);

  const syncGamification = useCallback(
    async (uid?: string) => {
      const id = uid ?? user?.id;
      if (!id) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        if (!refreshed.session?.user?.id) {
          console.warn(
            "syncGamification: Supabase Auth session missing — daily streak skipped.",
            "Log out and log in again.",
          );
          await refreshGamification(id);
          return;
        }
      }

      const streakResult = await processDailyStreak(supabase, id);
      setInstructorMood(streakResult.wasStreakBroken ? "angry" : "happy");

      const profile = await fetchGamificationProfile(supabase, id);
      const base = profile ?? DEFAULT_GAMIFICATION_PROFILE;

      if (streakResult.coinsEarned > 0) {
        setGamification({
          ...base,
          streakCount: streakResult.newStreak,
          coffeeCoins: streakResult.newCoffeeCoins,
        });
        return;
      }

      setGamification(base);
    },
    [refreshGamification, user?.id],
  );

  const buyShopItem = useCallback(
    async (itemId: string): Promise<BuyShopResult> => {
      if (!user) {
        return {
          error: "Не авторизований",
          charged: false,
          coffeeCoins: gamification?.coffeeCoins ?? 0,
          purchasedItems: gamification?.purchasedItems ?? [],
          activeInstructorItem: gamification?.activeInstructorItem ?? "coffee",
        };
      }

      const result = await buyShopItemInDb(supabase, user.id, itemId);

      if (!result.error) {
        setGamification((prev) => ({
          ...(prev ?? DEFAULT_GAMIFICATION_PROFILE),
          coffeeCoins: result.coffeeCoins,
          purchasedItems: result.purchasedItems,
          activeInstructorItem: result.activeInstructorItem,
        }));
      }

      return result;
    },
    [gamification, user],
  );

  useEffect(() => {
    return registerPostLoginHandler(async (userId) => {
      await syncGamification(userId);
    });
  }, [registerPostLoginHandler, syncGamification]);

  useEffect(() => {
    if (!authReady || !user?.id) return;
    syncGamification(user.id);
  }, [authReady, user?.id, syncGamification]);

  useEffect(() => {
    if (!authReady || !user || gamification) return;
    syncGamification(user.id);
  }, [authReady, user, gamification, syncGamification]);

  return (
    <GamificationContext.Provider
      value={{
        gamification,
        instructorMood,
        setInstructorMood,
        refreshGamification,
        buyShopItem,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error("useGamification must be used within GamificationProvider");
  }
  return context;
}
