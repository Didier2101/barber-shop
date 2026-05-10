'use client';
import { useGlobalStore } from '@/store/useGlobalStore';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarberHeader } from '@/components/headers/BarberHeader';
import { 
  Activity, 
  CalendarDays, 
  TrendingUp, 
  Users, 
  Scissors,
  LogOut,
  ChevronRight,
  UserCircle
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Swal from 'sweetalert2';

export default function BarberLayout({ children }: { children: React.ReactNode }) {
  const userProfile = useGlobalStore(state => state.userProfile);
  const clearStore = useGlobalStore(state => state.clearStore);
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (userProfile && userProfile.role !== 'barber' && userProfile.role !== 'owner') {
      router.replace('/dashboard/client');
    }
    // Si el ID en la URL no es el del usuario, redirigir a su propio dashboard
    if (userProfile && params.id && userProfile.id !== params.id && userProfile.role !== 'owner') {
        router.replace(`/dashboard/barber/${userProfile.id}`);
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
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden">
      {/* Background Photo - Hero Style */}
      <div className="fixed inset-0 z-0">
        {userProfile?.avatar_url ? (
          <img src={userProfile.avatar_url} alt={`Fondo de perfil de ${userProfile.name}`} className="w-full h-full object-cover opacity-10" />
        ) : (
          <img src="/nathon-oski-EW_rqoSdDes-unsplash.jpg" alt="Fondo decorativo de la barbería" className="w-full h-full object-cover opacity-5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-[#050505]/60" />
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside 
        className={`hidden lg:flex flex-col h-full border-r border-white/5 bg-black/40 backdrop-blur-xl z-50 transition-all duration-300 relative ${isCollapsed ? 'w-20' : 'w-72'}`}
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-24 w-6 h-6 bg-[#f59e0b] border border-amber-500/20 rounded-full flex items-center justify-center text-black shadow-lg shadow-amber-500/20 z-50 transition-transform active:scale-90"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <div className="rotate-180"><ChevronRight size={14} /></div>}
        </button>
        <div className={`p-8 pb-4 overflow-hidden ${isCollapsed ? 'items-center flex flex-col' : ''}`}>
          <Link href={`/dashboard/barber/${barberId}`} className="flex items-center gap-3 mb-10 group">
            <div className="bg-[#f59e0b] p-2 rounded-xl shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform shrink-0">
              <Scissors size={18} className="text-black" />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-black tracking-tighter uppercase text-white animate-in fade-in slide-in-from-left-2">
                BARBER<span className="text-[#f59e0b]">SHOP</span>
              </span>
            )}
          </Link>
          {!isCollapsed && <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-6 px-1 animate-in fade-in slide-in-from-left-2">Barber Dashboard</p>}
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar scroll-smooth">
          {tabs.map(tab => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                title={isCollapsed ? tab.label : ''}
                className={`flex items-center px-4 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all group ${isActive
                  ? 'bg-[#f59e0b] text-black shadow-lg shadow-amber-500/10'
                  : 'text-white/40 hover:bg-white/5 hover:text-white'
                } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
              >
                <div className="flex items-center gap-4">
                  <tab.icon size={18} strokeWidth={isActive ? 2.5 : 2} className={`shrink-0 ${isActive ? 'text-black' : 'text-white/30 group-hover:text-white'}`} />
                  {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 whitespace-nowrap">{tab.label}</span>}
                </div>
                {!isCollapsed && isActive && <ChevronRight size={14} className="animate-in fade-in slide-in-from-left-1" />}
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

      <BarberHeader
        userProfile={userProfile}
        barberId={barberId}
        onLogout={handleLogout}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-10">
        <header className="hidden lg:flex h-20 bg-transparent items-center justify-between px-10 shrink-0 z-40">
          <div>
            <h1 className="text-xs font-black uppercase tracking-[0.3em] text-white/40">
              {tabs.find(t => t.href === pathname)?.label || 'Panel de Barbero'}
            </h1>
          </div>
          <div className="flex items-center gap-6">
               <Link
          href={`/dashboard/barber/${barberId}/profile`}
          className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden"
        >
          {userProfile.avatar_url
            ? <img src={userProfile.avatar_url} alt={`Avatar de ${userProfile.name}`} className="w-full h-full object-cover" />
            : <UserCircle size={24} className="text-white/40" />}
        </Link>
      </div>
    </header>

        <main className="flex-1 p-4 lg:p-10 pt-20 lg:pt-10 overflow-y-auto scroll-smooth">
          {children}
        </main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-2xl border-t border-white/5 flex items-center justify-around px-2 z-[60] pb-safe">
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
                className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-all relative ${isActive ? 'text-[#f59e0b]' : 'text-white/40'}`}
              >
                <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
                {isActive && <div className="absolute top-0 w-8 h-1 bg-[#f59e0b] rounded-full" />}
              </Link>
            );
          })}
      </nav>
    </div>
  );
}
