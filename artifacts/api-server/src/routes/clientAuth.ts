import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { clientsTable, reservationsTable, classesTable, clientMembershipsTable, instructorsTable } from "@workspace/db";
import { eq, and, gte, desc } from "drizzle-orm";
import { verifyToken } from "../lib/auth";
import { Request, Response, NextFunction } from "express";

const router: IRouter = Router();
const JWT_SECRET = process.env["JWT_SECRET"] ?? process.env["SESSION_SECRET"] ?? "pilates-studio-dev-secret";

export interface ClientJwtPayload {
  clientId: number;
  email: string;
  name: string;
  type: "client";
}

function signClientToken(payload: ClientJwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

function requireClientAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as ClientJwtPayload;
    if (payload.type !== "client") {
      res.status(401).json({ error: "Token inválido" });
      return;
    }
    (req as any).client = payload;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}

// POST /api/client/register
router.post("/client/register", async (req, res): Promise<void> => {
  const { name, email, phone, password } = req.body as Record<string, string>;
  if (!name || !email || !phone || !password) {
    res.status(400).json({ error: "Todos los campos son requeridos" });
    return;
  }
  const existing = await db.select().from(clientsTable).where(eq(clientsTable.email, email.toLowerCase())).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Ya existe una cuenta con ese correo" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const inserted = await db.insert(clientsTable).values({
    name,
    email: email.toLowerCase(),
    phone,
    plan: "Por Clase",
    classesRemaining: 0,
    passwordHash,
  }).returning();

  const client = inserted[0];
  const token = signClientToken({ clientId: client.id, email: client.email, name: client.name, type: "client" });
  res.status(201).json({ token, client: { id: client.id, name: client.name, email: client.email, phone: client.phone } });
});

// POST /api/client/login
router.post("/client/login", async (req, res): Promise<void> => {
  const { email, password } = req.body as Record<string, string>;
  if (!email || !password) {
    res.status(400).json({ error: "Email y contraseña requeridos" });
    return;
  }
  const clients = await db.select().from(clientsTable).where(eq(clientsTable.email, email.toLowerCase())).limit(1);
  if (clients.length === 0 || !clients[0].passwordHash) {
    res.status(401).json({ error: "Credenciales incorrectas" });
    return;
  }
  const valid = await bcrypt.compare(password, clients[0].passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Credenciales incorrectas" });
    return;
  }
  const client = clients[0];
  const token = signClientToken({ clientId: client.id, email: client.email, name: client.name, type: "client" });
  res.json({ token, client: { id: client.id, name: client.name, email: client.email, phone: client.phone, plan: client.plan, classesRemaining: client.classesRemaining } });
});

// GET /api/client/me
router.get("/client/me", requireClientAuth, async (req, res): Promise<void> => {
  const { clientId } = (req as any).client as ClientJwtPayload;
  const clients = await db.select().from(clientsTable).where(eq(clientsTable.id, clientId)).limit(1);
  if (!clients.length) { res.status(404).json({ error: "Cliente no encontrado" }); return; }
  const c = clients[0];
  res.json({ id: c.id, name: c.name, email: c.email, phone: c.phone, plan: c.plan, classesRemaining: c.classesRemaining, createdAt: c.createdAt.toISOString() });
});

