import * as dynamoose from "dynamoose";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  SessionExpiredException,
} from "../common/errors";
import { ERROR_MESSAGES } from "../common/messages";
import {
  catchError,
  generateSessionIdentifier,
  parseExpirationTime,
  toExpirationTime,
} from "../common/utils";
import { SESSION_EXPIRE_DURATION_MS } from "./model/base.model";
import { Session, SessionIndex, SessionModel } from "./model/session.model";

export interface CreateSession {
  userId: string;
  deviceId: string;
  profileId: string;
  contentId: string;
  membershipType?: string;
}

export interface UpdateSession {
  userId?: string;
  sessionId?: string;
  profileId?: string;
  deviceId?: string;
  contentId?: string;
  membershipType?: string;
  startTime?: string;
  sessionState?: string;
  expirationTime?: number;
  isActive?: string;
}

export class SessionRepository {
  async listActiveSessionById(userId: string): Promise<any[]> {
    const sessions = await SessionModel.query({
      pk: `USER#${userId}`,
    })
      .using(SessionIndex.ACTIVE_SESSIONS)
      .exec();

    return sessions
      .map((s) => s.original())
      .filter((s) => !!s)
      .filter(
        (s) => new Date(parseExpirationTime(s.expirationTime)) > new Date(),
      );
  }

  async getSessionById(sessionId: string): Promise<any> {
    const sessions = await SessionModel.query({
      sessionId: sessionId,
    })
      .using(SessionIndex.SESSION_ID_INDEX)
      .exec();

    if (sessions.count === 0) {
      throw new NotFoundException(ERROR_MESSAGES.SESSION_NOT_FOUND);
    }
    const [session] = sessions;
    return session.original() as Session;
  }

  async create(props: CreateSession): Promise<any> {
    const sessionId = generateSessionIdentifier(props.userId, props.deviceId);
    const item = await SessionModel.get({
      pk: `USER#${props.userId}`,
      sk: `SESSION#${sessionId}`,
      sessionState: "ACTIVE",
    });
    if (item) {
      throw new ConflictException(ERROR_MESSAGES.SESSION_ALREADY_EXISTS);
    }

    const session = await SessionModel.create({
      pk: `USER#${props.userId}`,
      sk: `SESSION#${sessionId}`,
      userId: props.userId,
      sessionId: sessionId,
      deviceId: props.deviceId,
      profileId: props.profileId,
      isActive: "true",
      expirationTime: toExpirationTime(
        new Date(Date.now() + SESSION_EXPIRE_DURATION_MS),
      ),
    });
    return session.toJSON();
  }

  async update(userId: string, updateData: UpdateSession): Promise<any> {
    if (!updateData.sessionId) {
      throw new BadRequestException(ERROR_MESSAGES.SESSION_ID_REQUIRED);
    }

    const session = await SessionModel.get({
      pk: `USER#${userId}`,
      sk: `SESSION#${updateData.sessionId}`,
    });

    if (!session) {
      throw new NotFoundException(ERROR_MESSAGES.SESSION_NOT_FOUND);
    }

    if (
      new Date(parseExpirationTime(session.expirationTime)).valueOf() <
      Date.now()
    ) {
      throw new SessionExpiredException(ERROR_MESSAGES.SESSION_EXPIRED);
    }

    const [error, updated] = await catchError(
      SessionModel.update(
        {
          pk: `USER#${userId}`,
          sk: `SESSION#${updateData.sessionId}`,
        },
        {
          ...updateData,
          expirationTime: toExpirationTime(
            new Date(Date.now() + SESSION_EXPIRE_DURATION_MS),
          ),
        },
        {
          condition: new dynamoose.Condition().where("isActive").eq("true"),
        },
      ),
    );

    if (error) {
      if (error.name === "ConditionalCheckFailedException") {
        throw new NotFoundException(ERROR_MESSAGES.SESSION_NOT_FOUND);
      }
      throw error;
    }

    return updated.toJSON() as Session;
  }

  async terminate(sessionId: string): Promise<void> {
    const sessions = await SessionModel.query({
      sessionId: sessionId,
    })
      .using(SessionIndex.SESSION_ID_INDEX)
      .limit(1)
      .exec();

    const [session] = sessions;

    if (!session) {
      throw new NotFoundException(ERROR_MESSAGES.SESSION_NOT_FOUND);
    }

    await session.delete();
  }

  async count(userId: string): Promise<number> {
    const sessions = await this.listActiveSessionById(userId);
    return sessions.length;
  }
}
