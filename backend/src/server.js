// server.js
import app from "./app.js";
import env from "./config/env.js";
import { pingDb } from "./db/index.js";
import { ensureModuleMediaSchema } from "./db/moduleMediaSchema.js";
import logger from "./utils/logger.js";

async function start() {
  try {
    await pingDb();
    logger.info("Database connection OK");
    await ensureModuleMediaSchema();
    logger.info("Module media schema OK");

    app.listen(env.PORT, () => {
      logger.info(`Server listening on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    logger.error("Server startup failed", { message: error.message });
    process.exit(1);
  }
}

start();
