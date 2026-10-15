import { NextResponse } from "next/server";
import { createPasswordReset } from "@/lib/auth";
import { sendAdminEmail } from "@/lib/admin-email";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!process.env.RESEND_API_KEY || !process.env.ADMIN_FROM_EMAIL) {
    return NextResponse.json(
      { error: "Set RESEND_API_KEY and ADMIN_FROM_EMAIL to enable password recovery." },
      { status: 503 },
    );
  }

  try {
    const reset = await createPasswordReset(email);
    if (reset) {
      const resetUrl = new URL("/admin", request.url);
      resetUrl.searchParams.set("reset", reset.token);
      await sendAdminEmail(
        reset.email,
        "Reset your portfolio admin password",
        `<p>A password reset was requested for your portfolio admin account.</p><p><a href="${resetUrl.toString()}">Reset your password</a></p><p>This link expires in 15 minutes. If you did not request it, you can ignore this email.</p>`,
      );
    }
    return NextResponse.json({
      ok: true,
      message: "If an admin account exists for that email, a password reset link has been sent.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send the password reset email.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
