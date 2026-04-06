import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studiosTable = pgTable("studios", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").notNull().default("#7C3AED"),
  secondaryColor: text("secondary_color").notNull().default("#A78BFA"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  cancellationPolicy: text("cancellation_policy"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStudioSchema = createInsertSchema(studiosTable).omit({ id: true, createdAt: true });
export type InsertStudio = z.infer<typeof insertStudioSchema>;
export type Studio = typeof studiosTable.$inferSelect;
