import bcrypt from "bcryptjs";
import { db, studiosTable, usersTable, instructorsTable, classesTable } from "@workspace/db";
import { sql, notInArray } from "drizzle-orm";
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

export async function seedDatabase(): Promise<void> {
  try {
    logger.info("seed: checking database...");

    // 1. Studio
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

    // 2. Users (admin / receptionist / instructor)
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

    // 3. Instructor
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

    // 4. Fix invalid class data (migration for previously seeded bad data)
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

    // 5. Base classes (only if none exist)
    const existingClasses = await db.select().from(classesTable).limit(1);

    if (existingClasses.length === 0) {
      logger.info("seed: creating base classes...");

      // Mon–Fri + Sun: 9 slots 10:00–18:00   Sat: 4 slots 10:00–13:00
      const weekDaySlots = [
        "10:00", "11:00", "12:00", "13:00",
        "14:00", "15:00", "16:00", "17:00", "18:00",
      ];
      const satSlots = ["10:00", "11:00", "12:00", "13:00"];

      // Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5
      const weekDayIndices = [0, 1, 2, 3, 4, 5];

      const rows = [];

      for (const dayIndex of weekDayIndices) {
        const dayName = DAY_NAMES[dayIndex]!;
        const dateStr = getNextDayDate(dayIndex);
        for (let i = 0; i < weekDaySlots.length; i++) {
          const ti = i % VALID_TYPES.length;
          rows.push({
            name: CLASS_NAMES[ti]!,
            instructorId,
            time: weekDaySlots[i]!,
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

      // Saturday
      const satDate = getNextDayDate(6);
      for (let i = 0; i < satSlots.length; i++) {
        const ti = i % VALID_TYPES.length;
        rows.push({
          name: CLASS_NAMES[ti]!,
          instructorId,
          time: satSlots[i]!,
          duration: 60,
          capacity: 6,
          level: VALID_LEVELS[i % VALID_LEVELS.length]!,
          type: VALID_TYPES[ti]!,
          status: "Activa",
          dayOfWeek: "Sábado",
          date: satDate,
        });
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
