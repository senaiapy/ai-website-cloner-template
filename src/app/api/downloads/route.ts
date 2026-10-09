import { getDownloadableResources } from "@/lib/data";

export async function GET() {
  const resources = await getDownloadableResources();
  return Response.json(resources);
}

