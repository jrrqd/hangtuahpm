import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";
import { verifySessionEdge } from "@/lib/auth-edge";

const PUBLIC_PREFIXES = [
  "/login",
  "/reset-password",
  "/api/auth/login",
  "/api/auth/reset",
  "/brand",
];

function redirectTo(req: NextRequest, pathname: string) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const isPublic = PUBLIC_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );

  if (
    path.startsWith("/_next") ||
    path.startsWith("/favicon") ||
    /\.\w+$/.test(path)
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionEdge(token) : null;

  if (!session && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (session && (path === "/login" || path === "/")) {
    if (session.mustResetPw) return redirectTo(req, "/reset-password");
    if (session.role === "ADMIN") return redirectTo(req, "/admin/users");
    if (session.role === "LEADERSHIP") return redirectTo(req, "/dashboard");
    return redirectTo(req, "/w");
  }

  if (session?.mustResetPw && path !== "/reset-password" && !isPublic) {
    return redirectTo(req, "/reset-password");
  }

  if (session && path.startsWith("/admin") && session.role !== "ADMIN") {
    return redirectTo(req, "/dashboard");
  }

  if (
    session &&
    path.startsWith("/dashboard") &&
    session.role !== "ADMIN" &&
    session.role !== "LEADERSHIP"
  ) {
    return redirectTo(req, "/w");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
