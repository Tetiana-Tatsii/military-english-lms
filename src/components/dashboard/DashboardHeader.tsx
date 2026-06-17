"use client";

import React, { useState } from "react";
import { Shield, LogOut, ChevronDown, Sun, Moon, LifeBuoy } from "lucide-react";
import SupportModal from "./SupportModal";

interface DashboardHeaderProps {
  userName: string;
  isProfileOpen: boolean;
  isDarkMode: boolean;
  onProfileToggle: () => void;
  onDarkModeToggle: () => void;
  onLogout: () => void;
}

export default function DashboardHeader({
  userName,
  isProfileOpen,
  isDarkMode,
  onProfileToggle,
  onDarkModeToggle,
  onLogout,
}: DashboardHeaderProps) {
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  return (
    <div
      className={`flex items-center justify-between border-b px-6 py-4 ${
        isDarkMode
          ? "bg-[#3a3326] border-[#4a4231]"
          : "bg-[#f6f1e4] border-[#d8cdb4]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#8a8a45]">
          <Shield size={20} color="#f6f1e4" />
        </div>
        <div>
          <p
            className={`text-base font-semibold ${
              isDarkMode ? "text-white" : "text-[#3a3528]"
            }`}
          >
            MILITARY LMS
          </p>
          <p className="text-xs text-[#9a8f70]">Навчальний центр</p>
        </div>
      </div>

      {/* ПРОФІЛЬ */}
      <div className="relative">
        <div
          onClick={onProfileToggle}
          className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 transition-colors ${
            isProfileOpen
              ? isDarkMode
                ? "bg-[#4a4231]"
                : "bg-[#e9e1cd]"
              : "bg-transparent"
          }`}
        >
          <div className="text-right">
            <span
              className={`block text-sm font-semibold ${
                isDarkMode ? "text-white" : "text-[#3a3528]"
              }`}
            >
              {userName}
            </span>
          </div>
          <ChevronDown
            size={16}
            color="#8a8a45"
            style={{
              transform: isProfileOpen ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
            }}
          />
        </div>

        {/* ВИПАДАЮЧЕ МЕНЮ */}
        {isProfileOpen && (
          <div
            className={`absolute right-0 top-[110%] w-[220px] rounded-xl border p-2 shadow-lg ${
              isDarkMode
                ? "bg-[#3a3326] border-[#4a4231]"
                : "bg-white border-[#d8cdb4]"
            }`}
            style={{ zIndex: 100 }}
          >
            <button
              onClick={onDarkModeToggle}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-black/5"
              style={{
                color: isDarkMode ? "#d8cdb4" : "#5a5440",
              }}
            >
              {isDarkMode ? (
                <Sun size={16} color="#c79a3e" />
              ) : (
                <Moon size={16} color="#8a8a45" />
              )}
              <span>{isDarkMode ? "Світла тема" : "Темна тема"}</span>
            </button>
            <button
              onClick={() => setIsSupportModalOpen(true)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-black/5"
              style={{
                color: isDarkMode ? "#d8cdb4" : "#5a5440",
              }}
            >
              <LifeBuoy size={16} color="#8a8a45" />
              <span>Підтримка</span>
            </button>
            <hr
              className={`my-1.5 border-none ${
                isDarkMode ? "border-t border-[#4a4231]" : "border-t border-[#e9e1cd]"
              }`}
            />
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-black/5"
              style={{
                background: isDarkMode ? "#4e2d2d" : "#fdeced",
                color: "#c97a4a",
              }}
            >
              <LogOut size={16} />
              <span>Вихід</span>
            </button>
          </div>
        )}
      </div>

      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
    </div>
  );
}
