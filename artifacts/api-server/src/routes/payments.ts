import { Router, type IRouter } from "express";
import { db, paymentsTable, membershipsTable, clientMembershipsTable, clientsTable, reservationsTable } from "@workspace/db";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function getBaseUrl(req: any): string {
  const domain = process.env.REPLIT_DEV_DOMAIN;
  if (domain) return `https://${domain}`;
  return `${req.protocol}://${req.get("host")}`;
}

// ─── PayPal helpers ────────────────────────────────────────────────────────────

function getPayPalBase() {
  return process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) throw new Error("PayPal no está configurado");

  const res = await fetch(`${getPayPalBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error("Error al autenticar con PayPal");
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

// ─── POST /api/payments/paypal/create-order ────────────────────────────────────

router.post("/payments/paypal/create-order", async (req, res): Promise<void> => {
  const { clientId, membershipId, concept, amount } = req.body;

  if (!clientId || amount === undefined) {
    res.status(400).json({ error: "Faltan datos requeridos" });
    return;
  }

  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    res.status(503).json({ error: "PayPal no está configurado. Contacta al administrador." });
    return;
  }

  try {
    const token = await getPayPalAccessToken();
    const orderRes = await fetch(`${getPayPalBase()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: Number(amount).toFixed(2),
            },
            description: concept ?? "Membresía Moon Pilates Studio",
          },
        ],
        application_context: {
          brand_name: "Moon Pilates Studio",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
        },
      }),
    });

    if (!orderRes.ok) {
      const err = await orderRes.text();
      console.error("[PayPal] Create order error:", err);
      res.status(500).json({ error: "Error al crear la orden de pago" });
      return;
    }

    const order = await orderRes.json() as { id: string };

    await db.insert(paymentsTable).values({
      clientId: Number(clientId),
      membershipId: membershipId ? Number(membershipId) : null,
      concept: concept ?? "Membresía",
      amount: Number(amount),
      paymentMethod: "PayPal",
      chargedBy: "Sistema",
      stripeSessionId: order.id,
      status: "pending",
    });

    res.json({ orderId: order.id });
  } catch (err: any) {
    console.error("[PayPal] Error:", err.message);
    res.status(500).json({ error: err.message ?? "Error de pago" });
  }
});

// ─── POST /api/payments/paypal/capture-order ──────────────────────────────────

router.post("/payments/paypal/capture-order", async (req, res): Promise<void> => {
  const { orderId, clientId, membershipId } = req.body;

  if (!orderId || !clientId) {
    res.status(400).json({ error: "Faltan datos requeridos" });
    return;
  }

  try {
    const token = await getPayPalAccessToken();
    const captureRes = await fetch(`${getPayPalBase()}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!captureRes.ok) {
      const err = await captureRes.text();
      console.error("[PayPal] Capture error:", err);
      res.status(500).json({ error: "Error al capturar el pago" });
      return;
    }

    const capture = await captureRes.json() as {
      id: string;
      status: string;
      purchase_units?: Array<{ payments?: { captures?: Array<{ id: string }> } }>;
    };

    const captureId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? capture.id;

    await db
      .update(paymentsTable)
      .set({
        status: "paid",
        stripePaymentIntentId: captureId,
      })
      .where(eq(paymentsTable.stripeSessionId, orderId));

    if (membershipId) {
      const [membership] = await db
        .select()
        .from(membershipsTable)
        .where(eq(membershipsTable.id, Number(membershipId)));

      if (membership) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + (membership.durationDays ?? 30));

        const clients = await db
          .select({ name: clientsTable.name })
          .from(clientsTable)
          .where(eq(clientsTable.id, Number(clientId)))
          .limit(1);

        await db.insert(clientMembershipsTable).values({
          clientId: Number(clientId),
          membershipId: Number(membershipId),
          membershipName: membership.name,
          clientName: clients[0]?.name ?? "",
          startDate: startDate.toISOString().slice(0, 10),
          endDate: endDate.toISOString().slice(0, 10),
          classesUsed: 0,
          classesTotal: membership.totalClasses,
          status: "Activa",
        });

        await db
          .update(clientsTable)
          .set({ plan: membership.name, classesRemaining: membership.totalClasses })
          .where(eq(clientsTable.id, Number(clientId)));
      }
    }

    res.json({ status: "paid", captureId });
  } catch (err: any) {
    console.error("[PayPal] Capture error:", err.message);
    res.status(500).json({ error: err.message ?? "Error al procesar pago" });
  }
});

// ─── POST /api/payments/yappy ─────────────────────────────────────────────────

router.post("/payments/yappy", async (req, res): Promise<void> => {
  const { clientId, membershipId, concept, amount } = req.body;

  if (!clientId || amount === undefined) {
    res.status(400).json({ error: "Faltan datos requeridos" });
    return;
  }

  try {
    const [payment] = await db.insert(paymentsTable).values({
      clientId: Number(clientId),
      membershipId: membershipId ? Number(membershipId) : null,
      concept: concept ?? "Membresía",
      amount: Number(amount),
      paymentMethod: "Yappy",
      chargedBy: "Sistema",
      status: "pending",
    }).returning();

    res.json({ paymentId: payment.id, yappyPhone: "+50765869949", amount: Number(amount) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/payments ─────────────────────────────────────────────────────────

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
      createdAt: paymentsTable.createdAt,
      clientName: clientsTable.name,
      clientEmail: clientsTable.email,
    })
    .from(paymentsTable)
    .leftJoin(clientsTable, eq(paymentsTable.clientId, clientsTable.id))
    .orderBy(desc(paymentsTable.createdAt))
    .$dynamic();

  const conditions = [];
  if (method && method !== "Todos") conditions.push(eq(paymentsTable.paymentMethod, method));
  if (status && status !== "Todos") conditions.push(eq(paymentsTable.status, status));
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

// ─── GET /api/payments/summary ────────────────────────────────────────────────

router.get("/payments/summary", requireAuth, async (_req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      paymentMethod: paymentsTable.paymentMethod,
      amount: paymentsTable.amount,
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
    tarjeta: (byMethod["PayPal"] ?? 0) + (byMethod["Tarjeta"] ?? 0),
    yappy: byMethod["Yappy"] ?? 0,
    transferencia: byMethod["Transferencia"] ?? 0,
    pendiente: rows.filter((r) => r.status === "pending").reduce((s, r) => s + (r.amount ?? 0), 0),
    byMethod,
  });
});

// ─── POST /api/payments/manual ────────────────────────────────────────────────

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

// ─── POST /api/payments/manual/confirm-yappy ──────────────────────────────────

router.post("/payments/manual/confirm-yappy", requireAuth, async (req, res): Promise<void> => {
  const { paymentId, chargedBy } = req.body;
  if (!paymentId) { res.status(400).json({ error: "Falta paymentId" }); return; }

  const [updated] = await db
    .update(paymentsTable)
    .set({ status: "paid", chargedBy: chargedBy ?? "Recepción" })
    .where(eq(paymentsTable.id, Number(paymentId)))
    .returning();

  res.json(updated);
});

// ─── GET /api/client/payments ─────────────────────────────────────────────────

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
