import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Run on everything except static assets and PWA files.
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|robots.txt|icons|.*\\.(?:png|svg|ico|webmanifest)$).*)",
  ],
};
