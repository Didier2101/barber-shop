'use client';
import Link from 'next/link';
import { Menu, X, LayoutDashboard, UserCircle, CalendarDays, LogOut, History as HistoryIcon, TrendingUp, Users, Settings, Scissors } from 'lucide-react';
import { useState } from 'react';
import { useGlobalStore } from '@/store/useGlobalStore';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export function PrivateNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userProfile = useGlobalStore(state => state.userProfile);
  const clearStore = useGlobalStore(state => state.clearStore);
  const router = useRouter();

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
      background: '#111',
      color: '#fff'
    });

    if (result.isConfirmed) {
      clearStore();
      document.cookie = "barbershop-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      await supabase.auth.signOut();
      setMobileMenuOpen(false);
      router.replace('/');
    }
  };

  const navLinks = userProfile?.role === 'barber' ? [
    { href: `/dashboard/barber/${userProfile.id}?tab=inicio`, label: 'Inicio', icon: LayoutDashboard },
    { href: `/dashboard/barber/${userProfile.id}?tab=agenda`, label: 'Agenda', icon: CalendarDays },
    { href: `/dashboard/barber/${userProfile.id}?tab=estadisticas`, label: 'Finanzas', icon: TrendingUp },
    { href: `/dashboard/barber/${userProfile.id}?tab=clientes`, label: 'Clientes', icon: Users },
    { href: `/profile/${userProfile?.id}`, label: 'Ajustes', icon: Settings },
  ] : [
    { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
    { href: userProfile ? `/profile/${userProfile.id}` : '#', label: 'Mi Perfil', icon: UserCircle },
    ...(userProfile?.role === 'client' ? [
      { href: '/reservas', label: 'Mis Reservas', icon: HistoryIcon }
    ] : []),
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] bg-black/40 backdrop-blur-md border-b border-white/5 transition-all">
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo Section */}
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="bg-[#f59e0b] p-1.5 rounded shadow-lg">
            <Scissors size={16} className="text-black" />
          </div>
          <span className="text-lg font-black tracking-tighter uppercase text-white hidden sm:block">
            BARBER<span className="text-[#f59e0b]">SHOP</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-all flex items-center gap-2"
              >
                <link.icon size={14} />
                {link.label}
              </Link>
            ))}
          </div>

          <div className="h-8 w-px bg-white/10 hidden md:block mx-2" />

          {/* User Profile info - AHORA CON INICIALES */}
          {userProfile && (
            <div className="flex items-center gap-3 pl-3 pr-1 py-1 bg-white/5 border border-white/10 rounded-full">
              <div className="flex flex-col items-end hidden xs:flex">
                <span className="text-[10px] font-black text-white uppercase tracking-wider leading-none">{userProfile.nickname || userProfile.name.split(' ')[0]}</span>
                <span className="text-[8px] font-medium text-[#f59e0b] uppercase tracking-tighter opacity-70">{userProfile.role}</span>
              </div>
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#f59e0b]/30 bg-black flex-shrink-0 flex items-center justify-center">
                <span className="text-[10px] font-black text-white tracking-tighter">
                  {getInitials(userProfile.name)}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="p-2 text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
            title="Cerrar Sesión"
          >
            <LogOut size={20} />
          </button>

          {userProfile?.role === 'owner' && (
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="md:hidden p-2 text-white/70 hover:text-white"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </nav>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-black">
          <div className="px-4 py-4 flex flex-col gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest"
              >
                <link.icon size={16} className="text-[#f59e0b]" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
