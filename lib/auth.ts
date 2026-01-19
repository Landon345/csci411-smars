/* eslint-disable @typescript-eslint/no-explicit-any */
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "default_secret_change_me",
);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h") // Session lasts 2 hours
    .sign(SECRET_KEY);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, SECRET_KEY, {
    algorithms: ["HS256"],
  });
  console.log("payload", payload);
  return payload;
}

export async function login(user: {
  UserID: string;
  Email: string;
  FirstName: string;
  LastName: string;
}) {
  // Create the session
  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const session = await encrypt({ user, expires });

  // Save the session in a cookie
  const cookieStore = await cookies();
  cookieStore.set("auth_token", session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set("auth_token", "", { expires: new Date(0) });
}
