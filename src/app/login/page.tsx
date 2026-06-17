"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../../context/AppContext";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (isRegister) {
        const err = await registerUser(name, password, "student");
        if (err) {
          setError(err);
        } else {
          alert("Заявку на реєстрацію надіслано. Очікуйте активації.");
          setIsRegister(false);
          setName("");
          setPassword("");
        }
      } else {
        const err = await login(name, password);
        if (err) {
          setError(err);
        }
      }
    } catch (error) {
      const err = error as Error;
      setError("Критична помилка: " + err.message);
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#e9e1cd] font-sans">
      {/* ЛІВА ЧАСТИНА: Інформаційна панель (зникає на малих екранах) */}
      <div className="hidden flex-col items-center justify-center bg-[#4a4a35] p-10 text-center text-[#f0e9d8] md:flex">
        <img
          src="/logo.jpg"
          alt="Емблема кафедри"
          className="mb-6 h-auto w-40 rounded-lg"
        />
        <h1 className="mb-4 text-[36px] font-extrabold tracking-wide">
          MILITARY LMS
        </h1>
        <p className="mb-8 max-w-[400px] text-[18px] leading-relaxed text-[#d8cdb4]">
          Комплексна платформа для підготовки військовослужбовців до складання
          іспиту STANAG 6001.
        </p>

        {/* Місце під шеврони або додаткові логотипи */}
        <div className="mt-auto flex justify-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[12px]">
            NGU
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[12px]">
            Training
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[12px]">
            Language
          </div>
        </div>
      </div>

      {/* ПРАВА ЧАСТИНА: Форма входу */}
      <div className="flex flex-1 items-center justify-center p-5">
        <div className="w-full max-w-[400px] rounded-2xl border border-[#d8cdb4] bg-[#f6f1e4] p-10 shadow-[0_12px_32px_rgba(0,0,0,0.1)]">
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
              required
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[#d8cdb4] bg-white px-4 py-3.5 text-[15px] text-[#3a3528]"
              required
            />

            {error && (
              <div className="rounded-md border-l-4 border-[#c97a4a] bg-[#fdeced] p-2.5">
                <p className="text-[13px] font-medium text-[#c97a4a]">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="mt-2 w-full rounded-lg bg-[#8a8a45] px-4 py-3.5 text-[15px] font-semibold text-[#f6f1e4] transition-colors hover:bg-[#7a7a3d]"
            >
              {isRegister ? "Зареєструватися" : "Увійти"}
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
