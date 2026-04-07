import { Router, type IRouter } from "express";
import { db, classesTable, instructorsTable, reservationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateClassBody,
  UpdateClassBody,
  UpdateClassParams,
  GetClassParams,
  GetClassResponse,
  UpdateClassResponse,
  DeleteClassParams,
  ListClassesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getClassWithInstructor(id: number) {
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
    .where(eq(classesTable.id, id));
  return rows[0] ?? null;
}

router.get("/classes", async (_req, res): Promise<void> => {
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
    .orderBy(classesTable.time);

  const mapped = rows.map((r) => ({ ...r, instructor: r.instructor ?? "Sin instructor" }));
  res.json(ListClassesResponse.parse(mapped));
});

router.post("/classes", async (req, res): Promise<void> => {
  const parsed = CreateClassBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [cls] = await db.insert(classesTable).values(parsed.data).returning();
  const full = await getClassWithInstructor(cls.id);
  res.status(201).json(GetClassResponse.parse({ ...full, instructor: full?.instructor ?? "Sin instructor" }));
});

router.get("/classes/:id", async (req, res): Promise<void> => {
  const params = GetClassParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const cls = await getClassWithInstructor(params.data.id);
  if (!cls) {
    res.status(404).json({ error: "Class not found" });
    return;
  }
  res.json(GetClassResponse.parse({ ...cls, instructor: cls.instructor ?? "Sin instructor" }));
});

router.put("/classes/:id", async (req, res): Promise<void> => {
  const params = UpdateClassParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateClassBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await db.update(classesTable).set(parsed.data).where(eq(classesTable.id, params.data.id));
  const full = await getClassWithInstructor(params.data.id);
  if (!full) {
    res.status(404).json({ error: "Class not found" });
    return;
  }
  res.json(UpdateClassResponse.parse({ ...full, instructor: full.instructor ?? "Sin instructor" }));
});

router.delete("/classes/:id", async (req, res): Promise<void> => {
  const params = DeleteClassParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(reservationsTable).where(eq(reservationsTable.classId, params.data.id));
  const [cls] = await db.delete(classesTable).where(eq(classesTable.id, params.data.id)).returning();
  if (!cls) {
    res.status(404).json({ error: "Class not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
