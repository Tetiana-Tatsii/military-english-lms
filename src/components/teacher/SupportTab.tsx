"use client";

import React from "react";
import { LifeBuoy } from "lucide-react";
import { SupportTicket } from "@/context/AppContext";

interface SupportTabProps {
  supportTickets: SupportTicket[];
  isDarkMode: boolean;
  updateTicketStatus: (ticketId: string, status: "open" | "closed") => void;
}

export default function SupportTab({
  supportTickets,
  isDarkMode,
  updateTicketStatus,
}: SupportTabProps) {
  return (
<div style={{ animation: "fadeIn 0.3s ease" }}>
  <h2
    style={{
      fontSize: 24,
      fontWeight: 700,
      marginBottom: 24,
      color: isDarkMode ? "#e6e4dc" : "#3a3528",
    }}
  >
    <LifeBuoy size={24} style={{ display: "inline", marginRight: 8 }} />
    Служба підтримки
  </h2>
  {supportTickets.length === 0 ? (
    <div
      style={{
        background: isDarkMode ? "#2d2f2a" : "#fff",
        padding: 40,
        borderRadius: 12,
        border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
        textAlign: "center",
      }}
    >
      <p style={{ color: isDarkMode ? "#a3a198" : "#9a8f70", fontSize: 16 }}>
        Немає звернень до служби підтримки.
      </p>
    </div>
  ) : (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {supportTickets.map((ticket) => (
        <div
          key={ticket.id}
          style={{
            background: isDarkMode ? "#2d2f2a" : "#fff",
            padding: 24,
            borderRadius: 12,
            border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 16,
              paddingBottom: 16,
              borderBottom: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 12,
                  color: "#9a8f70",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Курсант
              </p>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: isDarkMode ? "#e6e4dc" : "#3a3528",
                  margin: 0,
                }}
              >
                {ticket.userName}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  fontSize: 12,
                  color: "#9a8f70",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Тип звернення
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: ticket.type === "bug" ? "#c97a4a" : "#8a8a45",
                  margin: 0,
                  fontWeight: 600,
                }}
              >
                {ticket.type === "bug" ? "Помилка (Bug)" : "Пропозиція покращення"}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  fontSize: 12,
                  color: "#9a8f70",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Дата
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "#5c574a",
                  margin: 0,
                }}
              >
                {new Date(ticket.date).toLocaleString("uk-UA")}
              </p>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <p
              style={{
                fontSize: 12,
                color: "#9a8f70",
                textTransform: "uppercase",
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Опис
            </p>
            <p
              style={{
                fontSize: 15,
                color: "#4a4a4a",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {ticket.message}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                padding: "4px 12px",
                borderRadius: 12,
                background:
                  ticket.status === "open" ? "#eef0df" : "#f0ede5",
                color: ticket.status === "open" ? "#8a8a45" : isDarkMode ? "#a3a198" : "#5c574a",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {ticket.status === "open" ? "Відкрито" : "Вирішено"}
            </div>
            {ticket.status === "open" && (
              <button
                onClick={() => updateTicketStatus(ticket.id, "closed")}
                style={{
                  background: "#8a8a45",
                  color: "#fff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Позначити як вирішене
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )}
</div>
  );
}
