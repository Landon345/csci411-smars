import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export interface SessionUser {
  UserID: string;
  Email: string;
  FirstName: string;
  LastName: string;
  Role: "patient" | "doctor" | "admin";
}

export interface SessionPayload {
  user: SessionUser;
  expires: string;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;

  try {
    const payload = await decrypt(token);
    if (!payload?.user) return null;
    return payload.user as SessionUser;
  } catch {
    return null;
  }
}
