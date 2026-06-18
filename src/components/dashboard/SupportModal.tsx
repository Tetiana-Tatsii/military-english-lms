"use client";

import React, { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { X, MessageSquare, CheckCircle } from "lucide-react";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const { user, addSupportTicket } = useAppContext();
  const [supportType, setSupportType] = useState<"bug" | "improvement">("bug");
  const [message, setMessage] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!message.trim()) {
      alert("Будь ласка, опишіть проблему або пропозицію.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Відправляємо тікет в систему
      await addSupportTicket(supportType, message);
      setIsSent(true);
    } catch (error) {
      console.error("Помилка при відправці тікета:", error);
      alert("Сталася помилка при відправці тікета. Спробуйте ще раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSent(false);
    setMessage("");
    setSupportType("bug");
    onClose();
  };

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
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 32,
          maxWidth: 500,
          width: "90%",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MessageSquare size={24} color="#8a8a45" />
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: "#3a3528",
              }}
            >
              Служба підтримки
            </h2>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X size={24} color="#5c574a" />
          </button>
        </div>

        {isSent ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
            }}
          >
            <CheckCircle size={64} color="#8a8a45" style={{ marginBottom: 16 }} />
            <p
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#8a8a45",
                marginBottom: 8,
              }}
            >
              ✓ Ваше повідомлення успішно відправлено!
            </p>
            <p
              style={{
                fontSize: 14,
                color: "#5c574a",
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              Технічний відділ вже працює над вирішенням.
            </p>
            <button
              onClick={handleClose}
              style={{
                background: "#8a8a45",
                color: "#fff",
                border: "none",
                padding: "12px 24px",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Закрити
            </button>
          </div>
        ) : (
          <>
            <p
              style={{
                fontSize: 14,
                color: "#5c574a",
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              Знайшли помилку чи маєте ідею, як покращити платформу? Напишіть нам!
            </p>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#3a3528",
                  marginBottom: 8,
                  display: "block",
                }}
              >
                Тип звернення
              </label>
              <select
                value={supportType}
                onChange={(e) => setSupportType(e.target.value as "bug" | "improvement")}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid #d8cdb4",
                  fontSize: 14,
                  background: "#fff",
                  color: "#3a3528",
                }}
              >
                <option value="bug">Помилка (Bug)</option>
                <option value="improvement">Пропозиція покращення</option>
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#3a3528",
                  marginBottom: 8,
                  display: "block",
                }}
              >
                Опис проблеми або пропозиції
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Опишіть детально проблему або вашу пропозицію..."
                rows={6}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid #d8cdb4",
                  fontSize: 14,
                  fontFamily: "inherit",
                  lineHeight: 1.6,
                  background: "#fff",
                  color: "#3a3528",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={handleClose}
                style={{
                  background: "#fff",
                  color: "#5c574a",
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
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{
                  background: isSubmitting ? "#c97a4a" : "#8a8a45",
                  color: "#fff",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                {isSubmitting ? "⏳ Відправлення..." : "Надіслати"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
