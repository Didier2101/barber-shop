'use client';
import { useGlobalStore } from '@/store/useGlobalStore';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

import {
  Activity,
  CalendarDays,
  TrendingUp,
  Users,
  Scissors,
  UserCircle,
  Menu,
  LogOut,
  X,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Swal from 'sweetalert2';

export default function BarberLayout({ children }: { children: React.ReactNode }) {
  const userProfile = useGlobalStore(state => state.userProfile);
  const clearStore = useGlobalStore(state => state.clearStore);
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userProfile && userProfile.role !== 'barber' && userProfile.role !== 'owner') {
      router.replace('/dashboard/client');
    }
    if (userProfile && params.id && userProfile.id !== params.id && userProfile.role !== 'owner') {
      router.replace(`/dashboard/barber/${userProfile.id}`);
    }
  }, [userProfile, router, params.id]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const barberId = params.id ?? userProfile?.id ?? '';

  const tabs = [
    { id: 'inicio', icon: Activity, label: 'Inicio', href: `/dashboard/barber/${barberId}` },
    { id: 'agenda', icon: CalendarDays, label: 'Agenda', href: `/dashboard/barber/${barberId}/agenda` },
    { id: 'stats', icon: TrendingUp, label: 'Finanzas', href: `/dashboard/barber/${barberId}/stats` },
    { id: 'clients', icon: Users, label: 'Mis Clientes', href: `/dashboard/barber/${barberId}/clients` },
    { id: 'perfil', icon: UserCircle, label: 'Mi Perfil', href: `/dashboard/barber/${barberId}/profile` }
  ];

  if (!userProfile) return null;

  return (
    <div className="flex flex-col h-screen bg-bg-base text-white overflow-hidden">
      {/* FONDO SÓLIDO PREMIUM */}
      <div className="fixed inset-0 z-0 bg-bg-base" />

      {/* ─────────────────────────────────────────────────────────────
          HEADER UNIFICADO (DESKTOP)
      ───────────────────────────────────────────────────────────── */}
      <header className="hidden lg:flex items-center justify-between px-8 h-20 shrink-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-white/5 relative shadow-lg">
        
        {/* LOGO */}
        <Link href={`/dashboard/barber/${barberId}`} className="flex items-center gap-3 group">
          <div className="bg-brand p-2.5 rounded-xl shadow-md group-hover:scale-105 transition-transform shrink-0">
            <Scissors size={20} className="text-black" />
          </div>
          <span className="text-xl font-bold tracking-tight uppercase text-white">
            BARBER<span className="text-brand">SHOP</span>
          </span>
        </Link>

        {/* NAVEGACIÓN CENTRAL */}
        <nav className="flex items-center gap-1 xl:gap-2 absolute left-1/2 -translate-x-1/2">
          {tabs.map(tab => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${isActive
                  ? 'bg-brand/10 text-brand'
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <tab.icon size={16} className={`${isActive ? 'text-brand' : 'text-white/50'}`} />
                <span className="hidden xl:inline">{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* USER DROPDOWN */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className="flex items-center gap-3 px-3 py-2 bg-bg-base hover:bg-white/5 rounded-2xl border border-white/5 transition-all shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-brand flex items-center justify-center text-black font-bold text-lg">
               {userProfile.avatar_url ? (
                 <Image src={userProfile.avatar_url} alt="Avatar" width={40} height={40} className="w-full h-full object-cover" />
               ) : (
                 userProfile.name?.charAt(0).toUpperCase()
               )}
            </div>
            <div className="text-left hidden md:block">
               <p className="text-sm font-bold text-white leading-none capitalize truncate max-w-[120px]">{userProfile.name}</p>
               <p className="text-[10px] font-bold text-brand uppercase tracking-widest mt-1">Barbero</p>
            </div>
            <ChevronDown size={16} className={`text-white/40 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isUserDropdownOpen && (
             <div className="absolute top-full right-0 mt-3 w-64 bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
               <div className="p-4 border-b border-white/5 bg-bg-base/50">
                  <p className="text-sm font-bold text-white truncate capitalize">{userProfile.name}</p>
                  <p className="text-[10px] font-medium text-white/40 truncate mt-0.5">{userProfile.email || 'correo@registrado.com'}</p>
               </div>
               <div className="p-2 space-y-1">
                  <Link 
                     href={`/dashboard/barber/${barberId}/profile`}
                     onClick={() => setIsUserDropdownOpen(false)}
                     className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-bold text-white hover:bg-white/5 transition-all"
                  >
                     <UserCircle size={16} className="text-brand" />
                     Mi Perfil
                  </Link>
                  <button 
                     onClick={() => { setIsUserDropdownOpen(false); handleLogout(); }}
                     className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all"
                  >
                     <LogOut size={16} />
                     Cerrar Sesión
                  </button>
               </div>
             </div>
          )}
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          HEADER MÓVIL (TOP)
      ───────────────────────────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-20 bg-surface/90 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-6 z-[60]">
        <Link href={`/dashboard/barber/${barberId}`} className="flex items-center gap-3">
          <div className="bg-brand/10 border border-brand/20 p-2.5 rounded-xl">
            <Scissors size={18} className="text-brand" />
          </div>
          <span className="text-xl font-bold tracking-tight uppercase text-white">
            B<span className="text-brand">S</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/barber/${barberId}/profile`}
            className="w-10 h-10 rounded-xl border border-white/10 bg-bg-base flex items-center justify-center overflow-hidden shadow-inner"
          >
            {userProfile.avatar_url
              ? <Image src={userProfile.avatar_url} alt={userProfile.name} width={40} height={40} className="w-full h-full object-cover" />
              : <UserCircle size={24} className="text-white/20" />}
          </Link>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-white/40 hover:text-brand transition-all">
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT AREA
      ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 p-4 lg:p-10 pb-28 lg:pb-10 overflow-y-auto relative z-10 custom-scrollbar">
        <div className="lg:hidden mb-6 pt-20">
           <h1 className="text-[10px] font-bold uppercase tracking-widest text-white/40">
             {tabs.find(t => t.href === pathname)?.label || 'Panel de Barbero'}
           </h1>
        </div>
        {children}
      </main>

      {/* ─────────────────────────────────────────────────────────────
          MOBILE BOTTOM NAV
      ───────────────────────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-surface/95 backdrop-blur-3xl border-t border-white/5 flex items-center justify-around px-2 z-[60] pb-safe">
        {[
          { id: 'inicio', icon: Activity, label: 'Inicio', href: `/dashboard/barber/${barberId}` },
          { id: 'agenda', icon: CalendarDays, label: 'Agenda', href: `/dashboard/barber/${barberId}/agenda` },
          { id: 'stats', icon: TrendingUp, label: 'Finanzas', href: `/dashboard/barber/${barberId}/stats` },
          { id: 'clients', icon: Users, label: 'Clientes', href: `/dashboard/barber/${barberId}/clients` }
        ].map(tab => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-all relative ${isActive ? 'text-brand' : 'text-white/40'}`}
            >
              <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-bold tracking-wide">{tab.label}</span>
              {isActive && <div className="absolute top-0 w-8 h-1 bg-brand rounded-full" />}
            </Link>
          );
        })}

        <div className="relative">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-all ${isMobileMenuOpen ? 'text-brand' : 'text-white/40'}`}
          >
            <Menu size={20} />
            <span className="text-[9px] font-bold tracking-wide">Más</span>
          </button>

          {isMobileMenuOpen && (
            <div className="absolute bottom-24 right-4 w-64 bg-surface border border-white/10 rounded-2xl shadow-2xl p-4 space-y-1 animate-in fade-in slide-in-from-bottom-6 duration-300">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 px-3">Más Opciones</p>
              {[
                { id: 'perfil', icon: UserCircle, label: 'Mi Perfil', href: `/dashboard/barber/${barberId}/profile` }
              ].map(tab => {
                const isActive = pathname === tab.href;
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs font-bold transition-all ${isActive ? 'bg-brand/10 text-brand' : 'text-white hover:bg-white/5'}`}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </Link>
                );
              })}
              <div className="h-px bg-white/5 my-3" />
              <button onClick={handleLogout} className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all">
                <LogOut size={18} />
                Salir
              </button>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
