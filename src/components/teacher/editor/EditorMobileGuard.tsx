"use client";

import React from "react";
import { Edit3 } from "lucide-react";

export default function EditorMobileGuard({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div
      className={`rounded-xl border p-8 text-center ${
        isDarkMode
          ? "border-[#3e403a] bg-[#2d2f2a]"
          : "border-[#e0dcd0] bg-[#f0ede5]"
      }`}
    >
      <Edit3 size={48} className="mx-auto mb-4 text-[#8a8a45]" />
      <h3
        className={`mb-2 text-lg font-bold ${
          isDarkMode ? "text-[#e6e4dc]" : "text-[#3a3528]"
        }`}
      >
        Редагування курсів
      </h3>
      <p
        className={`text-sm leading-relaxed ${
          isDarkMode ? "text-[#a3a198]" : "text-[#7a7568]"
        }`}
      >
        Створення уроків і редагування структури курсів доступні на десктопі або
        планшеті (екран від 768px). Відкрийте цю сторінку на комп&apos;ютері або
        планшеті, щоб продовжити.
      </p>
    </div>
  );
}
