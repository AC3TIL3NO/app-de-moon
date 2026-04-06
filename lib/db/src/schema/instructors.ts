import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const instructorsTable = pgTable("instructors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  specialties: text("specialties").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInstructorSchema = createInsertSchema(instructorsTable).omit({ id: true, createdAt: true });
export type InsertInstructor = z.infer<typeof insertInstructorSchema>;
export type Instructor = typeof instructorsTable.$inferSelect;
