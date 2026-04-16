/**
 * reset-admin-password.ts
 *
 * One-time utility script to reset the admin password in production without
 * reseeding the entire database.
 *
 * Usage:
 *   DATABASE_URL=<your-db-url> pnpm --filter @workspace/api-server reset-admin-password
 *
 * What it does:
 *   1. Connects to the database via DATABASE_URL
 *   2. Looks up the user with email moonpilatesstudiopty@gmail.com
 *   3. If found  → hashes a new temporary password and updates the record
 *   4. If not found → lists every existing admin user so you can identify the right one
 *
 * After logging in with the temporary password, change it immediately from the
 * admin settings panel. Delete this script once it is no longer needed.
 */

import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const TARGET_EMAIL = "moonpilatesstudiopty@gmail.com";
const TEMP_PASSWORD = "TempPassword123!";

async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("  Admin Password Reset Utility");
  console.log("=".repeat(60));

  if (!process.env["DATABASE_URL"]) {
    console.error("\n[ERROR] DATABASE_URL environment variable is not set.");
    console.error("  Export it before running this script:\n");
    console.error(`  DATABASE_URL=<connection-string> pnpm --filter @workspace/api-server reset-admin-password\n`);
    process.exit(1);
  }

  console.log(`\n[INFO] Searching for user: ${TARGET_EMAIL}`);

  const [targetUser] = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
    })
    .from(usersTable)
    .where(eq(usersTable.email, TARGET_EMAIL))
    .limit(1);

  if (targetUser) {
    console.log(`[INFO] User found → id=${targetUser.id}, name="${targetUser.name}", role=${targetUser.role}`);
    console.log("[INFO] Hashing new temporary password...");

    const newHash = await bcrypt.hash(TEMP_PASSWORD, 12);

    await db
      .update(usersTable)
      .set({ passwordHash: newHash })
      .where(eq(usersTable.id, targetUser.id));

    console.log("\n" + "=".repeat(60));
    console.log("  Password reset successfully!");
    console.log("=".repeat(60));
    console.log(`  Email    : ${targetUser.email}`);
    console.log(`  Password : ${TEMP_PASSWORD}`);
    console.log("=".repeat(60));
    console.log("\n[IMPORTANT] Log in and change this password immediately.\n");
  } else {
    console.warn(`\n[WARN] No user found with email: ${TARGET_EMAIL}`);
    console.log("[INFO] Listing all existing admin users...\n");

    const adminUsers = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        role: usersTable.role,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.role, "ADMIN"))
      .orderBy(usersTable.id);

    if (adminUsers.length === 0) {
      console.warn("[WARN] No admin users exist in the database at all.");
      console.log("       You may need to run the seed script to create one.\n");
    } else {
      console.log(`Found ${adminUsers.length} admin user(s):\n`);
      for (const user of adminUsers) {
        console.log(`  id=${user.id}  email="${user.email}"  name="${user.name}"  created=${user.createdAt.toISOString()}`);
      }
      console.log(
        "\nTo reset one of these accounts, update TARGET_EMAIL in this script and re-run it.\n"
      );
    }
  }

  // Cleanly close the connection pool so the process exits without hanging.
  const { pool } = await import("@workspace/db");
  await pool.end();
}

main().catch((err) => {
  console.error("\n[FATAL] Unexpected error:", err);
  process.exit(1);
});
