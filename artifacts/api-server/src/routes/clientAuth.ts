import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db } from "@workspace/db";
import { clientsTable, reservationsTable, classesTable, clientMembershipsTable, instructorsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { getAuth, clerkClient } from "@clerk/express";

const router: IRouter = Router();

export interface ClientPayload {
  clientId: number;
  email: string;
  name: string;
  type: "client";
}

async function getOrCreateClient(clerkUserId: string): Promise<typeof clientsTable.$inferSelect> {
  const byClerk = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.clerkUserId, clerkUserId))
    .limit(1);
  if (byClerk.length) return byClerk[0]!;

  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const firstName = clerkUser.firstName ?? "";
  const lastName = clerkUser.lastName ?? "";
  const name = [firstName, lastName].filter(Boolean).join(" ") || email || "Cliente";

  if (email) {
    const byEmail = await db
      .select()
      .from(clientsTable)
      .where(eq(clientsTable.email, email.toLowerCase()))
      .limit(1);
    if (byEmail.length) {
      await db
        .update(clientsTable)
        .set({ clerkUserId })
        .where(eq(clientsTable.id, byEmail[0]!.id));
      return byEmail[0]!;
    }
  }

  const inserted = await db
    .insert(clientsTable)
    .values({
      clerkUserId,
      name,
      email: email.toLowerCase() || `clerk-${clerkUserId}@placeholder.com`,
      phone: "",
      plan: "Por Clase",
      classesRemaining: 0,
    })
    .returning();
  return inserted[0]!;
}

async function requireClientAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }
  try {
    const client = await getOrCreateClient(auth.userId);
    (req as any).client = {
      clientId: client.id,
      name: client.name,
      email: client.email,
      type: "client",
    } as ClientPayload;
    next();
  } catch (err) {
    res.status(500).json({ error: "Error al verificar sesión" });
  }
}

// PATCH /api/client/profile — complete or update profile
router.patch("/client/profile", requireClientAuth, async (req, res): Promise<void> => {
  const { clientId } = (req as any).client as ClientPayload;
  const { firstName, lastName, phone } = req.body as { firstName?: string; lastName?: string; phone?: string };

  if (!firstName?.trim() || !phone?.trim()) {
    res.status(400).json({ error: "Nombre y teléfono son requeridos" });
    return;
  }

  const name = [firstName.trim(), (lastName ?? "").trim()].filter(Boolean).join(" ");
  const normalizedPhone = phone.trim();

  const updated = await db
    .update(clientsTable)
    .set({ name, phone: normalizedPhone })
    .where(eq(clientsTable.id, clientId))
    .returning();

  const c = updated[0]!;
  res.json({ id: c.id, name: c.name, email: c.email, phone: c.phone, plan: c.plan, classesRemaining: c.classesRemaining });
});

// GET /api/client/me
router.get("/client/me", requireClientAuth, async (req, res): Promise<void> => {
  const { clientId } = (req as any).client as ClientPayload;
  const clients = await db.select().from(clientsTable).where(eq(clientsTable.id, clientId)).limit(1);
  if (!clients.length) { res.status(404).json({ error: "Cliente no encontrado" }); return; }
  const c = clients[0]!;
  res.json({ id: c.id, name: c.name, email: c.email, phone: c.phone, plan: c.plan, classesRemaining: c.classesRemaining, createdAt: c.createdAt.toISOString() });
});

// GET /api/client/classes - public list of upcoming classes for booking
router.get("/client/classes", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(classesTable)
    .where(eq(classesTable.status, "Activa"))
    .orderBy(classesTable.date, classesTable.time)
    .limit(50);
  res.json(rows);
});

// GET /api/client/reservations
router.get("/client/reservations", requireClientAuth, async (req, res): Promise<void> => {
  const { clientId } = (req as any).client as ClientPayload;
  const rows = await db
    .select({
      id: reservationsTable.id,
      classId: reservationsTable.classId,
      className: classesTable.name,
      date: reservationsTable.date,
      time: classesTable.time,
      status: reservationsTable.status,
      attended: reservationsTable.attended,
      instructorId: classesTable.instructorId,
      instructorName: instructorsTable.name,
    })
    .from(reservationsTable)
    .leftJoin(classesTable, eq(reservationsTable.classId, classesTable.id))
    .leftJoin(instructorsTable, eq(classesTable.instructorId, instructorsTable.id))
    .where(eq(reservationsTable.clientId, clientId))
    .orderBy(desc(reservationsTable.createdAt))
    .limit(50);
  res.json(rows);
});

