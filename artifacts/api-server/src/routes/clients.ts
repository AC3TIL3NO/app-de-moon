import { Router, type IRouter } from "express";
import { db, clientsTable, reservationsTable, classesTable, clientMembershipsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateClientBody,
  UpdateClientBody,
  UpdateClientParams,
  GetClientParams,
  GetClientResponse,
  UpdateClientResponse,
  DeleteClientParams,
  ListClientsResponse,
  GetClientAttendanceParams,
  GetClientAttendanceResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeClient(c: Record<string, unknown>) {
  return {
    ...c,
    notes: c.notes ?? undefined,
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
  };
}

router.get("/clients", async (_req, res): Promise<void> => {
  const clients = await db.select().from(clientsTable).orderBy(desc(clientsTable.createdAt));
  res.json(ListClientsResponse.parse(clients.map(serializeClient)));
});

router.post("/clients", async (req, res): Promise<void> => {
  const parsed = CreateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [client] = await db.insert(clientsTable).values(parsed.data).returning();
  res.status(201).json(GetClientResponse.parse(serializeClient(client as unknown as Record<string, unknown>)));
});

router.get("/clients/:id", async (req, res): Promise<void> => {
  const params = GetClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, params.data.id));
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  res.json(GetClientResponse.parse(serializeClient(client as unknown as Record<string, unknown>)));
});

router.put("/clients/:id", async (req, res): Promise<void> => {
  const params = UpdateClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [client] = await db.update(clientsTable).set(parsed.data).where(eq(clientsTable.id, params.data.id)).returning();
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  res.json(UpdateClientResponse.parse(serializeClient(client as unknown as Record<string, unknown>)));
});

router.delete("/clients/:id", async (req, res): Promise<void> => {
  const params = DeleteClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [client] = await db.delete(clientsTable).where(eq(clientsTable.id, params.data.id)).returning();
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  res.sendStatus(204);
});

function computeClientMembershipStatus(m: {
  classesUsed: number;
  classesTotal: number;
  endDate: string;
}): "active" | "expired" | "completed" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(m.endDate);
  expiry.setHours(0, 0, 0, 0);
  const unlimited = m.classesTotal === -1;
  const classesExhausted = !unlimited && m.classesUsed >= m.classesTotal;
  if (classesExhausted) return "completed";
  if (expiry < today) return "expired";
  return "active";
}

router.get("/clients/:id/membership", async (req, res): Promise<void> => {
  const clientId = Number(req.params.id);
  if (!clientId) { res.status(400).json({ error: "Invalid id" }); return; }

  const rows = await db
    .select()
    .from(clientMembershipsTable)
    .where(eq(clientMembershipsTable.clientId, clientId))
    .orderBy(desc(clientMembershipsTable.createdAt));

  if (rows.length === 0) {
    res.status(404).json({ error: "No membership found" });
    return;
  }

  // Prefer the most recent active one, otherwise return the most recent
  const active = rows.find(r => r.status === "Activa");
  const row = active ?? rows[0]!;
  const computedStatus = computeClientMembershipStatus({
    classesUsed: row.classesUsed,
    classesTotal: row.classesTotal,
    endDate: row.endDate,
  });

  // Auto-update DB status if it has drifted
  if (
    (computedStatus === "expired" && row.status === "Activa") ||
    (computedStatus === "completed" && row.status === "Activa")
  ) {
    await db
      .update(clientMembershipsTable)
      .set({ status: computedStatus === "expired" ? "Vencida" : "Agotada" })
      .where(eq(clientMembershipsTable.id, row.id));
  }

  res.json({
    id: row.id,
    clientId: row.clientId,
    membershipId: row.membershipId,
    membershipName: row.membershipName,
    clientName: row.clientName,
    startDate: row.startDate,
    endDate: row.endDate,
    classesUsed: row.classesUsed,
    classesTotal: row.classesTotal,
    status: row.status as "Activa" | "Vencida" | "Agotada" | "Cancelada",
    computedStatus,
    remainingClasses: row.classesTotal === -1 ? null : Math.max(0, row.classesTotal - row.classesUsed),
  });
});

router.get("/clients/:id/attendance", async (req, res): Promise<void> => {
  const params = GetClientAttendanceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db
    .select({
      id: reservationsTable.id,
      classId: reservationsTable.classId,
      className: classesTable.name,
      date: reservationsTable.date,
      attended: reservationsTable.status,
    })
    .from(reservationsTable)
    .leftJoin(classesTable, eq(reservationsTable.classId, classesTable.id))
    .where(eq(reservationsTable.clientId, params.data.id))
    .orderBy(desc(reservationsTable.createdAt));

  const attendance = rows.map((r) => ({
    id: r.id,
    classId: r.classId,
    className: r.className ?? "Clase desconocida",
    date: r.date,
    attended: r.attended === "Confirmada",
  }));

  res.json(GetClientAttendanceResponse.parse(attendance));
});

export default router;
