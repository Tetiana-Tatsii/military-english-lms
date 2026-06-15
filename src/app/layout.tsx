import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Імпортуємо наш новий Провайдер
import { AppProvider } from "@/context/AppContext";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "LMS",
  description: "Закрита платформа вивчення військової англійської",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body className={`${inter.className} bg-[#0d0e12] text-zinc-200`}>
        {/* Обгортаємо весь сайт у наш "Мозок" */}
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
