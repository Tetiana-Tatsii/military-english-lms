"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Clock } from "lucide-react";

interface LessonBlockCardProps {
  title: string;
  accent: string;
  icon: ReactNode;
  estimatedTime?: string;
  isDarkMode: boolean;
  children: ReactNode;
  className?: string;
  /** Accordion: student can collapse/expand the body */
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export default function LessonBlockCard({
  title,
  accent,
  icon,
  estimatedTime,
  isDarkMode,
  children,
  className = "",
  collapsible = false,
  defaultOpen = true,
}: LessonBlockCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={`lesson-content-card ${className}`}
      style={{
        background: isDarkMode ? "#2d2f2a" : "#faf9f6",
        padding: 24,
        borderRadius: 12,
        border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
        marginBottom: 24,
        borderLeft: `4px solid ${accent}`,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: collapsible && !open ? 0 : 16,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: accent,
            fontWeight: 700,
            fontSize: 16,
            minWidth: 0,
          }}
        >
          {icon}
          {title}
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginLeft: "auto",
          }}
        >
          {estimatedTime ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                color: isDarkMode ? "#a3a198" : "#7a7568",
                background: isDarkMode ? "#252622" : "#f0ede5",
                padding: "4px 10px",
                borderRadius: 999,
              }}
            >
              <Clock size={13} />
              {estimatedTime}
            </span>
          ) : null}

          {collapsible ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? "Згорнути блок" : "Розгорнути блок"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                borderRadius: 8,
                border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
                background: isDarkMode ? "#252622" : "#fff",
                color: accent,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <ChevronDown
                size={18}
                style={{
                  transform: open ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              />
            </button>
          ) : null}
        </div>
      </header>

      {(!collapsible || open) && (
        <div
          style={{
            fontSize: 15,
            lineHeight: 1.65,
            color: isDarkMode ? "rgb(250, 249, 246)" : "#4a4a4a",
            minWidth: 0,
          }}
        >
          {children}
        </div>
      )}
    </section>
  );
}
