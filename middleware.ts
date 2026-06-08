import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";

  // pages.dev と www を tadatada.net に 301 リダイレクト
  if (host.includes("pages.dev") || host === "www.tadatada.net") {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = "tadatada.net";
    url.port = "";
    return NextResponse.redirect(url, { status: 301 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico|icons|assets|uploads).*)",
};
