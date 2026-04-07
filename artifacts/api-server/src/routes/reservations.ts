import { Router, type IRouter } from "express";
import { db, reservationsTable, clientsTable, classesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateReservationBody,
  CancelReservationParams,
  ListReservationsResponse,
  MarkAttendanceBody,
  MarkAttendanceParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/reservations", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: reservationsTable.id,
      clientId: reservationsTable.clientId,
      clientName: clientsTable.name,
      classId: reservationsTable.classId,
      className: classesTable.name,
      date: reservationsTable.date,
      status: reservationsTable.status,
      attended: reservationsTable.attended,
    })
    .from(reservationsTable)
    .leftJoin(clientsTable, eq(reservationsTable.clientId, clientsTable.id))
    .leftJoin(classesTable, eq(reservationsTable.classId, classesTable.id))
    .orderBy(reservationsTable.createdAt);

  const mapped = rows.map((r) => ({
    ...r,
    clientName: r.clientName ?? "Cliente desconocido",
    className: r.className ?? "Clase desconocida",
    attended: r.attended ?? false,
  }));
  res.json(ListReservationsResponse.parse(mapped));
});

router.post("/reservations", async (req, res): Promise<void> => {
  const parsed = CreateReservationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [reservation] = await db.insert(reservationsTable).values({
    ...parsed.data,
    status: "Confirmada",
  }).returning();

  // Update enrolled count on the class
  await db
    .update(classesTable)
    .set({ enrolled: db.$count(reservationsTable, eq(reservationsTable.classId, parsed.data.classId)) as unknown as number })
    .where(eq(classesTable.id, parsed.data.classId));

  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, parsed.data.clientId));
  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, parsed.data.classId));

  res.status(201).json({
    id: reservation.id,
    clientId: reservation.clientId,
    clientName: client?.name ?? "Cliente desconocido",
    classId: reservation.classId,
    className: cls?.name ?? "Clase desconocida",
    date: reservation.date,
    status: reservation.status,
  });
});

router.patch("/reservations/:id/attendance", async (req, res): Promise<void> => {
  const params = MarkAttendanceParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const body = MarkAttendanceBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const [updated] = await db
    .update(reservationsTable)
    .set({ attended: body.data.attended })
    .where(eq(reservationsTable.id, params.data.id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, updated.clientId));
  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, updated.classId));

  res.json({
    id: updated.id,
    clientId: updated.clientId,
    clientName: client?.name ?? "Cliente desconocido",
    classId: updated.classId,
    className: cls?.name ?? "Clase desconocida",
    date: updated.date,
    status: updated.status,
    attended: updated.attended,
  });
});

router.delete("/reservations/:id", async (req, res): Promise<void> => {
  const params = CancelReservationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [reservation] = await db
    .update(reservationsTable)
    .set({ status: "Cancelada" })
    .where(eq(reservationsTable.id, params.data.id))
    .returning();
  if (!reservation) {
    res.status(404).json({ error: "Reservation not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
