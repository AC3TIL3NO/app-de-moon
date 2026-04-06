import { Router, type IRouter } from "express";
import { db, membershipsTable, clientMembershipsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateMembershipBody,
  DeleteMembershipParams,
  ListMembershipsResponse,
  CreateClientMembershipBody,
  DeleteClientMembershipParams,
  ListClientMembershipsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// --- Membership Plans ---

router.get("/memberships", async (_req, res): Promise<void> => {
  const plans = await db.select().from(membershipsTable).orderBy(membershipsTable.createdAt);
  res.json(ListMembershipsResponse.parse(plans.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? undefined,
    totalClasses: p.totalClasses,
    price: p.price,
    durationDays: p.durationDays,
    active: p.active,
  }))));
});

router.post("/memberships", async (req, res): Promise<void> => {
  const parsed = CreateMembershipBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [plan] = await db.insert(membershipsTable).values({
    name: parsed.data.name,
    description: parsed.data.description,
    totalClasses: parsed.data.totalClasses,
    price: parsed.data.price,
    durationDays: parsed.data.durationDays,
    active: parsed.data.active ?? true,
  }).returning();
  res.status(201).json({
    id: plan.id,
    name: plan.name,
    description: plan.description ?? undefined,
    totalClasses: plan.totalClasses,
    price: plan.price,
    durationDays: plan.durationDays,
    active: plan.active,
  });
});

router.delete("/memberships/:id", async (req, res): Promise<void> => {
  const params = DeleteMembershipParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(membershipsTable).where(eq(membershipsTable.id, params.data.id));
  res.sendStatus(204);
});

// --- Client Memberships ---

router.get("/client-memberships", async (_req, res): Promise<void> => {
  const rows = await db.select().from(clientMembershipsTable).orderBy(clientMembershipsTable.createdAt);
  res.json(ListClientMembershipsResponse.parse(rows.map((r) => ({
    id: r.id,
    clientId: r.clientId,
    membershipId: r.membershipId,
    membershipName: r.membershipName,
    clientName: r.clientName,
    startDate: r.startDate,
    endDate: r.endDate,
    classesUsed: r.classesUsed,
    classesTotal: r.classesTotal,
    status: r.status as "Activa" | "Vencida" | "Agotada" | "Cancelada",
  }))));
});

router.post("/client-memberships", async (req, res): Promise<void> => {
  const parsed = CreateClientMembershipBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [cm] = await db.insert(clientMembershipsTable).values({
    clientId: parsed.data.clientId,
    membershipId: parsed.data.membershipId,
    membershipName: parsed.data.membershipName,
    clientName: parsed.data.clientName,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    classesTotal: parsed.data.classesTotal,
    status: parsed.data.status ?? "Activa",
  }).returning();
  res.status(201).json({
    id: cm.id,
    clientId: cm.clientId,
    membershipId: cm.membershipId,
    membershipName: cm.membershipName,
    clientName: cm.clientName,
    startDate: cm.startDate,
    endDate: cm.endDate,
    classesUsed: cm.classesUsed,
    classesTotal: cm.classesTotal,
    status: cm.status as "Activa" | "Vencida" | "Agotada" | "Cancelada",
  });
});

router.delete("/client-memberships/:id", async (req, res): Promise<void> => {
  const params = DeleteClientMembershipParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.update(clientMembershipsTable)
    .set({ status: "Cancelada" })
    .where(eq(clientMembershipsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
