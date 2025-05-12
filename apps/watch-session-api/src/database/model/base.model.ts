export const baseKey = {
  pk: {
    type: String,
    hashKey: true,
    required: true,
  },
  sk: {
    type: String,
    required: true,
    rangeKey: true,
  },
};

export const timestamps = {
  createdAt: {
    createdAt: {
      type: {
        value: Date,
        settings: {
          storage: "iso",
        },
      },
    },
  },
  updatedAt: {
    updatedAt: {
      type: {
        value: Date,
        settings: {
          storage: "iso",
        },
      },
    },
  },
};

export type ModelProps<T> = {
  [K in keyof T as T[K] extends (...args: any[]) => any ? never : K]: T[K];
};

export const SESSION_EXPIRE_DURATION_MS = 2 * 60 * 1000; // 2 minutes
