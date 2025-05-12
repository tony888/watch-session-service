import { describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { ERROR_MESSAGES } from "../src/common/messages";
import sessionRoute from "../src/routes/session.route";

const app = new Hono();
app.route("/api/sessions", sessionRoute);

describe("Session Routes", () => {
  const users = new Array(2).fill(null).map((_, i) => ({
    id: crypto.randomUUID(),
    profiles: new Array(2).fill(null).map(() => crypto.randomUUID()),
  }));

  const contents = [
    "97fcdbe3-3d5d-4bc7-a124-83a51ec93b3b",
    "0a903783-b063-42ad-9f95-da6b29ab49d4",
  ];

  const testCases = users.flatMap((user) =>
    user.profiles.flatMap((profile) =>
      contents.map((content) => ({
        userId: user.id,
        profileId: profile,
        contentId: content,
      })),
    ),
  );

  let sessionId: string;

  describe("GET /api/sessions", () => {
    it("should return a list of sessions for a valid user", async () => {
      const userId = users[0].id;
      const res = await app.request(`/api/sessions?userId=${userId}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toBe("Sessions retrieved successfully");
      expect(Array.isArray(json.data)).toBe(true);
    });

    it("should return 400 for missing userId", async () => {
      const res = await app.request("/api/sessions");
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe(ERROR_MESSAGES.USER_ID_REQUIRED);
    });

    it("should return empty array for user with no sessions", async () => {
      const res = await app.request(
        "/api/sessions?userId=42354bbb-1f4f-4dc0-8e9f-7e8be93bdd98",
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toEqual([]);
    });
  });

  describe("POST /api/sessions/start", () => {
    it(`should start a new session with userId: ${testCases[0]}...`, async () => {
      const res = await app.request("/api/sessions/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "TestAgent",
        },
        body: JSON.stringify(testCases[0]),
      });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.message).toBe("Session created successfully");
      expect(json.data).toHaveProperty("sessionId");
      sessionId = json.data.sessionId;
    });

    it("should return 400 for missing required fields", async () => {
      const res = await app.request("/api/sessions/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBeTruthy();
    });

    it("should return 400 for invalid content ID", async () => {
      const res = await app.request("/api/sessions/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...testCases[0],
          contentId: "invalid-content-id",
        }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/sessions/:sessionId", () => {
    it("should return a session by valid ID", async () => {
      const res = await app.request(`/api/sessions/${sessionId}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toBe("Session retrieved successfully");
      expect(json.data).toHaveProperty("sessionId", sessionId);
    });

    it("should return 404 for non-existent session", async () => {
      const res = await app.request("/api/sessions/nonexistent-session");
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe("SESSION_NOT_FOUND");
    });
  });

  describe("PUT /api/sessions/:sessionId", () => {
    it("should update a session with valid data", async () => {
      const updateData = {
        userId: users[0].id,
        contentId: contents[1],
        progress: 0.5,
      };

      const res = await app.request(`/api/sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toBe("Session updated successfully");
      expect(json.data.contentId).toBe(updateData.contentId);
    });

    it("should return 404 for updating non-existent session", async () => {
      const res = await app.request("/api/sessions/nonexistent-session", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: users[0].id,
          progress: 0.5,
        }),
      });
      expect(res.status).toBe(404);
    });

    it("should return 400 for invalid update data", async () => {
      const res = await app.request(`/api/sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: "invalid" }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/sessions/:sessionId", () => {
    it("should terminate an existing session", async () => {
      const res = await app.request(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toBe("Session terminated successfully");
    });

    it("should return 404 for terminating non-existent session", async () => {
      const res = await app.request("/api/sessions/nonexistent-session", {
        method: "DELETE",
      });
      expect(res.status).toBe(404);
    });

    it("should not allow terminating already terminated session", async () => {
      const res = await app.request(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      });
      expect(res.status).toBe(404);
    });
  });
});
