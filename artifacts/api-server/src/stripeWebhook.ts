import { type Request, type Response } from "express";
import { db, paymentsTable, membershipsTable, clientMembershipsTable, clientsTable, reservationsTable } from "@workspace/db";
import { eq, gte } from "drizzle-orm";

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey) {
    res.json({ received: true });
    return;
  }

  try {
    const Stripe = require("stripe");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-04-30.basil" });

    let event: any;

    if (webhookSecret && Buffer.isBuffer(req.body)) {
      const sig = req.headers["stripe-signature"] as string;
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = req.body;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const meta = session.metadata ?? {};
      const clientId = meta.clientId ? Number(meta.clientId) : null;
      const membershipId = meta.membershipId ? Number(meta.membershipId) : null;
      const reservationId = meta.reservationId ? Number(meta.reservationId) : null;

      let cardBrand: string | null = null;
      let cardLast4: string | null = null;

      if (session.payment_intent) {
        try {
          const pi = await stripe.paymentIntents.retrieve(session.payment_intent, {
            expand: ["payment_method"],
          });
          const pm = pi.payment_method as any;
          if (pm?.card) {
            cardBrand = pm.card.brand ?? null;
            cardLast4 = pm.card.last4 ?? null;
          }
        } catch (e) {
          console.error("[Stripe] Error retrieving payment method:", e);
        }
      }

      await db
        .update(paymentsTable)
        .set({
          status: "paid",
          stripePaymentIntentId: session.payment_intent ?? null,
          cardBrand,
          cardLast4,
        })
        .where(eq(paymentsTable.stripeSessionId, session.id));

      if (clientId && membershipId) {
        const [membership] = await db
          .select()
          .from(membershipsTable)
          .where(eq(membershipsTable.id, membershipId));

        if (membership) {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + (membership.durationDays ?? 30));

          await db.insert(clientMembershipsTable).values({
            clientId,
            membershipId,
            membershipName: membership.name,
            clientName: "",
            startDate: startDate.toISOString().slice(0, 10),
            endDate: endDate.toISOString().slice(0, 10),
            classesUsed: 0,
            classesTotal: membership.totalClasses,
            status: "Activa",
          });

          await db
            .update(clientsTable)
            .set({
              plan: membership.name,
              classesRemaining: membership.totalClasses,
            })
            .where(eq(clientsTable.id, clientId));
        }
      }

      if (clientId && reservationId) {
        await db
          .update(reservationsTable)
          .set({ status: "Confirmada" })
          .where(eq(reservationsTable.id, reservationId));
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error("[Stripe] Webhook error:", err.message);
    res.status(400).json({ received: false, error: err.message });
  }
}
