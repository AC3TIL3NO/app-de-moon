import { Router, type IRouter } from "express";
import { db, reservationsTable, classesTable, clientsTable, instructorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

async function sendWhatsAppMessage(to: string, body: string): Promise<{ success: boolean; sid?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

  if (!accountSid || !authToken) {
    console.warn("[WhatsApp] TWILIO credentials not set — message not sent");
    return { success: false };
  }

  try {
    const { Twilio } = await import("twilio");
    const client = new Twilio(accountSid, authToken);
    const message = await client.messages.create({
      from: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
      to: to.startsWith("whatsapp:") ? to : `whatsapp:${to}`,
      body,
    });
    return { success: true, sid: message.sid };
  } catch (err) {
    console.error("[WhatsApp] Failed to send:", err);
    return { success: false };
  }
}

router.post("/notifications/send-test/:id", async (req, res): Promise<void> => {
  const reservationId = parseInt(req.params.id);
  if (isNaN(reservationId)) {
    res.status(400).json({ success: false, message: "ID inválido" });
    return;
  }

  const [reservation] = await db
    .select({
      id: reservationsTable.id,
      clientName: clientsTable.name,
      clientPhone: clientsTable.phone,
      className: classesTable.name,
      classTime: classesTable.time,
      instructorName: instructorsTable.name,
    })
    .from(reservationsTable)
    .leftJoin(clientsTable, eq(reservationsTable.clientId, clientsTable.id))
    .leftJoin(classesTable, eq(reservationsTable.classId, classesTable.id))
    .leftJoin(instructorsTable, eq(classesTable.instructorId, instructorsTable.id))
    .where(eq(reservationsTable.id, reservationId));

  if (!reservation) {
    res.status(404).json({ success: false, message: "Reserva no encontrada" });
    return;
  }

  const clientName = reservation.clientName ?? "Cliente";
  const className = reservation.className ?? "Pilates";
  const classTime = reservation.classTime ?? "";
  const instructorName = reservation.instructorName ?? "el instructor";
  const phone = reservation.clientPhone ?? "";

  const messageBody = `Hola ${clientName} 👋 Te recordamos tu clase de ${className} mañana a las ${classTime} con ${instructorName}. ¡Te esperamos!`;

  if (!phone) {
    res.json({ success: false, message: "El cliente no tiene número de teléfono registrado" });
    return;
  }

  const result = await sendWhatsAppMessage(phone, messageBody);

  if (result.success) {
    res.json({ success: true, message: `Recordatorio enviado a ${phone}` });
  } else {
    res.json({
      success: false,
      message: "No se pudo enviar el mensaje. Verifica que las credenciales de Twilio estén configuradas.",
    });
  }
});

export { sendWhatsAppMessage };
export default router;
