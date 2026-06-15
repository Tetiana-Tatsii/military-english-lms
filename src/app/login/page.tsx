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
        alignItems: "center",
        justifyContent: "center",
        background: "#f0e9d8",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          padding: "2rem",
          borderRadius: "8px",
          width: "300px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ marginBottom: "1rem", textAlign: "center" }}>
          {isRegister ? "Реєстрація" : "Вхід"}
        </h1>

        <input
          placeholder="Ім'я або логін"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            marginBottom: "1rem",
            padding: "0.5rem",
          }}
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            marginBottom: "1rem",
            padding: "0.5rem",
          }}
        />

        {error && (
          <p style={{ color: "red", fontSize: "0.8rem", marginBottom: "1rem" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "0.5rem",
            background: "#333",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          {isRegister ? "Зареєструватися" : "Увійти"}
        </button>

        <p
          style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.9rem" }}
        >
          {isRegister ? "Вже є акаунт? " : "Немає акаунта? "}
          <span
            onClick={() => setIsRegister(!isRegister)}
            style={{
              color: "blue",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {isRegister ? "Увійти" : "Зареєструватися"}
          </span>
        </p>
      </form>
    </div>
  );
}
