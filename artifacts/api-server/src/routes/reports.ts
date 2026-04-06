import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { reservationsTable, clientsTable, classesTable, paymentsTable } from "@workspace/db";
import { eq, sql, desc, gte, lte, and } from "drizzle-orm";

const router: IRouter = Router();

function getDateRange(period?: string): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now);
  let from = new Date(now);

  switch (period) {
    case "today":
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
      break;
    case "week":
      from.setDate(now.getDate() - 7);
      break;
    case "month":
    default:
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
      break;
  }

  return { from, to };
}

router.get("/reports/revenue", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      month: sql<string>`to_char(${paymentsTable.createdAt}, 'Mon YYYY')`,
      monthOrder: sql<string>`to_char(${paymentsTable.createdAt}, 'YYYY-MM')`,
      total: sql<number>`coalesce(sum(${paymentsTable.amount}), 0)::float`,
      count: sql<number>`count(${paymentsTable.id})::int`,
    })
    .from(paymentsTable)
    .where(eq(paymentsTable.status, "paid"))
    .groupBy(
      sql`to_char(${paymentsTable.createdAt}, 'Mon YYYY')`,
      sql`to_char(${paymentsTable.createdAt}, 'YYYY-MM')`,
    )
    .orderBy(sql`to_char(${paymentsTable.createdAt}, 'YYYY-MM')`);

  res.json(rows.map((r) => ({ month: r.month, total: r.total, count: r.count })));
});

router.get("/reports/new-clients", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      month: sql<string>`to_char(${clientsTable.createdAt}, 'Mon YYYY')`,
      monthOrder: sql<string>`to_char(${clientsTable.createdAt}, 'YYYY-MM')`,
      count: sql<number>`count(${clientsTable.id})::int`,
    })
    .from(clientsTable)
    .groupBy(
      sql`to_char(${clientsTable.createdAt}, 'Mon YYYY')`,
      sql`to_char(${clientsTable.createdAt}, 'YYYY-MM')`,
    )
    .orderBy(sql`to_char(${clientsTable.createdAt}, 'YYYY-MM')`);

  res.json(rows.map((r) => ({ month: r.month, count: r.count })));
});

router.get("/reports/cancellations", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      month: sql<string>`to_char(${reservationsTable.createdAt}, 'Mon YYYY')`,
      monthOrder: sql<string>`to_char(${reservationsTable.createdAt}, 'YYYY-MM')`,
      cancelled: sql<number>`count(case when ${reservationsTable.status} = 'Cancelada' then 1 end)::int`,
      total: sql<number>`count(${reservationsTable.id})::int`,
    })
    .from(reservationsTable)
    .groupBy(
      sql`to_char(${reservationsTable.createdAt}, 'Mon YYYY')`,
      sql`to_char(${reservationsTable.createdAt}, 'YYYY-MM')`,
    )
    .orderBy(sql`to_char(${reservationsTable.createdAt}, 'YYYY-MM')`);

  res.json(rows.map((r) => ({ month: r.month, cancelled: r.cancelled, total: r.total })));
});

router.get("/reports/occupancy", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      hour: sql<string>`to_char(${classesTable.time}::time, 'HH24:00')`,
      reservations: sql<number>`count(${reservationsTable.id})::int`,
      capacity: sql<number>`coalesce(sum(${classesTable.capacity}), 0)::int`,
    })
    .from(classesTable)
    .leftJoin(
      reservationsTable,
      and(
        eq(reservationsTable.classId, classesTable.id),
        eq(reservationsTable.status, "Confirmada"),
      ),
    )
    .groupBy(sql`to_char(${classesTable.time}::time, 'HH24:00')`)
    .orderBy(sql`to_char(${classesTable.time}::time, 'HH24:00')`);

  res.json(rows.map((r) => ({
    hour: r.hour ?? "00:00",
    reservations: r.reservations,
    capacity: r.capacity,
    occupancyPct: r.capacity > 0 ? Math.round((r.reservations / r.capacity) * 100) : 0,
  })));
});

router.get("/reports/memberships", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      month: sql<string>`to_char(${paymentsTable.createdAt}, 'Mon YYYY')`,
      monthOrder: sql<string>`to_char(${paymentsTable.createdAt}, 'YYYY-MM')`,
      count: sql<number>`count(${paymentsTable.id})::int`,
      revenue: sql<number>`coalesce(sum(${paymentsTable.amount}), 0)::float`,
    })
    .from(paymentsTable)
    .where(eq(paymentsTable.status, "paid"))
    .groupBy(
      sql`to_char(${paymentsTable.createdAt}, 'Mon YYYY')`,
      sql`to_char(${paymentsTable.createdAt}, 'YYYY-MM')`,
    )
    .orderBy(sql`to_char(${paymentsTable.createdAt}, 'YYYY-MM')`);

  res.json(rows.map((r) => ({ month: r.month, count: r.count, revenue: r.revenue })));
});

export default router;
