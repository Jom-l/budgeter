import express from "express";
import session from "express-session";
import { RedisStore } from "connect-redis";
import cors from "cors";

import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { redis } from "./config/redis.js";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/error.js";
import { startScheduler } from "./services/scheduler.js";

async function main() {
  await connectDB();

  const app = express();
  app.set("trust proxy", 1);
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json());

  app.use(
    session({
      store: new RedisStore({ client: redis, prefix: "sess:" }),
      secret: env.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: env.isProd,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      },
    })
  );

  app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));
  app.use("/api", routes);

  app.use(notFound);
  app.use(errorHandler);

  app.listen(env.port, () => {
    console.log(`[server] listening on http://localhost:${env.port}`);
    startScheduler();
  });
}

main().catch((err) => {
  console.error("[server] fatal:", err);
  process.exit(1);
});
