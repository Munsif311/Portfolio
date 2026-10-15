import { NextResponse } from "next/server";
import { getAdminCredentials, isValidAdminCredentials, signSession } from "@/lib/auth";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const username = typeof payload.username === "string" ? payload.username : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!getAdminCredentials()) {
    return NextResponse.json(
      { error: "Admin auth is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD in your environment." },
      { status: 500 },
    );
  }

  if (!isValidAdminCredentials(username, password)) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const sessionToken = signSession(username);
  if (!sessionToken) {
    return NextResponse.json({ error: "Server session secret is not configured." }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("portfolio_admin_session", sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
  });

  return response;
}
