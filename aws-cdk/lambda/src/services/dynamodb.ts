import { DynamoDB } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  QueryCommandInput,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBOperation, WatchingEvent } from "lambda/src/types";
import { CONFIG } from "../config";
import { createLogger } from "../utils/logger";

const ddb = new DynamoDB({ region: CONFIG.region });
const ddbClient = DynamoDBDocumentClient.from(ddb);
const logger = createLogger({ service: "dynamodb-service" });

export const checkExistingRecord = async (
  event: WatchingEvent,
  skPrefix: "WATCH_HISTORY" | "CONTINUE_WATCHING",
): Promise<boolean> => {
  let skValue = "";
  if (skPrefix === "WATCH_HISTORY") {
    skValue = `${skPrefix}#${event.contentId}`;
  }
  if (skPrefix === "CONTINUE_WATCHING") {
    skValue = `${skPrefix}#${event.contentId}#${event.mediaVideoId}`;
  }

  const query: QueryCommandInput = {
    TableName: CONFIG.tableName,
    KeyConditionExpression: "pk = :pk and sk = :sk",
    ExpressionAttributeValues: {
      ":pk": `USER#${event.userId}#PROFILE#${event.profileId}`,
      ":sk": skValue,
    },
  };

  const result = await ddbClient.send(new QueryCommand(query));
  return (result.Count ?? 0) > 0;
};

export const createWatchHistory = async (
  event: WatchingEvent,
): Promise<DynamoDBOperation> => {
  const now = new Date().toISOString();
  return new PutCommand({
    TableName: CONFIG.tableName,
    Item: {
      pk: `USER#${event.userId}#PROFILE#${event.profileId}`,
      sk: `WATCH_HISTORY#${event.contentId}`,
      userId: event.userId,
      profileId: event.profileId,
      contentId: event.contentId,
      mediaVideoId: event.mediaVideoId,
      contentSection: event.contentSection,
      baseSection: event.baseSection,
      eventType: event.eventType,
      progress: event.progress.toFixed(2),
      watchedDate: new Date(event.timestamp).toISOString(),
      createdAt: now,
      updatedAt: now,
    },
    ConditionExpression:
      "attribute_not_exists(pk) AND attribute_not_exists(sk)",
  });
};

export const updateWatchHistory = async (
  event: WatchingEvent,
): Promise<DynamoDBOperation> => {
  return new UpdateCommand({
    TableName: CONFIG.tableName,
    Key: {
      pk: `USER#${event.userId}#PROFILE#${event.profileId}`,
      sk: `WATCH_HISTORY#${event.contentId}`,
    },
    UpdateExpression: `SET mediaVideoId = :mediaVideoId,
      contentSection = :contentSection,
      baseSection = :baseSection,
      eventType = :eventType,
      progress = :progress,
      watchedDate = :watchedDate,
      updatedAt = :updatedAt`,
    ExpressionAttributeValues: {
      ":mediaVideoId": event.mediaVideoId,
      ":contentSection": event.contentSection,
      ":baseSection": event.baseSection,
      ":eventType": event.eventType,
      ":progress": event.progress.toFixed(2),
      ":watchedDate": new Date(event.timestamp).toISOString(),
      ":updatedAt": new Date().toISOString(),
    },
    ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
  });
};

export const createContinueWatching = async (
  event: WatchingEvent,
): Promise<DynamoDBOperation> => {
  const now = new Date().toISOString();
  return new PutCommand({
    TableName: CONFIG.tableName,
    Item: {
      pk: `USER#${event.userId}#PROFILE#${event.profileId}`,
      sk: `CONTINUE_WATCHING#${event.contentId}#${event.mediaVideoId}`,
      userId: event.userId,
      profileId: event.profileId,
      contentId: event.contentId,
      mediaVideoId: event.mediaVideoId,
      contentSection: event.contentSection,
      baseSection: event.baseSection,
      eventType: event.eventType,
      progress: event.progress.toFixed(2),
      watchedDate: new Date(event.timestamp).toISOString(),
      createdAt: now,
      updatedAt: now,
    },
    ConditionExpression:
      "attribute_not_exists(pk) AND attribute_not_exists(sk)",
  });
};

export const updateContinueWatching = async (
  event: WatchingEvent,
): Promise<DynamoDBOperation> => {
  return new UpdateCommand({
    TableName: CONFIG.tableName,
    Key: {
      pk: `USER#${event.userId}#PROFILE#${event.profileId}`,
      sk: `CONTINUE_WATCHING#${event.contentId}#${event.mediaVideoId}`,
    },
    UpdateExpression: `SET mediaVideoId = :mediaVideoId,
      contentSection = :contentSection,
      baseSection = :baseSection,
      eventType = :eventType,
      progress = :progress,
      watchedDate = :watchedDate,
      updatedAt = :updatedAt`,
    ExpressionAttributeValues: {
      ":mediaVideoId": event.mediaVideoId,
      ":contentSection": event.contentSection,
      ":baseSection": event.baseSection,
      ":eventType": event.eventType,
      ":progress": event.progress.toFixed(2),
      ":watchedDate": new Date(event.timestamp).toISOString(),
      ":updatedAt": new Date().toISOString(),
    },
    ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
  });
};

export const performDynamoOperation = async (
  operation: DynamoDBOperation,
  retryCount = 0,
  maxRetries = CONFIG.maxRetries,
  baseDelay = 100,
): Promise<any> => {
  try {
    return await ddbClient.send(operation as any);
  } catch (error) {
    if (!(error instanceof Error)) throw error;

    const retryableErrors = [
      "ProvisionedThroughputExceededException",
      "ConditionalCheckFailedException",
    ];

    if (retryCount < maxRetries && retryableErrors.includes(error.name)) {
      const delay = Math.min(Math.pow(2, retryCount) * baseDelay, 5000);
      logger.warn("Retrying operation", {
        retryCount,
        error: error.name,
        delay,
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
      return performDynamoOperation(
        operation,
        retryCount + 1,
        maxRetries,
        baseDelay,
      );
    }
    throw error;
  }
};
