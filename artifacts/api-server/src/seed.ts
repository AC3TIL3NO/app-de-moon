import bcrypt from "bcryptjs";
import {
  db,
  studiosTable,
  usersTable,
  instructorsTable,
  classesTable,
  membershipsTable,
} from "@workspace/db";
import { eq, notInArray } from "drizzle-orm";
import { logger } from "./lib/logger";

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function getNextDayDate(dayIndex: number): string {
  const today = new Date();
  const current = today.getDay();
  let diff = dayIndex - current;
  if (diff <= 0) diff += 7;
  const next = new Date(today);
  next.setDate(today.getDate() + diff);
  return next.toISOString().split("T")[0]!;
}

const VALID_TYPES = ["Reformer", "Mat", "Privada"] as const;
const VALID_LEVELS = ["Principiante", "Intermedio", "Avanzado"] as const;
const CLASS_NAMES = ["Pilates Reformer", "Pilates Mat", "Clase Privada"];

// Lunes–Sábado, 10 slots por día (10:00–19:00)
const ALL_SLOTS = [
  "10:00", "11:00", "12:00", "13:00", "14:00",
  "15:00", "16:00", "17:00", "18:00", "19:00",
];

// Sun=0, Mon=1, ..., Sat=6  — excluimos Domingo (0)
const ACTIVE_DAY_INDICES = [1, 2, 3, 4, 5, 6];

