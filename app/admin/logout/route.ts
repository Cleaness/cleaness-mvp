import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  // Cookie löschen (Admin-Login)
  res.cookies.set("admin", "", { path: "/", maxAge: 0 });

  return res;
}
