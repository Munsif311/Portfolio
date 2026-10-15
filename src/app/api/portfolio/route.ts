import { NextResponse } from "next/server";
import { getPortfolioData } from "@/lib/portfolio";

export async function GET() {
  const portfolio = await getPortfolioData();
  return NextResponse.json(portfolio);
}
