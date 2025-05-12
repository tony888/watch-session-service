import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { z } from "zod";
import { MAX_CONCURRENT_SESSIONS } from "../common/constants";
import {
  NotFoundException,
  SessionExpiredException,
  validator,
} from "../common/errors";
import { createLogger } from "../common/logger";
import { ERROR_MESSAGES } from "../common/messages";
import {
  catchError,
  createErrorResponse,
  createSuccessResponse,
} from "../common/utils";
import { SessionRepository } from "../database/session.repository";

const repo = new SessionRepository();
const logger = createLogger({ service: "watch-session-api.session" });

const app = new Hono();

const enforceSessionLimitMiddleware = createMiddleware(async (c, next) => {
  const body = await c.req.json();

  const count = await repo.count(body.userId);
  if (count >= MAX_CONCURRENT_SESSIONS) {
    return c.json(
      createErrorResponse(
        ERROR_MESSAGES.SESSION_LIMIT_REACHED,
        "MAX_CONCURRENT_SESSIONS_REACHED",
      ),
      429,
    );
  }

  await next();
});

app.get(
  "/",
  validator(
    "query",
    z.object({
      userId: z
        .string({
          required_error: ERROR_MESSAGES.USER_ID_REQUIRED,
        })
        .uuid(),
    }),
  ),
  async (c) => {
    const query = c.req.valid("query");
    logger.info("Listing sessions", { userId: query.userId });

    const [error, sessions] = await catchError(
      repo.listActiveSessionById(query.userId),
    );

    if (error) {
      logger.error("Failed to list sessions", { error, userId: query.userId });
      return c.json(
        createErrorResponse(
          ERROR_MESSAGES.INTERNAL_ERROR,
          "SESSION_LIST_FAILED",
        ),
        500,
      );
    }
    logger.info("Sessions retrieved successfully", {
      userId: query.userId,
      count: sessions.length,
    });

    return c.json(
      createSuccessResponse("Sessions retrieved successfully", sessions),
    );
  },
);

app.post(
  "/",
  validator(
    "json",
    z.object({
      userId: z.string().uuid(),
      profileId: z.string().uuid(),
      contentId: z.string().uuid(),
      userAgent: z.string(),
      membershipType: z.string().optional(),
    }),
  ),
  enforceSessionLimitMiddleware,
  async (c) => {
    const body = c.req.valid("json");
    logger.info("Starting new session", {
      userId: body.userId,
      profileId: body.profileId,
      contentId: body.contentId,
      userAgent: body.userAgent,
    });
    if (!body.userAgent) {
      return c.json(
        createErrorResponse(
          ERROR_MESSAGES.USER_AGENT_REQUIRED,
          "USER_AGENT_REQUIRED",
        ),
        400,
      );
    }

    const [error, data] = await catchError(
      repo.create({
        userId: body.userId,
        deviceId: body.userAgent,
        profileId: body.profileId,
        contentId: body.contentId,
        membershipType: body.membershipType,
      }),
    );

    if (error) {
      logger.warn("Session already exists", {
        userId: body.userId,
        deviceId: body.userAgent,
        error: error.message,
      });
      if (
        error.name === "ConditionalCheckFailedException" ||
        error.name === "ConflictException"
      ) {
        return c.json(
          createErrorResponse(
            ERROR_MESSAGES.SESSION_ALREADY_EXISTS,
            "SESSION_ALREADY_EXISTS",
          ),
          409,
        );
      }
      logger.error("Failed to create session", { error, userId: body.userId });
      return c.json(
        createErrorResponse(
          ERROR_MESSAGES.INTERNAL_ERROR,
          "SESSION_CREATION_FAILED",
        ),
        500,
      );
    }
    logger.info("Session created successfully", {
      userId: body.userId,
      sessionId: data.sessionId,
    });

    return c.json(
      createSuccessResponse("Session created successfully", data),
      201,
    );
  },
);

app.get(
  "/count",
  validator(
    "query",
    z.object({
      userId: z.string().uuid(),
    }),
  ),
  async (c) => {
    const query = c.req.valid("query");
    logger.info("Getting session count", { userId: query.userId });
    const [error, count] = await catchError(repo.count(query.userId));

    if (error) {
      return c.json(
        createErrorResponse(
          ERROR_MESSAGES.INTERNAL_ERROR,
          "SESSION_COUNT_FAILED",
        ),
        500,
      );
    }

    return c.json(
      createSuccessResponse("Session count retrieved successfully", {
        maxSessions: MAX_CONCURRENT_SESSIONS,
        currentSessions: count,
      }),
    );
  },
);

app.get("/:sessionId", async (c) => {
  const sessionId = c.req.param("sessionId");
  const [error, session] = await catchError(repo.getSessionById(sessionId));
  if (error) {
    return c.json(
      createErrorResponse(ERROR_MESSAGES.NOT_FOUND, "SESSION_NOT_FOUND"),
      404,
    );
  }

  return c.json(
    createSuccessResponse("Session retrieved successfully", session),
  );
});

app.put(
  "/:sessionId",
  validator(
    "json",
    z.object({
      userId: z.string().uuid(),
      profileId: z.string().uuid(),
      contentId: z.string().uuid().optional(),
      membershipType: z.string().optional(),
    }),
  ),
  async (c) => {
    const sessionId = c.req.param("sessionId");
    const body = c.req.valid("json");
    logger.info("Updating session", {
      sessionId,
      userId: body.userId,
      profileId: body.profileId,
      contentId: body.contentId,
    });

    const [error, data] = await catchError(
      repo.update(body.userId, {
        sessionId: sessionId,
        profileId: body.profileId,
        contentId: body.contentId,
        membershipType: body.membershipType,
      }),
    );

    if (error) {
      logger.error("Failed to update session", {
        error,
        sessionId,
        userId: body.userId,
      });
      if (error instanceof NotFoundException) {
        return c.json(
          createErrorResponse(ERROR_MESSAGES.NOT_FOUND, "SESSION_NOT_FOUND"),
          404,
        );
      } else if (error instanceof SessionExpiredException) {
        return c.json(
          createErrorResponse(
            ERROR_MESSAGES.SESSION_EXPIRED,
            "SESSION_EXPIRED",
          ),
          422,
        );
      }
      return c.json(
        createErrorResponse(
          ERROR_MESSAGES.INTERNAL_ERROR,
          "SESSION_UPDATE_FAILED",
        ),
        500,
      );
    }

    logger.info("Session updated successfully", {
      sessionId,
      userId: body.userId,
    });

    return c.json(createSuccessResponse("Session updated successfully", data));
  },
);

app.delete("/:sessionId", async (c) => {
  const sessionId = c.req.param("sessionId");

  const [error] = await catchError(repo.terminate(sessionId));
  if (error) {
    logger.error("Failed to terminate session", { error, sessionId });
    if (error instanceof NotFoundException) {
      return c.json(
        createErrorResponse(ERROR_MESSAGES.NOT_FOUND, "SESSION_NOT_FOUND"),
        404,
      );
    }

    return c.json(
      createErrorResponse(
        ERROR_MESSAGES.INTERNAL_ERROR,
        "SESSION_TERMINATION_FAILED",
      ),
      500,
    );
  }
  logger.info("Session terminated successfully", { sessionId });

  return c.json(
    createSuccessResponse("Session terminated successfully", { sessionId }),
  );
});

export default app;
