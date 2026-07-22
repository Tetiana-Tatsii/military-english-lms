import { supabase } from "@/lib/supabase";

export const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

export function parseYouTubeVideoId(val: string): string {
  const match = val.match(
    /(?:youtu\.be\/|youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i,
  );
  return match?.[1] ?? val;
}

export async function uploadLessonMedia(
  file: File,
  folder: "photos" | "audio" | "documents",
): Promise<string | null> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("not_authenticated");
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    // H3: own folder so Storage RLS can scope INSERT/UPDATE to auth.uid()
    const filePath = `${folder}/${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("lesson-media")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("lesson-media").getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    console.error("Помилка завантаження файлу:", error);
    alert("Не вдалося завантажити файл на сервер.");
    return null;
  }
}
