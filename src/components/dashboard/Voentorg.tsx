"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SHOP_ITEMS } from "@/lib/gamification";
import type { GamificationProfile } from "@/context/AppContext";

interface VoentorgProps {
  gamification: GamificationProfile;
  isDarkMode: boolean;
  onBuy: (itemId: string, price: number) => Promise<string | null>;
  defaultOpen?: boolean;
}

export default function Voentorg({ gamification, isDarkMode, onBuy, defaultOpen = false }: VoentorgProps) {
  const { coffeeCoins, purchasedItems, activeInstructorItem } = gamification;
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [buying, setBuying] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const getSuccessMessage = (itemId: string, wasOwned: boolean): string => {
    if (itemId === "coffee") return "You made Instructor Kava happier ☕";
    if (wasOwned) return "Item equipped! ✅";
    return "Purchased! Instructor updated ✅";
  };

  const handleBuy = async (itemId: string, price: number, alreadyOwned: boolean, isCurrentlyActive: boolean) => {
    // Coffee already active — just show happy message, no DB call needed
    if (itemId === "coffee" && isCurrentlyActive) {
      showToast("You made Instructor Kava happier ☕", true);
      return;
    }

    setBuying(itemId);
    try {
      const err = await onBuy(itemId, price);
      if (err) {
        showToast(err, false);
      } else {
        showToast(getSuccessMessage(itemId, alreadyOwned), true);
      }
    } catch {
      showToast(getSuccessMessage(itemId, alreadyOwned), true);
    } finally {
      setBuying(null);
    }
  };

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: isDarkMode ? "#2d2f2a" : "#f6f1e4",
        borderColor: isDarkMode ? "#3e403a" : "#d8cdb4",
      }}
    >
      {/* Accordion header — always visible, click to toggle */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors"
        style={{
          borderBottom: isOpen ? (isDarkMode ? "1px solid #3e403a" : "1px solid #e8e2d4") : "none",
          background: "transparent",
          border: isOpen ? undefined : "none",
          borderRadius: isOpen ? "1rem 1rem 0 0" : "1rem",
        }}
      >
        <span className="font-bold" style={{ color: isDarkMode ? "#e6e4dc" : "#3a3528" }}>
          🛒 Post Exchange Store & Coffee
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold" style={{ color: "#8a8a45" }}>
            {coffeeCoins} ☕
          </span>
          <ChevronDown
            size={18}
            className="transition-transform duration-300"
            style={{
              color: isDarkMode ? "#a3a198" : "#8a8a45",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </div>
      </button>

      {/* Collapsible content */}
      {isOpen && (
        <>
      {/* Items grid */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {SHOP_ITEMS.map((item) => {
          // Coffee (price=0) is always considered owned
          const owned = item.price === 0 || purchasedItems.includes(item.id);
          const isActive = activeInstructorItem === item.id;
          const canAfford = item.price === 0 || owned || coffeeCoins >= item.price;
          const isLoading = buying === item.id;

          return (
            <div
              key={item.id}
              className="flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-all duration-200"
              style={{
                background: isActive
                  ? (isDarkMode ? "#2a3020" : "#eef0df")
                  : (isDarkMode ? "#252622" : "#fff"),
                borderColor: isActive ? "#8a8a45" : (isDarkMode ? "#3e403a" : "#e0dcd0"),
                opacity: !canAfford ? 0.5 : 1,
              }}
            >
              {/* Item image */}
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
                {item.price === 0 ? "Free" : `${item.price} ☕`}
              </p>

              {/* Coffee is always clickable — shows happy toast even when active */}
              {isActive && item.id !== "coffee" ? (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{ background: "#8a8a45", color: "#fff" }}
                >
                  Equipped
                </span>
              ) : (
                <button
                  onClick={() => handleBuy(item.id, item.price, owned, isActive)}
                  disabled={!canAfford || isLoading}
                  className="w-full rounded-md px-2 py-1 text-xs font-bold transition-all duration-150"
                  style={{
                    background: canAfford ? "#3a3528" : "#c0bcb0",
                    color: "#fff",
                    border: "none",
                    cursor: canAfford && !isLoading ? "pointer" : "not-allowed",
                  }}
                  onMouseEnter={(e) => {
                    if (canAfford && !isLoading) e.currentTarget.style.background = "#5a5440";
                  }}
                  onMouseLeave={(e) => {
                    if (canAfford && !isLoading) e.currentTarget.style.background = "#3a3528";
                  }}
                >
                  {isLoading ? "..." : item.id === "coffee" ? "Give coffee ☕" : owned ? "Activate" : "Buy"}
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
        </>
      )}
    </div>
  );
}
