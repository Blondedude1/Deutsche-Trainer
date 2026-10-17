import { NextResponse } from "next/server";
import { COOKIE, sessionToken } from "@/lib/auth";

export async function POST(req: Request) {
  const pass = process.env.APP_PASSCODE;
  if (!pass) return NextResponse.json({ error: "APP_PASSCODE is not set on the server." }, { status: 500 });
  const { passcode } = (await req.json().catch(() => ({}))) as { passcode?: string };
  if (passcode !== pass) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return NextResponse.json({ error: "Wrong passcode" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await sessionToken(pass), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return res;
}
