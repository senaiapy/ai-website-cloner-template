import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const researchDir = path.join(
      process.cwd(),
      "docs/research/apostila.denderson.ai"
    );

    const specificFile = path.join(researchDir, `lesson-${id}.json`);
    let fileContent = "";

    try {
      fileContent = await fs.readFile(specificFile, "utf8");
    } catch {
      // Fallback: search in master-curriculum.json
      const masterFile = path.join(researchDir, "master-curriculum.json");
      const masterRaw = await fs.readFile(masterFile, "utf8");
      const masterData = JSON.parse(masterRaw);
      const found = masterData.lessons?.find((l: { id: string }) => l.id === id);

      if (!found) {
        return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
      }

      fileContent = JSON.stringify({ lesson: found });
    }

    // Rewrite remote CDN video URLs to local videos
    fileContent = fileContent.replace(
      /https:\/\/assets\.cdn\.filesafe\.space\/sVzQ1MyiOqQn2e6Yuzu1\/media\//g,
      "/videos/"
    );

    const parsed = JSON.parse(fileContent);
    // Ensure response format matches { lesson: ... }
    const responsePayload = parsed.lesson ? parsed : { lesson: parsed };

    return NextResponse.json(responsePayload);
  } catch (err) {
    console.error("Erro ao carregar aula individual:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

