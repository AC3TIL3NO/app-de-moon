import { Router, type IRouter } from "express";
import { db, paymentsTable, membershipsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.post("/payments/create-checkout-session", async (req, res): Promise<void> => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    res.status(503).json({
      error: "Stripe no está configurado. Agrega STRIPE_SECRET_KEY para activar los pagos.",
    });
    return;
  }

  const { clientId, membershipId, membershipName, price } = req.body;

  if (!clientId || !membershipId || !membershipName || price === undefined) {
    res.status(400).json({ error: "Faltan datos requeridos" });
    return;
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-04-30.basil" });

    const appUrl = process.env.APP_URL || process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : "http://localhost:8080";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: membershipName },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${appUrl}/memberships?payment=success`,
      cancel_url: `${appUrl}/memberships?payment=cancelled`,
      metadata: { clientId: String(clientId), membershipId: String(membershipId) },
    });

    await db.insert(paymentsTable).values({
      clientId,
      membershipId,
      amount: price,
      stripeSessionId: session.id,
      status: "pending",
    });

    res.json({ url: session.url ?? "", sessionId: session.id });
  } catch (err) {
    console.error("[Stripe] Checkout session error:", err);
    res.status(500).json({ error: "Error al crear sesión de pago" });
  }
});

router.post("/payments/webhook", async (req, res): Promise<void> => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey) {
    res.status(503).json({ received: false });
    return;
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-04-30.basil" });

    let event = req.body;

    if (webhookSecret) {
      const sig = req.headers["stripe-signature"] as string;
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      await db
        .update(paymentsTable)
        .set({ status: "paid", stripePaymentIntentId: session.payment_intent ?? null })
        .where(eq(paymentsTable.stripeSessionId, session.id));
    }

    res.json({ received: true });
  } catch (err) {
    console.error("[Stripe] Webhook error:", err);
    res.status(400).json({ received: false });
  }
});

router.get("/payments", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(paymentsTable)
    .orderBy(desc(paymentsTable.createdAt));

  res.json(
    rows.map((r) => ({
      id: r.id,
      clientId: r.clientId,
      membershipId: r.membershipId,
      amount: r.amount,
      stripeSessionId: r.stripeSessionId ?? undefined,
      status: r.status,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    }))
  );
});

export default router;
