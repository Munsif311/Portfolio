import { NextResponse } from "next/server";
import { getAdminSetupState, isValidAdminCredentials, signSession } from "@/lib/auth";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const email = typeof payload.email === "string" ? payload.email : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  try {
    if ((await getAdminSetupState()) !== "ready") {
      return NextResponse.json(
        { error: "Complete the one-time admin setup before signing in." },
        { status: 409 },
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin authentication is unavailable.";
    return NextResponse.json(
      { error: message },
      { status: 503 },
    );
  }

  try {
    if (!(await isValidAdminCredentials(email, password))) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin authentication is unavailable.";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const sessionToken = signSession(email.trim().toLowerCase());
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
