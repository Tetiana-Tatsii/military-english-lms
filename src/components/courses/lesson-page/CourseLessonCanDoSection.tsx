"use client";

import { useEffect, useState } from "react";
import { ListChecks } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import {
  loadCanDoChecks,
  saveCanDoChecks,
} from "@/lib/canDoChecklistStorage";
import {
  getBlockEstimatedTime,
  LESSON_BLOCKS,
} from "@/lib/lessonBlocks";
import type { Lesson } from "@/types";
import LessonBlockCard from "./LessonBlockCard";

interface CourseLessonCanDoSectionProps {
  lesson: Lesson;
  isDarkMode: boolean;
}

export default function CourseLessonCanDoSection({
  lesson,
  isDarkMode,
}: CourseLessonCanDoSectionProps) {
  const { user } = useAppContext();
  const items = (lesson.canDoItems ?? []).filter((i) => i.trim());
  const def = LESSON_BLOCKS.canDoChecklist;
  const [checks, setChecks] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!user?.id || !lesson.id) {
      setChecks({});
      return;
    }
    setChecks(loadCanDoChecks(user.id, lesson.id));
  }, [user?.id, lesson.id]);

  const toggle = (index: number) => {
    setChecks((prev) => {
      const next = { ...prev, [index]: !prev[index] };
      if (user?.id) saveCanDoChecks(user.id, lesson.id, next);
      return next;
    });
  };

  if (items.length === 0) return null;

  return (
    <LessonBlockCard
      title={def.title}
      accent={def.accent}
      icon={<ListChecks size={20} />}
      estimatedTime={getBlockEstimatedTime(lesson, "canDoChecklist")}
      isDarkMode={isDarkMode}
    >
      <p
        style={{
          margin: "0 0 14px",
          fontSize: 13,
          color: isDarkMode ? "#a3a198" : "#7a7568",
        }}
      >
        Самооцінка. Результат зберігається лише у вашому браузері.
      </p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
        {items.map((item, index) => (
          <li key={`${index}-${item.slice(0, 12)}`}>
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 8,
                border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
                background: isDarkMode ? "#252622" : "#fff",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={Boolean(checks[index])}
                onChange={() => toggle(index)}
                style={{
                  marginTop: 3,
                  width: 18,
                  height: 18,
                  accentColor: def.accent,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 15, lineHeight: 1.5 }}>{item}</span>
            </label>
          </li>
        ))}
      </ul>
    </LessonBlockCard>
  );
}
