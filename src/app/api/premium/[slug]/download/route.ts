import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SLUG_MAP: Record<string, string> = {
  "banco-dados-naia": "starter-kit-automacoes.zip",
  "prospect-google": "niche-research.zip",
  "prospect-instagram": "carrossel.zip",
  "prospect-facebook": "content-matrix.zip",
  "edicao-video-avalanche": "remotion.zip",
  "sdr-completo": "hook-generator.zip",
  "paginas-interativas-avalanche": "landing-pages.zip",
  "crm-opensource": "starter-kit-automacoes.zip",
  "naia-claude-10x": "starter-kit-automacoes.zip",
  "infograficos": "gemini-infographic.zip",
  "ia-radar": "niche-research.zip",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ error: "Slug required" }, { status: 400 });
  }

  const downloadsDir = path.join(process.cwd(), "public", "downloads");
  let targetFile = path.join(downloadsDir, `${slug}.zip`);

  if (!fs.existsSync(targetFile)) {
    const mapped = SLUG_MAP[slug];
    if (mapped && fs.existsSync(path.join(downloadsDir, mapped))) {
      targetFile = path.join(downloadsDir, mapped);
    }
  }

  if (!fs.existsSync(targetFile)) {
    // Fallback to starter-kit-automacoes.zip if exists
    const fallback = path.join(downloadsDir, "starter-kit-automacoes.zip");
    if (fs.existsSync(fallback)) {
      targetFile = fallback;
    }
  }

  if (!fs.existsSync(targetFile)) {
    return NextResponse.json({ error: "Premium package not found" }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(targetFile);
  const filename = `${slug}.zip`;

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Length": fileBuffer.length.toString(),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

