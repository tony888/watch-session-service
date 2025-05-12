import env from "config/env";

export const CONFIG = {
  tableName: `watch-session-${env.ENV}`,
  region: process.env.REGION || "ap-southeast-1",
  maxRetries: 3,
} as const;
