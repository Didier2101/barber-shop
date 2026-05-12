'use client';
import { useGlobalStore } from '@/store/useGlobalStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { OwnerHeader } from '@/components/headers/OwnerHeader';

import {
  Activity,
  Check,
  Clock,
  Sparkles,
  Users,
  User,
  Scissors,
  DollarSign,
  UserCircle,
  Menu,
  LogOut,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Swal from 'sweetalert2';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const userProfile = useGlobalStore(state => state.userProfile);
  const clearStore = useGlobalStore(state => state.clearStore);
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (userProfile && userProfile.role !== 'owner') {
      if (userProfile.role === 'barber') router.replace(`/dashboard/barber/${userProfile.id}`);
      else router.replace(`/dashboard/client/${userProfile.id}`);
    }
  }, [userProfile, router]);

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
      background: '#0a0a0a',
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
    { id: 'inicio', icon: Activity, label: 'Inicio', href: '/dashboard/owner' },
    { id: 'liquidaciones', icon: Check, label: 'Liquidaciones', href: '/dashboard/owner/liquidations' },
    { id: 'config', icon: Clock, label: 'Horarios', href: '/dashboard/owner/schedules' },
    { id: 'promociones', icon: Sparkles, label: 'Promociones', href: '/dashboard/owner/promotions' },
    { id: 'barberos', icon: Users, label: 'Equipo', href: '/dashboard/owner/team' },
    { id: 'clientes', icon: User, label: 'Clientes', href: '/dashboard/owner/clients' },
    { id: 'servicios', icon: Scissors, label: 'Servicios', href: '/dashboard/owner/services' },
    { id: 'gastos', icon: DollarSign, label: 'Gastos', href: '/dashboard/owner/expenses' },
    { id: 'perfil', icon: UserCircle, label: 'Perfil', href: '/dashboard/owner/profile' }
  ];

  if (!userProfile || userProfile.role !== 'owner') return null;

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden">
      {/* FONDO SÓLIDO PREMIUM */}
      <div className="fixed inset-0 z-0 bg-[#050505]" />

      {/* DESKTOP SIDEBAR */}
      <aside
        className={`hidden lg:flex flex-col h-full border-r border-white/5 bg-black/40 backdrop-blur-xl z-50 transition-all duration-300 relative ${isCollapsed ? 'w-20' : 'w-72'}`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-24 w-6 h-6 bg-[#f59e0b] rounded-full flex items-center justify-center text-black shadow-lg z-50 transition-transform active:scale-90"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <div className="rotate-180"><ChevronRight size={14} /></div>}
        </button>
        <div className={`p-8 pb-4 overflow-hidden ${isCollapsed ? 'items-center flex flex-col' : ''}`}>
          <Link href="/dashboard/owner" className="flex items-center gap-3 mb-10 group">
            <div className="bg-[#f59e0b] p-2 rounded-xl shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform shrink-0">
              <Scissors size={18} className="text-black" />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-black tracking-tighter uppercase text-white">
                BARBER<span className="text-[#f59e0b]">SHOP</span>
              </span>
            )}
          </Link>
          {!isCollapsed && <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-6 px-1">Admin Dashboard</p>}
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar scroll-smooth">
          {tabs.map(tab => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                title={isCollapsed ? tab.label : ''}
                className={`flex items-center px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all group ${isActive
                  ? 'bg-[#f59e0b] text-black shadow-lg shadow-amber-500/10'
                  : 'text-white/40 hover:bg-white/5 hover:text-white'
                  } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
              >
                <div className="flex items-center gap-4">
                  <tab.icon size={18} className={`shrink-0 ${isActive ? 'text-black' : 'text-white/30 group-hover:text-white'}`} />
                  {!isCollapsed && <span className="whitespace-nowrap">{tab.label}</span>}
                </div>
                {!isCollapsed && isActive && <ChevronRight size={14} />}
              </Link>
            );
          })}
        </nav>

        <div className={`p-6 border-t border-white/5 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          <button
            onClick={handleLogout}
            title={isCollapsed ? 'Cerrar Sesión' : ''}
            className={`flex items-center gap-4 px-4 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white/30 hover:bg-red-500/10 hover:text-red-500 transition-all ${isCollapsed ? 'w-12 h-12 justify-center p-0' : 'w-full'}`}
          >
            <LogOut size={18} className="shrink-0" />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      <OwnerHeader
        userProfile={userProfile}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <header className="hidden lg:flex h-20 bg-transparent items-center justify-between px-10 shrink-0 z-40">
          <div>
            <h1 className="text-xs font-black uppercase tracking-[0.3em] text-white/40">
              {tabs.find(t => t.href === pathname)?.label || 'Panel de Control'}
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
              <div className="w-8 h-8 rounded-xl bg-[#f59e0b] flex items-center justify-center text-black font-black text-[10px]">
                {userProfile.name?.charAt(0)}
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-white">{userProfile.name}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-10 pt-20 lg:pt-10 overflow-y-auto relative z-10">
          {children}
        </main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-2xl border-t border-white/5 flex items-center justify-around px-2 z-[60] pb-safe">
        {[
          { id: 'inicio', icon: Activity, label: 'Inicio', href: '/dashboard/owner' },
          { id: 'liquidaciones', icon: Check, label: 'Cierres', href: '/dashboard/owner/liquidations' },
          { id: 'barberos', icon: Users, label: 'Equipo', href: '/dashboard/owner/team' },
          { id: 'clientes', icon: User, label: 'Clientes', href: '/dashboard/owner/clients' }
        ].map(tab => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-all relative ${isActive ? 'text-[#f59e0b]' : 'text-white/40'}`}
            >
              <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
              {isActive && <div className="absolute top-0 w-8 h-1 bg-[#f59e0b] rounded-full" />}
            </Link>
          );
        })}

        <div className="relative">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-all ${isMobileMenuOpen ? 'text-[#f59e0b]' : 'text-white/40'}`}
          >
            <Menu size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest">Más</span>
          </button>

          {isMobileMenuOpen && (
            <div className="absolute bottom-24 right-0 w-64 bg-black/95 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl p-6 space-y-1 animate-in slide-in-from-bottom-10 duration-300">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-4 px-2">Gestión Avanzada</p>
              {[
                { id: 'config', icon: Clock, label: 'Horarios', href: '/dashboard/owner/schedules' },
                { id: 'promociones', icon: Sparkles, label: 'Promociones', href: '/dashboard/owner/promotions' },
                { id: 'servicios', icon: Scissors, label: 'Servicios', href: '/dashboard/owner/services' },
                { id: 'gastos', icon: DollarSign, label: 'Gastos', href: '/dashboard/owner/expenses' },
                { id: 'perfil', icon: UserCircle, label: 'Mi Perfil', href: '/dashboard/owner/profile' }
              ].map(tab => {
                const isActive = pathname === tab.href;
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-4 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-[#f59e0b] text-black' : 'text-white/40 active:bg-white/5'}`}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </Link>
                );
              })}
              <div className="h-px bg-white/5 my-4" />
              <button onClick={handleLogout} className="flex items-center gap-4 w-full px-4 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-red-500 active:bg-red-500/10 transition-all">
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
