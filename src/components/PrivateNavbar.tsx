'use client';
import Link from 'next/link';
import { Menu, X, LayoutDashboard, UserCircle, CalendarDays, LogOut, History as HistoryIcon, TrendingUp, Users, Settings, Scissors, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useGlobalStore } from '@/store/useGlobalStore';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Swal from 'sweetalert2';

export function PrivateNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userProfile = useGlobalStore(state => state.userProfile);
  const clearStore = useGlobalStore(state => state.clearStore);
  const router = useRouter();
  const pathname = usePathname();

  const isProfilePage = pathname.includes('/profile/');

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Estás seguro de que deseas salir?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0061ff',
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      background: '#fff',
      color: '#111'
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
  ] : userProfile?.role === 'owner' ? [] : [
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
    <header className="fixed top-0 left-0 right-0 z-[100] bg-white border-b border-gray-200 transition-all">
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo & Back Section */}
        <div className="flex items-center gap-4">
          {isProfilePage && (
            <button 
              onClick={() => router.back()} 
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 rounded-lg transition-all text-gray-900 group border border-transparent hover:border-gray-100"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Volver</span>
            </button>
          )}
          
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="bg-[#0061ff] p-1.5 rounded">
              <Scissors size={14} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900 hidden sm:block">
              Barber<span className="text-[#0061ff]">Shop</span>
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[11px] font-medium px-4 py-2 text-gray-500 hover:text-[#0061ff] hover:bg-gray-50 rounded transition-all flex items-center gap-2"
              >
                <link.icon size={14} />
                {link.label}
              </Link>
            ))}
          </div>

          <div className="h-6 w-px bg-gray-200 hidden md:block mx-2" />

          {/* User Profile info */}
          {userProfile && (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end hidden xs:flex">
                <span className="text-[11px] font-semibold text-gray-900 leading-none">{userProfile.nickname || userProfile.name.split(' ')[0]}</span>
                <span className="text-[9px] text-gray-400 uppercase tracking-tighter">{userProfile.role}</span>
              </div>
              <div className="w-8 h-8 rounded-full border border-gray-200 bg-gray-50 flex-shrink-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-gray-600">
                  {getInitials(userProfile.name)}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-gray-900 rounded transition-all"
            title="Cerrar Sesión"
          >
            <LogOut size={18} />
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
                <link.icon size={16} className="text-[#0061ff]" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
