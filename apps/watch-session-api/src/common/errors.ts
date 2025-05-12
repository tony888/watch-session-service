import { zValidator } from "@hono/zod-validator";
import { ValidationTargets } from "hono/types";
import * as z from "zod";
import { createErrorResponse } from "./utils";
import { ERROR_MESSAGES } from "./messages";

export class NotFoundException extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "NotFoundException";
  }
}

export class BadRequestException extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "BadRequestException";
  }
}

export class ConflictException extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "ConflictException";
  }
}

export class SessionExpiredException extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "SessionExpiredException";
  }
}

export const validator = <T>(
  target: keyof ValidationTargets,
  schema: z.ZodType<T>,
) => {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json(
        createErrorResponse(
          ERROR_MESSAGES.VALIDATION_ERROR,
          result.error.issues.map((i) => i.message).join(", "),
        ),
        400,
      );
    }
  });
};