// GET /api/client/reservations
router.get("/client/reservations", requireClientAuth, async (req, res): Promise<void> => {
  const { clientId } = (req as any).client as ClientJwtPayload;
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
  const { clientId } = (req as any).client as ClientJwtPayload;
  const today = new Date().toISOString().slice(0, 10);
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

// POST /api/client/reserve
router.post("/client/reserve", requireClientAuth, async (req, res): Promise<void> => {
  const { clientId } = (req as any).client as ClientJwtPayload;
  const { classId, date } = req.body as { classId?: number; date?: string };
  if (!classId || !date) {
    res.status(400).json({ error: "classId y date son requeridos" });
    return;
  }

  // Check class exists and has capacity
  const classes = await db.select().from(classesTable).where(eq(classesTable.id, classId)).limit(1);
  if (!classes.length) { res.status(404).json({ error: "Clase no encontrada" }); return; }
  const cls = classes[0];
  if (cls.enrolled >= cls.capacity) {
    res.status(409).json({ error: "No hay cupos disponibles" });
    return;
  }

  // Check not already reserved
  const existing = await db.select().from(reservationsTable).where(
    and(eq(reservationsTable.clientId, clientId), eq(reservationsTable.classId, classId), eq(reservationsTable.date, date))
  ).limit(1);
  if (existing.length) {
    res.status(409).json({ error: "Ya tienes una reserva para esta clase en esa fecha" });
    return;
  }

  // Check client membership — deduct a class if active
  const activeMemberships = await db.select().from(clientMembershipsTable).where(
    and(eq(clientMembershipsTable.clientId, clientId), eq(clientMembershipsTable.status, "Activa"))
  ).limit(1);

  let usedMembership = false;
  if (activeMemberships.length > 0) {
    const mem = activeMemberships[0];
    if (mem.classesTotal === -1 || mem.classesUsed < mem.classesTotal) {
      await db.update(clientMembershipsTable)
        .set({ classesUsed: mem.classesUsed + 1 })
        .where(eq(clientMembershipsTable.id, mem.id));
      usedMembership = true;
    }
  } else {
    // Check client has classes remaining
    const clients = await db.select().from(clientsTable).where(eq(clientsTable.id, clientId)).limit(1);
    if (!clients.length || clients[0].classesRemaining <= 0) {
      res.status(402).json({ error: "Sin clases disponibles. Compra un plan para continuar." });
      return;
    }
    await db.update(clientsTable).set({ classesRemaining: clients[0].classesRemaining - 1 }).where(eq(clientsTable.id, clientId));
  }

  // Create reservation
  const inserted = await db.insert(reservationsTable).values({
    clientId,
    classId,
    clientName: (req as any).client.name,
    className: cls.name,
    date,
    status: "Confirmada",
    attended: false,
  }).returning();

  // Update enrolled count
  await db.update(classesTable).set({ enrolled: cls.enrolled + 1 }).where(eq(classesTable.id, classId));

  res.status(201).json({ reservation: inserted[0], usedMembership });
});

// DELETE /api/client/reservations/:id - cancel
router.delete("/client/reservations/:id", requireClientAuth, async (req, res): Promise<void> => {
  const { clientId } = (req as any).client as ClientJwtPayload;
  const id = parseInt(req.params["id"] ?? "0");

  const reservations = await db.select().from(reservationsTable)
    .where(and(eq(reservationsTable.id, id), eq(reservationsTable.clientId, clientId)))
    .limit(1);

  if (!reservations.length) {
    res.status(404).json({ error: "Reserva no encontrada" });
    return;
  }

  const reservation = reservations[0];
  if (reservation.status === "Cancelada") {
    res.status(409).json({ error: "La reserva ya fue cancelada" });
    return;
  }

  await db.update(reservationsTable).set({ status: "Cancelada" }).where(eq(reservationsTable.id, id));

  // Return class spot
  const classRow = await db.select().from(classesTable).where(eq(classesTable.id, reservation.classId)).limit(1);
  if (classRow.length > 0 && classRow[0].enrolled > 0) {
    await db.update(classesTable).set({ enrolled: classRow[0].enrolled - 1 }).where(eq(classesTable.id, reservation.classId));
  }

  // Refund class to client
  const clients = await db.select().from(clientsTable).where(eq(clientsTable.id, clientId)).limit(1);
  if (clients.length) {
    await db.update(clientsTable).set({ classesRemaining: clients[0].classesRemaining + 1 }).where(eq(clientsTable.id, clientId));
  }

  res.json({ success: true });
});

export default router;
