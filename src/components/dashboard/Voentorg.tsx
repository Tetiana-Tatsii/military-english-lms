"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  EQUIPMENT_COMING_SOON,
  EQUIPMENT_ITEMS,
  REFRESHMENT_ITEMS,
  getShopItem,
  type BuyShopResult,
  type ShopCatalogItem,
} from "@/lib/gamification";
import type { GamificationProfile } from "@/context/AppContext";
import CoffeeCoinIcon from "@/components/ui/CoffeeCoinIcon";

interface VoentorgProps {
  gamification: GamificationProfile;
  isDarkMode: boolean;
  onBuy: (itemId: string) => Promise<BuyShopResult>;
  defaultOpen?: boolean;
}

export default function Voentorg({
  gamification,
  isDarkMode,
  onBuy,
  defaultOpen = false,
}: VoentorgProps) {
  const { coffeeCoins, purchasedItems, inventory } = gamification;
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [buying, setBuying] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const isOwned = (item: ShopCatalogItem) =>
    item.price === 0 ||
    purchasedItems.includes(item.id) ||
    inventory.some((i) => i.itemId === item.id);

  const isEquipped = (item: ShopCatalogItem) => {
    const fromInv = inventory.find((i) => i.itemId === item.id);
    if (fromInv) return fromInv.equipped;
    if (item.kind === "refreshment") {
      return (
        inventory.find((i) => i.kind === "refreshment" && i.equipped)?.itemId ===
          item.id ||
        (!inventory.some((i) => i.kind === "refreshment" && i.equipped) &&
          gamification.activeInstructorItem === item.id)
      );
    }
    // equipment legacy
    return (
      gamification.activeInstructorItem === item.id ||
      (item.id === "boots" && purchasedItems.includes("boots") && !fromInv)
    );
  };

  const getSuccessMessage = (itemId: string, charged: boolean): string => {
    const item = getShopItem(itemId);
    if (itemId === "coffee") return "You made Instructor Kava happier ☕";
    if (item?.kind === "equipment") {
      return charged ? "Equipment purchased & equipped ✅" : "Equipment equipped ✅";
    }
    if (charged) return "Purchased! Refreshment updated ✅";
    return "Refreshment equipped! ✅";
  };

  const handleBuy = async (item: ShopCatalogItem) => {
    const equipped = isEquipped(item);
    if (item.id === "coffee" && equipped) {
      showToast("You made Instructor Kava happier ☕", true);
      return;
    }

    const owned = isOwned(item);
    if (!owned && coffeeCoins < item.price) {
      showToast("Недостатньо Кава-коїнів ☕", false);
      return;
    }

    // Equipment already equipped — no-op toast
    if (item.kind === "equipment" && owned && equipped) {
      showToast("Already equipped ✅", true);
      return;
    }

    setBuying(item.id);
    try {
      const result = await onBuy(item.id);
      if (result.error) {
        showToast(result.error, false);
      } else {
        showToast(getSuccessMessage(item.id, result.charged), true);
      }
    } catch {
      showToast("Purchase failed. Try logging in again.", false);
    } finally {
      setBuying(null);
    }
  };

  const cardBg = (active: boolean) =>
    active
      ? isDarkMode
        ? "#2a3020"
        : "#eef0df"
      : isDarkMode
        ? "#252622"
        : "#fff";

  const border = (active: boolean) =>
    active ? "#8a8a45" : isDarkMode ? "#3e403a" : "#e0dcd0";

  const renderItemCard = (item: ShopCatalogItem) => {
    const owned = isOwned(item);
    const equipped = isEquipped(item);
    const canPurchase = !owned && coffeeCoins >= item.price;
    const canActivate = owned && !equipped;
    const canClick =
      item.id === "coffee" ? true : canPurchase || canActivate || (owned && equipped);
    const isLoading = buying === item.id;

    return (
      <div
        key={item.id}
        className="flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-all duration-200"
        style={{
          background: cardBg(equipped),
          borderColor: border(equipped),
          opacity: canClick || equipped ? 1 : 0.5,
        }}
      >
        <div
          className="flex items-center justify-center overflow-hidden rounded-lg"
          style={{
            width: 64,
            height: 64,
            background: isDarkMode ? "#2d2f2a" : "#f0ede5",
          }}
        >
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover"
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

        <p
          className="text-xs font-bold"
          style={{ color: isDarkMode ? "#e6e4dc" : "#3a3528" }}
        >
          {item.name}
        </p>
        <p
          className="text-xs font-semibold flex items-center justify-center gap-1"
          style={{ color: "#8a8a45" }}
        >
          {item.price === 0 ? (
            "Free"
          ) : owned ? (
            "У власності"
          ) : (
            <>
              {item.price}
              <CoffeeCoinIcon />
            </>
          )}
        </p>

        {equipped && item.id !== "coffee" ? (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-bold"
            style={{ background: "#8a8a45", color: "#fff" }}
          >
            Equipped
          </span>
        ) : (
          <button
            onClick={() => handleBuy(item)}
            disabled={(!canClick && !equipped) || isLoading}
            className={`w-full rounded-lg px-2 py-1.5 text-xs font-bold transition-colors duration-200 ${
              (canClick || item.id === "coffee") && !isLoading
                ? "bg-[#8a8a45] text-white cursor-pointer hover:bg-[#6b6b36]"
                : "bg-[#e9e1cd] text-[#9a8f70] cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              "..."
            ) : item.id === "coffee" ? (
              <span className="inline-flex items-center justify-center gap-1">
                Give coffee
                <CoffeeCoinIcon />
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
  };

  const sectionTitle = (label: string) => (
    <p
      className="col-span-2 text-xs font-bold uppercase tracking-wide pt-1"
      style={{ color: isDarkMode ? "#a3a198" : "#8a8a45" }}
    >
      {label}
    </p>
  );

  return (
    <div
      className="w-full rounded-2xl border overflow-hidden"
      style={{
        background: isDarkMode ? "#2d2f2a" : "#f6f1e4",
        borderColor: isDarkMode ? "#3e403a" : "#d8cdb4",
      }}
    >
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`flex w-full items-center justify-between bg-transparent px-5 py-4 text-left transition-colors ${
          isOpen
            ? `border-b ${isDarkMode ? "border-[#3e403a]" : "border-[#e8e2d4]"} rounded-t-2xl`
            : "rounded-2xl"
        }`}
      >
        <span
          className="font-bold"
          style={{ color: isDarkMode ? "#e6e4dc" : "#3a3528" }}
        >
          🛒 Post Exchange Store & Coffee
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold" style={{ color: "#8a8a45" }}>
              {coffeeCoins}
            </span>
            <CoffeeCoinIcon />
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

      {isOpen && (
        <>
          <div className="grid grid-cols-2 gap-3 p-4">
            {sectionTitle("☕ Refreshments")}
            {REFRESHMENT_ITEMS.map(renderItemCard)}

            {sectionTitle("🪖 Equipment")}
            {EQUIPMENT_ITEMS.map(renderItemCard)}

            {EQUIPMENT_COMING_SOON.map((stub) => (
              <div
                key={stub.id}
                className="flex flex-col items-center gap-2 rounded-lg border p-3 text-center opacity-80"
                style={{
                  background: isDarkMode ? "#252622" : "#fff",
                  borderColor: isDarkMode ? "#3e403a" : "#e0dcd0",
                }}
              >
                <div
                  className="flex items-center justify-center rounded-lg text-3xl"
                  style={{
                    width: 64,
                    height: 64,
                    background: isDarkMode ? "#2d2f2a" : "#f0ede5",
                  }}
                >
                  {stub.emoji}
                </div>
                <p
                  className="text-xs font-bold leading-tight"
                  style={{ color: isDarkMode ? "#e6e4dc" : "#3a3528" }}
                >
                  {stub.name}
                </p>
                <p
                  className="text-[10px] leading-tight"
                  style={{ color: isDarkMode ? "#a3a198" : "#6b6560" }}
                >
                  {stub.nameUk}
                </p>
                <p
                  className="text-[9px] font-mono leading-tight break-all px-0.5"
                  style={{ color: "#9a8f70" }}
                  title="Файли для дизайнера"
                >
                  {stub.artShop}
                  <br />
                  {stub.artLayer}
                </p>
                <p className="text-[10px] font-semibold" style={{ color: "#9a8f70" }}>
                  Coming soon · layer: {stub.layer}
                </p>
                <span className="w-full rounded-lg px-2 py-1.5 text-xs font-bold bg-[#e9e1cd] text-[#9a8f70]">
                  Locked
                </span>
              </div>
            ))}
          </div>

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
