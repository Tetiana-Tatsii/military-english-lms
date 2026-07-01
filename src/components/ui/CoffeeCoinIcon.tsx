"use client";

const COIN_SRC = "/coins/coffee-coin_open.webp";

/** Єдиний розмір іконки коїна в балансі та магазині */
export default function CoffeeCoinIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <img
      src={COIN_SRC}
      alt=""
      aria-hidden
      className={`flex-shrink-0 object-contain ${className}`}
    />
  );
}
