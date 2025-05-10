import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the user is authenticated
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
  });
  
  // Define public routes that don't require authentication
  const publicRoutes = ['/', '/auth/signin', '/auth/signup', '/auth/error'];
  
  // Check if the requested path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith('/api/auth/')
  );
  
  // Redirect logic
  if (!token && !isPublicRoute) {
    // Redirect to login if accessing protected route without auth
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  } else if (token && (pathname === '/auth/signin' || pathname === '/auth/signup')) {
    // Redirect to app if accessing auth pages while logged in
    return NextResponse.redirect(new URL('/app', request.url));
  }
  
  return NextResponse.next();
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. Static files (/_next/...)
     * 2. Public files (/favicon.ico, etc)
     * 3. API routes that don't need auth checks
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 