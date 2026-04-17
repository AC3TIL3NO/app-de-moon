import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, studiosTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken } from "../lib/auth";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email y contraseña son requeridos" });
    return;
  }

  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (users.length === 0) {
    res.status(401).json({ error: "Credenciales incorrectas" });
    return;
  }

  const user = users[0];

  console.log("========== LOGIN DEBUG ==========");
  console.log("USER FROM DB:", user);
  console.log("PASSWORD INPUT:", password);
  console.log("HASH EN DB:", user.passwordHash);

  const valid = await bcrypt.compare(password, user.passwordHash);

  console.log("VALID RESULT:", valid);
  console.log("================================");

  if (!valid) {
    res.status(401).json({ error: "Credenciales incorrectas" });
    return;
  }

  const studios = await db
    .select()
    .from(studiosTable)
    .where(eq(studiosTable.id, user.studioId))
    .limit(1);

  const studio = studios[0];

  const token = signToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "ADMIN" | "RECEPTIONIST" | "INSTRUCTOR",
    studioId: user.studioId,
    studioName: studio?.name ?? "Pilates Studio",
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      studioId: user.studioId,
      studioName: studio?.name ?? "Pilates Studio",
    },
  });
});

// 🔥 ENDPOINT PARA GENERAR HASH REAL (TEMPORAL)
router.get("/auth/debug-hash", async (req, res) => {
  const hash = await bcrypt.hash("123456789", 10);
  res.json({ hash });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  res.json({
    id: req.user!.userId,
    email: req.user!.email,
    name: req.user!.name,
    role: req.user!.role,
    studioId: req.user!.studioId,
    studioName: req.user!.studioName,
  });
});

export default router;
