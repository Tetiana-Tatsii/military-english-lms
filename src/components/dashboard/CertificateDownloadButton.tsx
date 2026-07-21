"use client";

import { useCallback, useEffect, useState } from "react";
import { Award, Download, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  downloadCertificateHtml,
  evaluateCertificateEligibility,
  fetchQuizLessonIdsForUser,
  fetchSlpAverage,
  getOrIssueCertificate,
  type CertificateEligibility,
  type CertificateRecord,
} from "@/lib/certificates";
import type { Answer, Course } from "@/types";

interface CertificateDownloadButtonProps {
  course: Course;
  userId: string;
  studentName: string;
  answers: Answer[];
  isDarkMode: boolean;
}

export default function CertificateDownloadButton({
  course,
  userId,
  studentName,
  answers,
  isDarkMode,
}: CertificateDownloadButtonProps) {
  const [eligibility, setEligibility] = useState<CertificateEligibility | null>(
    null,
  );
  const [existing, setExisting] = useState<CertificateRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const refresh = useCallback(async () => {
    if (course.status !== "active") {
      setChecking(false);
      setEligibility(null);
      return;
    }

    setChecking(true);
    setError(null);
    try {
      const lessonIds = course.modules.flatMap((m) =>
        m.lessons.map((l) => l.id),
      );
      const [quizIds, slpAverage, certRes] = await Promise.all([
        fetchQuizLessonIdsForUser(supabase, userId, lessonIds),
        fetchSlpAverage(supabase, userId),
        supabase
          .from("certificates")
          .select(
            "id, user_id, course_id, student_name, course_title, certificate_number, completed_at, issued_at",
          )
          .eq("user_id", userId)
          .eq("course_id", course.id)
          .maybeSingle(),
      ]);

      if (certRes.data) {
        setExisting(certRes.data as CertificateRecord);
      } else {
        setExisting(null);
      }

      setEligibility(
        evaluateCertificateEligibility(
          course,
          answers,
          quizIds,
          slpAverage,
        ),
      );
    } catch (err) {
      console.error(err);
      setError("Не вдалося перевірити умови сертифіката.");
    } finally {
      setChecking(false);
    }
  }, [answers, course, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleDownload = async () => {
    if (!eligibility?.eligible && !existing) return;

    setBusy(true);
    setError(null);
    try {
      const cert =
        existing ??
        (await getOrIssueCertificate(supabase, {
          userId,
          studentName,
          course,
        }));
      setExisting(cert);
      await downloadCertificateHtml({
        ...cert,
        student_name: studentName,
      });
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Помилка завантаження.";
      if (
        message.includes("certificates") ||
        message.includes("schema cache") ||
        message.includes("does not exist")
      ) {
        setError(
          "Таблиця certificates ще не створена. Запустіть SQL: supabase/migrations/certificates.sql",
        );
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  };

  if (course.status !== "active") return null;

  const canDownload = Boolean(existing) || Boolean(eligibility?.eligible);
  const muted = isDarkMode ? "#a3a198" : "#7a7568";

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleDownload}
        disabled={!canDownload || busy || checking}
        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
          canDownload && !busy
            ? "cursor-pointer bg-[#8a8a45] text-white hover:bg-[#6b6b36]"
            : "cursor-not-allowed bg-[#e9e1cd] text-[#9a8f70]"
        }`}
      >
        {busy || checking ? (
          <Loader2 size={16} className="animate-spin" />
        ) : canDownload ? (
          <Download size={16} />
        ) : (
          <Award size={16} />
        )}
        {busy
          ? "Готуємо сертифікат…"
          : checking
            ? "Перевірка умов…"
            : canDownload
              ? "Завантажити сертифікат"
              : "Сертифікат ще недоступний"}
      </button>

      {!checking && !canDownload && eligibility && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs" style={{ color: muted }}>
          {eligibility.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}

      {existing && (
        <p className="mt-2 text-xs" style={{ color: muted }}>
          № {existing.certificate_number} · імʼя в файлі: {studentName}
        </p>
      )}

      {error && (
        <p className="mt-2 text-xs text-[#c97a4a]">{error}</p>
      )}
    </div>
  );
}
