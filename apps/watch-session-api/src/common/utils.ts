import * as crypto from "node:crypto";
import { ApiResponse } from "./types";
import { ObjectType } from "dynamoose/dist/General";

export const generateSessionIdentifier = (
  accountId: string,
  deviceId: string,
) => {
  const data = `${accountId}-${deviceId}-${Date.now()}`;
  return crypto.createHash("md5").update(data).digest("hex");
};

export async function catchError<T>(
  promise: Promise<T>,
): Promise<[undefined, T] | [Error]> {
  return promise
    .then((data) => {
      return [undefined, data] as [undefined, T];
    })
    .catch((error) => {
      return [error];
    });
}

export async function catchErrorTyped<
  T,
  E extends new (message?: string) => Error,
>(
  promise: Promise<T>,
  errorToCatch?: E[],
): Promise<[undefined, T] | [InstanceType<E>]> {
  return promise
    .then((data) => {
      return [undefined, data] as [undefined, T];
    })
    .catch((error) => {
      if (!errorToCatch) {
        return [error];
      }

      if (errorToCatch.some((e) => error instanceof e)) {
        return [error];
      }

      throw error;
    });
}

export const createErrorResponse = (
  message: string,
  error?: string,
): ApiResponse => ({
  message,
  error,
});

export const createSuccessResponse = <T>(
  message: string,
  data?: T,
): ApiResponse<T> => ({
  message,
  data,
});

export function createPk(userId: string, profileId: string): string {
  return `USER#${userId}#PROFILE#${profileId}`;
}

export function sortWatchedDate(
  prev: ObjectType | null,
  curr: ObjectType | null,
) {
  if (!prev || !curr) return 0;
  if (!prev.watchedDate || !curr.watchedDate) return 0;
  return (
    new Date(curr.watchedDate).valueOf() - new Date(prev.watchedDate).valueOf()
  );
}

export function parseExpirationTime(date: number): Date {
  return new Date(date * 1000);
}

export function toExpirationTime(date: Date): number {
  return Math.floor(date.valueOf() / 1000);
}
