import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    user: {
      email: "marcelu.phd@gmail.com",
      name: "Marcelo dos Anjos",
      role: "member",
      plan: "complete",
      founder: false,
      purchases: [],
      supportRegistered: false,
      communityTrial: null,
      communityActive: true,
      estudosActive: true,
      installActive: false,
    },
  });
}

