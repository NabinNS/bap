import { NextRequest, NextResponse } from "next/server";

// Middleware can't inspect the in-memory access token or the httpOnly refresh
// cookie — route protection is handled client-side by the AuthProvider.
// This file is kept as a placeholder for future edge-level auth (e.g. JWT verification).

export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
