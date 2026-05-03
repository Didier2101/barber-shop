import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';

export function middleware(req: NextRequest) {
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/');
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0]?.trim() || 'unknown' : 'unknown';

  if (isApiRoute) {
    const rate = checkRateLimit(`api:${ip}`, 120, 60_000);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
  }

  // Comprobamos la existencia de nuestra cookie de sesión personalizada
  const token = req.cookies.get('barbershop-auth')?.value;
  
  const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname.startsWith('/barber/');
  const isAuthRoute = req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register';

  // Si intenta entrar a dashboard o reservas sin estar logueado, al login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Si ya está logueado e intenta entrar a login o registro, al dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

// Configurar en qué rutas se ejecutará el middleware
export const config = {
  matcher: ['/dashboard/:path*', '/barber/:path*', '/login', '/register', '/api/:path*'],
};
