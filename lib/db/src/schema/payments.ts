import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  membershipId: integer("membership_id"),
  reservationId: integer("reservation_id"),
  concept: text("concept").notNull().default("Membresía"),
  amount: real("amount").notNull(),
  paymentMethod: text("payment_method").notNull().default("Stripe"),
  cardBrand: text("card_brand"),
  cardLast4: text("card_last4"),
  chargedBy: text("charged_by").notNull().default("Sistema"),
  stripeSessionId: text("stripe_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
