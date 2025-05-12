import { ModelType } from "dynamoose/dist/General";
import { NotFoundException } from "../common/errors";
import { ERROR_MESSAGES } from "../common/messages";
import { createPk, sortWatchedDate } from "../common/utils";
import { WatchHistory, WatchHistoryDto } from "./model/watch-history.model";

export interface CreateWatchHistory {
  userId: string;
  profileId: string;
  contentId: string;
  mediaVideoId: string;
  contentSection?: string;
  baseSection?: string;
  progress: string;
  timestamp: string;
}

export interface WatchHistoryFilter {
  contentSections?: string[];
  baseSections?: string[];
  watchedDate?: string;
  limit?: number;
}

const LIMIT = 50;
const WATCH_HISTORY_PREFIX = "WATCH_HISTORY#";

export class WatchHistoryRepository {
  constructor(private model: ModelType<WatchHistory>) {}

  async listById(
    userId: string,
    profileId: string,
    options = { limit: 50 },
  ): Promise<any[]> {
    const histories = await this.model
      .query({
        pk: createPk(userId, profileId),
        sk: { beginsWith: WATCH_HISTORY_PREFIX },
      })
      .limit(options.limit)
      .exec();
    return histories
      .map((history) => WatchHistoryDto.parse(history.original()))
      .sort(sortWatchedDate);
  }

  async getOne(
    userId: string,
    profileId: string,
    contentId: string,
  ): Promise<any | undefined> {
    const histories = await this.model
      .query({
        pk: createPk(userId, profileId),
        sk: `WATCH_HISTORY#${contentId}`,
      })
      .limit(1)
      .exec();

    if (histories.length === 0) return;

    return WatchHistoryDto.parse(histories[0].original());
  }

  async list(
    userId: string,
    profileId: string,
    filter: WatchHistoryFilter,
  ): Promise<any[]> {
    const { limit, ...opts } = filter;

    let query = this.model.query({
      pk: createPk(userId, profileId),
      sk: { beginsWith: WATCH_HISTORY_PREFIX },
    });

    if (opts.contentSections && opts.contentSections?.length > 0) {
      query = query.where("contentSection").in(opts.contentSections);
    }

    if (opts.baseSections && opts.baseSections?.length > 0) {
      query = query.where("baseSection").in(opts.baseSections);
    }

    if (opts?.watchedDate) {
      query = query.filter("watchedDate").beginsWith(opts.watchedDate);
    }

    const histories = await query.limit(limit || LIMIT).exec();
    return histories
      .map((history) => WatchHistoryDto.parse(history.original()))
      .sort(sortWatchedDate);
  }

  async create(data: CreateWatchHistory): Promise<WatchHistory> {
    const history = await this.model.create({
      pk: createPk(data.userId, data.profileId),
      sk: `WATCH_HISTORY#${data.contentId}`,
      userId: data.userId,
      contentId: data.contentId,
      mediaVideoId: data.mediaVideoId,
      contentSection: data.contentSection,
      baseSection: data.baseSection,
      progress: data.progress,
      watchedDate: new Date().toISOString(),
    });
    return history;
  }

  async update(
    userId: string,
    profileId: string,
    data: Partial<WatchHistory>,
  ): Promise<WatchHistory> {
    if (!data.contentId || !data.mediaVideoId) {
      throw new Error("Content ID and Media Video ID are required");
    }

    const updated = await this.model.update(
      {
        pk: createPk(userId, profileId),
        sk: `WATCH_HISTORY#${data.contentId}`,
      },
      {
        ...data,
        watchedDate: new Date().toISOString(),
      },
    );
    return updated;
  }

  async count(userId: string, profileId: string): Promise<number> {
    const history = await this.listById(userId, profileId);
    return history.length;
  }

  async delete(
    userId: string,
    profileId: string,
    contentId: string,
  ): Promise<void> {
    const history = await this.model.get({
      pk: createPk(userId, profileId),
      sk: `WATCH_HISTORY#${contentId}`,
    });
    if (!history) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }
    return await history.delete();
  }

  async deleteAll(
    userId: string,
    profileId: string,
    opts?: {
      contentSections?: string[];
      baseSections?: string[];
      watchedDate?: string;
    },
  ): Promise<void> {
    const itemsToDelete = await this.list(userId, profileId, {
      contentSections: opts?.contentSections,
      baseSections: opts?.baseSections,
      watchedDate: opts?.watchedDate,
    });

    const deletePromises = itemsToDelete.map((item) =>
      this.model.delete({
        pk: createPk(item.userId, item.profileId),
        sk: `${WATCH_HISTORY_PREFIX}${item.contentId}`,
      }),
    );

    await Promise.all(deletePromises);
  }
}
