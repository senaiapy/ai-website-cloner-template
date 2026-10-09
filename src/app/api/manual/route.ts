import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      "docs/research/apostila.denderson.ai/api-_api_manual.json"
    );
    const content = await fs.readFile(filePath, "utf8");
    return new NextResponse(content, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erro ao carregar manual JSON:", err);
    return NextResponse.json({ error: "Manual not found" }, { status: 500 });
  }
}

