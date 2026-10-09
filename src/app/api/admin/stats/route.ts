import { getAdminStats } from "@/lib/data";

export async function GET() {
  const stats = await getAdminStats();
  return Response.json(stats);
}

