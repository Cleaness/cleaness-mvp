import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addMinutes, parseLocalDateTime } from "@/lib/time";

export async function POST(req: Request) {
  const form = await req.formData();
  const date = String(form.get("date") || "");
  const time = String(form.get("time") || "");
  const serviceTypeId = String(form.get("serviceTypeId") || "");
  const firstName = String(form.get("firstName") || "");
  const lastName = String(form.get("lastName") || "");
  const phone = String(form.get("phone") || "");
  const email = String(form.get("email") || "") || null;
  const notes = String(form.get("notes") || "") || null;

  const service = await prisma.serviceType.findUnique({ where: { id: serviceTypeId } });
  if (!service || !service.isOnlineBookable) {
    return NextResponse.redirect(new URL(`/book/beratung?error=service`, req.url));
  }

  const startAt = parseLocalDateTime(date, time);
  const endAt = addMinutes(startAt, service.durationMinutes);

  // Öffnungszeiten MVP: 10:00–18:00
  const startMinutes = startAt.getHours() * 60 + startAt.getMinutes();
  if (startMinutes < 10 * 60 || startMinutes >= 18 * 60) {
    return NextResponse.redirect(new URL(`/book/beratung?date=${date}&error=hours`, req.url));
  }

  const conflict = await prisma.booking.findFirst({
    where: { startAt: { lt: endAt }, endAt: { gt: startAt } },
  });
  if (conflict) {
    return NextResponse.redirect(new URL(`/book/beratung?date=${date}&error=busy`, req.url));
  }

  const customer = await prisma.customer.upsert({
    where: { phone },
    create: { firstName, lastName, phone, email, notes: null },
    update: { firstName, lastName, email: email ?? undefined },
  });

  await prisma.booking.create({
    data: {
      startAt,
      endAt,
      notes,
      source: "ONLINE",
      customerId: customer.id,
      serviceTypeId: service.id,
    },
  });

  return NextResponse.redirect(new URL(`/book/beratung/success?date=${date}`, req.url));
}
