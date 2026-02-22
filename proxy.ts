import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  // --- 1. AUTHENTICATION LOGIC --
  const token = request.cookies.get("auth_token")?.value;
  const path = request.nextUrl.pathname;

  const isProtectedRoute =
    path.startsWith("/dashboard") ||
    path.startsWith("/patient") ||
    path.startsWith("/doctor") ||
    path.startsWith("/admin");

  // If trying to access a protected route without a token, redirect to login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Verify token if it exists and route is protected
  if (token && isProtectedRoute) {
    try {
      const session = await decrypt(token);
      const role = session?.user?.Role;

      // Redirect unverified users to the verification page
      if (session?.user?.emailVerified === false) {
        return NextResponse.redirect(new URL("/verify-email", request.url));
      }

      // Role-based route protection by prefix
      if (path.startsWith("/patient") && role !== "patient") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      if (path.startsWith("/doctor") && role !== "doctor") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      if (path.startsWith("/admin") && role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch {
      // Token is invalid — clear the stale cookie and redirect to login
      const redirectResponse = NextResponse.redirect(
        new URL("/login", request.url),
      );
      redirectResponse.cookies.set("auth_token", "", {
        expires: new Date(0),
        path: "/",
      });
      return redirectResponse;
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
