import * as dynamoose from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { baseKey, timestamps } from "./base.model";
import env from "../config";
import { z } from "zod";

const watchHistorySchema = new dynamoose.Schema(
  {
    ...baseKey,
    userId: {
      type: String,
      required: true,
    },
    contentId: {
      type: String,
      required: true,
    },
    mediaVideoId: {
      type: String,
      required: true,
    },
    contentSection: {
      type: String,
    },
    baseSection: {
      type: String,
    },
    eventType: {
      type: String,
    },
    progress: {
      type: String,
      default: "0",
      validate: (value) => {
        // Regex pattern explanation:
        // ^: start of string
        // (100|[0-9]{1,2}): either exactly 100 or 1-2 digits
        // (\.[0-9]{1,2})?$: optionally followed by a decimal point and 1-2 digits
        const pattern = /^(100|[0-9]{1,2})(\.[0-9]{1,2})?$/;
        return pattern.test(String(value));
      },
    },
    watchedDate: {
      type: String,
      default: new Date().toISOString(),
    },
  },
  {
    timestamps,
  },
);

export class WatchHistory extends Item {
  pk!: string;
  sk!: string;
  userId!: string;
  contentId!: string;
  mediaVideoId!: string;
  contentSection?: string;
  baseSection?: string;
  eventType?: string;
  progress!: string;
  watchedDate!: string;
}

export const WatchHistoryModel = dynamoose.model<WatchHistory>(
  "watch-history",
  watchHistorySchema,
  {
    tableName: `${env.TABLE_NAME}-${env.ENV}`,
    create: false,
    update: false,
  },
);

export const WatchHistoryDto = z.object({
  pk: z.string(),
  sk: z.string(),
  userId: z.string(),
  profileId: z.string(),
  contentId: z.string(),
  mediaVideoId: z.string(),
  contentSection: z.string().optional(),
  baseSection: z.string().optional(),
  eventType: z.string().optional(),
  progress: z.coerce.number().default(0),
  watchedDate: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
