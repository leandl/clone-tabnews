export const features = {
  READ: {
    ACTIVATION_TOKEN: "read:activation_token",
    SESSION: "read:session",
  },

  CREATE: {
    SESSION: "create:session",
    USER: "create:user",
  },

  UPDATE: {
    USER: {
      SELF: "update:user",
      OTHERS: "update:user:others",
    },
  },
} as const;

type DeepValue<T> = T extends string
  ? T
  : T extends Record<string, unknown>
    ? DeepValue<T[keyof T]>
    : never;

export type Feature = DeepValue<typeof features>;