// GET /api/client/membership
router.get("/client/membership", requireClientAuth, async (req, res): Promise<void> => {
  const { clientId } = (req as any).client as ClientPayload;
  const memberships = await db
    .select()
    .from(clientMembershipsTable)
    .where(
      and(
        eq(clientMembershipsTable.clientId, clientId),
        eq(clientMembershipsTable.status, "Activa"),
      )
    )
    .orderBy(desc(clientMembershipsTable.createdAt))
    .limit(1);
  res.json(memberships[0] ?? null);
});

// POST /api/client/reserve
router.post("/client/reserve", requireClientAuth, async (req, res): Promise<void> => {
  const { clientId, name } = (req as any).client as ClientPayload;
  const { classId, date } = req.body as { classId?: number; date?: string };
  if (!classId || !date) {
    res.status(400).json({ error: "classId y date son requeridos" });
    return;
  }

  const classes = await db.select().from(classesTable).where(eq(classesTable.id, classId)).limit(1);
  if (!classes.length) { res.status(404).json({ error: "Clase no encontrada" }); return; }
  const cls = classes[0]!;
  if (cls.enrolled >= cls.capacity) {
    res.status(409).json({ error: "No hay cupos disponibles" });
    return;
  }

  const existing = await db.select().from(reservationsTable).where(
    and(eq(reservationsTable.clientId, clientId), eq(reservationsTable.classId, classId), eq(reservationsTable.date, date))
  ).limit(1);
  if (existing.length) {
    res.status(409).json({ error: "Ya tienes una reserva para esta clase en esa fecha" });
    return;
  }

  const activeMemberships = await db.select().from(clientMembershipsTable).where(
    and(eq(clientMembershipsTable.clientId, clientId), eq(clientMembershipsTable.status, "Activa"))
  ).limit(1);

  let usedMembership = false;
  if (activeMemberships.length > 0) {
    const mem = activeMemberships[0]!;
    if (mem.classesTotal === -1 || mem.classesUsed < mem.classesTotal) {
      await db.update(clientMembershipsTable)
        .set({ classesUsed: mem.classesUsed + 1 })
        .where(eq(clientMembershipsTable.id, mem.id));
      usedMembership = true;
    }
  } else {
    const clientRow = await db.select().from(clientsTable).where(eq(clientsTable.id, clientId)).limit(1);
    if (!clientRow.length || clientRow[0]!.classesRemaining <= 0) {
      res.status(402).json({ error: "Sin clases disponibles. Compra un plan para continuar." });
      return;
    }
    await db.update(clientsTable).set({ classesRemaining: clientRow[0]!.classesRemaining - 1 }).where(eq(clientsTable.id, clientId));
  }

  const inserted = await db.insert(reservationsTable).values({
    clientId,
    classId,
    clientName: name,
    className: cls.name,
    date,
    status: "Confirmada",
    attended: false,
  }).returning();

  await db.update(classesTable).set({ enrolled: cls.enrolled + 1 }).where(eq(classesTable.id, classId));

  res.status(201).json({ reservation: inserted[0], usedMembership });
});

// DELETE /api/client/reservations/:id - cancel
router.delete("/client/reservations/:id", requireClientAuth, async (req, res): Promise<void> => {
  const { clientId } = (req as any).client as ClientPayload;
  const id = parseInt(req.params["id"] ?? "0");

  const reservations = await db.select().from(reservationsTable)
    .where(and(eq(reservationsTable.id, id), eq(reservationsTable.clientId, clientId)))
    .limit(1);

  if (!reservations.length) {
    res.status(404).json({ error: "Reserva no encontrada" });
    return;
  }

  const reservation = reservations[0]!;
  if (reservation.status === "Cancelada") {
    res.status(409).json({ error: "La reserva ya fue cancelada" });
    return;
  }

  await db.update(reservationsTable).set({ status: "Cancelada" }).where(eq(reservationsTable.id, id));

  const classRow = await db.select().from(classesTable).where(eq(classesTable.id, reservation.classId)).limit(1);
  if (classRow.length > 0 && classRow[0]!.enrolled > 0) {
    await db.update(classesTable).set({ enrolled: classRow[0]!.enrolled - 1 }).where(eq(classesTable.id, reservation.classId));
  }

  const clientRow = await db.select().from(clientsTable).where(eq(clientsTable.id, clientId)).limit(1);
  if (clientRow.length) {
    await db.update(clientsTable).set({ classesRemaining: clientRow[0]!.classesRemaining + 1 }).where(eq(clientsTable.id, clientId));
  }

  res.json({ success: true });
});

// GET /api/client/payments
router.get("/client/payments", requireClientAuth, async (req, res): Promise<void> => {
  const { clientId } = (req as any).client as ClientPayload;
  const { paymentsTable } = await import("@workspace/db");
  const rows = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.clientId, clientId))
    .orderBy(desc(paymentsTable.createdAt))
    .limit(50);
  res.json(rows);
});

export default router;
