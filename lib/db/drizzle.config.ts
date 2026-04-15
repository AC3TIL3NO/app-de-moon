import { defineConfig } from "drizzle-kit";
import path from "path";

// DATABASE_URL is only required at runtime (when migrations actually run).
// During the build phase this file may be imported without the variable set,
// so we fall back to an empty string rather than throwing immediately.
const databaseUrl = process.env.DATABASE_URL ?? "";

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  out: path.join(__dirname, "./drizzle"),
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
