import { createClient } from "redis";
import { env } from "./env.js";

export const redis = createClient({ url: env.redisUrl });

redis.on("error", (err) => console.error("[redis] error:", err.message));
redis.on("connect", () => console.log("[redis] connected (Memurai)"));

// Connect once at import time so importers get a ready client.
await redis.connect();
