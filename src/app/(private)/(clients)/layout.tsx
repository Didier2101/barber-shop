'use client';
import { useGlobalStore } from '@/store/useGlobalStore';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

import {
  CalendarDays,
  UserCircle,
  Home,
  Scissors,
  LogOut,
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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    { id: 'inicio', icon: Home, label: 'Inicio', href: `/dashboard/client/${clientId}` },
    { id: 'reservas', icon: CalendarDays, label: 'Reservas', href: `/dashboard/client/${clientId}/reservas` },
  ];

  if (!userProfile) return null;

  return (
    <>
      {/* DESKTOP BLOCKER */}
      <div className="hidden lg:flex fixed inset-0 z-[999] bg-bg-base items-center justify-center p-10 text-center">
        <div className="space-y-4 max-w-md">
          <div className="w-20 h-20 bg-brand/10 text-brand rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Scissors size={40} />
          </div>
          <h2 className="text-3xl font-black text-zinc-900 uppercase tracking-tighter italic">App Móvil</h2>
          <p className="text-zinc-500 font-medium">Esta aplicación está diseñada exclusivamente para dispositivos móviles. Por favor, accede desde tu teléfono para la mejor experiencia.</p>
        </div>
      </div>

      {/* MOBILE APP LAYOUT */}
      <div className="lg:hidden flex flex-col h-[100dvh] bg-bg-base text-zinc-900 overflow-hidden">
        {/* FONDO SÓLIDO PREMIUM */}
        <div className="fixed inset-0 z-0 bg-bg-base" />

        {/* ─────────────────────────────────────────────────────────────
            MAIN CONTENT AREA
        ───────────────────────────────────────────────────────────── */}
        <main className="flex-1 p-4 pb-28 overflow-y-auto custom-scrollbar relative z-10 pt-6">
          {children}
        </main>

        {/* ─────────────────────────────────────────────────────────────
            MOBILE BOTTOM NAV
        ───────────────────────────────────────────────────────────── */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface/95 backdrop-blur-3xl border-t border-accent-green/20 flex items-center justify-around px-2 z-[60] pb-safe">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || (tab.id !== 'inicio' && pathname.startsWith(tab.href + '/'));
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-all relative ${isActive ? 'text-brand' : 'text-zinc-400'}`}
              >
                <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[9px] font-bold tracking-wide">{tab.label}</span>
                {isActive && <div className="absolute top-0 w-8 h-1 bg-brand rounded-full" />}
              </Link>
            );
          })}

          {/* PROFILE BUTTON W/ POPOVER */}
          <div ref={profileRef} className="relative flex flex-col items-center justify-center gap-1 w-16 h-full">
            <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="w-8 h-8 rounded-full border-2 border-accent-green/30 overflow-hidden bg-bg-base flex items-center justify-center text-zinc-400 transition-transform active:scale-95">
              {userProfile?.avatar_url ? <Image src={userProfile.avatar_url} alt="Profile" width={32} height={32} className="w-full h-full object-cover" /> : <UserCircle size={20} />}
            </button>
            <span className="text-[9px] font-bold tracking-wide text-zinc-400">Tú</span>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }} className="absolute bottom-16 right-0 w-48 bg-surface/95 backdrop-blur-xl border border-accent-green/20 rounded-2xl p-2 shadow-2xl z-[70] transform origin-bottom-right">
                  <Link href={`/dashboard/client/${clientId}/profile`} onClick={() => setShowProfileMenu(false)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-brand/10 transition-colors text-zinc-900 font-bold text-sm">
                    <UserCircle size={18} className="text-brand" /> Mi Perfil
                  </Link>
                  <button onClick={() => { setShowProfileMenu(false); handleLogout(); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-colors text-red-500 font-bold text-sm">
                    <LogOut size={18} /> Cerrar Sesión
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </div>
    </>
  );
}