export async function seedDatabase(): Promise<void> {
  try {
    logger.info("seed: checking database...");

    // ─── 1. Studio ───────────────────────────────────────────────────────────
    const existingStudios = await db.select().from(studiosTable).limit(1);
    let studioId: number;

    if (existingStudios.length === 0) {
      logger.info("seed: creating studio...");
      const [studio] = await db
        .insert(studiosTable)
        .values({
          name: "Moon Pilates Studio",
          slug: "moon-pilates",
          primaryColor: "#7C3AED",
          secondaryColor: "#A78BFA",
          phone: "+507 6586-9949",
          email: "moonpilatesstudiopty@gmail.com",
          address: "Atrio Mall Costa del Este Piso 2 Local C-16, Panamá",
          cancellationPolicy:
            "Las cancelaciones deben realizarse con al menos 24 horas de anticipación.",
        })
        .returning({ id: studiosTable.id });
      studioId = studio!.id;
      logger.info({ studioId }, "seed: studio created");
    } else {
      studioId = existingStudios[0]!.id;
      logger.info({ studioId }, "seed: studio already exists");
    }

    // ─── 2. Users ────────────────────────────────────────────────────────────
    const existingUsers = await db.select().from(usersTable).limit(1);

    if (existingUsers.length === 0) {
      logger.info("seed: creating users...");
      const ROUNDS = 10;
      await db.insert(usersTable).values([
        {
          email: "admin@studio.com",
          name: "Administrador",
          passwordHash: await bcrypt.hash("admin123", ROUNDS),
          role: "ADMIN" as const,
          studioId,
        },
        {
          email: "recep@studio.com",
          name: "Recepcionista",
          passwordHash: await bcrypt.hash("recep123", ROUNDS),
          role: "RECEPTIONIST" as const,
          studioId,
        },
        {
          email: "inst@studio.com",
          name: "Instructora Demo",
          passwordHash: await bcrypt.hash("inst123", ROUNDS),
          role: "INSTRUCTOR" as const,
          studioId,
        },
      ]);
      logger.info("seed: users created");
    } else {
      logger.info("seed: users already exist");
    }

    // ─── 3. Instructor ───────────────────────────────────────────────────────
    const existingInstructors = await db.select().from(instructorsTable).limit(1);
    let instructorId: number;

    if (existingInstructors.length === 0) {
      logger.info("seed: creating instructor...");
      const [instructor] = await db
        .insert(instructorsTable)
        .values({
          name: "María González",
          email: "maria@moonpilates.com",
          phone: "+507 6586-9949",
          specialties: ["Reformer", "Mat", "Privada"],
        })
        .returning({ id: instructorsTable.id });
      instructorId = instructor!.id;
      logger.info({ instructorId }, "seed: instructor created");
    } else {
      instructorId = existingInstructors[0]!.id;
      logger.info({ instructorId }, "seed: instructor already exists");
    }

    // ─── 4. Membership plans (always ensure correct plans exist) ─────────────
    const REQUIRED_PLANS = [
      { name: "Pilates Básico",   description: "4 clases al mes\nPrecios sin ITBMS\nClases de 60 minutos",                       totalClasses: 4,  price: 75,  durationDays: 30 },
      { name: "Pilates Plus",     description: "8 clases al mes\nPrecios sin ITBMS\nClases de 60 minutos",                       totalClasses: 8,  price: 135, durationDays: 30 },
      { name: "Pilates Premium",  description: "12 clases al mes\nPrecios sin ITBMS\nClases de 60 minutos\nAcceso prioritario",  totalClasses: 12, price: 180, durationDays: 30 },
    ];

    const existingMemberships = await db.select().from(membershipsTable).orderBy(membershipsTable.id);

    if (existingMemberships.length === 0) {
      await db.insert(membershipsTable).values(REQUIRED_PLANS.map(p => ({ ...p, active: true })));
      logger.info("seed: membership plans created");
    } else {
      // Update existing plans to ensure correct names/prices (in order)
      for (let i = 0; i < REQUIRED_PLANS.length; i++) {
        const plan = REQUIRED_PLANS[i]!;
        const existing = existingMemberships[i];
        if (existing && (existing.name !== plan.name || existing.price !== plan.price)) {
          await db.update(membershipsTable).set({ ...plan, active: true }).where(eq(membershipsTable.id, existing.id));
          logger.info({ id: existing.id, name: plan.name }, "seed: updated membership plan");
        }
      }
      // Create any missing plans beyond existing count
      if (existingMemberships.length < REQUIRED_PLANS.length) {
        const missing = REQUIRED_PLANS.slice(existingMemberships.length);
        await db.insert(membershipsTable).values(missing.map(p => ({ ...p, active: true })));
        logger.info({ count: missing.length }, "seed: created missing membership plans");
      }
    }

    // ─── 5. Fix invalid class data ──────────────────────────────────────────
    const fixedLevels = await db
      .update(classesTable)
      .set({ level: "Principiante" })
      .where(notInArray(classesTable.level, [...VALID_LEVELS]))
      .returning({ id: classesTable.id });
    if (fixedLevels.length > 0) {
      logger.info({ count: fixedLevels.length }, "seed: fixed invalid class levels");
    }

    const fixedTypes = await db
      .update(classesTable)
      .set({ type: "Reformer" })
      .where(notInArray(classesTable.type, [...VALID_TYPES]))
      .returning({ id: classesTable.id });
    if (fixedTypes.length > 0) {
      logger.info({ count: fixedTypes.length }, "seed: fixed invalid class types");
    }

    // ─── 6. Remove Sunday classes (migration) ───────────────────────────────
    const deletedSundays = await db
      .delete(classesTable)
      .where(eq(classesTable.dayOfWeek, "Domingo"))
      .returning({ id: classesTable.id });
    if (deletedSundays.length > 0) {
      logger.info({ count: deletedSundays.length }, "seed: deleted Sunday classes");
    }

    // ─── 7. Ensure all Mon–Sat days have all 10 slots (migration) ───────────
    const classesByDay = await db
      .select({ dayOfWeek: classesTable.dayOfWeek, time: classesTable.time, instructorId: classesTable.instructorId, date: classesTable.date })
      .from(classesTable)
      .where(notInArray(classesTable.dayOfWeek, ["Domingo"]));

    const existingByDay: Record<string, Set<string>> = {};
    const templateByDay: Record<string, { instructorId: number; date: string }> = {};
    for (const r of classesByDay) {
      if (!existingByDay[r.dayOfWeek]) existingByDay[r.dayOfWeek] = new Set();
      existingByDay[r.dayOfWeek]!.add(r.time);
      if (!templateByDay[r.dayOfWeek]) templateByDay[r.dayOfWeek] = { instructorId: r.instructorId, date: r.date };
    }

    const missingSlots: typeof classesByDay[0][] = [];
    for (const [dayName, tpl] of Object.entries(templateByDay)) {
      ALL_SLOTS.forEach((time, i) => {
        if (!existingByDay[dayName]?.has(time)) {
          missingSlots.push({ dayOfWeek: dayName, time, instructorId: tpl.instructorId, date: tpl.date });
        }
      });
    }

    if (missingSlots.length > 0) {
      await db.insert(classesTable).values(missingSlots.map((s, i) => ({
        name: CLASS_NAMES[i % CLASS_NAMES.length]!,
        instructorId: s.instructorId,
        time: s.time,
        duration: 60,
        capacity: 6,
        level: VALID_LEVELS[i % VALID_LEVELS.length]!,
        type: VALID_TYPES[i % VALID_TYPES.length]!,
        status: "Activa",
        dayOfWeek: s.dayOfWeek,
        date: s.date,
      })));
      logger.info({ count: missingSlots.length }, "seed: added missing time slots");
    }

    // ─── 8. Base classes (only if none exist) ───────────────────────────────
    const existingClasses = await db.select().from(classesTable).limit(1);

    if (existingClasses.length === 0) {
      logger.info("seed: creating base classes (Lun–Sáb, 10 slots)...");

      const rows = [];
      for (const dayIndex of ACTIVE_DAY_INDICES) {
        const dayName = DAY_NAMES[dayIndex]!;
        const dateStr = getNextDayDate(dayIndex);
        for (let i = 0; i < ALL_SLOTS.length; i++) {
          const ti = i % VALID_TYPES.length;
          rows.push({
            name: CLASS_NAMES[ti]!,
            instructorId,
            time: ALL_SLOTS[i]!,
            duration: 60,
            capacity: 6,
            level: VALID_LEVELS[i % VALID_LEVELS.length]!,
            type: VALID_TYPES[ti]!,
            status: "Activa",
            dayOfWeek: dayName,
            date: dateStr,
          });
        }
      }

      await db.insert(classesTable).values(rows);
      logger.info({ count: rows.length }, "seed: classes created");
    } else {
      logger.info("seed: classes already exist");
    }

    logger.info("seed: done");
  } catch (err) {
    logger.error({ err }, "seed: failed (server will still start)");
  }
}
