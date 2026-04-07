import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { studiosTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router: IRouter = Router();

const DEFAULT_PAYMENT_METHODS = ["Efectivo", "Yappy", "Visa", "Mastercard", "PayPal", "PagueloFacil", "Transferencia"];

function parsePaymentMethods(raw: string | null | undefined): string[] {
  if (!raw) return DEFAULT_PAYMENT_METHODS;
  try { return JSON.parse(raw) as string[]; } catch { return DEFAULT_PAYMENT_METHODS; }
}

router.get("/studio/settings", async (_req, res): Promise<void> => {
  const [studio] = await db.select().from(studiosTable).where(eq(studiosTable.id, 1)).limit(1);
  if (!studio) { res.status(404).json({ error: "Estudio no encontrado" }); return; }
  res.json({
    ...studio,
    paymentMethods: parsePaymentMethods(studio.paymentMethods),
  });
});

router.patch("/studio/settings", requireAuth, requireRole("ADMIN"), async (req, res): Promise<void> => {
  const { name, logoUrl, primaryColor, secondaryColor, phone, email, address, cancellationPolicy, paymentMethods } = req.body as Record<string, unknown>;

  const updates: Record<string, unknown> = {};
  if (typeof name === "string" && name) updates.name = name;
  if (logoUrl !== undefined) updates.logoUrl = logoUrl || null;
  if (typeof primaryColor === "string" && primaryColor) updates.primaryColor = primaryColor;
  if (typeof secondaryColor === "string" && secondaryColor) updates.secondaryColor = secondaryColor;
  if (phone !== undefined) updates.phone = phone || null;
  if (email !== undefined) updates.email = email || null;
  if (address !== undefined) updates.address = address || null;
  if (cancellationPolicy !== undefined) updates.cancellationPolicy = cancellationPolicy || null;
  if (Array.isArray(paymentMethods)) updates.paymentMethods = JSON.stringify(paymentMethods);

  const [updated] = await db.update(studiosTable).set(updates as any).where(eq(studiosTable.id, 1)).returning();
  if (!updated) { res.status(404).json({ error: "Estudio no encontrado" }); return; }

  res.json({
    ...updated,
    paymentMethods: parsePaymentMethods(updated.paymentMethods),
  });
});

export default router;
