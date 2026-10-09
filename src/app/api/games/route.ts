import { getGames } from "@/lib/data";

export async function GET() {
  const games = await getGames();
  return Response.json(games);
}

