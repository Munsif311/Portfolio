import { getPortfolioData } from "@/lib/portfolio";
import { PortfolioClient } from "@/components/portfolio-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const portfolio = await getPortfolioData();
  return <PortfolioClient portfolio={portfolio} />;
}
