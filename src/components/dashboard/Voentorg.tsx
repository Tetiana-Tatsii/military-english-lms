"use client";

import React, { useState } from "react";
import { SHOP_ITEMS } from "@/lib/gamification";
import type { GamificationProfile } from "@/context/AppContext";

interface VoentorgProps {
  gamification: GamificationProfile;
  isDarkMode: boolean;
  onBuy: (itemId: string, price: number) => Promise<string | null>;
}

export default function Voentorg({ gamification, isDarkMode, onBuy }: VoentorgProps) {
  const { coffeeCoins, purchasedItems, activeInstructorItem } = gamification;
  const [buying, setBuying] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleBuy = async (itemId: string, price: number) => {
    setBuying(itemId);
    const err = await onBuy(itemId, price);
    if (err) {
      showToast(err, false);
    } else {
      showToast("Придбано! Інструктор оновлено ✅", true);
    }
    setBuying(null);
  };

  return (
    <div
      className="rounded-xl border"
      style={{
        background: isDarkMode ? "#2d2f2a" : "#f6f1e4",
        borderColor: isDarkMode ? "#3e403a" : "#d8cdb4",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: isDarkMode ? "1px solid #3e403a" : "1px solid #e8e2d4" }}
      >
        <span className="font-bold" style={{ color: isDarkMode ? "#e6e4dc" : "#3a3528" }}>
          🛒 Воєнторг &amp; Кофейня
        </span>
        <span className="text-lg font-bold" style={{ color: "#8a8a45" }}>
          {coffeeCoins} ☕
        </span>
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {SHOP_ITEMS.map((item) => {
          const owned = purchasedItems.includes(item.id);
          const isActive = activeInstructorItem === item.id;
          const canAfford = coffeeCoins >= item.price;
          const isLoading = buying === item.id;

          return (
            <div
              key={item.id}
              className="flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-all"
              style={{
                background: isActive
                  ? (isDarkMode ? "#2a3020" : "#eef0df")
                  : (isDarkMode ? "#252622" : "#fff"),
                borderColor: isActive
                  ? "#8a8a45"
                  : (isDarkMode ? "#3e403a" : "#e0dcd0"),
                opacity: !canAfford && !owned ? 0.6 : 1,
              }}
            >
              {/* Item image with emoji fallback */}
              <div
                className="flex items-center justify-center overflow-hidden rounded-lg"
                style={{ width: 64, height: 64, background: isDarkMode ? "#2d2f2a" : "#f0ede5" }}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent) {
                      parent.style.fontSize = "36px";
                      parent.textContent = item.emoji;
                    }
                  }}
                />
              </div>

              <p className="text-xs font-bold" style={{ color: isDarkMode ? "#e6e4dc" : "#3a3528" }}>
                {item.name}
              </p>
              <p className="text-xs font-semibold" style={{ color: "#8a8a45" }}>
                {item.price} ☕
              </p>

              {isActive ? (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{ background: "#8a8a45", color: "#fff" }}
                >
                  Активний
                </span>
              ) : (
                <button
                  onClick={() => handleBuy(item.id, item.price)}
                  disabled={!canAfford || isLoading}
                  className="w-full rounded-md px-2 py-1 text-xs font-bold transition-opacity"
                  style={{
                    background: canAfford ? "#3a3528" : "#c0bcb0",
                    color: "#fff",
                    border: "none",
                    cursor: canAfford && !isLoading ? "pointer" : "not-allowed",
                  }}
                >
                  {isLoading ? "..." : owned ? "Активувати" : "Придбати"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="mx-4 mb-4 rounded-lg px-4 py-2 text-sm font-semibold"
          style={{
            background: toast.ok ? "#eef0df" : "#fdeced",
            color: toast.ok ? "#8a8a45" : "#c97a4a",
            border: `1px solid ${toast.ok ? "#8a8a45" : "#c97a4a"}`,
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
