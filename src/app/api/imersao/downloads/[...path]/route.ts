import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MIME_MAP: Record<string, string> = {
  ".md": "text/markdown; charset=utf-8",
  ".zip": "application/zip",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  if (!pathSegments || pathSegments.length === 0) {
    return NextResponse.json({ error: "File not specified" }, { status: 400 });
  }

  const subPath = pathSegments.join("/");
  const downloadsDir = path.join(process.cwd(), "public", "downloads");
  let targetFile = path.join(downloadsDir, subPath);

  // Fallback mappings if filename differs slightly
  if (!fs.existsSync(targetFile)) {
    if (subPath.includes("instalador-hermes") || subPath.includes("hermes-instalacao")) {
      const candidates = [
        "hermes-instalacao-plano-b.zip",
        "instalador-hermes-plano-b.zip",
        "starter-kit-automacoes.zip",
      ];
      for (const cand of candidates) {
        const p = path.join(downloadsDir, cand);
        if (fs.existsSync(p)) {
          targetFile = p;
          break;
        }
      }
    }
  }

  if (!fs.existsSync(targetFile)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const ext = path.extname(targetFile).toLowerCase();
  const mimeType = MIME_MAP[ext] || "application/octet-stream";
  const filename = path.basename(targetFile);
  const fileBuffer = fs.readFileSync(targetFile);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Length": fileBuffer.length.toString(),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

