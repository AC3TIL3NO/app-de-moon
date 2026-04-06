import { Router, type IRouter } from "express";
import { db, instructorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateInstructorBody,
  ListInstructorsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/instructors", async (_req, res): Promise<void> => {
  const instructors = await db.select().from(instructorsTable).orderBy(instructorsTable.createdAt);
  const mapped = instructors.map((i) => ({
    ...i,
    specialties: i.specialties ?? [],
  }));
  res.json(ListInstructorsResponse.parse(mapped));
});

router.post("/instructors", async (req, res): Promise<void> => {
  const parsed = CreateInstructorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [instructor] = await db.insert(instructorsTable).values({
    ...parsed.data,
    specialties: parsed.data.specialties ?? [],
  }).returning();
  res.status(201).json({ ...instructor, specialties: instructor.specialties ?? [] });
});

router.delete("/instructors/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(instructorsTable).where(eq(instructorsTable.id, id));
  res.sendStatus(204);
});

export default router;
