import bcrypt from "bcryptjs";
import {
  db,
  studiosTable,
  usersTable,
  instructorsTable,
  classesTable,
  membershipsTable,
  clientsTable,
  clientMembershipsTable,
  reservationsTable,
} from "@workspace/db";
import { eq, notInArray, inArray } from "drizzle-orm";
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

// Lunes–Sábado, 9 slots por día (10:00–18:00)
const ALL_SLOTS = [
  "10:00", "11:00", "12:00", "13:00", "14:00",
  "15:00", "16:00", "17:00", "18:00",
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
          primaryColor: "#C49A1E",
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
      // Always keep core branding values up to date
      await db
        .update(studiosTable)
        .set({
          name: "Moon Pilates Studio",
          primaryColor: "#C49A1E",
          secondaryColor: "#A78BFA",
          phone: "+507 6586-9949",
          email: "moonpilatesstudiopty@gmail.com",
          address: "Atrio Mall Costa del Este Piso 2 Local C-16, Panamá",
        })
        .where(eq(studiosTable.id, studioId));
      logger.info({ studioId }, "seed: studio already exists");
    }

    // ─── 2. Admin user — always ensure Shantel exists ────────────────────────
    const shantel = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, "moonpilatesstudiopty@gmail.com"))
      .limit(1);

    if (shantel.length === 0) {
      logger.info("seed: creating admin user Shantel Amaya...");
      await db.insert(usersTable).values({
        email: "moonpilatesstudiopty@gmail.com",
        name: "Shantel Amaya",
        passwordHash: await bcrypt.hash("123456789", 10),
        role: "ADMIN" as const,
        studioId,
      });
      logger.info("seed: admin user created");
    } else {
      logger.info({ id: shantel[0]!.id }, "seed: admin user already exists");
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
    const PUBLIC_PLANS = [
      { name: "Pilates Básico",   description: "4 clases al mes\nPrecios sin ITBMS\nClases de 60 minutos",                       totalClasses: 4,  price: 75,  durationDays: 30, isPublic: true },
      { name: "Pilates Plus",     description: "8 clases al mes\nPrecios sin ITBMS\nClases de 60 minutos",                       totalClasses: 8,  price: 135, durationDays: 30, isPublic: true },
      { name: "Pilates Premium",  description: "12 clases al mes\nPrecios sin ITBMS\nClases de 60 minutos\nAcceso prioritario",  totalClasses: 12, price: 180, durationDays: 30, isPublic: true },
    ];

    const INTERNAL_PLANS = [
      { name: "Clase Individual Grupal", description: "Clase grupal de pago por sesión", totalClasses: 1, price: 20, durationDays: 1, isPublic: false },
      { name: "Clase Privada",           description: "Clase privada individual",         totalClasses: 1, price: 30, durationDays: 1, isPublic: false },
      { name: "Clase Privada Dual",      description: "Clase privada para dos personas",  totalClasses: 1, price: 40, durationDays: 1, isPublic: false },
    ];

    const existingMemberships = await db.select().from(membershipsTable).orderBy(membershipsTable.id);
    const existingNames = new Set(existingMemberships.map(m => m.name));

    if (existingMemberships.length === 0) {
      await db.insert(membershipsTable).values([...PUBLIC_PLANS, ...INTERNAL_PLANS].map(p => ({ ...p, active: true })));
      logger.info("seed: all membership plans created");
    } else {
      // Update existing public plans to ensure correct names/prices (in order by ID)
      const publicExisting = existingMemberships.filter(m => m.isPublic !== false).slice(0, PUBLIC_PLANS.length);
      for (let i = 0; i < PUBLIC_PLANS.length; i++) {
        const plan = PUBLIC_PLANS[i]!;
        const existing = publicExisting[i];
        if (existing && (existing.name !== plan.name || existing.price !== plan.price)) {
          await db.update(membershipsTable).set({ ...plan, active: true }).where(eq(membershipsTable.id, existing.id));
          logger.info({ id: existing.id, name: plan.name }, "seed: updated public membership plan");
        }
      }
      // Create any missing internal plans by name
      for (const plan of INTERNAL_PLANS) {
        if (!existingNames.has(plan.name)) {
          await db.insert(membershipsTable).values({ ...plan, active: true });
          logger.info({ name: plan.name }, "seed: created internal plan");
        }
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

    // ─── 9. Remove legacy demo clients (@demo.com) ───────────────────────────
    const DEMO_EMAILS = [
      "maria.hernandez@demo.com",
      "laura.sanchez@demo.com",
      "diana.torres@demo.com",
      "ana.garcia@demo.com",
      "maria.lopez@demo.com",
      "alejandra.ruiz@demo.com",
    ];
    const demoClients = await db
      .select({ id: clientsTable.id })
      .from(clientsTable)
      .where(inArray(clientsTable.email, DEMO_EMAILS));

    if (demoClients.length > 0) {
      const demoIds = demoClients.map(c => c.id);
      await db.delete(reservationsTable).where(inArray(reservationsTable.clientId, demoIds));
      await db.delete(clientMembershipsTable).where(inArray(clientMembershipsTable.clientId, demoIds));
      await db.delete(clientsTable).where(inArray(clientsTable.id, demoIds));
      logger.info({ count: demoIds.length }, "seed: removed legacy demo clients");
    }

    logger.info("seed: done");
  } catch (err) {
    logger.error({ err }, "seed: failed (server will still start)");
  }
}
