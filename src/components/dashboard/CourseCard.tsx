"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Target, ChevronRight } from "lucide-react";
import { Course } from "@/context/AppContext";

export default function CourseCard({ course }: { course: Course }) {
  const router = useRouter();

  return (
    <div
      style={{
        background: "#f6f1e4",
        borderRadius: 12,
        padding: "20px",
        border: "0.5px solid #d8cdb4",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {course.status === "draft" && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "#e9e1cd",
            padding: "4px 8px",
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 600,
            color: "#9a8f70",
            textTransform: "uppercase",
          }}
        >
          У розробці
        </div>
      )}

      <h3
        style={{
          fontSize: 18,
          fontWeight: 600,
          margin: "0 0 4px",
          color: "#3a3528",
          paddingRight: "80px",
        }}
      >
        {course.title}
      </h3>
      <p
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "#8a8a45",
          margin: "0 0 12px",
        }}
      >
        {course.subtitle}
      </p>
      <p
        style={{
          fontSize: 14,
          color: "#5a5440",
          lineHeight: 1.6,
          marginBottom: "20px",
        }}
      >
        {course.description}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: "#9a8f70",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Target size={14} /> Модулів: {course.modules.length}
        </span>

        <button
          onClick={() => router.push(`/courses/${course.id}`)}
          disabled={course.status === "draft"}
          style={{
            background: course.status === "draft" ? "#e9e1cd" : "#8a8a45",
            color: course.status === "draft" ? "#9a8f70" : "#f6f1e4",
            border: "none",
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            cursor: course.status === "draft" ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {course.status === "draft" ? "Недоступно" : "Перейти до курсу"}{" "}
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
