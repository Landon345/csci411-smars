import { NextResponse } from "next/server";

// Returns the RSA public key so the client can encrypt the SSN before transmission.
export async function GET() {
  const raw = process.env.SSN_PUBLIC_KEY;
  if (!raw) {
    return NextResponse.json({ error: "Public key not configured" }, { status: 500 });
  }
  // Restore literal newlines from the \n-escaped .env value
  const publicKey = raw.replace(/\\n/g, "\n");
  return NextResponse.json({ publicKey });
}
