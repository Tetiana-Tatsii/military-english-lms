import { supabase } from "@/lib/supabase";
import { mapDbRowToAnswer } from "@/lib/mappers";
import { getAudioExtension, isIOSDevice } from "@/lib/voiceRecording";
import type { Answer, SessionUser } from "@/types";

export type SubmitHomeworkInput = Omit<
  Answer,
  "id" | "submittedAt" | "status" | "studentName" | "squadId"
> & { audioBlob?: Blob | null; files?: File[] };

/** Upload media + insert answers row. Returns mapped Answer. */
export async function submitHomeworkAnswer(
  user: SessionUser,
  answerData: SubmitHomeworkInput,
): Promise<Answer> {
  let audioUrl: string | undefined;
  const fileUrls: string[] = [];

  try {
    if (answerData.audioBlob) {
      try {
        const audioMime =
          answerData.audioBlob.type ||
          (isIOSDevice() ? "audio/mp4" : "audio/webm");
        const fileExt = getAudioExtension(audioMime);
        const fileName = `audio-${Date.now()}.${fileExt}`;
        const filePath = `student-answers/${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("lesson-media")
          .upload(filePath, answerData.audioBlob, {
            contentType: audioMime,
            upsert: false,
          });

        if (!uploadError) {
          const { data } = supabase.storage
            .from("lesson-media")
            .getPublicUrl(filePath);
          audioUrl = data.publicUrl;
        } else {
          console.error("Помилка завантаження аудіо:", uploadError);
        }
      } catch (error) {
        console.error("Помилка завантаження аудіо:", error);
      }
    }

    if (answerData.files && answerData.files.length > 0) {
      const { compressImageFile, isCompressibleImage } = await import(
        "@/lib/compressImage"
      );

      for (const rawFile of answerData.files) {
        try {
          const file = isCompressibleImage(rawFile)
            ? await compressImageFile(rawFile)
            : rawFile;
          const fileExt = file.name.split(".").pop() || "bin";
          const fileName = `file-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `student-answers/${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("lesson-media")
            .upload(filePath, file, {
              contentType: file.type || undefined,
              upsert: false,
            });

          if (!uploadError) {
            const { data } = supabase.storage
              .from("lesson-media")
              .getPublicUrl(filePath);
            fileUrls.push(data.publicUrl);
          } else {
            console.error("Помилка завантаження файлу:", uploadError);
          }
        } catch (error) {
          console.error("Помилка завантаження файлу:", error);
        }
      }
    }
  } catch (error) {
    console.error("Помилка при обробці відповіді:", error);
  }

  const { data, error } = await supabase
    .from("answers")
    .insert([
      {
        user_id: user.id,
        course_id: answerData.courseId,
        lesson_id: answerData.lessonId,
        text: answerData.text || "",
        audio_url: audioUrl || null,
        attachments: [...(answerData.attachments || []), ...fileUrls],
        status: "pending",
        student_name: user.name || "Курсант",
        squad_id: user.squadId || "General",
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Помилка Supabase при збереженні:", error);
    throw error;
  }

  return mapDbRowToAnswer(data);
}
