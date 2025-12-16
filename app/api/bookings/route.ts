import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { addMinutes, parseLocalDateTime } from "@/lib/time";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get("date"); // YYYY-MM-DD
  if (!date) return NextResponse.json({ bookings: [] });

  const start = new Date(date + "T00:00:00");
  const end = new Date(date + "T23:59:59");

  // Wichtig: Overlap-Query, nicht nur "startAt im Tag"
  const bookings = await prisma.booking.findMany({
    where: {
      status: "ACTIVE",
      startAt: { lt: end },
      endAt: { gt: start },
      },
    include: { customer: true, serviceType: true },
    orderBy: { startAt: "asc" },
  });

  return NextResponse.json({ bookings });
}

const CreateBooking = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  serviceTypeId: z.string().min(1),
  customerId: z.string().min(1),
  notes: z.string().optional().nullable(),
  source: z.enum(["ADMIN", "ONLINE"]).default("ADMIN"),
});

export async function POST(req: Request) {
  const body = await req.json();
  const data = CreateBooking.parse(body);

  const service = await prisma.serviceType.findUnique({ where: { id: data.serviceTypeId } });
  if (!service) return NextResponse.json({ error: "Service nicht gefunden" }, { status: 400 });

  const startAt = parseLocalDateTime(data.date, data.time);
  const endAt = addMinutes(startAt, service.durationMinutes);

  const conflict = await prisma.booking.findFirst({
    where: { startAt: { lt: endAt }, endAt: { gt: startAt } },
  });
  if (conflict) return NextResponse.json({ error: "Zeit ist bereits belegt" }, { status: 409 });

  const booking = await prisma.booking.create({
    data: {
      startAt,
      endAt,
      notes: data.notes ?? null,
      source: data.source,
      customerId: data.customerId,
      serviceTypeId: data.serviceTypeId,
    },
    include: { customer: true, serviceType: true },
  });

  return NextResponse.json({ booking });
}
