import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PATCH(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { phone, firstName, lastName } = body;

  if (firstName !== undefined && (!firstName || !String(firstName).trim())) {
    return NextResponse.json({ error: "First name cannot be empty" }, { status: 400 });
  }
  if (lastName !== undefined && (!lastName || !String(lastName).trim())) {
    return NextResponse.json({ error: "Last name cannot be empty" }, { status: 400 });
  }

  if (phone !== null && phone !== undefined && phone !== "") {
    const trimmed = String(phone).trim();
    if (trimmed.length > 23) {
      return NextResponse.json({ error: "Phone number must be 23 characters or fewer" }, { status: 400 });
    }
    if (!/^[+\d\s\-().]+$/.test(trimmed)) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
    }
  }

  const updated = await prisma.user.update({
    where: { UserID: user.UserID },
    data: {
      ...(firstName !== undefined && { FirstName: String(firstName).trim() }),
      ...(lastName !== undefined && { LastName: String(lastName).trim() }),
      Phone: phone ? String(phone).trim() : null,
    },
    select: { FirstName: true, LastName: true, Phone: true },
  });

  return NextResponse.json(updated);
}
