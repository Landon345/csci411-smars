import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ valid: false, reason: "Missing token" }, { status: 400 });
  }

  const invite = await prisma.inviteToken.findUnique({ where: { Token: token } });

  if (!invite) {
    return NextResponse.json({ valid: false, reason: "Invalid invite link" });
  }

  if (invite.Used) {
    return NextResponse.json({ valid: false, reason: "This invite link has already been used" });
  }

  if (invite.ExpiresAt < new Date()) {
    return NextResponse.json({ valid: false, reason: "This invite link has expired" });
  }

  return NextResponse.json({ valid: true, email: invite.Email });
}
