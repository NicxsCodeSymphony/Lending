import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = process.env.JWT_SECRET;
const protectedRoutes = ['/dashboard', "/customers", "/lending", "/history", "/audit-trail", "/settings", "/sync-data"];
const publicRoutes = ['/', '/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  const isPublicRoute = publicRoutes.some(route =>
    pathname === route
  );

  if (isPublicRoute && token && SECRET) {
    try {
      const secret = new TextEncoder().encode(SECRET);
      await jwtVerify(token, secret);
      console.log("✅ User authenticated, redirecting to dashboard");
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (err) {
      console.error("❌ Invalid token on public route:", err);
      return NextResponse.next();
    }
  }

  if (isProtectedRoute) {
    if (!token || !SECRET) {
      console.log("❌ No token found, redirecting to home");
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      const secret = new TextEncoder().encode(SECRET);
      const { payload } = await jwtVerify(token, secret);
      console.log("✅ Verified payload:", payload);
      return NextResponse.next();
    } catch (err) {
      console.error("❌ Invalid token:", err);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};