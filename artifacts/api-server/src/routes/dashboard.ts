import { Router, type IRouter } from "express";
import { db, classesTable, clientsTable, reservationsTable, instructorsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import {
  GetDashboardSummaryResponse,
  GetTodayClassesResponse,
  GetRecentClientsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getTodayDate(): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const today = getTodayDate();

  const [allClasses, allClients, pendingReservations, todayClasses] = await Promise.all([
    db.select().from(classesTable),
    db.select().from(clientsTable),
    db.select().from(reservationsTable).where(eq(reservationsTable.status, "Pendiente")),
    db.select().from(classesTable).where(eq(classesTable.date, today)),
  ]);

  const totalCapacity = todayClasses.reduce((sum, c) => sum + c.capacity, 0);
  const totalEnrolled = todayClasses.reduce((sum, c) => sum + c.enrolled, 0);

  const summary = {
    todayClassesCount: todayClasses.length,
    activeClientsCount: allClients.length,
    pendingReservationsCount: pendingReservations.length,
    availableSpotsCount: Math.max(0, totalCapacity - totalEnrolled),
  };

  res.json(GetDashboardSummaryResponse.parse(summary));
});

router.get("/dashboard/today-classes", async (_req, res): Promise<void> => {
  const today = getTodayDate();

  const rows = await db
    .select({
      id: classesTable.id,
      name: classesTable.name,
      instructorId: classesTable.instructorId,
      instructor: instructorsTable.name,
      time: classesTable.time,
      duration: classesTable.duration,
      capacity: classesTable.capacity,
      enrolled: classesTable.enrolled,
      level: classesTable.level,
      type: classesTable.type,
      status: classesTable.status,
      dayOfWeek: classesTable.dayOfWeek,
      date: classesTable.date,
    })
    .from(classesTable)
    .leftJoin(instructorsTable, eq(classesTable.instructorId, instructorsTable.id))
    .where(eq(classesTable.date, today))
    .orderBy(classesTable.time);

  const mapped = rows.map((r) => ({ ...r, instructor: r.instructor ?? "Sin instructor" }));
  res.json(GetTodayClassesResponse.parse(mapped));
});

router.get("/dashboard/recent-clients", async (_req, res): Promise<void> => {
  const clients = await db
    .select()
    .from(clientsTable)
    .orderBy(desc(clientsTable.createdAt))
    .limit(5);

  res.json(GetRecentClientsResponse.parse(clients.map((c) => ({ ...c, notes: c.notes ?? undefined, createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt }))));
});

export default router;
