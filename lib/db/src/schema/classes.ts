import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { instructorsTable } from "./instructors";

export const classesTable = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  instructorId: integer("instructor_id").notNull().references(() => instructorsTable.id),
  time: text("time").notNull(),
  duration: integer("duration").notNull(),
  capacity: integer("capacity").notNull(),
  enrolled: integer("enrolled").notNull().default(0),
  level: text("level").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("Activa"),
  dayOfWeek: text("day_of_week").notNull(),
  date: text("date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertClassSchema = createInsertSchema(classesTable).omit({ id: true, createdAt: true, enrolled: true });
export type InsertClass = z.infer<typeof insertClassSchema>;
export type PilatesClass = typeof classesTable.$inferSelect;
