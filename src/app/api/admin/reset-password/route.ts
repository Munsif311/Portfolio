import { NextResponse } from "next/server";
import { resetAdminPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const token = typeof payload.token === "string" ? payload.token : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  try {
    if (!(await resetAdminPassword(token, password))) {
      return NextResponse.json({ error: "The password reset link is invalid or expired." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reset the admin password.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
