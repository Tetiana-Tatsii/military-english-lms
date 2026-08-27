"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  EQUIPMENT_ITEMS,
  REFRESHMENT_ITEMS,
  getShopItem,
  type BuyShopResult,
  type UnequipShopResult,
  type ShopCatalogItem,
} from "@/lib/gamification";
import type { GamificationProfile } from "@/context/AppContext";
import CoffeeCoinIcon from "@/components/ui/CoffeeCoinIcon";

interface VoentorgProps {
  gamification: GamificationProfile;
  isDarkMode: boolean;
  onBuy: (itemId: string) => Promise<BuyShopResult>;
  onUnequip: (itemId: string) => Promise<UnequipShopResult>;
  defaultOpen?: boolean;
}

export default function Voentorg({
  gamification,
  isDarkMode,
  onBuy,
  onUnequip,
  defaultOpen = false,
}: VoentorgProps) {
  const { coffeeCoins, purchasedItems, inventory } = gamification;
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [refreshmentsOpen, setRefreshmentsOpen] = useState(true);
  const [equipmentOpen, setEquipmentOpen] = useState(true);
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
    const owned = isOwned(item);
    if (!owned && coffeeCoins < item.price) {
      showToast("Недостатньо Кава-коїнів ☕", false);
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

  const handleUnequip = async (item: ShopCatalogItem) => {
    if (item.id === "coffee") return;

    setBuying(item.id);
    try {
      const result = await onUnequip(item.id);
      if (result.error) {
        showToast(result.error, false);
      } else if (item.kind === "refreshment") {
        showToast("Refreshment unequipped — coffee is back ☕", true);
      } else {
        showToast("Equipment unequipped ✅", true);
      }
    } catch {
      showToast("Unequip failed. Try logging in again.", false);
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
      item.id === "coffee" ? true : canPurchase || canActivate;
    const isLoading = buying === item.id;

    return (
      <div
        key={item.id}
        className="flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center transition-all duration-200"
        style={{
          background: cardBg(equipped),
          borderColor: border(equipped),
          opacity: canClick || equipped ? 1 : 0.5,
        }}
      >
        <div
          className="flex items-center justify-center overflow-hidden rounded-lg"
          style={{
            width: 80,
            height: 80,
            background: "transparent",
          }}
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
                parent.style.fontSize = "42px";
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
          <button
            onClick={() => handleUnequip(item)}
            disabled={isLoading}
            className="mt-auto max-w-full self-center rounded-lg px-3 py-1.5 text-xs font-bold transition-colors duration-200 cursor-pointer hover:bg-[#6b6b36]"
            style={{ background: "#8a8a45", color: "#fff" }}
          >
            {isLoading ? "..." : "Unequip"}
          </button>
        ) : (
          <button
            onClick={() => handleBuy(item)}
            disabled={(!canClick && !equipped) || isLoading}
            className={`mt-auto max-w-full self-center rounded-lg px-3 py-1.5 text-xs font-bold transition-colors duration-200 ${
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

  const sectionHeader = (
    label: string,
    open: boolean,
    onToggle: () => void,
  ) => (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="flex w-full items-center justify-between bg-transparent px-0 py-1 text-left"
    >
      <span
        className="text-xs font-bold uppercase tracking-wide"
        style={{ color: isDarkMode ? "#a3a198" : "#8a8a45" }}
      >
        {label}
      </span>
      <ChevronDown
        size={16}
        className="transition-transform duration-300"
        style={{
          color: isDarkMode ? "#a3a198" : "#8a8a45",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
        }}
      />
    </button>
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
          <div className="flex flex-col gap-4 p-4">
            <div>
              {sectionHeader("☕ Refreshments", refreshmentsOpen, () =>
                setRefreshmentsOpen((v) => !v),
              )}
              {refreshmentsOpen && (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
                  {REFRESHMENT_ITEMS.map(renderItemCard)}
                </div>
              )}
            </div>

            <div>
              {sectionHeader("🪖 Equipment", equipmentOpen, () =>
                setEquipmentOpen((v) => !v),
              )}
              {equipmentOpen && (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
                  {EQUIPMENT_ITEMS.map(renderItemCard)}
                </div>
              )}
            </div>
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
