import type { Answer } from "@/context/AppContext";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDbRowToAnswer(a: Record<string, any>): Answer {
  return {
    id: a.id,
    lessonId: a.lesson_id,
    courseId: a.course_id,
    studentName: a.student_name,
    squadId: a.squad_id,
    text: a.text,
    voiceRecorded: !!a.audio_url,
    audioUrl: a.audio_url ?? undefined,
    attachments: a.attachments ?? [],
    submittedAt: a.created_at,
    status: a.status as "pending" | "reviewed",
    teacherFeedbackText: a.teacher_feedback ?? undefined,
    teacherFeedbackAudio: a.teacher_feedback_audio ?? false,
    score: a.score ?? undefined,
    locked_by_teacher_id: a.locked_by_teacher_id ?? null,
    user_id: a.user_id ?? undefined,
    coins_awarded: a.coins_awarded ?? false,
  };
}
