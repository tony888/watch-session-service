import { apiReference } from "@scalar/hono-api-reference";
import { env } from "bun";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import ContinueRoute from "./routes/continue.route";
import HistoryRoute from "./routes/history.route";
import SessionRoute from "./routes/session.route";

const app = new Hono();

app.use(logger());
app.use(secureHeaders());
app.use("*", requestId());
app.use(prettyJSON());
app.use(cors());

const api = app.basePath("/api");

if (env.NODE_ENV !== "production") {
  app.use(
    "/doc/*",
    serveStatic({
      root: "./",
    }),
  );
  api.get(
    "/swagger",
    apiReference({
      cdn: "https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.25.80",
      spec: {
        url: "/doc/openapi.yaml",
      },
    }),
  );
}

api.get("/health", (c) => {
  return c.text("OK");
});

api.route("/sessions", SessionRoute);
api.route("/watch-histories", HistoryRoute);
api.route("/continue-watchings", ContinueRoute);

const port = +(process.env.PORT || 3000);
console.log(`Server is running on http://localhost:${port}`);

export default {
  fetch: app.fetch,
  port,
};
