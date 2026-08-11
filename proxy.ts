import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/((?!_next/|icons/|sw\\.js|manifest\\.webmanifest).*)"],
};

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const shellRevision = request.nextUrl.searchParams.get("shell") ?? "shell-v1";
  requestHeaders.set("x-shell-revision", shellRevision);
  return NextResponse.next({ request: { headers: requestHeaders } });
}
