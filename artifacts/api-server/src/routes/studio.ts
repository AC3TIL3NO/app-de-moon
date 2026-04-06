import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { studiosTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/studio/settings", async (req, res): Promise<void> => {
  const studioId = 1;
  const studios = await db
    .select()
    .from(studiosTable)
    .where(eq(studiosTable.id, studioId))
    .limit(1);

  if (studios.length === 0) {
    res.status(404).json({ error: "Estudio no encontrado" });
    return;
  }

  res.json(studios[0]);
});

router.patch("/studio/settings", async (req, res): Promise<void> => {
  const studioId = 1;
  const { name, logoUrl, primaryColor, secondaryColor, phone, email, address, cancellationPolicy } =
    req.body as Record<string, string | undefined>;

  const updated = await db
    .update(studiosTable)
    .set({
      ...(name && { name }),
      ...(logoUrl !== undefined && { logoUrl }),
      ...(primaryColor && { primaryColor }),
      ...(secondaryColor && { secondaryColor }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(address !== undefined && { address }),
      ...(cancellationPolicy !== undefined && { cancellationPolicy }),
    })
    .where(eq(studiosTable.id, studioId))
    .returning();

  if (updated.length === 0) {
    res.status(404).json({ error: "Estudio no encontrado" });
    return;
  }

  res.json(updated[0]);
});

export default router;
