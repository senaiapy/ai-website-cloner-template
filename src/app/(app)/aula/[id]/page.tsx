import { notFound } from "next/navigation";
import { getLesson, getDownloadableResources } from "@/lib/data";
import { LessonView } from "@/components/LessonView";
import { getManualViewData } from "@/lib/manual-views";

const VIEW_MAP: Record<string, string> = {
  "manual": "manual",
  "marketplace-skills": "skills",
  "marketplace-premium": "premium",
  "gravacoes-comunidade": "gravacoes",
  "gravacoes-estudos": "estudos",
  "extras": "extras",
};

export default async function AulaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getLesson(id);

  if (!result) notFound();

  const { lesson, course } = result;
  const allResources = await getDownloadableResources();

  // Find previous and next lessons
  const allCourseLessons = course.modules.flatMap((m) => m.lessons);
  const currentIndex = allCourseLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? allCourseLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < allCourseLessons.length - 1
      ? allCourseLessons[currentIndex + 1]
      : null;

  // Filter relevant downloadable resources
  const relevantResources = allResources
    .filter((r) => {
      if (lesson.id.includes("hermes") || lesson.id.includes("servidor")) {
        return (
          r.id.includes("hermes") ||
          r.id.includes("seguranca") ||
          r.id.includes("regras")
        );
      }
      if (lesson.id.includes("estudos")) {
        return r.id.includes("orca") || r.id.includes("erp");
      }
      if (lesson.id.includes("dia-1")) {
        return r.downloadUrl.includes("dia-1");
      }
      if (lesson.id.includes("dia-2")) {
        return r.downloadUrl.includes("dia-2");
      }
      return true;
    })
    .slice(0, 4);

  const viewKey = VIEW_MAP[lesson.id];
  const manualView = viewKey ? getManualViewData(viewKey) : null;

  return (
    <LessonView
      lesson={lesson}
      course={course}
      prevLesson={prevLesson}
      nextLesson={nextLesson}
      relevantResources={relevantResources}
      manualView={manualView}
    />
  );
}
