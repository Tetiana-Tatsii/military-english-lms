"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SHOP_ITEMS, type BuyShopResult } from "@/lib/gamification";
import type { GamificationProfile } from "@/context/AppContext";

interface VoentorgProps {
  gamification: GamificationProfile;
  isDarkMode: boolean;
  onBuy: (itemId: string, price: number) => Promise<BuyShopResult>;
  defaultOpen?: boolean;
}

const COIN_OPEN = "/coins/coffee-coin_open.webp";

function CoffeeCoin({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <img
      src={COIN_OPEN}
      alt="coffee coin"
      className={`object-contain flex-shrink-0 ${className}`}
    />
  );
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

  const getSuccessMessage = (itemId: string, charged: boolean): string => {
    if (itemId === "coffee") return "You made Instructor Kava happier ☕";
    if (charged) return "Purchased! Instructor updated ✅";
    return "Item equipped! ✅";
  };

  const handleBuy = async (itemId: string, price: number, isCurrentlyActive: boolean) => {
    // Coffee already active — just show happy message, no DB call needed
    if (itemId === "coffee" && isCurrentlyActive) {
      showToast("You made Instructor Kava happier ☕", true);
      return;
    }

    setBuying(itemId);
    try {
      const result = await onBuy(itemId, price);
      if (result.error) {
        showToast(result.error, false);
      } else {
        showToast(getSuccessMessage(itemId, result.charged), true);
      }
    } catch {
      showToast("Purchase failed. Try logging in again.", false);
    } finally {
      setBuying(null);
    }
  };

  return (
    <div
      className="w-full rounded-2xl border overflow-hidden"
      style={{
        background: isDarkMode ? "#2d2f2a" : "#f6f1e4",
        borderColor: isDarkMode ? "#3e403a" : "#d8cdb4",
      }}
    >
      {/* Accordion header — always visible, click to toggle */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`flex w-full items-center justify-between bg-transparent px-5 py-4 text-left transition-colors ${
          isOpen
            ? `border-b ${isDarkMode ? "border-[#3e403a]" : "border-[#e8e2d4]"} rounded-t-2xl`
            : "rounded-2xl"
        }`}
      >
        <span className="font-bold" style={{ color: isDarkMode ? "#e6e4dc" : "#3a3528" }}>
          🛒 Post Exchange Store & Coffee
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5">
            <span className="text-sm font-bold" style={{ color: "#8a8a45" }}>
              {coffeeCoins}
            </span>
            <CoffeeCoin />
          </div>
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
          const owned = item.price === 0 || purchasedItems.includes(item.id);
          const isActive = activeInstructorItem === item.id;
          const canAfford = owned || coffeeCoins >= item.price;
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
              <p className="text-xs font-semibold flex items-center justify-center gap-0.5" style={{ color: "#8a8a45" }}>
                {item.price === 0 ? (
                  "Free"
                ) : (
                  <>
                    {item.price}
                    <CoffeeCoin className="w-3.5 h-3.5" />
                  </>
                )}
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
                  onClick={() => handleBuy(item.id, item.price, isActive)}
                  disabled={!canAfford || isLoading}
                  className={`w-full rounded-lg px-2 py-1.5 text-xs font-bold transition-colors duration-200 ${
                    canAfford && !isLoading
                      ? "bg-[#8a8a45] text-white cursor-pointer hover:bg-[#6b6b36]"
                      : "bg-[#e9e1cd] text-[#9a8f70] cursor-not-allowed"
                  }`}
                >
                  {isLoading ? (
                    "..."
                  ) : item.id === "coffee" ? (
                    <span className="inline-flex items-center justify-center gap-1">
                      Give coffee
                      <CoffeeCoin className="w-3.5 h-3.5" />
                    </span>
                  ) : owned ? (
                    "Activate"
                  ) : (
                    "Buy"
                  )}
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
