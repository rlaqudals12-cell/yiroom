import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 인증 없이 접근 가능한 공개 라우트
const isPublicRoute = createRouteMatcher([
  "/",
  "/manifest.json",
  "/manifest.webmanifest",
  "/privacy",
  "/terms",
  "/robots.txt",
  "/sitemap.xml",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // 공개 라우트가 아닌 경우에만 인증 보호
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|manifest\\.json|manifest\\.webmanifest|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
