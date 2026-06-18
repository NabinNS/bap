import { NextRequest, NextResponse } from "next/server";

const AUTH_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const hasSession = !!request.cookies.get("refresh_token")?.value;
  const { pathname } = request.nextUrl;

  // Logged-in users should not see login/register — send them to dashboard
  if (hasSession && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
