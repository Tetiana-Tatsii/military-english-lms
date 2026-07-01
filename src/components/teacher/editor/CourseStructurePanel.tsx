"use client";

import React from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Edit3,
  BookOpen,
  X,
} from "lucide-react";

import type { EditorTabState } from "./useEditorTab";

interface CourseStructurePanelProps {
  state: EditorTabState;
  isDarkMode: boolean;
}

export default function CourseStructurePanel({ state, isDarkMode }: CourseStructurePanelProps) {
  const {
    courses,
    selectedCourseId,
    setSelectedCourseId,
    activeCourse,
    setIsAddingCourse,
    openEditCourseModal,
    handleDeleteCourse,
    editingModuleId,
    editingModuleName,
    setEditingModuleName,
    handleSaveModuleName,
    handleCancelEditModuleName,
    handleEditModuleName,
    handleDeleteModule,
    editingLessonId,
    editingLessonName,
    setEditingLessonName,
    handleSaveLessonName,
    handleCancelEditLessonName,
    handleEditLessonName,
    setEditingLesson,
    handleDeleteLesson,
    newLessonTitle,
    selectedModuleId,
    setSelectedModuleId,
    setNewLessonTitle,
    handleAddLesson,
  } = state;

  return (
  <div style={{ animation: "fadeIn 0.3s ease" }}>
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <select
        value={selectedCourseId}
        onChange={(e) => setSelectedCourseId(e.target.value)}
        className="w-full md:w-auto md:min-w-[300px]"
        style={{
          padding: "10px 16px",
          borderRadius: 8,
          border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
          fontSize: 16,
          fontWeight: 600,
          background: isDarkMode ? "#2d2f2a" : "#fff",
          color: isDarkMode ? "#e6e4dc" : "#4a4a4a",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        {courses.length === 0 && <option value="">Немає курсів</option>}
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>
      <button
        onClick={() => setIsAddingCourse(true)}
        className="flex w-full items-center justify-center gap-2 md:w-auto"
        style={{
          background: "#8a8a45",
          color: "#fff",
          border: "none",
          padding: "10px 20px",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        <Plus size={18} /> Створити новий курс
      </button>
    </div>

    {activeCourse ? (
      <div
        className="rounded-xl border p-5 md:p-8"
        style={{
          background: isDarkMode ? "#2d2f2a" : "#fff",
          borderColor: isDarkMode ? "#3e403a" : "#e0dcd0",
        }}
      >
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h3
                style={{
                  fontSize: 28,
                  margin: "0 0 8px",
                  color: isDarkMode ? "#e6e4dc" : "#3a3528",
                }}
              >
                {activeCourse.title}
              </h3>
              <button
                onClick={openEditCourseModal}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#8a8a45",
                  cursor: "pointer",
                }}
              >
                <Edit3 size={20} />
              </button>
            </div>
            <p
              style={{
                color: isDarkMode ? "#a3a198" : "#7a7568",
                margin: 0,
                fontWeight: 500,
                fontSize: 15,
              }}
            >
              {activeCourse.subtitle}
            </p>
          </div>
          <button
            onClick={handleDeleteCourse}
            className="w-full shrink-0 md:w-auto"
            style={{
              background: "#fdeced",
              color: "#c97a4a",
              border: "1px solid #facbce",
              padding: "8px 16px",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Видалити курс
          </button>
        </div>

        <h4
          style={{
            fontSize: 18,
            borderBottom: "2px solid #f0ede5",
            paddingBottom: 12,
            marginBottom: 24,
          }}
        >
          Структура курсу
        </h4>

        {activeCourse.modules.map((mod, modIndex) => (
          <div
            key={mod.id}
            style={{
              background: isDarkMode ? "#2a2c27" : "#faf9f6",
              padding: 20,
              borderRadius: 12,
              marginBottom: 20,
              border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
            }}
          >
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              {editingModuleId === mod.id ? (
                <div className="flex w-full flex-col gap-2 md:flex-1 md:flex-row md:items-center">
                  <input
                    value={editingModuleName}
                    onChange={(e) => setEditingModuleName(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid #8a8a45",
                      fontSize: 16,
                    }}
                  />
                  <button
                    onClick={handleSaveModuleName}
                    style={{
                      background: "#8a8a45",
                      color: "#fff",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    ✓
                  </button>
                  <button
                    onClick={handleCancelEditModuleName}
                    style={{
                      background: "transparent",
                      border: "1px solid #c97a4a",
                      color: "#c97a4a",
                      padding: "8px 16px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <span className="flex min-w-0 flex-1 items-center gap-2 font-bold text-[17px] md:gap-3">
                  <BookOpen size={20} color="#8a8a45" className="shrink-0" />
                  <span className="w-full min-w-0 truncate">
                    Модуль {modIndex + 1}: {mod.title}
                  </span>
                  <button
                    onClick={() => handleEditModuleName(mod.id, mod.title)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#8a8a45",
                      cursor: "pointer",
                    }}
                    className="shrink-0"
                  >
                    <Edit2 size={16} />
                  </button>
                </span>
              )}
              <button
                onClick={() => handleDeleteModule(mod.id)}
                className="shrink-0 self-end md:self-auto"
                style={{
                  background: "none",
                  border: "none",
                  color: "#c97a4a",
                  cursor: "pointer",
                }}
              >
                <Trash2 size={18} />
              </button>
            </div>
            <div className="border-[#e0dcd0] pl-0 md:ml-7 md:border-l-2 md:pl-6">
              {mod.lessons.map((les, lesIndex) => (
                <div
                  key={les.id}
                  className="flex flex-col gap-3 border-b border-dashed border-[#e0dcd0] py-3 md:flex-row md:items-center md:justify-between"
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                  }}
                >
                  {editingLessonId === les.id ? (
                    <div className="flex w-full flex-col gap-2 md:flex-1 md:flex-row md:items-center">
                      <input
                        value={editingLessonName}
                        onChange={(e) => setEditingLessonName(e.target.value)}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          borderRadius: 6,
                          border: "1px solid #8a8a45",
                          fontSize: 14,
                        }}
                      />
                      <button
                        onClick={() => handleSaveLessonName(mod.id)}
                        style={{
                          background: "#8a8a45",
                          color: "#fff",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={handleCancelEditLessonName}
                        style={{
                          background: "transparent",
                          border: "1px solid #c97a4a",
                          color: "#c97a4a",
                          padding: "6px 12px",
                          borderRadius: 6,
                          cursor: "pointer",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <span
                      onClick={() =>
                        setEditingLesson({
                          moduleId: mod.id,
                          lesson: les,
                        })
                      }
                      className="flex min-w-0 w-full flex-1 cursor-pointer items-center gap-2 md:gap-2.5"
                      style={{
                        color: isDarkMode ? "#a3a198" : "#5c574a",
                      }}
                    >
                      <Edit2 size={16} color="#8a8a45" className="shrink-0" />
                      <span className="w-full min-w-0 truncate">
                        <span style={{ fontWeight: 700 }}>
                          Урок {modIndex + 1}.{lesIndex + 1}
                        </span>{" "}
                        {les.title}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditLessonName(les.id, les.title);
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#8a8a45",
                          cursor: "pointer",
                        }}
                        className="shrink-0"
                      >
                        <Edit2 size={14} />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={() => handleDeleteLesson(mod.id, les.id)}
                    className="shrink-0 self-end md:self-auto"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#c97a4a",
                      cursor: "pointer",
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
              <div className="mt-4 flex flex-col gap-2 md:flex-row">
                <input
                  placeholder="Назва нового уроку..."
                  value={
                    selectedModuleId === mod.id ? newLessonTitle : ""
                  }
                  onChange={(e) => {
                    setSelectedModuleId(mod.id);
                    setNewLessonTitle(e.target.value);
                  }}
                  className="w-full flex-1"
                  style={{
                    padding: "10px 14px",
                    borderRadius: 6,
                    border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
                    background: isDarkMode ? "#2d2f2a" : "#fff",
                    color: isDarkMode ? "#e6e4dc" : "#3a3528",
                  }}
                />
                <button
                  onClick={() => handleAddLesson(mod.id)}
                  className="w-full md:w-auto"
                  style={{
                    background: "#8a8a45",
                    color: "#fff",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  + Додати урок
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p style={{ textAlign: "center", padding: "60px 0" }}>
        Оберіть або створіть курс.
      </p>
    )}
  </div>
  );
}
