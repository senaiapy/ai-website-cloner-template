import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      "docs/research/apostila.denderson.ai/master-curriculum.json"
    );
    let raw = await fs.readFile(filePath, "utf8");

    // Rewrite remote CDN video URLs to local videos
    raw = raw.replace(
      /https:\/\/assets\.cdn\.filesafe\.space\/sVzQ1MyiOqQn2e6Yuzu1\/media\//g,
      "/videos/"
    );

    return new NextResponse(raw, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erro ao carregar curriculum:", err);
    return NextResponse.json({ error: "Curriculum not found" }, { status: 500 });
  }
}

