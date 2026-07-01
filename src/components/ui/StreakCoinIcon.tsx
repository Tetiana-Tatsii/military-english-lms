"use client";

const COIN_OPEN = "/coins/coffee-coin_open.webp";
const COIN_LOCKED = "/coins/coffee-coin_locked.webp";

/** Монети streak — responsive розміри як раніше */
export default function StreakCoinIcon({
  filled,
  className = "h-7 w-7 sm:h-10 sm:w-10 md:h-[56px] md:w-[56px] lg:h-[72px] lg:w-[72px] object-contain flex-shrink-0 transition-all duration-300",
}: {
  filled: boolean;
  className?: string;
}) {
  return (
    <img
      src={filled ? COIN_OPEN : COIN_LOCKED}
      alt=""
      aria-hidden
      className={`${className}`}
      style={{ opacity: filled ? 1 : 0.55 }}
    />
  );
}
