'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, Scissors, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardHref, setDashboardHref] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, is_active')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!profile || profile.is_active === false) {
        await supabase.auth.signOut();
        return;
      }

      document.cookie = "barbershop-auth=true; path=/; max-age=2592000; SameSite=Lax";

      if (profile.role === 'owner') setDashboardHref('/dashboard/owner');
      else if (profile.role === 'barber') setDashboardHref(`/dashboard/barber/${profile.id}`);
      else setDashboardHref(`/dashboard/client/${profile.id}`);
    };
    checkSession();
  }, []);

  const isLoggedIn = !!dashboardHref;

  const publicLinks = [
    { href: '/servicios', label: 'SERVICIOS' },
    { href: '/nosotros', label: 'NOSOTROS' },
    { href: '/contacto', label: 'CONTACTO' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] bg-black/80 backdrop-blur-md border-b border-white/10 transition-all">
      <div className="container mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-4 group">
          <div className="bg-[#f59e0b] p-2.5 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-transform group-hover:scale-105">
            <Scissors size={20} className="text-black" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-black tracking-tighter uppercase text-white">
              BARBER<span className="text-[#f59e0b]">SHOP</span>
            </span>
            <span className="text-[9px] font-black tracking-[0.3em] text-[#f59e0b] mt-0.5 opacity-70">EST. 2024</span>
          </div>
        </Link>

        {/* Navigation & Auth */}
        <nav className="flex items-center gap-3 sm:gap-6">
          <div className="hidden lg:flex items-center gap-5">
            {publicLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[10px] font-black uppercase tracking-[0.12em] px-2 py-2 text-white/70 hover:text-[#f59e0b] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {!isLoggedIn && (
              <Link href="/login" className="hidden sm:block text-[10px] font-black uppercase tracking-[0.1em] px-2 sm:px-3 py-2 text-white/60 hover:text-[#f59e0b] transition-colors">
                INICIAR SESIÓN
              </Link>
            )}
            <Link 
              href={isLoggedIn ? dashboardHref! : "/register"} 
              className="bg-[#f59e0b] hover:bg-white text-black px-4 sm:px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all shadow-lg"
            >
              {isLoggedIn ? "MI CUENTA" : "RESERVAR"}
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-white/20 text-white hover:border-[#f59e0b] hover:text-[#f59e0b] transition-all"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-black/95 backdrop-blur-md">
          <div className="container mx-auto px-4 sm:px-6 py-4 flex flex-col gap-2">
            {publicLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full px-3 py-3 rounded-lg border border-white/10 text-white/85 hover:text-[#f59e0b] hover:border-[#f59e0b]/40 transition-all text-[11px] font-black uppercase tracking-[0.14em]"
              >
                {link.label}
              </Link>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-2">
              {!isLoggedIn && (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-3 py-3 rounded-lg border border-white/10 text-white/70 hover:text-white transition-all text-[11px] font-black uppercase tracking-[0.14em]"
                >
                  INICIAR SESIÓN
                </Link>
              )}
              <Link
                href={isLoggedIn ? dashboardHref! : "/register"}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-center px-3 py-3 rounded-lg bg-[#f59e0b] hover:bg-white text-black transition-all text-[11px] font-black uppercase tracking-[0.14em] ${!isLoggedIn ? '' : 'col-span-2'}`}
              >
                {isLoggedIn ? "MI CUENTA" : "RESERVAR"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
