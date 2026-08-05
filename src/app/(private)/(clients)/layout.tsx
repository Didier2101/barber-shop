'use client';
import { useGlobalStore } from '@/store/useGlobalStore';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';

import {
  CalendarDays,
  UserCircle,
  Home,
  Scissors,
  LogOut,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Swal from 'sweetalert2';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const userProfile = useGlobalStore(state => state.userProfile);
  const clearStore = useGlobalStore(state => state.clearStore);
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const clientId = params.id || userProfile?.id || '';

  useEffect(() => {
    if (userProfile && userProfile.role !== 'client' && userProfile.role !== 'owner') {
      if (userProfile.role === 'barber') router.replace(`/dashboard/barber/${userProfile.id}`);
      else router.replace('/dashboard/owner');
    }
    if (userProfile && params.id && userProfile.id !== params.id && userProfile.role !== 'owner') {
      router.replace(`/dashboard/client/${userProfile.id}`);
    }
  }, [userProfile, router, params.id]);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Estás seguro de que deseas salir?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#333',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      background: '#111111',
      color: '#fff'
    });
    if (result.isConfirmed) {
      clearStore();
      document.cookie = "barbershop-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      await supabase.auth.signOut();
      router.replace('/');
    }
  };

  const tabs = [
    { id: 'inicio',   icon: Home,        label: 'Inicio',      href: `/dashboard/client/${clientId}` },
    { id: 'reservas', icon: CalendarDays, label: 'Reservas', href: `/dashboard/client/${clientId}/reservas` },
    { id: 'barberos', icon: Users,        label: 'Barberos',    href: `/dashboard/client/${clientId}/barberos` },
    { id: 'perfil',   icon: UserCircle,  label: 'Perfil',      href: `/dashboard/client/${clientId}/profile` },
  ];

  if (!userProfile) return null;

  return (
    <>
      {/* DESKTOP BLOCKER */}
      <div className="hidden lg:flex fixed inset-0 z-[999] bg-bg-base items-center justify-center p-10 text-center">
        <div className="space-y-4 max-w-md">
           <div className="w-20 h-20 bg-[#f59e0b]/10 text-[#f59e0b] rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Scissors size={40} />
           </div>
           <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">App Móvil</h2>
           <p className="text-white/40 font-medium">Esta aplicación está diseñada exclusivamente para dispositivos móviles. Por favor, accede desde tu teléfono para la mejor experiencia.</p>
        </div>
      </div>

      {/* MOBILE APP LAYOUT */}
      <div className="lg:hidden flex flex-col h-[100dvh] bg-bg-base text-white overflow-hidden">
        {/* FONDO SÓLIDO PREMIUM */}
        <div className="fixed inset-0 z-0 bg-bg-base" />

        {/* ─────────────────────────────────────────────────────────────
            MAIN CONTENT AREA
        ───────────────────────────────────────────────────────────── */}
        <main className="flex-1 p-4 pb-28 overflow-y-auto custom-scrollbar relative z-10 pt-6">
          <div className="mb-6">
             <h1 className="text-[10px] font-bold uppercase tracking-widest text-white/40">
               {tabs.find(t => pathname === t.href || pathname.startsWith(t.href + '/'))?.label || 'Mi Espacio'}
             </h1>
          </div>
          {children}
        </main>

        {/* ─────────────────────────────────────────────────────────────
            MOBILE BOTTOM NAV
        ───────────────────────────────────────────────────────────── */}
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-surface/95 backdrop-blur-3xl border-t border-white/5 flex items-center justify-around px-2 z-[60] pb-safe">
          {tabs.map(tab => {
            const isActive = pathname === tab.href || (tab.id !== 'inicio' && pathname.startsWith(tab.href + '/'));
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-all relative ${isActive ? 'text-[#f59e0b]' : 'text-white/40'}`}
              >
                <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[9px] font-bold tracking-wide">{tab.label}</span>
                {isActive && <div className="absolute top-0 w-8 h-1 bg-[#f59e0b] rounded-full" />}
              </Link>
            );
          })}
          
          {/* BOTÓN SALIR */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center gap-1 w-16 h-full transition-all relative text-white/40 hover:text-red-500"
          >
            <LogOut size={20} strokeWidth={2} />
            <span className="text-[9px] font-bold tracking-wide">Salir</span>
          </button>
        </nav>
      </div>
    </>
  );
}
