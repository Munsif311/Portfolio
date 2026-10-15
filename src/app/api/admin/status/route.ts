import { NextResponse } from "next/server";
import { getAdminSetupState } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({
      state: await getAdminSetupState(),
      recoveryEnabled: Boolean(process.env.RESEND_API_KEY && process.env.ADMIN_FROM_EMAIL),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to check admin setup.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
