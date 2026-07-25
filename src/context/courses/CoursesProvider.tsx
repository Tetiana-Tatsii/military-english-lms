"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { mapDbRowToAnswer } from "@/lib/mappers";
import { recalculateSlp } from "@/lib/slp";
import {
  awardHomeworkCoins,
  checkAndCompleteCourse,
} from "@/lib/gamification";
import { getAudioExtension, isIOSDevice } from "@/lib/voiceRecording";
import { fetchCourses } from "@/lib/courses/fetchCourses";
import { fetchAnswers } from "@/lib/courses/fetchAnswers";
import { seedInitialCoursesIfEmpty } from "@/lib/courses/seedInitialCourses";
import { useAuth } from "@/context/auth";
import { useGamification } from "@/context/gamification";
import { answerKeys, courseKeys } from "./queryKeys";
import type { Answer, Course, Lesson, Module } from "@/types";

interface CoursesContextValue {
  courses: Course[];
  answers: Answer[];
  isInitialized: boolean;
  submitAnswer: (
    answerData: Omit<
      Answer,
      "id" | "submittedAt" | "status" | "studentName" | "squadId"
    > & { audioBlob?: Blob | null; files?: File[] },
  ) => Promise<void>;
  provideFeedback: (
    answerId: string,
    feedbackText: string,
    feedbackAudio: boolean,
    score?: number,
    coinsToAward?: number,
  ) => Promise<void>;
  addCourse: (title: string, subtitle: string, description: string) => Promise<void>;
  updateCourse: (courseId: string, updatedData: Partial<Course>) => Promise<void>;
  deleteCourse: (courseId: string) => Promise<void>;
  addModule: (courseId: string, title: string, icon: string) => Promise<void>;
  updateModule: (
    courseId: string,
    moduleId: string,
    updatedData: Partial<Module>,
  ) => Promise<void>;
  deleteModule: (courseId: string, moduleId: string) => Promise<void>;
  addLesson: (
    courseId: string,
    moduleId: string,
    lessonData: Omit<Lesson, "id">,
  ) => Promise<void>;
  updateLesson: (
    courseId: string,
    moduleId: string,
    lessonId: string,
    updatedData: Partial<Lesson>,
  ) => Promise<void>;
  deleteLesson: (
    courseId: string,
    moduleId: string,
    lessonId: string,
  ) => Promise<void>;
}

const CoursesContext = createContext<CoursesContextValue | undefined>(undefined);

type CoursesUpdater = Course[] | ((prev: Course[]) => Course[]);
type AnswersUpdater = Answer[] | ((prev: Answer[]) => Answer[]);

