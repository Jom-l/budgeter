import dotenv from "dotenv";

dotenv.config();

const required = ["MONGODB_URI", "SESSION_SECRET"];
for (const key of required) {
  if (!process.env[key]) {
    console.warn(`[env] Missing ${key} — using a fallback. Set it in server/.env`);
  }
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/budget_computer",
  redisUrl: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  sessionSecret: process.env.SESSION_SECRET || "dev-insecure-secret-change-me",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  outlookUser: process.env.OUTLOOK_USER || "",
  outlookPass: process.env.OUTLOOK_PASS || "",
  dailySweepCron: process.env.DAILY_SWEEP_CRON || "0 8 * * *",
  isProd: (process.env.NODE_ENV || "development") === "production",
};
