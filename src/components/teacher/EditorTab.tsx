"use client";

import React from "react";
import type { EditorTabProps } from "./editor/types";
import { useEditorTab } from "./editor/useEditorTab";
import EditorMobileGuard from "./editor/EditorMobileGuard";
import CourseStructurePanel from "./editor/CourseStructurePanel";
import LessonEditorPanel from "./editor/LessonEditorPanel";
import CourseFormModal from "./editor/CourseFormModal";

export type { EditorTabProps } from "./editor/types";

export default function EditorTab(props: EditorTabProps) {
  const { isDarkMode } = props;
  const state = useEditorTab(props);

  if (state.isMobile) {
    return <EditorMobileGuard isDarkMode={isDarkMode} />;
  }

  return (
    <>
      {!state.editingLesson && (
        <CourseStructurePanel state={state} isDarkMode={isDarkMode} />
      )}
      <LessonEditorPanel state={state} isDarkMode={isDarkMode} />
      {(state.isAddingCourse || state.isEditingCourse) && (
        <CourseFormModal state={state} isDarkMode={isDarkMode} />
      )}
    </>
  );
}
