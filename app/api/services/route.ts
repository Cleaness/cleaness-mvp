import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  const services = await prisma.serviceType.findMany({
    where: { isActive: true },
    orderBy: [{ isOnlineBookable: "desc" }, { durationMinutes: "asc" }]
  });
  return NextResponse.json({ services });
}

const CreateSchema = z.object({
  displayName: z.string().min(1),
  baseName: z.string().min(1),
  durationMinutes: z.number().int().min(15).max(600),
  isOnlineBookable: z.boolean().default(false),
});

export async function POST(req: Request) {
  const body = await req.json();
  const data = CreateSchema.parse(body);
  const service = await prisma.serviceType.create({ data });
  return NextResponse.json({ service });
}
