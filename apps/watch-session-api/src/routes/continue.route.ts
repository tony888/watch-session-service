import { Hono } from "hono";
import * as z from "zod";
import { validator } from "../common/errors";
import { createLogger } from "../common/logger";
import { ERROR_MESSAGES } from "../common/messages";
import { createErrorResponse, createSuccessResponse } from "../common/utils";
import { ContinueWatchingRepository } from "../database/continue-watching.repository";
import {
  ContinueWatchingDto,
  ContinueWatchingModel,
} from "../database/model/continue-watching.model";

const DEFAULT_LIMIT = 50;

const app = new Hono();
const logger = createLogger({ service: "watch-session-api.continue-watching" });

const repo = new ContinueWatchingRepository(ContinueWatchingModel);

app.get(
  "/",
  validator(
    "query",
    z.object({
      userId: z
        .string({
          required_error: ERROR_MESSAGES.USER_ID_REQUIRED,
        })
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
      mediaVideoId: z
        .string()
        .uuid({
          message: ERROR_MESSAGES.ID_MUST_BE_UUID,
        })
        .optional(),
      contentSection: z.union([z.string(), z.array(z.string())]).optional(),
      baseSection: z.union([z.string(), z.array(z.string())]).optional(),
      limit: z.coerce
        .number()
        .int()
        .gt(0)
        .lte(100)
        .default(DEFAULT_LIMIT)
        .optional(),
    }),
  ),
  async (c) => {
    const {
      userId,
      profileId,
      contentId,
      mediaVideoId,
      contentSection = [],
      baseSection = [],
      limit,
    } = c.req.valid("query");
    logger.info("Continue watching request received", {
      userId,
      profileId,
      contentId,
      mediaVideoId,
      baseSection,
    });

    let items;
    if (userId && contentId && mediaVideoId) {
      logger.info("Fetching specific continue watching item", {
        userId,
        profileId,
        contentId,
        mediaVideoId,
      });
      const item = await repo.getOneByMediaVideoId(
        userId,
        profileId,
        contentId,
        mediaVideoId,
      );
      items = item ? [item] : [];
    } else if (userId && contentId) {
      logger.info("Fetching content specific continue watching items", {
        userId,
        profileId,
        contentId,
      });
      items = await repo.listByContentId(userId, profileId, contentId, {
        contentSections: Array.isArray(contentSection)
          ? contentSection
          : [contentSection],
        baseSections: Array.isArray(baseSection)
          ? baseSection
          : [baseSection],
        limit: limit || DEFAULT_LIMIT,
      });
    } else if (userId) {
      logger.info("Fetching all continue watching items for user", { userId });
      items = await repo.listById(userId, profileId, {
        contentSections: Array.isArray(contentSection)
          ? contentSection
          : [contentSection],
        baseSections: Array.isArray(baseSection)
          ? baseSection
          : [baseSection],
        limit: limit || DEFAULT_LIMIT,
      });
    } else {
      return c.json(createErrorResponse(ERROR_MESSAGES.USER_ID_REQUIRED), 400);
    }

    logger.info("Retrieved continue watching items", {
      userId,
      profileId,
      contentId,
      mediaVideoId,
      count: items.length,
    });
    return c.json(
      createSuccessResponse(
        "Retrieved continue watching",
        items.map((item) => ContinueWatchingDto.parse(item)),
      ),
    );
  },
);

app.delete(
  "/",
  validator(
    "json",
    z.object({
      userId: z
        .string({ required_error: ERROR_MESSAGES.USER_ID_REQUIRED })
        .uuid({ message: ERROR_MESSAGES.ID_MUST_BE_UUID }),
      profileId: z
        .string({ required_error: ERROR_MESSAGES.PROFILE_ID_REQUIRED })
        .uuid({ message: ERROR_MESSAGES.ID_MUST_BE_UUID }),
      contentId: z
        .string()
        .uuid({ message: ERROR_MESSAGES.ID_MUST_BE_UUID })
        .optional(),
      mediaVideoId: z
        .string()
        .uuid({ message: ERROR_MESSAGES.ID_MUST_BE_UUID })
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
      mediaVideoId,
      watchedDate,
      contentSection = [],
      baseSection = [],
    } = c.req.valid("json");
    logger.info("Deleting continue watching items", {
      userId,
      profileId,
      contentId,
      mediaVideoId,
      watchedDate,
      contentSection,
      baseSection,
    });

    const contentSections = Array.isArray(contentSection)
      ? contentSection
      : [contentSection];
      
    const baseSections = Array.isArray(baseSection)
      ? baseSection
      : [baseSection];

    // missing contentId when mediaVideoId is present
    if ((mediaVideoId && !contentId) || (contentId && !mediaVideoId)) {
      return c.json(
        createErrorResponse(
          ERROR_MESSAGES.CONTENT_ID_AND_MEDIA_VIDEO_ID_REQUIRED,
        ),
        400,
      );
    }

    if (watchedDate) {
      await repo.deleteByDate({
        userId: userId,
        profileId: profileId,
        watchedDate: watchedDate,
      });
      return c.json(createSuccessResponse("Delete success"));
    } else if (contentSections.length > 0 || baseSections.length > 0) {
      await repo.deleteAll(userId, profileId, {
        contentSections,
        baseSections,
      });
      return c.json(createSuccessResponse("Delete success"));
    } else if (contentId && mediaVideoId) {
      // Remove specific continue watching item
      const item = await repo.getOneByMediaVideoId(
        userId,
        profileId,
        contentId,
        mediaVideoId,
      );

      if (!item) {
        return c.json(createErrorResponse(ERROR_MESSAGES.NOT_FOUND), 404);
      }

      await repo.delete({
        userId: userId,
        profileId: profileId,
        contentId: contentId,
        mediaVideoId: mediaVideoId,
      });

      return c.json(createSuccessResponse("Delete success"));
    }

    // Remove all continue watching items for the user
    const items = await repo.listById(userId, profileId);
    const deletes = items.map(
      ({ userId, profileId, contentId, mediaVideoId }) =>
        repo.delete({
          userId: userId,
          profileId: profileId,
          contentId: contentId,
          mediaVideoId: mediaVideoId,
        }),
    );
    await Promise.all(deletes);
    return c.json(createSuccessResponse("Delete success"));
  },
);

export default app;
