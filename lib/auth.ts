/* eslint-disable @typescript-eslint/no-explicit-any */
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Enforce JWT_SECRET at module initialization
const jwtSecret = process.env.JWT_SECRET;
if (
  process.env.NODE_ENV === "production" &&
  (!jwtSecret || jwtSecret.length < 32)
) {
  throw new Error(
    "JWT_SECRET must be set and at least 32 characters in production",
  );
}

const SECRET_KEY = new TextEncoder().encode(
  jwtSecret || "default_secret_change_me",
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
  return payload;
}

export async function login(user: {
  UserID: string;
  Email: string;
  FirstName: string;
  LastName: string;
  Role: string;
  emailVerified: boolean;
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
