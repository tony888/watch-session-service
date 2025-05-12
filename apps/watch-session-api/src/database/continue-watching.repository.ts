import { ModelType } from "dynamoose/dist/General";
import { COMPLETED_THRESHOLD } from "../common/constants";
import { NotFoundException } from "../common/errors";
import { createPk, sortWatchedDate } from "../common/utils";
import { ContinueWatching } from "./model/continue-watching.model";

export interface CreateContinueWatching {
  userId: string;
  profileId: string;
  contentId: string;
  mediaVideoId: string;
  progress: string;
  contentSection?: string;
  baseSection?: string;
}

export interface UpdateContinueWatching {
  contentId: string;
  mediaVideoId: string;
  progress: string;
  contentSection?: string;
  baseSection?: string;
}

export interface DeleteContinueWatching {
  userId: string;
  profileId: string;
  contentId: string;
  mediaVideoId: string;
  baseSection?: string;
}

export interface DeleteContinueWatchingByDate {
  userId: string;
  profileId: string;
  watchedDate: string;
}

export interface ListFilterOptions {
  contentSections?: string[];
  baseSections?: string[];
  watchedDate?: string;
  limit?: number;
}

const LIMIT = 50;
const CONTINUE_WATCHING_PREFIX = "CONTINUE_WATCHING#";

export class ContinueWatchingRepository {
  constructor(private model: ModelType<ContinueWatching>) {}

  async listById(
    userId: string,
    profileId: string,
    options?: ListFilterOptions,
  ): Promise<any[]> {
    let query = this.model.query({
      pk: createPk(userId, profileId),
      sk: { beginsWith: CONTINUE_WATCHING_PREFIX },
    });

    if (
      options?.contentSections?.length &&
      options.contentSections.length > 0
    ) {
      query = query.filter("contentSection").in(options.contentSections);
    }

    if (
      options?.baseSections?.length &&
      options.baseSections.length > 0
    ) {
      query = query.filter("baseSection").in(options.baseSections);
    }

    if (options?.watchedDate) {
      query = query.filter("watchedDate").beginsWith(options.watchedDate);
    }

    const items = await query.limit(options?.limit || LIMIT).exec();

    return items
      .filter((item) => {
        return parseFloat(item.progress) < COMPLETED_THRESHOLD;
      })
      .map((item) => item.original())
      .sort(sortWatchedDate);
  }

  async listByContentId(
    userId: string,
    profileId: string,
    contentId: string,
    options: ListFilterOptions = {
      contentSections: [],
      baseSections: [],
      limit: 50,
    },
  ): Promise<any[]> {
    let query = this.model.query({
      pk: createPk(userId, profileId),
      sk: { beginsWith: `${CONTINUE_WATCHING_PREFIX}${contentId}` },
    });

    if (options.contentSections?.length && options.contentSections.length > 0) {
      query = query.filter("contentSection").in(options.contentSections);
    }

    if (options.baseSections?.length && options.baseSections.length > 0) {
      query = query.filter("baseSection").in(options.baseSections);
    }

    const items = await query.limit(options.limit || LIMIT).exec();
    return items.map((item) => item.original()).sort(sortWatchedDate);
  }

  async getOne(
    userId: string,
    profileId: string,
    contentId: string,
  ): Promise<any> {
    const items = await this.model
      .query({
        pk: createPk(userId, profileId),
        sk: {
          beginsWith: `${CONTINUE_WATCHING_PREFIX}${contentId}`,
        },
      })
      .exec();

    const [item] = items.sort(
      (a, b) =>
        new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf(),
    );
    if (!item) {
      throw new NotFoundException("Continue watching not found");
    }

    return item.original();
  }

  async getOneByMediaVideoId(
    userId: string,
    profileId: string,
    contentId: string,
    mediaVideoId: string,
  ): Promise<any | undefined> {
    const items = await this.model
      .query({
        pk: createPk(userId, profileId),
        sk: this.createSk(contentId, mediaVideoId),
      })
      .limit(1)
      .exec();
    if (items.count === 0) return;

    return items[0].original();
  }

  async create(data: CreateContinueWatching): Promise<ContinueWatching> {
    const item = await this.model.create({
      pk: createPk(data.userId, data.profileId),
      sk: this.createSk(data.contentId, data.mediaVideoId),
      userId: data.userId,
      contentId: data.contentId,
      mediaVideoId: data.mediaVideoId,
      contentSection: data.contentSection,
      baseSection: data.baseSection,
      progress: data.progress,
    });
    return item;
  }

  async update(
    userId: string,
    profileId: string,
    data: UpdateContinueWatching,
  ): Promise<ContinueWatching> {
    if (!data.contentId) {
      throw new Error("contentId is required");
    }

    const item = await this.model.update(
      {
        pk: createPk(userId, profileId),
        sk: this.createSk(data.contentId, data.mediaVideoId),
      },
      {
        ...data,
      },
    );

    return item;
  }

  async delete(input: DeleteContinueWatching) {
    await this.model.delete({
      pk: createPk(input.userId, input.profileId),
      sk: this.createSk(input.contentId, input.mediaVideoId),
    });
  }

  async deleteByDate(input: DeleteContinueWatchingByDate) {
    const items = await this.listById(input.userId, input.profileId, {
      watchedDate: input.watchedDate,
    });

    const deletes = items.map(
      ({ userId, profileId, contentId, mediaVideoId }) => {
        return this.model.delete({
          pk: createPk(userId, profileId),
          sk: this.createSk(contentId, mediaVideoId),
        });
      },
    );

    await Promise.all(deletes);
  }

  async deleteAll(
    userId: string,
    profileId: string,
    opts?: {
      contentSections?: string[];
      baseSections?: string[];
    },
  ): Promise<void> {
    const itemsToDelete = await this.listById(userId, profileId, {
      contentSections: opts?.contentSections || [],
      baseSections: opts?.baseSections || [],
    });
    const deletePromises = itemsToDelete.map((item) => {
      return this.model.delete({
        pk: createPk(item.userId, item.profileId),
        sk: this.createSk(item.contentId, item.mediaVideoId),
      });
    });
    await Promise.all(deletePromises);
  }

  async count(userId: string, profileId: string): Promise<number> {
    const items = await this.listById(userId, profileId);
    return items.length;
  }

  private createSk(contentId: string, mediaVideoId: string) {
    return `${CONTINUE_WATCHING_PREFIX}${contentId}#${mediaVideoId}`;
  }
}
