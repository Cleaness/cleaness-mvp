import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const existing = await prisma.serviceType.count();
  if (existing > 0) return NextResponse.json({ ok: true, message: "Already seeded" });

  await prisma.serviceType.create({
    data: { displayName: "Beratung (30 Min)", baseName: "Beratung", durationMinutes: 30, isOnlineBookable: true }
  });

  const durations = Array.from({ length: 10 }, (_, i) => (i + 1) * 30); // 30..300
  for (const d of durations) {
    await prisma.serviceType.create({
      data: { displayName: `Behandlung (${d} Min)`, baseName: "Behandlung", durationMinutes: d, isOnlineBookable: false }
    });
  }

  return NextResponse.json({ ok: true });
}
