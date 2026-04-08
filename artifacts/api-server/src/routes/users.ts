import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/users", requireAuth, requireRole("ADMIN"), async (req, res): Promise<void> => {
  const users = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
    })
    .from(usersTable)
    .where(eq(usersTable.studioId, req.user!.studioId))
    .orderBy(usersTable.name);

  res.json(users);
});

router.post("/users", requireAuth, requireRole("ADMIN"), async (req, res): Promise<void> => {
  const { email, name, password, role } = req.body as {
    email?: string;
    name?: string;
    password?: string;
    role?: string;
  };

  if (!email || !name || !password || !role) {
    res.status(400).json({ error: "Todos los campos son requeridos" });
    return;
  }

  const validRoles = ["ADMIN", "RECEPTIONIST", "INSTRUCTOR"];
  if (!validRoles.includes(role)) {
    res.status(400).json({ error: "Rol inválido" });
    return;
  }

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Ya existe un usuario con ese correo" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await db
    .insert(usersTable)
    .values({
      email: email.toLowerCase(),
      name,
      passwordHash,
      role: role as "ADMIN" | "RECEPTIONIST" | "INSTRUCTOR",
      studioId: req.user!.studioId,
    })
    .returning({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
    });

  res.status(201).json(user);
});

router.patch("/users/:id", requireAuth, requireRole("ADMIN"), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const { name, email, role, password } = req.body as {
    name?: string;
    email?: string;
    role?: string;
    password?: string;
  };

  if (Number.isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const updates: Partial<{ name: string; email: string; role: string; passwordHash: string }> = {};
  if (name) updates.name = name;
  if (email) {
    const emailLower = email.toLowerCase();
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, emailLower))
      .limit(1);
    if (existing.length > 0 && existing[0].id !== id) {
      res.status(409).json({ error: "Ya existe un usuario con ese correo" });
      return;
    }
    updates.email = emailLower;
  }
  if (role) {
    const validRoles = ["ADMIN", "RECEPTIONIST", "INSTRUCTOR"];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: "Rol inválido" });
      return;
    }
    updates.role = role;
  }
  if (password) updates.passwordHash = await bcrypt.hash(password, 10);

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Nada que actualizar" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(and(eq(usersTable.id, id), eq(usersTable.studioId, req.user!.studioId)))
    .returning({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
    });

  if (!updated) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  res.json(updated);
});

router.delete("/users/:id", requireAuth, requireRole("ADMIN"), async (req, res): Promise<void> => {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  if (id === req.user!.userId) {
    res.status(400).json({ error: "No puedes eliminarte a ti mismo" });
    return;
  }

  const [deleted] = await db
    .delete(usersTable)
    .where(and(eq(usersTable.id, id), eq(usersTable.studioId, req.user!.studioId)))
    .returning({ id: usersTable.id });

  if (!deleted) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  res.json({ success: true });
});

export default router;
