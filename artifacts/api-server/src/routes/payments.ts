import { Router, type IRouter } from "express";
import { db, paymentsTable, membershipsTable, clientMembershipsTable, clientsTable, reservationsTable } from "@workspace/db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  const Stripe = require("stripe");
  return new Stripe(key, { apiVersion: "2025-04-30.basil" });
}

function getBaseUrl(req: any): string {
  const domain = process.env.REPLIT_DEV_DOMAIN;
  if (domain) return `https://${domain}`;
  return `${req.protocol}://${req.get("host")}`;
}

router.post("/payments/create-checkout-session", async (req, res): Promise<void> => {
  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(503).json({ error: "Stripe no está configurado. El administrador debe agregar STRIPE_SECRET_KEY." });
    return;
  }

  const { clientId, membershipId, reservationId, concept, membershipName, price } = req.body;

  if (!clientId || price === undefined) {
    res.status(400).json({ error: "Faltan datos requeridos" });
    return;
  }

  try {
    const stripe = getStripe();
    const base = getBaseUrl(req);
    const successPath = `/landing/dashboard?payment=success`;
    const cancelPath = `/landing/dashboard?payment=cancelled`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: membershipName ?? concept ?? "Clase Moon Pilates",
              description: "Moon Pilates Studio",
              images: [],
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${base}${successPath}`,
      cancel_url: `${base}${cancelPath}`,
      metadata: {
        clientId: String(clientId),
        membershipId: membershipId ? String(membershipId) : "",
        reservationId: reservationId ? String(reservationId) : "",
        concept: concept ?? "Membresía",
      },
    });

    await db.insert(paymentsTable).values({
      clientId: Number(clientId),
      membershipId: membershipId ? Number(membershipId) : null,
      reservationId: reservationId ? Number(reservationId) : null,
      concept: concept ?? "Membresía",
      amount: price,
      paymentMethod: "Stripe",
      chargedBy: "Sistema",
      stripeSessionId: session.id,
      status: "pending",
    });

    res.json({ url: session.url ?? "", sessionId: session.id });
  } catch (err: any) {
    console.error("[Stripe] Checkout session error:", err.message);
    res.status(500).json({ error: "Error al crear sesión de pago: " + err.message });
  }
});

router.post("/payments/webhook", async (req, res): Promise<void> => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(503).json({ received: false });
    return;
  }

  try {
    const stripe = getStripe();
    let event: any = req.body;

    if (webhookSecret && Buffer.isBuffer(req.body)) {
      const sig = req.headers["stripe-signature"] as string;
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
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
        } catch (_) {}
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
        const [membership] = await db.select().from(membershipsTable).where(eq(membershipsTable.id, membershipId));
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
});

router.get("/payments", requireAuth, async (req, res): Promise<void> => {
  const { method, dateFrom, dateTo, status } = req.query as Record<string, string>;

  let query = db
    .select({
      id: paymentsTable.id,
      clientId: paymentsTable.clientId,
      membershipId: paymentsTable.membershipId,
      reservationId: paymentsTable.reservationId,
      concept: paymentsTable.concept,
      amount: paymentsTable.amount,
      paymentMethod: paymentsTable.paymentMethod,
      cardBrand: paymentsTable.cardBrand,
      cardLast4: paymentsTable.cardLast4,
      chargedBy: paymentsTable.chargedBy,
      status: paymentsTable.status,
      stripeSessionId: paymentsTable.stripeSessionId,
      stripePaymentIntentId: paymentsTable.stripePaymentIntentId,
      createdAt: paymentsTable.createdAt,
      clientName: clientsTable.name,
      clientEmail: clientsTable.email,
    })
    .from(paymentsTable)
    .leftJoin(clientsTable, eq(paymentsTable.clientId, clientsTable.id))
    .orderBy(desc(paymentsTable.createdAt))
    .$dynamic();

  const conditions = [];
  if (method) conditions.push(eq(paymentsTable.paymentMethod, method));
  if (status) conditions.push(eq(paymentsTable.status, status));
  if (dateFrom) conditions.push(gte(paymentsTable.createdAt, new Date(dateFrom)));
  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    conditions.push(lte(paymentsTable.createdAt, to));
  }
  if (conditions.length) query = query.where(and(...conditions));

  const rows = await query;
  res.json(rows.map((r) => ({
    ...r,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  })));
});

router.get("/payments/summary", requireAuth, async (_req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      paymentMethod: paymentsTable.paymentMethod,
      amount: paymentsTable.amount,
      createdAt: paymentsTable.createdAt,
      status: paymentsTable.status,
    })
    .from(paymentsTable)
    .where(gte(paymentsTable.createdAt, today));

  const paid = rows.filter((r) => r.status === "paid");
  const total = paid.reduce((s, r) => s + (r.amount ?? 0), 0);
  const byMethod: Record<string, number> = {};
  for (const r of paid) {
    const m = r.paymentMethod ?? "Otro";
    byMethod[m] = (byMethod[m] ?? 0) + (r.amount ?? 0);
  }

  res.json({
    totalHoy: total,
    efectivo: byMethod["Efectivo"] ?? 0,
    tarjeta: byMethod["Stripe"] ?? 0,
    yappy: byMethod["Yappy"] ?? 0,
    transferencia: byMethod["Transferencia"] ?? 0,
    pendiente: rows.filter((r) => r.status === "pending").reduce((s, r) => s + (r.amount ?? 0), 0),
    byMethod,
  });
});

router.post("/payments/manual", requireAuth, async (req, res): Promise<void> => {
  const { clientId, membershipId, reservationId, concept, amount, paymentMethod, chargedBy, activateMembership } = req.body;

  if (!clientId || amount === undefined || !paymentMethod) {
    res.status(400).json({ error: "Faltan datos requeridos" });
    return;
  }

  const [payment] = await db.insert(paymentsTable).values({
    clientId: Number(clientId),
    membershipId: membershipId ? Number(membershipId) : null,
    reservationId: reservationId ? Number(reservationId) : null,
    concept: concept ?? "Pago manual",
    amount: Number(amount),
    paymentMethod,
    chargedBy: chargedBy ?? "Recepción",
    status: "paid",
  }).returning();

  if (activateMembership && membershipId) {
    const [membership] = await db.select().from(membershipsTable).where(eq(membershipsTable.id, Number(membershipId)));
    if (membership) {
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + (membership.durationDays ?? 30));
      await db.insert(clientMembershipsTable).values({
        clientId: Number(clientId),
        membershipId: Number(membershipId),
        membershipName: membership.name,
        clientName: "",
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        classesUsed: 0,
        classesTotal: membership.totalClasses,
        status: "Activa",
      });
      await db.update(clientsTable).set({ plan: membership.name, classesRemaining: membership.totalClasses }).where(eq(clientsTable.id, Number(clientId)));
    }
  }

  res.json(payment);
});

router.get("/client/payments", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) { res.status(401).json({ error: "No autorizado" }); return; }

  try {
    const jwt = require("jsonwebtoken");
    const secret = process.env.JWT_SECRET ?? process.env.SESSION_SECRET ?? "pilates-studio-dev-secret";
    const decoded = jwt.verify(token, secret) as { clientId: number; type: string };
    if (decoded.type !== "client") { res.status(403).json({ error: "Acceso denegado" }); return; }

    const rows = await db
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.clientId, decoded.clientId))
      .orderBy(desc(paymentsTable.createdAt));

    res.json(rows.map((r) => ({
      ...r,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    })));
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
});

export default router;
