import "dotenv/config";
import { parseEvent } from "./src/parser";
import {
  checkExistingRecord,
  createContinueWatching,
  createWatchHistory,
  performDynamoOperation,
  updateContinueWatching,
  updateWatchHistory,
} from "./src/services/dynamodb";
import { readData } from "./src/services/s3";
import {
  DynamoDBOperation,
  EventType,
  S3Event,
  WatchingEvent,
  WatchingEventSchema,
} from "./src/types";
import { catchError } from "./src/utils/errors";
import { httpHandler } from "./src/utils/http";
import { createLogger } from "./src/utils/logger";
import {
  deduplicateEventByContent,
  deduplicateEventByMediaVideo,
} from "./src/utils/validation";

const logger = createLogger({ service: "watch-history-processor" });

const handler = async (event: S3Event) => {
  const requestId = event.id;
  logger.info("Processing watch history events", { requestId });

  const [error, data] = await catchError(readData(event));
  if (error) {
    logger.error("Failed to read data from S3", { error, requestId });
    throw new Error("Failed to read data from S3");
  }

  const events = parseEvent(data);
  const watchingEvent = deduplicateEventByContent(events);
  const continueWatchingEvent = deduplicateEventByMediaVideo(events);

  const [processingError, results] = await catchError(
    Promise.all([
      processEvents(watchingEvent, "WATCH_HISTORY", requestId),
      processEvents(continueWatchingEvent, "CONTINUE_WATCHING", requestId),
    ]),
  );

  if (processingError) {
    logger.error("Failed to process events", {
      error: processingError,
      requestId,
    });
    throw new Error("Failed to process events");
  }

  const [historyResults, continueWatchingResult] = results;

  logger.info("Successfully processed watch history events", {
    processedCount: historyResults.length + continueWatchingResult.length,
    requestId,
  });

  return httpHandler(200, {
    message: "Success",
    processed: {
      watchingHistory: historyResults.length,
      continueWatching: continueWatchingResult.length,
    },
  });
};

const processEvents = async (
  events: Map<string, WatchingEvent>,
  eventType: EventType,
  requestId: string,
) => {
  const results = [];
  for (const event of events.values()) {
    const { error } = WatchingEventSchema.safeParse(event);
    if (error) {
      logger.error("Invalid event format", {
        error,
      });
      continue;
    }

    try {
      const exists = await checkExistingRecord(event, eventType);

      const actions: {
        [K in EventType]: (events: WatchingEvent) => Promise<DynamoDBOperation>;
      } = {
        WATCH_HISTORY: exists ? updateWatchHistory : createWatchHistory,
        CONTINUE_WATCHING: exists
          ? updateContinueWatching
          : createContinueWatching,
      };

      const operation = await actions[eventType](event);

      await performDynamoOperation(operation);
      results.push({
        userId: event.userId,
        contentId: event.contentId,
        status: "success",
      });
    } catch (error) {
      logger.error("Failed to process event", {
        error,
        userId: event.userId,
        contentId: event.contentId,
        requestId,
        eventType,
      });
      results.push({
        userId: event.userId,
        contentId: event.contentId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
};

export { handler };
