import type { SupabaseClient } from "@supabase/supabase-js";
import type { Answer, Course } from "@/types";

export const CERTIFICATE_SLP_MIN = 60;

export type CertificateRecord = {
  id: string;
  user_id: string;
  course_id: string;
  student_name: string;
  course_title: string;
  certificate_number: string;
  completed_at: string;
  issued_at: string;
};

export type CertificateEligibility = {
  eligible: boolean;
  reasons: string[];
  totalLessons: number;
  homeworkDone: number;
  quizzesRequired: number;
  quizzesDone: number;
  slpAverage: number;
};

function getCourseLessons(course: Course) {
  return course.modules.flatMap((m) => m.lessons);
}

export function getOverallSlpAverage(slp: {
  listening: number;
  speaking: number;
  reading: number;
  writing: number;
}): number {
  const values = [slp.listening, slp.speaking, slp.reading, slp.writing];
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/**
 * Criteria:
 * - homework submitted for every lesson
 * - quiz submitted for every lesson that has a quiz
 * - overall SLP average >= 60%
 */
export function evaluateCertificateEligibility(
  course: Course,
  answers: Answer[],
  quizLessonIdsWithResult: Set<string>,
  slpAverage: number,
): CertificateEligibility {
  const lessons = getCourseLessons(course);
  const totalLessons = lessons.length;
  const reasons: string[] = [];

  if (totalLessons === 0) {
    return {
      eligible: false,
      reasons: ["У курсі ще немає уроків."],
      totalLessons: 0,
      homeworkDone: 0,
      quizzesRequired: 0,
      quizzesDone: 0,
      slpAverage,
    };
  }

  const answered = new Set(
    answers
      .filter((a) => a.courseId === course.id)
      .map((a) => a.lessonId),
  );
  const homeworkDone = lessons.filter((l) => answered.has(l.id)).length;

  const quizLessons = lessons.filter((l) => (l.quiz?.length ?? 0) > 0);
  const quizzesRequired = quizLessons.length;
  const quizzesDone = quizLessons.filter((l) =>
    quizLessonIdsWithResult.has(l.id),
  ).length;

  if (homeworkDone < totalLessons) {
    reasons.push(
      `ДЗ здано ${homeworkDone}/${totalLessons} уроків — потрібні всі.`,
    );
  }
  if (quizzesDone < quizzesRequired) {
    reasons.push(
      `Практичні тести: ${quizzesDone}/${quizzesRequired} — потрібні всі.`,
    );
  }
  if (slpAverage < CERTIFICATE_SLP_MIN) {
    reasons.push(
      `Середній SLP ${slpAverage}% — потрібно не нижче ${CERTIFICATE_SLP_MIN}%.`,
    );
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    totalLessons,
    homeworkDone,
    quizzesRequired,
    quizzesDone,
    slpAverage,
  };
}

export async function fetchQuizLessonIdsForUser(
  supabase: SupabaseClient,
  userId: string,
  lessonIds: string[],
): Promise<Set<string>> {
  if (lessonIds.length === 0) return new Set();

  const { data, error } = await supabase
    .from("quiz_results")
    .select("lesson_id")
    .eq("user_id", userId)
    .in("lesson_id", lessonIds);

  if (error) {
    console.error("quiz_results for certificate:", error);
    return new Set();
  }

  return new Set((data ?? []).map((r) => r.lesson_id as string));
}

export async function fetchSlpAverage(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("profiles")
    .select("slp_listening, slp_speaking, slp_reading, slp_writing")
    .eq("id", userId)
    .single();

  if (error || !data) return 0;

  return getOverallSlpAverage({
    listening: data.slp_listening ?? 0,
    speaking: data.slp_speaking ?? 0,
    reading: data.slp_reading ?? 0,
    writing: data.slp_writing ?? 0,
  });
}

function buildCertificateNumber(courseId: string): string {
  const year = new Date().getFullYear();
  const short = courseId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase() || "COURSE";
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MEL-${short}-${year}-${rand}`;
}

function formatUaDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export async function getOrIssueCertificate(
  supabase: SupabaseClient,
  params: {
    userId: string;
    studentName: string;
    course: Course;
    completedAt?: string;
  },
): Promise<CertificateRecord> {
  const { data: existing, error: existingError } = await supabase
    .from("certificates")
    .select(
      "id, user_id, course_id, student_name, course_title, certificate_number, completed_at, issued_at",
    )
    .eq("user_id", params.userId)
    .eq("course_id", params.course.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }
  if (existing) {
    return existing as CertificateRecord;
  }

  const now = new Date().toISOString();
  const row = {
    user_id: params.userId,
    course_id: params.course.id,
    student_name: params.studentName,
    course_title: params.course.title,
    certificate_number: buildCertificateNumber(params.course.id),
    completed_at: params.completedAt ?? now,
    issued_at: now,
  };

  const { data, error } = await supabase
    .from("certificates")
    .insert(row)
    .select(
      "id, user_id, course_id, student_name, course_title, certificate_number, completed_at, issued_at",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Не вдалося видати сертифікат.");
  }

  return data as CertificateRecord;
}

export async function downloadCertificateHtml(
  cert: CertificateRecord,
): Promise<void> {
  const res = await fetch("/certificates/template.html", { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Не знайдено шаблон сертифіката.");
  }

  let html = await res.text();
  const replacements: Record<string, string> = {
    "{{STUDENT_NAME}}": cert.student_name,
    "{{COURSE_TITLE}}": cert.course_title,
    "{{COMPLETED_AT}}": formatUaDate(cert.completed_at),
    "{{ISSUED_AT}}": formatUaDate(cert.issued_at),
    "{{CERTIFICATE_NUMBER}}": cert.certificate_number,
  };

  for (const [token, value] of Object.entries(replacements)) {
    html = html.split(token).join(value);
  }

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeName = cert.student_name.replace(/[^\p{L}\p{N}_-]+/gu, "_");
  a.href = url;
  a.download = `certificate-${safeName}-${cert.certificate_number}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
