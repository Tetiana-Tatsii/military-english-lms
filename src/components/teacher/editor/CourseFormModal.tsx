"use client";

import React from "react";

import type { EditorTabState } from "./useEditorTab";

interface CourseFormModalProps {
  state: EditorTabState;
  isDarkMode: boolean;
}

export default function CourseFormModal({ state, isDarkMode }: CourseFormModalProps) {
  const {
    isAddingCourse,
    isEditingCourse,
    isSavingCourse,
    courseData,
    setCourseData,
    closeCourseForm,
    handleCourseFormSubmit,
  } = state;

  return (
          <div
  style={{
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  }}
  onClick={closeCourseForm}
          >
  <div
    style={{
      background: isDarkMode ? "#2d2f2a" : "#fff",
      borderRadius: 12,
      padding: 32,
      maxWidth: 500,
      width: "90%",
      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
    }}
    onClick={(e) => e.stopPropagation()}
  >
    <h2
      style={{
        margin: "0 0 24px",
        fontSize: 20,
        fontWeight: 700,
        color: isDarkMode ? "#e6e4dc" : "#3a3528",
      }}
    >
      {isAddingCourse ? "Створити новий курс" : "Редагувати курс"}
    </h2>
    <form onSubmit={handleCourseFormSubmit}>
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: isDarkMode ? "#e6e4dc" : "#3a3528",
          marginBottom: 8,
          display: "block",
        }}
      >
        Назва курсу *
      </label>
      <input
        type="text"
        value={courseData.title}
        onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
        placeholder="Введіть назву курсу"
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 8,
          border: "1px solid #d8cdb4",
          fontSize: 14,
          background: isDarkMode ? "#2d2f2a" : "#fff",
          color: isDarkMode ? "#e6e4dc" : "#3a3528",
        }}
      />
    </div>
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: isDarkMode ? "#e6e4dc" : "#3a3528",
          marginBottom: 8,
          display: "block",
        }}
      >
        Підзаголовок
      </label>
      <input
        type="text"
        value={courseData.subtitle}
        onChange={(e) => setCourseData({ ...courseData, subtitle: e.target.value })}
        placeholder="Введіть підзаголовок курсу"
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 8,
          border: "1px solid #d8cdb4",
          fontSize: 14,
          background: isDarkMode ? "#2d2f2a" : "#fff",
          color: isDarkMode ? "#e6e4dc" : "#3a3528",
        }}
      />
    </div>
    <div style={{ marginBottom: 24 }}>
      <label
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: isDarkMode ? "#e6e4dc" : "#3a3528",
          marginBottom: 8,
          display: "block",
        }}
      >
        Опис курсу
      </label>
      <textarea
        value={courseData.description}
        onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
        placeholder="Введіть опис курсу"
        rows={4}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 8,
          border: "1px solid #d8cdb4",
          fontSize: 14,
          fontFamily: "inherit",
          lineHeight: 1.6,
          background: isDarkMode ? "#2d2f2a" : "#fff",
          color: isDarkMode ? "#e6e4dc" : "#3a3528",
          resize: "vertical",
        }}
      />
    </div>
    <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
      <button
        type="button"
        onClick={closeCourseForm}
        style={{
          background: isDarkMode ? "#2d2f2a" : "#fff",
          color: isDarkMode ? "#a3a198" : "#5c574a",
          border: "1px solid #d8cdb4",
          padding: "12px 24px",
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        Скасувати
      </button>
      <button
        type="submit"
        disabled={isSavingCourse}
        style={{
          background: "#8a8a45",
          color: "#fff",
          border: "none",
          padding: "12px 24px",
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 14,
          cursor: isSavingCourse ? "not-allowed" : "pointer",
          opacity: isSavingCourse ? 0.7 : 1,
        }}
      >
        {isSavingCourse ? "Збереження..." : isAddingCourse ? "Створити" : "Зберегти"}
      </button>
    </div>
    </form>
  </div>
          </div>
  );
}
