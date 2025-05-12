import { model } from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { Schema } from "dynamoose/dist/Schema";
import env from "../config";
import { baseKey, timestamps } from "./base.model";

const sessionSchema = new Schema(
  {
    ...baseKey,
    userId: {
      type: String,
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: {
        name: "SessionIdIndex",
        type: "global",
        rangeKey: "isActive",
      },
    },
    profileId: {
      type: String,
      required: true,
    },
    contentId: String,
    deviceId: String,
    membershipType: String,
    startTime: {
      type: String,
      default: () => new Date().toISOString(),
    },
    sessionState: {
      type: String,
      enum: ["ACTIVE", "TERMINATED"],
      required: true,
      default: "ACTIVE",
    },
    expirationTime: Number,
    isActive: {
      type: String,
      default: undefined,
    },
  },
  { timestamps },
);

export class Session extends Item {
  pk!: string;
  sk!: string;
  userId!: string;
  sessionId!: string;
  profileId!: string;
  contentId?: string;
  deviceId?: string;
  membershipType?: string;
  startTime!: string;
  sessionState!: string;
  expirationTime!: number;
  isActive!: string;
}

export type SessionProps = typeof Session.prototype;

export const SessionModel = model<Session>("session", sessionSchema, {
  tableName: `${env.TABLE_NAME}-${env.ENV}`,
  create: false,
  update: false,
});

export enum SessionIndex {
  ACTIVE_SESSIONS = "ActiveSessions",
  SESSION_ID_INDEX = "SessionIdIndex",
}
