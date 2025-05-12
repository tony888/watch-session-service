import env from "env-var";

const ENV_NAMES = {
  production: "prod",
  staging: "staging",
  test: "test",
  development: "dev",
} as const;

const envName = env.get("NODE_ENV").asString() as keyof typeof ENV_NAMES;

const dbConfig = {
  TABLE_NAME: env
    .get("TABLE_NAME")
    .required()
    .default("watch-session")
    .asString(),
  ENV: ENV_NAMES[envName] || process.env.NODE_ENV || "dev",
};

export default dbConfig;
