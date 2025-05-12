import { Hono } from "hono";
import * as z from "zod";
import { NotFoundException, validator } from "../common/errors";
import { createLogger } from "../common/logger";
import { ERROR_MESSAGES } from "../common/messages";
import { createErrorResponse, createSuccessResponse } from "../common/utils";
import {
  WatchHistoryDto,
  WatchHistoryModel,
} from "../database/model/watch-history.model";
import { WatchHistoryRepository } from "../database/watch-history.repository";

const DEFAULT_LIMIT = 50;

const app = new Hono();

const repo = new WatchHistoryRepository(WatchHistoryModel);
const logger = createLogger({ service: "watch-session-api.history" });

const queries = z.object({
  userId: z.string({
    required_error: ERROR_MESSAGES.USER_ID_REQUIRED,
  }),
  profileId: z.string({
    required_error: ERROR_MESSAGES.PROFILE_ID_REQUIRED,
  }),
  contentId: z.string().optional(),
  contentSection: z.union([z.string(), z.array(z.string())]).optional(),
  baseSection: z.union([z.string(), z.array(z.string())]).optional(),
  limit: z.coerce
    .number()
    .int()
    .gt(0)
    .lte(100)
    .default(DEFAULT_LIMIT)
    .optional(),
});

app.get("/", validator("query", queries), async (c) => {
  const {
    userId,
    profileId,
    contentId,
    contentSection = [],
    baseSection = [],
    limit,
  } = c.req.valid("query");
  logger.info("Fetching watch history", {
    userId,
    profileId,
    contentId: contentId || "all",
    contentSections: contentSection || "all",
    baseSections: baseSection || "all",
  });

  const data = contentId
    ? await repo.getOne(userId, profileId, contentId)
    : await repo.list(userId, profileId, {
        contentSections: Array.isArray(contentSection)
          ? contentSection
          : contentSection ? [contentSection] : [],
        baseSections: Array.isArray(baseSection)
          ? baseSection
          : baseSection ? [baseSection] : [],
        limit: limit || DEFAULT_LIMIT,
      });

  if (!data) {
    logger.info("No history found", { userId, contentId });
    return c.json(createErrorResponse(ERROR_MESSAGES.NOT_FOUND), 404);
  }

  logger.info("History retrieved successfully", {
    userId,
    contentId: contentId || "all",
    resultCount: Array.isArray(data) ? data.length : 1,
  });

  return c.json(
    createSuccessResponse(
      "Retrieved history successfully",
      Array.isArray(data)
        ? data.map((item) => WatchHistoryDto.parse(item))
        : WatchHistoryDto.parse(data),
    ),
    200,
  );
});

app.delete(
  "/",
  validator(
    "json",
    z.object({
      userId: z
        .string({ required_error: ERROR_MESSAGES.USER_ID_REQUIRED })
        .uuid({
          message: ERROR_MESSAGES.ID_MUST_BE_UUID,
        }),
      profileId: z
        .string({
          required_error: ERROR_MESSAGES.PROFILE_ID_REQUIRED,
        })
        .uuid({
          message: ERROR_MESSAGES.ID_MUST_BE_UUID,
        }),
      contentId: z
        .string()
        .uuid({
          message: ERROR_MESSAGES.ID_MUST_BE_UUID,
        })
        .optional(),
      watchedDate: z
        .string()
        .date(ERROR_MESSAGES.INVALID_DATE_FORMAT)
        .optional(),
      contentSection: z.union([z.string(), z.array(z.string())]).optional(),
      baseSection: z.union([z.string(), z.array(z.string())]).optional(),
    }),
  ),
  async (c) => {
    const {
      userId,
      profileId,
      contentId,
      contentSection = [],
      baseSection = [],
      watchedDate,
    } = c.req.valid("json");

    const contentSections = Array.isArray(contentSection)
      ? contentSection
      : contentSection ? [contentSection] : [];
      
    const baseSections = Array.isArray(baseSection)
      ? baseSection
      : baseSection ? [baseSection] : [];

    logger.info("Deleting watch history", { 
      userId, 
      contentId, 
      contentSections: contentSections.length > 0 ? contentSections : "none", 
      baseSections: baseSections.length > 0 ? baseSections : "none" 
    });
    
    try {
      if (contentSections.length > 0 || baseSections.length > 0) {
        await repo.deleteAll(userId, profileId, {
          contentSections: contentSections.length > 0 ? contentSections : undefined,
          baseSections: baseSections.length > 0 ? baseSections : undefined,
        });
        logger.info("All watch history deleted successfully", {
          userId,
          profileId,
          contentSections: contentSections.length > 0 ? contentSections : "none",
          baseSections: baseSections.length > 0 ? baseSections : "none",
        });
      } else if (contentId) {
        await repo.delete(userId, profileId, contentId);
        logger.info("Watch history deleted successfully", {
          userId,
          contentId,
        });
      } else {
        await repo.deleteAll(userId, profileId, {
          watchedDate: watchedDate,
        });
        logger.info("All watch history deleted successfully", {
          userId,
          profileId,
          watchedDate,
        });
      }
    } catch (error) {
      logger.error("Failed to delete watch history", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
        contentId,
      });
      if (error instanceof NotFoundException) {
        return c.json(createErrorResponse(ERROR_MESSAGES.NOT_FOUND), 404);
      }
      return c.json(createErrorResponse(ERROR_MESSAGES.INTERNAL_ERROR), 500);
    }
    return c.json(createSuccessResponse("Deleted history successfully"), 200);
  },
);

export default app;
