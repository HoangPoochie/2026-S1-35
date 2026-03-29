
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./index.js";
import logger from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, "migrations");

async function run() {
  const files = (await fs.readdir(migrationsDir))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    logger.warn("No migration files found.");
    process.exit(0);
  }

  for (const file of files) {
    const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
    logger.info(`Running migration: ${file}`);
    await pool.query(sql);
  }

  logger.info("Migrations completed.");
  process.exit(0);
}

run().catch((error) => {
  logger.error("Migration failed", { message: error.message });
  process.exit(1);
});
