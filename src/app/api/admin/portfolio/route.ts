import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { getPortfolioData, savePortfolioData } from "@/lib/portfolio";

export async function GET() {
  const admin = getAuthenticatedAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const portfolio = await getPortfolioData();
  return NextResponse.json(portfolio);
}

export async function PUT(request: Request) {
  const admin = getAuthenticatedAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (process.env.VERCEL === "1" && !process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    return NextResponse.json(
      { error: "Vercel Blob is not configured. Portfolio editing requires a connected Blob store." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid portfolio payload." }, { status: 400 });
  }

  await savePortfolioData(body as any);
  return NextResponse.json({ ok: true });
}