export function CoursesProvider({ children }: { children: ReactNode }) {
  const { user, usersDb, authReady, registerPostLoginHandler } = useAuth();
  const { refreshGamification, setInstructorMood } = useGamification();
  const queryClient = useQueryClient();
  const seedAttempted = useRef(false);

  const coursesQueryKey = courseKeys.byUser(user?.id);
  const answersQueryKey = answerKeys.byUser(user?.id);

  const coursesQuery = useQuery({
    queryKey: coursesQueryKey,
    queryFn: async () => {
      const data = await fetchCourses();
      if (data === null) throw new Error("Failed to load courses");
      return data;
    },
    enabled: authReady,
  });

  const answersQuery = useQuery({
    queryKey: answersQueryKey,
    queryFn: fetchAnswers,
    enabled: authReady,
  });

  const courses = coursesQuery.data ?? [];
  const answers = answersQuery.data ?? [];
  const isInitialized =
    authReady && coursesQuery.isFetched && answersQuery.isFetched;

  const setCourses = useCallback(
    (updater: CoursesUpdater) => {
      queryClient.setQueryData<Course[]>(coursesQueryKey, (prev) => {
        const current = prev ?? [];
        return typeof updater === "function" ? updater(current) : updater;
      });
    },
    [queryClient, coursesQueryKey],
  );

  const setAnswers = useCallback(
    (updater: AnswersUpdater) => {
      queryClient.setQueryData<Answer[]>(answersQueryKey, (prev) => {
        const current = prev ?? [];
        return typeof updater === "function" ? updater(current) : updater;
      });
    },
    [queryClient, answersQueryKey],
  );

  // One-time cleanup of legacy localStorage caches
  useEffect(() => {
    localStorage.removeItem("lanp_courses");
    localStorage.removeItem("lanp_answers");
  }, []);

  // Seed empty DB once (fresh project / local)
  useEffect(() => {
    if (!authReady || !coursesQuery.isFetched || seedAttempted.current) return;
    if (coursesQuery.isError) return;

    if ((coursesQuery.data?.length ?? 0) > 0) {
      seedAttempted.current = true;
      return;
    }

    seedAttempted.current = true;
    (async () => {
      try {
        await seedInitialCoursesIfEmpty();
        await queryClient.invalidateQueries({ queryKey: courseKeys.all });
      } catch (error) {
        console.error("Помилка seed курсів:", error);
      }
    })();
  }, [
    authReady,
    coursesQuery.isFetched,
    coursesQuery.isError,
    coursesQuery.data?.length,
    queryClient,
  ]);

  useEffect(() => {
    return registerPostLoginHandler(async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: courseKeys.all }),
        queryClient.invalidateQueries({ queryKey: answerKeys.all }),
      ]);
    });
  }, [registerPostLoginHandler, queryClient]);

  // Realtime → invalidate (simpler than hand-merging into cache)
  useEffect(() => {
    if (!isInitialized) return;

    const coursesChannel = supabase
      .channel("lms-courses-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "lms_courses" },
        () => {
          void queryClient.invalidateQueries({ queryKey: courseKeys.all });
        },
      )
      .subscribe();

    const lessonsChannel = supabase
      .channel("lms-lessons-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lms_lessons" },
        () => {
          void queryClient.invalidateQueries({ queryKey: courseKeys.all });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(coursesChannel);
      supabase.removeChannel(lessonsChannel);
    };
  }, [isInitialized, queryClient]);

  const saveCourseToSupabase = useCallback(async (course: Course) => {
    try {
      const modulesForDb = (course.modules || []).map((mod) => ({
        id: mod.id,
        title: mod.title,
        icon: mod.icon,
        lessons: [],
      }));

      const { error } = await supabase.from("lms_courses").upsert({
        id: course.id,
        title: course.title || "",
        subtitle: course.subtitle || "",
        description: course.description || "",
        status: course.status || "draft",
        modules: modulesForDb,
        final_test: course.finalTest || { title: "", questions: [] },
      });

      if (error) {
        console.error("Помилка Supabase при збереженні курсу:", error);
        throw error;
      }
    } catch (error) {
      console.error("Помилка при збереженні курсу:", error);
      throw error;
    }
  }, []);

  const callModuleRpc = useCallback(
    async (
      rpcName: string,
      args: Record<string, unknown>,
      courseId: string,
    ): Promise<Module[]> => {
      const { data, error } = await supabase.rpc(rpcName, args);
      if (error) {
        console.error(`RPC ${rpcName} failed:`, error.message);
        throw new Error(
          error.message ||
            `RPC ${rpcName} failed (перевірте права на schema private).`,
        );
      }
      const newModules = (data as Module[]) || [];
      setCourses((prev) =>
        prev.map((c) => {
          if (c.id !== courseId) return c;
          const mergedModules = newModules.map((updMod) => {
            const existingMod = c.modules.find((m) => m.id === updMod.id);
            return { ...updMod, lessons: existingMod?.lessons ?? [] };
          });
          return { ...c, modules: mergedModules };
        }),
      );
      return newModules;
    },
    [setCourses],
  );

  const submitAnswer = useCallback(
    async (
      answerData: Omit<
        Answer,
        "id" | "submittedAt" | "status" | "studentName" | "squadId"
      > & { audioBlob?: Blob | null; files?: File[] },
    ) => {
      if (!user) {
        console.error("Користувач не авторизований для відправки відповіді");
        return;
      }

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
            user_id: user?.id,
            course_id: answerData.courseId,
            lesson_id: answerData.lessonId,
            text: answerData.text || "",
            audio_url: audioUrl || null,
            attachments: [...(answerData.attachments || []), ...fileUrls],
            status: "pending",
            student_name: user?.name || "Курсант",
            squad_id: user?.squadId || "General",
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Помилка Supabase при збереженні:", error);
        throw error;
      }

      if (data) {
        setAnswers((prev) => [...prev, mapDbRowToAnswer(data)]);
      }
    },
    [user, setAnswers],
  );

  const provideFeedback = useCallback(
    async (
      answerId: string,
      feedbackText: string,
      feedbackAudio: boolean,
      score?: number,
      coinsToAward?: number,
    ) => {
      const answer = answers.find((a) => a.id === answerId);
      const coinAmount = Math.min(20, Math.max(0, coinsToAward ?? 0));
      const willAwardCoins = coinAmount > 0 && !answer?.coins_awarded;

      setAnswers((prev) =>
        prev.map((ans) =>
          ans.id === answerId
            ? {
                ...ans,
                teacherFeedbackText: feedbackText,
                teacherFeedbackAudio: feedbackAudio,
                score,
                status: "reviewed",
                coins_awarded: willAwardCoins ? true : ans.coins_awarded,
                coins_awarded_amount: willAwardCoins
                  ? coinAmount
                  : ans.coins_awarded_amount,
              }
            : ans,
        ),
      );

      const { error } = await supabase
        .from("answers")
        .update({
          score,
          teacher_feedback: feedbackText,
          teacher_feedback_audio: feedbackAudio,
          status: "reviewed",
        })
        .eq("id", answerId);

      if (error) {
        console.error("Помилка Supabase при збереженні фідбеку:", error);
        throw error;
      }

      let studentId =
        answer?.user_id ||
        usersDb.find((u) => u.name === answer?.studentName)?.id;

      if (willAwardCoins) {
        const coinResult = await awardHomeworkCoins(
          supabase,
          answerId,
          coinAmount,
        );
        if (coinResult.error) {
          setAnswers((prev) =>
            prev.map((ans) =>
              ans.id === answerId
                ? {
                    ...ans,
                    coins_awarded: answer?.coins_awarded ?? false,
                    coins_awarded_amount: answer?.coins_awarded_amount ?? 0,
                  }
                : ans,
            ),
          );
          throw new Error(
            coinResult.error === "forbidden"
              ? "Немає прав на нарахування коїнів."
              : coinResult.error === "student_not_found"
                ? "Не знайдено профіль курсанта для нарахування коїнів."
                : `Не вдалося нарахувати коїни: ${coinResult.error}`,
          );
        }
        if (coinResult.studentId) {
          studentId = coinResult.studentId;
        }
        setAnswers((prev) =>
          prev.map((ans) =>
            ans.id === answerId
              ? {
                  ...ans,
                  coins_awarded: true,
                  coins_awarded_amount:
                    coinResult.coinsAwardedAmount ?? coinAmount,
                }
              : ans,
          ),
        );
      }

      if (studentId) {
        if (answer?.courseId) {
          const justCompleted = await checkAndCompleteCourse(
            supabase,
            studentId,
            answer.courseId,
            courses,
          );
          if (justCompleted) {
            setInstructorMood("proud");
            await refreshGamification(studentId);
          }
        }

        if (score !== undefined) {
          await recalculateSlp(supabase, studentId, courses);
        }
      }
    },
    [
      answers,
      courses,
      refreshGamification,
      setAnswers,
      setInstructorMood,
      usersDb,
    ],
  );

  const addCourse = useCallback(
    async (title: string, subtitle: string, description: string) => {
      const newCourse: Course = {
        id: `course-${Date.now()}`,
        title,
        subtitle,
        description,
        status: "draft",
        modules: [],
        finalTest: { title: `Підсумковий тест: ${title}`, questions: [] },
      };
      setCourses((prev) => [...prev, newCourse]);
      await saveCourseToSupabase(newCourse);
    },
    [saveCourseToSupabase, setCourses],
  );

  const updateCourse = useCallback(
    async (courseId: string, updatedData: Partial<Course>) => {
      let updatedCourse: Course | undefined;
      setCourses((prev) => {
        const newCourses = prev.map((c) =>
          c.id === courseId ? { ...c, ...updatedData } : c,
        );
        updatedCourse = newCourses.find((c) => c.id === courseId);
        return newCourses;
      });
      if (updatedCourse) await saveCourseToSupabase(updatedCourse);
    },
    [saveCourseToSupabase, setCourses],
  );

  const deleteCourse = useCallback(
    async (courseId: string) => {
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      try {
        await supabase.from("lms_courses").delete().eq("id", courseId);
      } catch (error) {
        console.error("Помилка видалення курсу з Supabase:", error);
      }
    },
    [setCourses],
  );

  const addModule = useCallback(
    async (courseId: string, title: string, icon: string) => {
      await callModuleRpc(
        "add_module_to_course",
        {
          p_course_id: courseId,
          p_module: { id: `mod-${Date.now()}`, title, icon, lessons: [] },
        },
        courseId,
      );
    },
    [callModuleRpc],
  );

  const updateModule = useCallback(
    async (
      courseId: string,
      moduleId: string,
      updatedData: Partial<Module>,
    ) => {
      await callModuleRpc(
        "update_module_in_course",
        {
          p_course_id: courseId,
          p_module_id: moduleId,
          p_module_patch: updatedData,
        },
        courseId,
      );
    },
    [callModuleRpc],
  );

  const deleteModule = useCallback(
    async (courseId: string, moduleId: string) => {
      await supabase
        .from("lms_lessons")
        .delete()
        .eq("course_id", courseId)
        .eq("module_id", moduleId);

      await callModuleRpc(
        "delete_module_from_course",
        { p_course_id: courseId, p_module_id: moduleId },
        courseId,
      );
    },
    [callModuleRpc],
  );

  const addLesson = useCallback(
    async (
      courseId: string,
      moduleId: string,
      lessonData: Omit<Lesson, "id">,
    ) => {
      const newLessonId = `lesson-${Date.now()}`;
      const newLesson: Lesson = { ...lessonData, id: newLessonId };

      const course = courses.find((c) => c.id === courseId);
      const mod = course?.modules.find((m) => m.id === moduleId);
      const orderIndex = mod?.lessons.length ?? 0;

      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? {
                ...c,
                modules: c.modules.map((m) =>
                  m.id === moduleId
                    ? { ...m, lessons: [...m.lessons, newLesson] }
                    : m,
                ),
              }
            : c,
        ),
      );

      const { error } = await supabase.from("lms_lessons").insert({
        id: newLessonId,
        course_id: courseId,
        module_id: moduleId,
        order_index: orderIndex,
        content: newLesson,
      });

      if (error) {
        console.error("Помилка додавання уроку:", error);
        setCourses((prev) =>
          prev.map((c) =>
            c.id === courseId
              ? {
                  ...c,
                  modules: c.modules.map((m) =>
                    m.id === moduleId
                      ? {
                          ...m,
                          lessons: m.lessons.filter((l) => l.id !== newLessonId),
                        }
                      : m,
                  ),
                }
              : c,
          ),
        );
        throw error;
      }
    },
    [courses, setCourses],
  );

  const updateLesson = useCallback(
    async (
      courseId: string,
      moduleId: string,
      lessonId: string,
      updatedData: Partial<Lesson>,
    ) => {
      const course = courses.find((c) => c.id === courseId);
      const mod = course?.modules.find((m) => m.id === moduleId);
      const existingLesson =
        mod?.lessons.find((l) => l.id === lessonId) ?? ({} as Lesson);
      const orderIndex = mod?.lessons.findIndex((l) => l.id === lessonId) ?? 0;

      const updatedLesson: Lesson = {
        ...existingLesson,
        ...updatedData,
        id: lessonId,
      };

      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? {
                ...c,
                modules: c.modules.map((m) =>
                  m.id === moduleId
                    ? {
                        ...m,
                        lessons: m.lessons.map((l) =>
                          l.id === lessonId ? updatedLesson : l,
                        ),
                      }
                    : m,
                ),
              }
            : c,
        ),
      );

      const { error } = await supabase.from("lms_lessons").upsert(
        {
          id: lessonId,
          course_id: courseId,
          module_id: moduleId,
          order_index: Math.max(0, orderIndex),
          content: updatedLesson,
        },
        { onConflict: "id" },
      );

      if (error) {
        console.error("Помилка збереження уроку:", error.message, error);
        throw new Error(
          error.message ||
            "Немає прав на збереження (перевірте RLS для lms_lessons і роль teacher/admin).",
        );
      }
    },
    [courses, setCourses],
  );

  const deleteLesson = useCallback(
    async (courseId: string, moduleId: string, lessonId: string) => {
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? {
                ...c,
                modules: c.modules.map((m) =>
                  m.id === moduleId
                    ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) }
                    : m,
                ),
              }
            : c,
        ),
      );

      const { error } = await supabase
        .from("lms_lessons")
        .delete()
        .eq("id", lessonId);

      if (error) {
        console.error("Помилка видалення уроку:", error);
        throw error;
      }
    },
    [setCourses],
  );

  return (
    <CoursesContext.Provider
      value={{
        courses,
        answers,
        isInitialized,
        submitAnswer,
        provideFeedback,
        addCourse,
        updateCourse,
        deleteCourse,
        addModule,
        updateModule,
        deleteModule,
        addLesson,
        updateLesson,
        deleteLesson,
      }}
    >
      {children}
    </CoursesContext.Provider>
  );
}

export function useCourses() {
  const context = useContext(CoursesContext);
  if (!context) {
    throw new Error("useCourses must be used within CoursesProvider");
  }
  return context;
}
