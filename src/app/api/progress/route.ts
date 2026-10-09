import { NextResponse } from "next/server";

const userProgress: Record<string, boolean> = {};

export async function GET() {
  return NextResponse.json({ progress: userProgress });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.lessonId) {
      userProgress[body.lessonId] = true;
    }
    return NextResponse.json({ success: true, progress: userProgress });
  } catch {
    return NextResponse.json({ progress: userProgress });
  }
}
