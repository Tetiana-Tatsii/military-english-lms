"use client";

import { ExternalLink, FileText, FolderOpen } from "lucide-react";
import {
  getBlockEstimatedTime,
  LESSON_BLOCKS,
} from "@/lib/lessonBlocks";
import type { Lesson } from "@/types";
import LessonBlockCard from "./LessonBlockCard";

interface CourseLessonResourcesSectionProps {
  lesson: Lesson;
  isDarkMode: boolean;
}

export default function CourseLessonResourcesSection({
  lesson,
  isDarkMode,
}: CourseLessonResourcesSectionProps) {
  const docs = lesson.documents ?? [];
  const links = lesson.resourceLinks ?? [];
  if (docs.length === 0 && links.length === 0) return null;

  const def = LESSON_BLOCKS.additionalResources;

  return (
    <LessonBlockCard
      title={def.title}
      accent={def.accent}
      icon={<FolderOpen size={20} />}
      estimatedTime={getBlockEstimatedTime(lesson, "additionalResources")}
      isDarkMode={isDarkMode}
      collapsible
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {docs.map((doc) => (
          <a
            key={doc.id}
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 16,
              background: isDarkMode ? "#252622" : "#fff",
              borderRadius: 8,
              border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
              textDecoration: "none",
              color: isDarkMode ? "#e6e4dc" : "#4a4a4a",
            }}
          >
            <FileText size={20} color={def.accent} />
            <span style={{ fontSize: 15, fontWeight: 600 }}>{doc.name}</span>
          </a>
        ))}
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 16,
              background: isDarkMode ? "#252622" : "#fff",
              borderRadius: 8,
              border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
              textDecoration: "none",
              color: isDarkMode ? "#e6e4dc" : "#4a4a4a",
            }}
          >
            <ExternalLink size={20} color={def.accent} />
            <span style={{ fontSize: 15, fontWeight: 600 }}>
              {link.label || link.url}
            </span>
          </a>
        ))}
      </div>
    </LessonBlockCard>
  );
}
