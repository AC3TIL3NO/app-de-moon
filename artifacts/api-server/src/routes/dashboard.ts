import { Router, type IRouter } from "express";
import { db, classesTable, clientsTable, reservationsTable, instructorsTable } from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import {
  GetDashboardSummaryResponse,
  GetTodayClassesResponse,
  GetRecentClientsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const DAY_NAMES_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function getTodayDate(): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getTodayDayName(): string {
  return DAY_NAMES_ES[new Date().getDay()]!;
}

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const todayDay = getTodayDayName();

  const [allClasses, allClients, pendingReservations, todayClasses] = await Promise.all([
    db.select().from(classesTable),
    db.select().from(clientsTable),
    db.select().from(reservationsTable).where(eq(reservationsTable.status, "Pendiente")),
    db.select().from(classesTable).where(and(eq(classesTable.dayOfWeek, todayDay), eq(classesTable.status, "Activa"))),
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
  const todayDay = getTodayDayName();

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
    .where(and(eq(classesTable.dayOfWeek, todayDay), eq(classesTable.status, "Activa")))
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

router.get("/dashboard/occupancy", async (_req, res): Promise<void> => {
  const classes = await db.select({
    name: classesTable.name,
    enrolled: classesTable.enrolled,
    capacity: classesTable.capacity,
  }).from(classesTable).orderBy(classesTable.name);

  const data = classes.map((c) => ({
    className: c.name,
    enrolled: c.enrolled,
    capacity: c.capacity,
    fillPct: c.capacity > 0 ? Math.round((c.enrolled / c.capacity) * 100) : 0,
  }));
  res.json(data);
});

router.get("/dashboard/top-clients", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      clientName: clientsTable.name,
      classesAttended: sql<number>`count(${reservationsTable.id})::int`,
    })
    .from(reservationsTable)
    .leftJoin(clientsTable, eq(reservationsTable.clientId, clientsTable.id))
    .where(eq(reservationsTable.attended, true))
    .groupBy(clientsTable.name)
    .orderBy(desc(sql`count(${reservationsTable.id})`))
    .limit(5);

  res.json(rows.map((r) => ({
    clientName: r.clientName ?? "Desconocido",
    classesAttended: r.classesAttended,
  })));
});

const DAY_ORDER = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DAY_LABELS: Record<string, string> = {
  Lunes: "Lun", Martes: "Mar", Miércoles: "Mié", Jueves: "Jue",
  Viernes: "Vie", Sábado: "Sáb", Domingo: "Dom",
};

router.get("/dashboard/weekly-attendance", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      dayOfWeek: classesTable.dayOfWeek,
      attended: sql<number>`count(${reservationsTable.id})::int`,
    })
    .from(reservationsTable)
    .leftJoin(classesTable, eq(reservationsTable.classId, classesTable.id))
    .where(eq(reservationsTable.attended, true))
    .groupBy(classesTable.dayOfWeek)
    .orderBy(classesTable.dayOfWeek);

  const map: Record<string, number> = {};
  for (const r of rows) {
    if (r.dayOfWeek) map[r.dayOfWeek] = r.attended;
  }

  const data = DAY_ORDER.map((day) => ({
    day,
    label: DAY_LABELS[day] ?? day,
    attended: map[day] ?? 0,
  }));

  res.json(data);
});

router.get("/dashboard/popular-classes", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      type: classesTable.type,
      count: sql<number>`count(${reservationsTable.id})::int`,
    })
    .from(reservationsTable)
    .leftJoin(classesTable, eq(reservationsTable.classId, classesTable.id))
    .groupBy(classesTable.type)
    .orderBy(desc(sql`count(${reservationsTable.id})`));

  res.json(rows.map((r) => ({
    type: r.type ?? "Otro",
    count: r.count,
  })));
});

export default router;
