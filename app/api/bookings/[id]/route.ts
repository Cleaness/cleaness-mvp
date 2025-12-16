import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });

    const booking = await prisma.booking.update({
      where: { id },
      data: { status: "CANCELED" },
    });

    return NextResponse.json({ ok: true, booking });
  } catch (e) {
    console.error("CANCEL /api/bookings/[id] failed:", e);
    return NextResponse.json({ error: "CANCEL_FAILED" }, { status: 500 });
  }
}
