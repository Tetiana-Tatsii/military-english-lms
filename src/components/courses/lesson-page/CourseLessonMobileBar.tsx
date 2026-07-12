"use client";

import { ArrowLeft, Menu } from "lucide-react";
interface CourseLessonMobileBarProps {
  isDarkMode: boolean;
  onOpenSidebar: () => void;
  onBackToDashboard: () => void;
}

export default function CourseLessonMobileBar({
  isDarkMode,
  onOpenSidebar,
  onBackToDashboard,
}: CourseLessonMobileBarProps) {
  return (
    <div
      className="flex shrink-0 items-center justify-between px-4 py-2 xl:hidden"
      style={{
        borderBottom: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
        background: isDarkMode ? "#2a2c27" : "#f0ede5",
      }}
    >
      <button
        onClick={onOpenSidebar}
        style={{
          background: "transparent",
          border: "none",
          color: isDarkMode ? "#d8cdb4" : "#8a8a45",
          cursor: "pointer",
          padding: 4,
        }}
      >
        <Menu size={24} />
      </button>
      <button
        onClick={onBackToDashboard}
        style={{
          background: "transparent",
          border: "none",
          color: isDarkMode ? "#d8cdb4" : "#8a8a45",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: 0,
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        <ArrowLeft size={16} /> Кабінет
      </button>
    </div>
  );
}
