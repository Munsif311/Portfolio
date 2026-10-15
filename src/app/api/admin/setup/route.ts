import { NextResponse } from "next/server";
import { beginAdminSetup, signSession } from "@/lib/auth";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const email = typeof payload.email === "string" ? payload.email : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  const passwordConfirm = typeof payload.passwordConfirm === "string" ? payload.passwordConfirm : "";
  const sessionToken = signSession(email.trim().toLowerCase());
  if (!sessionToken) {
    return NextResponse.json({ error: "Server session secret is not configured." }, { status: 503 });
  }

  try {
    const setup = await beginAdminSetup(email, password, passwordConfirm);
    const response = NextResponse.json({ ok: true });
    response.cookies.set("portfolio_admin_session", sessionToken, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 12,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start admin setup.";
    const status =
      message === "Admin setup is already complete." ||
      message === "Admin setup has already started. Continue with the same email address." ||
      message === "Admin setup was started in another request. Refresh the page and try signing in."
        ? 409
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
