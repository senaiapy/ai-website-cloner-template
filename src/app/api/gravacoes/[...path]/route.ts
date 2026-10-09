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
  const gravacoesDir = path.join(process.cwd(), "public", "gravacoes");
  const downloadsDir = path.join(process.cwd(), "public", "downloads");

  // Check 1: direct in public/gravacoes/
  let targetFile = path.join(gravacoesDir, subPath);

  // Check 2: if it ended in "transcricao" without extension, check .txt
  if (!fs.existsSync(targetFile)) {
    const withTxt = path.join(gravacoesDir, `${subPath}.txt`);
    if (fs.existsSync(withTxt)) {
      targetFile = withTxt;
    }
  }

  // Check 3: if it ended in "mapa" without extension, check .json
  if (!fs.existsSync(targetFile)) {
    const withJson = path.join(gravacoesDir, `${subPath}.json`);
    if (fs.existsSync(withJson)) {
      targetFile = withJson;
    }
  }

  // Check 4: if it's an archive request, check public/downloads
  if (!fs.existsSync(targetFile)) {
    const filename = pathSegments[pathSegments.length - 1];
    const inDownloads = path.join(downloadsDir, filename);
    if (fs.existsSync(inDownloads)) {
      targetFile = inDownloads;
    }
  }

  if (!fs.existsSync(targetFile)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const ext = path.extname(targetFile).toLowerCase();
  const mimeType = MIME_MAP[ext] || "application/octet-stream";
  const filename = path.basename(targetFile);
  const fileBuffer = fs.readFileSync(targetFile);

  const isJson = ext === ".json";

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Length": fileBuffer.length.toString(),
      ...(isJson
        ? { "Content-Disposition": "inline" }
        : { "Content-Disposition": `attachment; filename="${filename}"` }),
      "Cache-Control": "public, max-age=3600",
    },
  });
}

