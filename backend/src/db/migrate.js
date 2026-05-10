
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./index.js";
import logger from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, "migrations");
const migrationsTableName = "schema_migrations";

async function ensureMigrationsTable(conn) {
  await conn.query(
    `
    CREATE TABLE IF NOT EXISTS ${migrationsTableName} (
      filename VARCHAR(255) NOT NULL PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    `
  );
}

async function loadAppliedMigrations(conn) {
  const [rows] = await conn.query(
    `
    SELECT filename
    FROM ${migrationsTableName}
    `
  );

  return new Set(rows.map((row) => row.filename));
}

async function run() {
  const files = (await fs.readdir(migrationsDir))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    logger.warn("No migration files found.");
    process.exit(0);
  }

  const conn = await pool.getConnection();

  try {
    await ensureMigrationsTable(conn);
    const appliedMigrations = await loadAppliedMigrations(conn);

    for (const file of files) {
      if (appliedMigrations.has(file)) {
        logger.info(`Skipping already applied migration: ${file}`);
        continue;
      }

      const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
      logger.info(`Running migration: ${file}`);

      await conn.beginTransaction();

      try {
        await conn.query(sql);
        await conn.execute(
          `
          INSERT INTO ${migrationsTableName} (filename)
          VALUES (?)
          `,
          [file]
        );
        await conn.commit();
        appliedMigrations.add(file);
      } catch (error) {
        await conn.rollback();
        throw error;
      }
    }

    logger.info("Migrations completed.");
    process.exit(0);
  } finally {
    conn.release();
  }
}

run().catch((error) => {
  logger.error("Migration failed", { message: error.message });
  process.exit(1);
});
