"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Target, ChevronRight } from "lucide-react";
import { Course } from "@/context/AppContext";

export default function CourseCard({ course }: { course: Course }) {
  const router = useRouter();

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#d8cdb4] bg-[#f6f1e4] p-5">
      {course.status === "draft" && (
        <div className="absolute right-3 top-3 rounded bg-[#e9e1cd px-2 py-1 text-[10px] font-semibold uppercase text-[#9a8f70]">
          У розробці
        </div>
      )}

      <h3 className="pr-20 text-lg font-semibold text-[#3a3528]">
        {course.title}
      </h3>
      <p className="mb-3 text-sm font-medium text-[#8a8a45]">
        {course.subtitle}
      </p>
      <p className="mb-5 text-sm leading-relaxed text-[#5a5440]">
        {course.description}
      </p>

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-[#9a8f70]">
          <Target size={14} /> Модулів: {course.modules.length}
        </span>

        <button
          onClick={() => router.push(`/courses/${course.id}`)}
          disabled={course.status === "draft"}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium ${
            course.status === "draft"
              ? "cursor-not-allowed bg-[#e9e1cd] text-[#9a8f70]"
              : "cursor-pointer bg-[#8a8a45] text-[#f6f1e4]"
          }`}
        >
          {course.status === "draft" ? "Недоступно" : "Перейти до курсу"}{" "}
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
