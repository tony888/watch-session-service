import { beforeAll, describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { ERROR_MESSAGES } from "../src/common/messages";
import { WatchHistoryModel } from "../src/database/model/watch-history.model";
import { WatchHistoryRepository } from "../src/database/watch-history.repository";
import historyRoute from "../src/routes/history.route";

const app = new Hono();
app.route("/api/watch-histories", historyRoute);

describe("History Routes", () => {
  const testUserId = "bc9a7a74-112e-4164-8649-784d9c3f1367";
  const testContentId = "bd614cc1-897a-491c-a349-ee25fe637e17";
  const testProfileId = "f3b9c4b5-5f6b-4d5d-9e3e-4d1c7b4f9e6a";

  beforeAll(async () => {
    const repo = new WatchHistoryRepository(WatchHistoryModel);
    await repo.create({
      userId: testUserId,
      contentId: testContentId,
      profileId: testProfileId,
      mediaVideoId: "c7d28344-23eb-4221-bf8a-75ce3cbd3f52",
      contentSection: "episode1",
      baseSection: "season1",
      progress: Number(18.87).toFixed(2),
      timestamp: new Date().toISOString(),
    });
  });

  describe("GET /api/watch-histories", () => {
    it("should return a list of watch histories for a user", async () => {
      const res = await app.request(
        `/api/watch-histories?userId=${testUserId}&profileId=${testProfileId}`,
      );
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.message).toBe("Retrieved history successfully");
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.every((item: any) => item.userId === testUserId)).toBe(
        true,
      );
    });

    it("should return a specific watch history by content ID", async () => {
      const res = await app.request(
        `/api/watch-histories?userId=${testUserId}&profileId=${testProfileId}&contentId=${testContentId}`,
      );
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.message).toBe("Retrieved history successfully");
      expect(json.data).toHaveProperty("userId", testUserId);
      expect(json.data).toHaveProperty("contentId", testContentId);
      expect(json.data).toHaveProperty("watchedDate");
      expect(json.data).toHaveProperty("progress");
      expect(json.data).toHaveProperty("baseSection", "season1");
    });

    it("should filter watch histories by baseSection", async () => {
      const res = await app.request(
        `/api/watch-histories?userId=${testUserId}&profileId=${testProfileId}&baseSection=season1`,
      );
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.message).toBe("Retrieved history successfully");
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThan(0);
      expect(json.data.every((item: any) => item.baseSection === "season1")).toBe(true);
    });

    it("should return 400 when userId is missing", async () => {
      const res = await app.request("/api/watch-histories");
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.message).toBe(ERROR_MESSAGES.VALIDATION_ERROR);
      expect(json.error).toBe(
        `${ERROR_MESSAGES.USER_ID_REQUIRED}, ${ERROR_MESSAGES.PROFILE_ID_REQUIRED}`,
      );
    });
  });

  describe("DELETE /api/watch-histories", () => {
    it("should delete a watch history by baseSection", async () => {
      // First recreate the test record 
      const repo = new WatchHistoryRepository(WatchHistoryModel);
      await repo.create({
        userId: testUserId,
        contentId: testContentId,
        profileId: testProfileId,
        mediaVideoId: "c7d28344-23eb-4221-bf8a-75ce3cbd3f52",
        contentSection: "episode1",
        baseSection: "season1",
        progress: Number(18.87).toFixed(2),
        timestamp: new Date().toISOString(),
      });
      
      // Verify the record exists
      let checkRes = await app.request(
        `/api/watch-histories?userId=${testUserId}&profileId=${testProfileId}&contentId=${testContentId}`
      );
      expect(checkRes.status).toBe(200);
      
      // Now delete it by baseSection
      const res = await app.request(`/api/watch-histories`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: testUserId,
          profileId: testProfileId,
          baseSection: "season1",
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toBe("Deleted history successfully");
      
      // Verify it was deleted
      checkRes = await app.request(
        `/api/watch-histories?userId=${testUserId}&profileId=${testProfileId}&contentId=${testContentId}`
      );
      expect(checkRes.status).toBe(404);
    });

    it("should delete a watch history by contentId", async () => {
      // First create a new test record
      const repo = new WatchHistoryRepository(WatchHistoryModel);
      await repo.create({
        userId: testUserId,
        contentId: testContentId,
        profileId: testProfileId,
        mediaVideoId: "c7d28344-23eb-4221-bf8a-75ce3cbd3f52",
        contentSection: "episode1",
        baseSection: "season1",
        progress: Number(18.87).toFixed(2),
        timestamp: new Date().toISOString(),
      });
      
      const res = await app.request(`/api/watch-histories`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: testUserId,
          profileId: testProfileId,
          contentId: testContentId,
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toBe("Deleted history successfully");
    });

    it("should return 404 when deleting non-existent history", async () => {
      const res = await app.request(`/api/watch-histories`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: testUserId,
          profileId: testProfileId,
          contentId: "non-existent-id",
        }),
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.message).toBe(ERROR_MESSAGES.NOT_FOUND);
    });

    it("should return 400 when missing required parameters", async () => {
      const res = await app.request(`/api/watch-histories`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: testUserId,
          profileId: testProfileId,
        }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.message).toBe("Validation error");
    });
  });
});
