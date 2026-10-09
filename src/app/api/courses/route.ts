import { createCourse, getCourses } from "@/lib/data";

export async function GET() {
  const courses = await getCourses();
  return Response.json(courses);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const course = await createCourse({
      slug,
      title: body.title,
      subtitle: body.subtitle,
      description: body.description,
      categorySlug: body.categorySlug || "aplicacoes",
      coverImage: body.coverImage || "/images/grupo-20261001-orca-print.webp",
      modules: body.modules || [],
    });
    return Response.json(course, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return Response.json({ error: message }, { status: 400 });
  }
}

