"use client";

import CompassLoader from "./CompassLoader";

interface PageLoadingScreenProps {
  message: string;
  isDarkMode?: boolean;
}

export default function PageLoadingScreen({
  message,
  isDarkMode = false,
}: PageLoadingScreenProps) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 font-semibold"
      style={{
        background: isDarkMode ? "#1c1d1a" : "#f0e9d8",
        color: "#8a8a45",
      }}
    >
      <CompassLoader size={56} />
      <p className="text-lg">{message}</p>
    </div>
  );
}
