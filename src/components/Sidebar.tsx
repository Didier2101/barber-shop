'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  UserCircle, 
  CalendarDays, 
  LogOut, 
  History as HistoryIcon, 
  TrendingUp, 
  Users, 
  Settings, 
  Scissors,
  Search
} from 'lucide-react';
import { useGlobalStore } from '@/store/useGlobalStore';
import { supabase } from '@/lib/supabase';
import Swal from 'sweetalert2';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const userProfile = useGlobalStore(state => state.userProfile);
  const clearStore = useGlobalStore(state => state.clearStore);

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

  const navLinks = userProfile?.role === 'barber' ? [
    { section: 'Principal', items: [
      { href: `/dashboard/barber/${userProfile.id}?tab=inicio`, label: 'Inicio de la cuenta', icon: LayoutDashboard },
      { href: `/dashboard/barber/${userProfile.id}?tab=agenda`, label: 'Actividad / Agenda', icon: CalendarDays },
    ]},
    { section: 'Observar', items: [
      { href: `/dashboard/barber/${userProfile.id}?tab=estadisticas`, label: 'Finanzas / Analytics', icon: TrendingUp },
      { href: `/dashboard/barber/${userProfile.id}?tab=clientes`, label: 'Mis Clientes', icon: Users },
    ]},
    { section: 'Configuración', items: [
      { href: `/profile/${userProfile?.id}`, label: 'Ajustes de Perfil', icon: Settings },
    ]}
  ] : [
    { section: 'Principal', items: [
      { href: '/dashboard', label: 'Inicio de la cuenta', icon: LayoutDashboard },
      ...(userProfile?.role === 'client' ? [
        { href: '/reservas', label: 'Mis Reservas', icon: HistoryIcon }
      ] : []),
    ]},
    { section: 'Configuración', items: [
      { href: userProfile ? `/profile/${userProfile.id}` : '#', label: 'Mi Perfil', icon: UserCircle },
    ]}
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white border-r border-gray-200 z-[110]">
      {/* Sidebar Header */}
      <div className="p-6 pb-2">
        <Link href="/dashboard" className="flex items-center gap-3 mb-6">
          <div className="bg-[#f59e0b] p-1.5 rounded shadow-sm">
            <Scissors size={18} className="text-black" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase text-gray-900">
            BARBER<span className="text-[#f59e0b]">SHOP</span>
          </span>
        </Link>

        {/* Quick Search placeholder (Cloudflare style) */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search size={14} className="text-gray-400" />
          </div>
          <input 
            type="text" 
            placeholder="Búsqueda rápida..." 
            className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/20 focus:border-[#f59e0b] transition-all"
            disabled
          />
          <div className="absolute inset-y-0 right-3 flex items-center text-[10px] text-gray-400 font-medium">
             Ctrl K
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-6 overflow-y-auto custom-scrollbar">
        {navLinks.map((section) => (
          <div key={section.section}>
            <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{section.section}</h3>
            <div className="space-y-1">
              {section.items.map((link) => {
                const isActive = pathname === link.href || (link.href.includes('tab') && pathname.includes(link.href.split('?')[0]) && pathname.includes(link.href.split('=')[1]));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <link.icon size={18} className={isActive ? 'text-[#f59e0b]' : 'text-gray-400'} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut size={18} className="text-gray-400" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
