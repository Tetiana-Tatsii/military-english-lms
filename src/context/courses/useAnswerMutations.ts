"use client";

import { useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth";
import { useGamification } from "@/context/gamification";
import {
  submitHomeworkAnswer,
  type SubmitHomeworkInput,
} from "@/lib/courses/submitHomeworkAnswer";
import {
  provideHomeworkFeedback,
  type ProvideFeedbackInput,
  type ProvideFeedbackResult,
} from "@/lib/courses/provideHomeworkFeedback";
import { answerKeys, courseKeys } from "./queryKeys";
import type { Answer, Course } from "@/types";

type SetAnswers = (updater: Answer[] | ((prev: Answer[]) => Answer[])) => void;

export function useAnswerMutations(options: {
  answers: Answer[];
  courses: Course[];
  setAnswers: SetAnswers;
}) {
  const { answers, courses, setAnswers } = options;
  const { user, usersDb } = useAuth();
  const { refreshGamification, setInstructorMood } = useGamification();
  const queryClient = useQueryClient();
  /** Answers as they were before optimistic feedback patch (for coin RPC). */
  const feedbackAnswersSnapshot = useRef<Answer[] | null>(null);

  const submitMutation = useMutation({
    mutationFn: async (answerData: SubmitHomeworkInput) => {
      if (!user) {
        throw new Error("Користувач не авторизований для відправки відповіді");
      }
      return submitHomeworkAnswer(user, answerData);
    },
    onSuccess: (created) => {
      setAnswers((prev) => [...prev, created]);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: answerKeys.all });
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async (input: ProvideFeedbackInput) => {
      // Prefer pre-optimistic snapshot. getQueryData here can see a stale
      // coins_awarded=true from an older optimistic patch and skip the RPC.
      const latestAnswers = feedbackAnswersSnapshot.current ?? answers;
      const latestCourses =
        queryClient.getQueryData<Course[]>(courseKeys.byUser(user?.id)) ??
        courses;

      return provideHomeworkFeedback(input, {
        answers: latestAnswers,
        courses: latestCourses,
        usersDb,
        refreshGamification,
        setInstructorMood,
      });
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: answerKeys.all });
      const previous =
        queryClient.getQueryData<Answer[]>(answerKeys.byUser(user?.id)) ??
        answers;
      feedbackAnswersSnapshot.current = previous;

      // Optimistic score/feedback only — never flip coins_awarded before RPC.
      setAnswers((prev) =>
        prev.map((ans) =>
          ans.id === input.answerId
            ? {
                ...ans,
                teacherFeedbackText: input.feedbackText,
                teacherFeedbackAudio: input.feedbackAudio,
                score: input.score,
                status: "reviewed" as const,
              }
            : ans,
        ),
      );

      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        setAnswers(context.previous);
      }
    },
    onSettled: () => {
      feedbackAnswersSnapshot.current = null;
    },
    onSuccess: async (result) => {
      // Apply server patch first so coins survive refetch races.
      setAnswers((prev) =>
        prev.map((ans) =>
          ans.id === result.answerId ? { ...ans, ...result.patch } : ans,
        ),
      );
      await queryClient.invalidateQueries({ queryKey: answerKeys.all });
      setAnswers((prev) =>
        prev.map((ans) =>
          ans.id === result.answerId ? { ...ans, ...result.patch } : ans,
        ),
      );
    },
  });

  const submitAnswer = useCallback(
    async (answerData: SubmitHomeworkInput) => {
      if (!user) {
        console.error("Користувач не авторизований для відправки відповіді");
        return;
      }
      await submitMutation.mutateAsync(answerData);
    },
    [user, submitMutation],
  );

  const provideFeedback = useCallback(
    async (
      answerId: string,
      feedbackText: string,
      feedbackAudio: boolean,
      score?: number,
      coinsToAward?: number,
    ): Promise<ProvideFeedbackResult> => {
      return feedbackMutation.mutateAsync({
        answerId,
        feedbackText,
        feedbackAudio,
        score,
        coinsToAward,
      });
    },
    [feedbackMutation],
  );

  return { submitAnswer, provideFeedback };
}
