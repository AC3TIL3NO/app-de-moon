import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "@workspace/db";
import { logger } from "./lib/logger";

export async function runMigrations(): Promise<void> {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const migrationsFolder = path.resolve(__dirname, "drizzle");

  logger.info({ migrationsFolder }, "migrate: running database migrations...");

  try {
    await migrate(db, { migrationsFolder });
    logger.info("migrate: migrations completed successfully");
  } catch (err) {
    logger.error({ err }, "migrate: failed to run migrations");
    throw err;
  }
}
