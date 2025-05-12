import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { ERROR_MESSAGES } from "../src/common/messages";
import { createPk } from "../src/common/utils";
import { ContinueWatchingRepository } from "../src/database/continue-watching.repository";
import { ContinueWatchingModel } from "../src/database/model/continue-watching.model";
import continueRoute from "../src/routes/continue.route";

const app = new Hono();
app.route("/api/continue-watchings", continueRoute);

describe("Continue Watching Routes", () => {
  const repo = new ContinueWatchingRepository(ContinueWatchingModel);
  const testUserId = "233584f4-3833-4632-89dd-22f08d00bde2";
  const testProfileId = "1c508a6b-110c-44d4-9e83-3ef6aa104de2";
  const testContentId = "6a668905-abec-4165-a182-36d1055262b5";
  const testMediaVideoId = "8dd3e34e-687c-4457-9705-e745b38e6b43";

  beforeAll(async () => {
    await repo.create({
      userId: testUserId,
      profileId: testProfileId,
      contentId: testContentId,
      mediaVideoId: testMediaVideoId,
      progress: Number(29.8).toFixed(2),
      baseSection: "movie",
    });
  });

  it("should return a list of continue watching items for a user", async () => {
    const res = await app.request(
      `/api/continue-watchings?userId=${testUserId}&profileId=${testProfileId}`,
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toBeArray();
    expect(json.data.length).toBeGreaterThan(0);
  });

  it("should return a continue watching item by content ID", async () => {
    const res = await app.request(
      `/api/continue-watchings?userId=${testUserId}&profileId=${testProfileId}&contentId=${testContentId}`,
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toBeArray();
    expect(json.data.length).toBeGreaterThan(0);
  });

  it("should return a continue watching item by media video ID", async () => {
    const res = await app.request(
      `/api/continue-watchings?userId=${testUserId}&profileId=${testProfileId}&contentId=${testContentId}&mediaVideoId=${testMediaVideoId}`,
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    const item = json.data[0];
    expect(item).toHaveProperty("userId", testUserId);
    expect(item).toHaveProperty("contentId", testContentId);
    expect(item).toHaveProperty("mediaVideoId", testMediaVideoId);
    expect(item).toHaveProperty("progress", "29.80");
    expect(item).toHaveProperty("baseSection", "movie");
  });

  it("should return 400 when userId is missing", async () => {
    const res = await app.request("/api/continue-watchings");
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toBe(ERROR_MESSAGES.VALIDATION_ERROR);
    expect(json.error).toBe(
      `${ERROR_MESSAGES.USER_ID_REQUIRED}, ${ERROR_MESSAGES.PROFILE_ID_REQUIRED}`,
    );
  });

  it("should return 400 when userId format is invalid", async () => {
    const res = await app.request(
      "/api/continue-watchings?userId=invalid-uuid&profileId=invalid-uuid",
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toBe(ERROR_MESSAGES.VALIDATION_ERROR);
    expect(json.error).toBe(
      `${ERROR_MESSAGES.ID_MUST_BE_UUID}, ${ERROR_MESSAGES.ID_MUST_BE_UUID}`,
    );
  });

  it("should return 404 when userId does not exist", async () => {
    const nonExistentUserId = "11111111-1111-1111-1111-111111111111";
    const nonExistentProfileId = "11111111-1111-1111-1111-111111111111";
    const res = await app.request(
      `/api/continue-watchings?userId=${nonExistentUserId}&profileId=${nonExistentProfileId}`,
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.message).toBe("No continue watching data found");
  });

  it("should return 400 when contentId format is invalid", async () => {
    const res = await app.request(
      `/api/continue-watchings?userId=${testUserId}&profileId=${testProfileId}&contentId=invalid-uuid`,
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toBe(ERROR_MESSAGES.VALIDATION_ERROR);
  });

  it("should return 404 when contentId does not exist", async () => {
    const nonExistentContentId = "22222222-2222-2222-2222-222222222222";
    const res = await app.request(
      `/api/continue-watchings?userId=${testUserId}&profileId=${testProfileId}&contentId=${nonExistentContentId}`,
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.message).toBe("No continue watching data found");
  });

  it("should return continue watching items filtered by baseSection", async () => {
    const res = await app.request(
      `/api/continue-watchings?userId=${testUserId}&profileId=${testProfileId}&baseSection=movie`,
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toBeArray();
    expect(json.data.length).toBeGreaterThan(0);
    expect(json.data[0]).toHaveProperty("baseSection", "movie");
  });

  afterAll(async () => {
    // Clean up
    const [data] = await ContinueWatchingModel.query({
      pk: createPk(testUserId, testProfileId),
      sk: `CONTINUE_WATCHING#${testContentId}#${testMediaVideoId}`,
    })
      .limit(1)
      .exec();
    if (!data) return;
    await data.delete();
  });
});
