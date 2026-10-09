import type { NextRequest } from "next/server";

import { getCourseBySlug } from "@/lib/data";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/courses/[slug]">) {
  const { slug } = await ctx.params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    return Response.json({ error: "Course not found" }, { status: 404 });
  }

  return Response.json(course);
}
