"use client";

import { ExternalLink, X } from "lucide-react";
import { CERTIFICATE_FEEDBACK_FORM_URL } from "@/lib/courseFeedback";

interface CertificateFeedbackModalProps {
  isDarkMode: boolean;
  busy: boolean;
  onDownload: () => void;
  onClose: () => void;
}

export default function CertificateFeedbackModal({
  isDarkMode,
  busy,
  onDownload,
  onClose,
}: CertificateFeedbackModalProps) {
  const titleColor = isDarkMode ? "#e6e4dc" : "#3a3528";
  const bodyColor = isDarkMode ? "#a3a198" : "#5c574a";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="certificate-feedback-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(0,0,0,0.5)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 440,
          borderRadius: 12,
          padding: 28,
          background: isDarkMode ? "#2d2f2a" : "#fff",
          border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
          boxShadow: "0 16px 40px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <h3
            id="certificate-feedback-title"
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 800,
              color: titleColor,
            }}
          >
            Перед завантаженням сертифіката
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрити"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 4,
              flexShrink: 0,
            }}
          >
            <X size={20} color={bodyColor} />
          </button>
        </div>

        <p
          style={{
            margin: "0 0 16px",
            fontSize: 14,
            lineHeight: 1.6,
            color: bodyColor,
          }}
        >
          Будь ласка, залиште короткий відгук про навчання на платформі — це
          допоможе нам покращити курс для наступних груп.
        </p>

        <a
          href={CERTIFICATE_FEEDBACK_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 24,
            color: "#8a8a45",
            fontWeight: 700,
            fontSize: 15,
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          Заповнити форму зворотного звʼязку
          <ExternalLink size={16} />
        </a>

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
            onClick={onClose}
            disabled={busy}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
              background: isDarkMode ? "#252622" : "#fff",
              color: titleColor,
              fontWeight: 600,
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            Скасувати
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={busy}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: "#8a8a45",
              color: "#fff",
              fontWeight: 700,
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            {busy ? "Готуємо сертифікат…" : "Завантажити сертифікат"}
          </button>
        </div>
      </div>
    </div>
  );
}
