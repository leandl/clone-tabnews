export const features = {
  READ: {
    ACTIVATION_TOKEN: "read:activation_token",
    SESSION: "read:session",
    USER: {
      DEFAULT: "read:user",
      SELF: "create:user:self",
    },
    MIGRATION: "read:migration",
    STATUS: {
      DEFAULT: "read:status",
      ALL: "read:status:all",
    },
  },

  CREATE: {
    SESSION: "create:session",
    USER: "create:user",
    MIGRATION: "create:migration",
  },

  UPDATE: {
    USER: {
      DEFAULT: "update:user",
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

function extractFeatures(obj: unknown): Feature[] {
  if (typeof obj === "string") {
    return [obj] as Feature[];
  }

  if (typeof obj === "object" && obj !== null) {
    return Object.values(obj).flatMap(extractFeatures);
  }

  return [];
}

export const availableFeatures = extractFeatures(features);
