export const courseKeys = {
  all: ["courses"] as const,
  byUser: (userId: string | null | undefined) =>
    ["courses", userId ?? "anon"] as const,
};

export const answerKeys = {
  all: ["answers"] as const,
  byUser: (userId: string | null | undefined) =>
    ["answers", userId ?? "anon"] as const,
};
