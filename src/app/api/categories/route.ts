import { getCategories } from "@/lib/data";

export async function GET() {
  const categories = await getCategories();
  return Response.json(categories);
}
