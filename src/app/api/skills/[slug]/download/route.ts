import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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
    // Check if filename without .zip exists or search
    const files = fs.readdirSync(downloadsDir);
    const matched = files.find(
      (f) => f.toLowerCase().includes(slug.toLowerCase()) && f.endsWith(".zip")
    );
    if (matched) {
      targetFile = path.join(downloadsDir, matched);
    }
  }

  if (!fs.existsSync(targetFile)) {
    return NextResponse.json({ error: "Skill package not found" }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(targetFile);
  const filename = path.basename(targetFile);

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

