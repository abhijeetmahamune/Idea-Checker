import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh auth session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Handle Guest ID cookie generation
  let guestSessionId = request.cookies.get('guest_session_id')?.value;
  if (!guestSessionId) {
    guestSessionId = crypto.randomUUID();
    supabaseResponse.cookies.set('guest_session_id', guestSessionId, {
      path: '/',
      httpOnly: false, // Accessible on the client side
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
    });
  }

  const url = request.nextUrl.clone();
  
  // Dashboard routes protection
  const isDashboardRoute = url.pathname.startsWith('/dashboard') || 
                          url.pathname.startsWith('/problems');

  if (isDashboardRoute && !user) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from auth pages
  const isAuthRoute = url.pathname.startsWith('/login') || url.pathname.startsWith('/register');
  if (isAuthRoute && user) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
