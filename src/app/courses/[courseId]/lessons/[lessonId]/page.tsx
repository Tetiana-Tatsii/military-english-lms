import { redirect } from "next/navigation";

type LegacyLessonPageProps = {
  params: Promise<{ courseId: string; lessonId: string }>;
};

/**
 * Legacy route kept for old bookmarks / links.
 * Active lesson UX lives at /courses/[courseId]?lesson=[lessonId].
 */
export default async function LegacyLessonRedirectPage({
  params,
}: LegacyLessonPageProps) {
  const { courseId, lessonId } = await params;
  redirect(
    `/courses/${encodeURIComponent(courseId)}?lesson=${encodeURIComponent(lessonId)}`,
  );
}
