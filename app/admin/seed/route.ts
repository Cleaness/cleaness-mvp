import { NextResponse } from "next/server";

export async function POST(req: Request) {
  await fetch(new URL("/api/seed", req.url), { method: "POST" });
  return NextResponse.redirect(new URL("/admin", req.url));
}
