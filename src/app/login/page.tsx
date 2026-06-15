"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../../context/AppContext";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, registerUser } = useAppContext();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isRegister) {
      const err = registerUser(name, password, "student");
      if (err) {
        setError(err);
      } else {
        alert("Заявку на реєстрацію надіслано викладачу. Очікуйте активації.");
        setIsRegister(false);
        setName("");
        setPassword("");
      }
    } else {
      const err = login(name, password);
      if (err) {
        setError(err);
      } else {
        router.push("/dashboard");
      }
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#e9e1cd", // Трохи темніший фон для контрасту
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* ЛІВА ЧАСТИНА: Інформаційна панель (зникає на малих екранах) */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px",
          background: "#4a4a35", // Темно-зелений військовий колір
          color: "#f0e9d8",
          textAlign: "center",
        }}
      >
        <img
          src="/logo.jpg" // Твоя емблема
          alt="Емблема кафедри"
          style={{
            width: "160px",
            height: "auto",
            marginBottom: "24px",
            borderRadius: "8px",
          }}
        />
        <h1
          style={{
            fontSize: "36px",
            fontWeight: 800,
            margin: "0 0 16px",
            letterSpacing: "1px",
          }}
        >
          MILITARY LMS
        </h1>
        <p
          style={{
            fontSize: "18px",
            maxWidth: "400px",
            lineHeight: "1.6",
            color: "#d8cdb4",
            marginBottom: "32px",
          }}
        >
          Комплексна платформа для підготовки військовослужбовців до складання
          іспиту STANAG 6001.
        </p>

        {/* Місце під шеврони або додаткові логотипи */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            justifyContent: "center",
            marginTop: "auto",
          }}
        >
          {/* Заглушки під шеврони. Можеш замінити на <img> коли матимеш файли */}
          <div
            style={{
              width: "80px",
              height: "80px",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            NGU
          </div>
          <div
            style={{
              width: "80px",
              height: "80px",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            Training
          </div>
          <div
            style={{
              width: "80px",
              height: "80px",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            Language
          </div>
        </div>
      </div>

      {/* ПРАВА ЧАСТИНА: Форма входу */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "#f6f1e4",
            padding: "48px 40px",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "400px",
            boxShadow: "0 12px 32px rgba(0,0,0,0.1)",
            border: "1px solid #d8cdb4",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: 700,
                margin: "0 0 8px",
                color: "#3a3528",
              }}
            >
              {isRegister ? "Створення акаунту" : "Вхід у систему"}
            </h2>
            <p
              style={{
                fontSize: "14px",
                fontStyle: "italic",
                color: "#8a8a45",
                margin: 0,
              }}
            >
              &quot;English is always a good idea!&quot;
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <input
              placeholder="Ім'я або логін"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "8px",
                border: "1px solid #d8cdb4",
                background: "#fff",
                fontSize: "15px",
                color: "#3a3528",
                boxSizing: "border-box",
              }}
              required
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "8px",
                border: "1px solid #d8cdb4",
                background: "#fff",
                fontSize: "15px",
                color: "#3a3528",
                boxSizing: "border-box",
              }}
              required
            />

            {error && (
              <div
                style={{
                  background: "#fdeced",
                  padding: "10px",
                  borderRadius: "6px",
                  borderLeft: "4px solid #c97a4a",
                }}
              >
                <p
                  style={{
                    color: "#c97a4a",
                    fontSize: "13px",
                    margin: "0",
                    fontWeight: 500,
                  }}
                >
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "14px",
                background: "#8a8a45",
                color: "#f6f1e4",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: 600,
                marginTop: "8px",
                transition: "background 0.2s",
              }}
            >
              {isRegister ? "Зареєструватися" : "Увійти"}
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              marginTop: "32px",
              fontSize: "14px",
              color: "#6b6b3a",
            }}
          >
            {isRegister ? "Вже маєте акаунт? " : "Немає акаунту? "}
            <span
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              style={{
                color: "#8a8a45",
                cursor: "pointer",
                fontWeight: 600,
                textDecoration: "underline",
                textUnderlineOffset: "4px",
              }}
            >
              {isRegister ? "Увійти" : "Створити"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
