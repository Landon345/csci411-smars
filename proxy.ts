import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  // --- 1. AUTHENTICATION LOGIC --
  const token = request.cookies.get("auth_token")?.value;
  const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard");

  // If trying to access dashboard without a token, redirect to login
  if (isDashboardPage && !token) {
    console.log("running proxy, no token");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Verify token if it exists
  if (token) {
    console.log("running proxy, with token");
    try {
      await decrypt(token);
    } catch (e) {
      // If token is invalid and they are on a protected page, redirect
      if (isDashboardPage) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }
  }

  // --- 2. CSP & NONCE LOGIC ---
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("Content-Security-Policy", cspHeader);

  return response;
}
