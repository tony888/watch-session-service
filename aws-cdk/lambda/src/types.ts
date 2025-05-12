import { PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";

export type EventType = "CONTINUE_WATCHING" | "WATCH_HISTORY";

export type DynamoDBOperation = PutCommand | UpdateCommand;

export const WatchingEventSchema = z.object({
  userId: z.string().uuid(),
  profileId: z.string().uuid(),
  contentId: z.string().uuid(),
  mediaVideoId: z.string().uuid(),
  contentSection: z.string().max(50).optional(),
  baseSection: z.string().max(30).optional(),
  eventType: z.string().max(50).optional(),
  progress: z.number().min(0).max(100),
  timestamp: z.number(),
});

export type WatchingEvent = z.infer<typeof WatchingEventSchema>;

export interface S3Event {
  version: string;
  id: string;
  "detail-type": string;
  source: string;
  account: string;
  time: string;
  region: string;
  resources: string[];
  detail: {
    version: string;
    bucket: {
      name: string;
    };
    object: {
      key: string;
      size: number;
      etag: string;
      sequencer: string;
    };
    "request-id": string;
    requester: string;
    "source-ip-address": string;
    reason: string;
  };
}
