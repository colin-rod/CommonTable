import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js Middleware for Authentication
 *
 * Protects routes based on authentication status:
 * - Protected routes: /dashboard, /recipes, /calendar (requires auth)
 * - Auth routes: /auth/* (redirects to /dashboard if authenticated)
 * - Public routes: / (landing page, accessible to all)
 *
 * Uses Supabase SSR for edge-compatible auth checks
 */
export async function middleware(request: NextRequest) {
  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // If environment variables are missing, allow request to proceed
    // The application will handle this error at runtime
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client for edge runtime
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: '',
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value: '',
          ...options,
        });
      },
    },
  });

  // Check session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAuthenticated = !!session;
  const { pathname } = request.nextUrl;

  // Protected routes (require authentication)
  const protectedRoutes = ['/dashboard', '/recipes', '/calendar'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // Auth routes (should redirect if authenticated)
  const authRoutes = ['/auth/login', '/auth/signup'];
  const isAuthRoute = authRoutes.includes(pathname);

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !isAuthenticated) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute && isAuthenticated) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    redirectUrl.searchParams.delete('redirectTo');
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

/**
 * Middleware matcher configuration
 * Excludes static files and Next.js internals
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
