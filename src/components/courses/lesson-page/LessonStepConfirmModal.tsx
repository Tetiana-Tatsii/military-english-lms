"use client";

interface LessonStepConfirmModalProps {
  isDarkMode: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LessonStepConfirmModal({
  isDarkMode,
  title,
  message,
  confirmLabel = "Пропустити",
  cancelLabel = "Скасувати",
  onConfirm,
  onCancel,
}: LessonStepConfirmModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lesson-step-confirm-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(0,0,0,0.45)",
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 12,
          padding: 24,
          background: isDarkMode ? "#2d2f2a" : "#faf9f6",
          border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
          boxShadow: "0 16px 40px rgba(0,0,0,0.2)",
        }}
      >
        <h3
          id="lesson-step-confirm-title"
          style={{
            margin: "0 0 10px",
            fontSize: 18,
            fontWeight: 800,
            color: isDarkMode ? "#e6e4dc" : "#3a3528",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: "0 0 20px",
            fontSize: 14,
            lineHeight: 1.55,
            color: isDarkMode ? "#a3a198" : "#5c574a",
          }}
        >
          {message}
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
              background: isDarkMode ? "#252622" : "#fff",
              color: isDarkMode ? "#e6e4dc" : "#3a3528",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: "#8a8a45",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
