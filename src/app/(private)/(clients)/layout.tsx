'use client';
import { useGlobalStore } from '@/store/useGlobalStore';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  CalendarDays,
  UserCircle,
  LogOut,
  ChevronRight,
  Scissors,
  Home
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const clientId = params.id || userProfile?.id;

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
      background: '#fff',
      color: '#000'
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
    { id: 'reservas', icon: CalendarDays, label: 'Mis Reservas', href: `/dashboard/client/${clientId}/reservas` },
    { id: 'perfil',   icon: UserCircle,   label: 'Mi Perfil',   href: `/dashboard/client/${clientId}/profile` },
  ];

  const activeTab = tabs.find(t => pathname === t.href || pathname.startsWith(t.href + '/'));

  if (!userProfile) return null;

  return (
    <div className="flex h-[100dvh] bg-[#050505] text-white overflow-hidden">

      {/* ── FONDO ──────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src={userProfile.avatar_url || '/nathon-oski-EW_rqoSdDes-unsplash.jpg'}
          alt={`Fondo de perfil de ${userProfile.name}`}
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-[#050505]/50" />
      </div>

      {/* ── SIDEBAR DESKTOP ────────────────────────────── */}
      <aside className={`hidden lg:flex flex-col h-full border-r border-white/5 bg-black/40 backdrop-blur-xl z-50 transition-all duration-300 relative shrink-0 ${isCollapsed ? 'w-[72px]' : 'w-72'}`}>
        
        {/* Toggle */}
        <button
          onClick={() => setIsCollapsed(v => !v)}
          className="absolute -right-3 top-24 w-6 h-6 bg-[#f59e0b] rounded-full flex items-center justify-center text-black shadow-lg z-50 transition-transform active:scale-90"
        >
          {isCollapsed ? <ChevronRight size={13} /> : <div className="rotate-180"><ChevronRight size={13} /></div>}
        </button>

        {/* Logo */}
        <div className={`p-6 pb-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <Link href={`/dashboard/client/${clientId}`} className="flex items-center gap-3 group">
            <div className="bg-[#f59e0b] p-2 rounded-xl shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform shrink-0">
              <Scissors size={17} className="text-black" />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-black tracking-tighter uppercase text-white">
                BARBER<span className="text-[#f59e0b]">SHOP</span>
              </span>
            )}
          </Link>
        </div>

        {!isCollapsed && (
          <p className="text-[9px] font-bold text-white/25 uppercase tracking-[0.25em] mb-4 px-7">
            Menú del Cliente
          </p>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {tabs.map(tab => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
            return (
              <Link
                key={tab.id}
                href={tab.href}
                title={isCollapsed ? tab.label : ''}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all group
                  ${isActive ? 'bg-[#f59e0b] text-black' : 'text-white/40 hover:bg-white/5 hover:text-white'}
                  ${isCollapsed ? 'justify-center' : ''}`}
              >
                <tab.icon size={18} strokeWidth={isActive ? 2.5 : 2} className={`shrink-0 ${isActive ? 'text-black' : 'text-white/30 group-hover:text-white'}`} />
                {!isCollapsed && <span className="whitespace-nowrap">{tab.label}</span>}
                {!isCollapsed && isActive && <ChevronRight size={13} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className={`p-4 border-t border-white/5 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={handleLogout}
            title={isCollapsed ? 'Cerrar Sesión' : ''}
            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white/30 hover:bg-red-500/10 hover:text-red-400 transition-all w-full ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={18} className="shrink-0" />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* ── COLUMNA PRINCIPAL ──────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-10">

        {/* ── TOP BAR MOBILE ─────────────────────────── */}
        <header className="lg:hidden flex items-center justify-between px-5 h-16 bg-black/60 backdrop-blur-md border-b border-white/5 shrink-0 z-40">
          {/* Logo */}
          <Link href={`/dashboard/client/${clientId}`} className="flex items-center gap-2.5">
            <div className="bg-[#f59e0b] p-1.5 rounded-lg">
              <Scissors size={14} className="text-black" />
            </div>
            <span className="text-base font-black tracking-tighter uppercase text-white">
              B<span className="text-[#f59e0b]">S</span>
            </span>
          </Link>

          {/* Page title */}
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40 absolute left-1/2 -translate-x-1/2">
            {activeTab?.label || 'Mi Espacio'}
          </span>

          {/* Avatar */}
          <Link href={`/dashboard/client/${clientId}/profile`} className="w-9 h-9 rounded-full border-2 border-[#f59e0b]/40 overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
            {userProfile.avatar_url
              ? <img src={userProfile.avatar_url} alt={`Avatar de ${userProfile.name}`} className="w-full h-full object-cover" />
              : <span className="text-xs font-black text-[#f59e0b]">{userProfile.name?.charAt(0)}</span>}
          </Link>
        </header>

        {/* ── TOP BAR DESKTOP ────────────────────────── */}
        <header className="hidden lg:flex h-16 bg-transparent items-center justify-between px-10 shrink-0 z-40">
          <h1 className="text-xs font-black uppercase tracking-[0.3em] text-white/30">
            {activeTab?.label || 'Mi Espacio'}
          </h1>
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
            <div className="w-7 h-7 rounded-lg bg-[#f59e0b] flex items-center justify-center text-black font-black text-[10px]">
              {userProfile.name?.charAt(0)}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white">
              {userProfile.nickname || userProfile.name?.split(' ')[0]}
            </span>
          </div>
        </header>

        {/* ── CONTENIDO ──────────────────────────────── */}
        <main className="flex-1 overflow-y-auto scroll-smooth px-4 lg:px-10 py-6 pb-28 lg:pb-10">
          {children}
        </main>
      </div>

      {/* ── BOTTOM NAV MOBILE ──────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-black/95 backdrop-blur-2xl border-t border-white/5">
        <div className="flex items-stretch h-[68px] pb-safe">
          {tabs.map(tab => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors ${isActive ? 'text-[#f59e0b]' : 'text-white/30'}`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-[#f59e0b] rounded-full" />
                )}
                <tab.icon size={21} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* Logout en bottom nav */}
          <button
            onClick={handleLogout}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-white/20 hover:text-red-400 transition-colors"
          >
            <LogOut size={21} strokeWidth={1.8} />
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">Salir</span>
          </button>
        </div>
      </nav>

    </div>
  );
}
