"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../../context/AppContext";

const MIN_PASSWORD_LENGTH = 6;
const MIN_NAME_LENGTH = 2;

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, registerUser, user } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (user.role === "teacher" || user.role === "admin") {
        router.push("/teacher");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, router]);

  const validate = (): string | null => {
    if (name.trim().length < MIN_NAME_LENGTH)
      return `Ім'я має містити щонайменше ${MIN_NAME_LENGTH} символи.`;
    if (password.length < MIN_PASSWORD_LENGTH)
      return `Пароль має містити щонайменше ${MIN_PASSWORD_LENGTH} символів.`;
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      if (isRegister) {
        const err = await registerUser(name.trim(), password, "student");
        if (err) {
          setError(err);
        } else {
          setSuccessMessage("Заявку надіслано. Очікуйте активації адміністратором.");
          setIsRegister(false);
          setName("");
          setPassword("");
        }
      } else {
        const err = await login(name.trim(), password);
        if (err) {
          setError(err);
        }
      }
    } catch (error) {
      const err = error as Error;
      setError("Критична помилка: " + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-[#e9e1cd] font-sans md:grid-cols-[45%_55%]">
      {/* ЛІВА ЧАСТИНА: Інформаційна панель (зникає на малих екранах) */}
      <div className="hidden flex-col items-center justify-center bg-[#4a4a35] p-10 text-center text-[#f0e9d8] md:flex">
        <img
          src="/logo.png"
          alt="Емблема кафедри"
          className="mb-6 h-auto w-40 rounded-lg"
        />
        <h1 className="mb-4 text-[36px] font-extrabold tracking-wide">
          Military Learning Management System
        </h1>
        <p className="mb-8 max-w-2xl text-xl leading-relaxed text-[#d8cdb4]">
          Глобальна взаємосумісність починається тут. <br /> Сучасна платформа для вивчення англійської мови: <br /> для військової кар'єри, міжнародних місій та життя.
        </p>

        {/* Місце під шеврони або додаткові логотипи */}
        <div className="mt-auto flex justify-center gap-8">
          <div className="flex h-28 w-28 items-center justify-center rounded-full border border-white/20 bg-white/10">
            <img src="/logo-ngu.png" alt="НГУ" className="w-full h-full object-contain p-2" />
          </div>
          <div className="flex h-28 w-28 items-center justify-center rounded-full border border-white/20 bg-white/10">
            <img src="/logo-tc.png" alt="Навчальний центр" className="w-full h-full object-contain p-2" />
          </div>
          <div className="flex h-28 w-28 items-center justify-center rounded-full border border-white/20 bg-white/10">
            <img src="/logo-stanag.png" alt="STANAG" className="w-full h-full object-contain p-2" />
          </div>
        </div>
      </div>

      {/* ПРАВА ЧАСТИНА: Форма входу */}
      <div className="flex flex-1 items-center justify-center p-5">
        <div className="w-full max-w-md rounded-2xl border border-[#d8cdb4] bg-[#f6f1e4] p-10 shadow-[0_12px_32px_rgba(0,0,0,0.1)]">
          {/* Mobile logo - visible only on smartphones */}
          <div className="md:hidden flex flex-col items-center justify-center mb-8 w-full">
            <img 
              src="/logo.png" 
              alt="Military LMS Logo" 
              className="w-24 h-24 object-contain drop-shadow-xl mb-3"
            />
            <h1 className="text-2xl font-extrabold text-[#3a3528] tracking-wide">
              MILITARY LMS
            </h1>
          </div>

          <div className="mb-8 text-center">
            <h2 className="mb-2 text-[24px] font-bold text-[#3a3528]">
              {isRegister ? "Створення акаунту" : "Вхід у систему"}
            </h2>
            <p className="text-[14px] italic text-[#8a8a45]">
              &quot;English is always a good idea!&quot;
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              placeholder="Ім'я або логін"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[#d8cdb4] bg-white px-4 py-3.5 text-[15px] text-[#3a3528]"
              minLength={MIN_NAME_LENGTH}
              required
            />
            <div>
              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#d8cdb4] bg-white px-4 py-3.5 text-[15px] text-[#3a3528]"
                minLength={MIN_PASSWORD_LENGTH}
                required
              />
              {isRegister && (
                <p className="mt-1 text-[12px] text-[#9a8f70]">
                  Мінімум {MIN_PASSWORD_LENGTH} символів
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-md border-l-4 border-[#c97a4a] bg-[#fdeced] p-2.5">
                <p className="text-[13px] font-medium text-[#c97a4a]">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="rounded-md border-l-4 border-[#8a8a45] bg-[#eef0df] p-2.5">
                <p className="text-[13px] font-medium text-[#5c6b1a]">{successMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full rounded-lg bg-[#8a8a45] px-4 py-3.5 text-[15px] font-semibold text-[#f6f1e4] transition-colors hover:bg-[#7a7a3d] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading
                ? "Зачекайте..."
                : isRegister ? "Зареєструватися" : "Увійти"}
            </button>
          </form>

          <p className="mt-8 text-center text-[14px] text-[#6b6b3a]">
            {isRegister ? "Вже маєте акаунт? " : "Немає акаунту? "}
            <span
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              className="cursor-pointer font-semibold text-[#8a8a45] underline underline-offset-4"
            >
              {isRegister ? "Увійти" : "Створити"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
