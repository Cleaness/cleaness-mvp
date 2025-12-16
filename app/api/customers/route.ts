import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();

    const customers = await prisma.customer.findMany({
      where: q
        ? {
            OR: [
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { phone: { contains: q } },
              { email: { contains: q } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ customers });
  } catch (e: any) {
    console.error("GET /api/customers failed:", e);
    return NextResponse.json({ error: "GET_FAILED" }, { status: 500 });
  }
}

const CustomerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(3),
  email: z.string().email().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = CustomerSchema.parse(body);

    const customer = await prisma.customer.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email ?? null,
        notes: data.notes ?? null,
      },
    });

    return NextResponse.json({ customer });
  } catch (e: any) {
    console.error("POST /api/customers failed:", e);
    // häufigster Grund: Telefon/E-Mail Unique Constraint
    return NextResponse.json({ error: "POST_FAILED" }, { status: 400 });
  }
}
