import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";
import { membershipsTable } from "./memberships";

export const clientMembershipsTable = pgTable("client_memberships", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clientsTable.id),
  membershipId: integer("membership_id").notNull().references(() => membershipsTable.id),
  membershipName: text("membership_name").notNull(),
  clientName: text("client_name").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  classesUsed: integer("classes_used").notNull().default(0),
  classesTotal: integer("classes_total").notNull(),
  status: text("status").notNull().default("Activa"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertClientMembershipSchema = createInsertSchema(clientMembershipsTable).omit({ id: true, createdAt: true, classesUsed: true });
export type InsertClientMembership = z.infer<typeof insertClientMembershipSchema>;
export type ClientMembership = typeof clientMembershipsTable.$inferSelect;
