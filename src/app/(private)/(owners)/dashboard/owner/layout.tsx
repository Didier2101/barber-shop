'use client';
import { useGlobalStore } from '@/store/useGlobalStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState, } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  X,
  ChevronDown,
  Settings,
  Wallet,
  BarChart3,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Swal from 'sweetalert2';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const userProfile = useGlobalStore(state => state.userProfile);
  const clearStore = useGlobalStore(state => state.clearStore);
  const router = useRouter();
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  

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
      confirmButtonColor: 'var(--color-accent-pink)',
      cancelButtonColor: '#333',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      background: '#FFF7EB',
      color: '#18181b'
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
    { id: 'calendar', icon: Calendar, label: 'Calendario', href: '/dashboard/owner/calendar' },
    {
      id: 'gestion', icon: Users, label: 'Gestión',
      subItems: [
        { id: 'barberos', icon: Users, label: 'Equipo', href: '/dashboard/owner/team' },
        { id: 'clientes', icon: User, label: 'Clientes', href: '/dashboard/owner/clients' },
        { id: 'servicios', icon: Scissors, label: 'Servicios', href: '/dashboard/owner/services' },
        { id: 'promociones', icon: Sparkles, label: 'Promociones', href: '/dashboard/owner/promotions' },
      ]
    },
    {
      id: 'finanzas', icon: Wallet, label: 'Finanzas',
      subItems: [
        { id: 'gastos', icon: DollarSign, label: 'Gastos', href: '/dashboard/owner/expenses' },
        { id: 'finanzas', icon: Wallet, label: 'Finanzas', href: '/dashboard/owner/finances' },
        { id: 'reportes', icon: BarChart3, label: 'Reportes', href: '/dashboard/owner/reports' },
      ]
    },
    {
      id: 'admin', icon: Settings, label: 'Administración',
      subItems: [
        { id: 'config', icon: Clock, label: 'Horarios', href: '/dashboard/owner/schedules' },
        { id: 'usuarios', icon: ShieldAlert, label: 'Seguridad', href: '/dashboard/owner/users' },
      ]
    }
  ];

  if (!userProfile || userProfile.role !== 'owner') return null;

  return (
    <div className="flex h-screen bg-erp-bg text-zinc-900 overflow-hidden font-sans">

      {/* ─────────────────────────────────────────────────────────────
          SIDEBAR DESKTOP (ERP STYLE)
      ───────────────────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: isSidebarExpanded ? 280 : 80 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="hidden lg:flex flex-col h-full bg-erp-surface border-r border-erp-border relative z-40 shadow-xl overflow-hidden shrink-0"
      >
        {/* Sidebar Header */}
        <div
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="relative flex flex-col items-center justify-center py-6 border-b border-erp-border shrink-0 cursor-pointer group hover:bg-black/5 transition-colors"
        // title={isSidebarExpanded ? "Colapsar menú" : "Expandir menú"}
        >
          {/* Logo siempre visible */}
          <div className={`relative shrink-0 transition-all duration-300 ${isSidebarExpanded ? 'w-16 h-16' : 'w-10 h-10'}`}>
            <Image src="/logo-barber-red.png" alt="BarberRed Logo" fill className="object-contain drop-shadow-md group-hover:scale-105 transition-transform" />
          </div>

          <AnimatePresence>
            {isSidebarExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="flex flex-col items-center overflow-hidden whitespace-nowrap"
              >
                <span className="text-xl font-black tracking-tight uppercase leading-none">
                  BARBER<span className="text-[#ff2400]">RED</span>
                </span>
                <span className="text-[10px] font-black text-erp-text-muted uppercase tracking-widest mt-1">
                  by Grizzly
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar py-6 px-3 space-y-2">
          {tabs.map(tab => {
            if (tab.subItems) {
              const isChildActive = tab.subItems.some(sub => pathname === sub.href);
              const isOpen = activeDropdown === tab.id;

              return (
                <div key={tab.id} className="relative group/navitem">
                  <button
                    onClick={() => {
                      if (!isSidebarExpanded) setIsSidebarExpanded(true);
                      setActiveDropdown(isOpen ? null : tab.id);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all ${isChildActive
                      ? 'bg-erp-primary/10 text-erp-primary'
                      : 'text-zinc-500 hover:bg-black/5 hover:text-zinc-900'
                      }`}
                  >
                    <tab.icon size={20} className={`shrink-0 ${isChildActive ? 'text-erp-primary' : 'text-zinc-400'}`} />
                    <AnimatePresence>
                      {isSidebarExpanded && (
                        <motion.span
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="flex-1 text-left whitespace-nowrap"
                        >
                          {tab.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {isSidebarExpanded && (
                      <ChevronDown size={16} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    )}
                  </button>

                  {/* Tooltip for collapsed state */}
                  {!isSidebarExpanded && (
                    <div className="absolute left-full top-0 ml-2 hidden group-hover/navitem:block bg-erp-surface border border-erp-border rounded-xl shadow-xl py-2 z-50 w-48">
                      <p className="px-4 py-2 text-[10px] font-black text-erp-primary uppercase tracking-widest border-b border-erp-border mb-2">{tab.label}</p>
                      {tab.subItems.map(sub => (
                        <Link key={sub.id} href={sub.href} className="flex items-center gap-3 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-erp-primary/5 hover:text-erp-primary">
                          <sub.icon size={14} /> {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}

                  <AnimatePresence>
                    {isSidebarExpanded && isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2 pb-1 space-y-1 pl-11 pr-2">
                          {tab.subItems.map(sub => {
                            const isSubActive = pathname === sub.href;
                            return (
                              <Link
                                key={sub.id}
                                href={sub.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${isSubActive ? 'bg-erp-primary/5 text-erp-primary' : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/5'}`}
                              >
                                <sub.icon size={14} />
                                {sub.label}
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            const isActive = pathname === tab.href;
            return (
              <div key={tab.id} className="relative group/navitem">
                <Link
                  href={tab.href!}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all ${isActive
                    ? 'bg-erp-primary/10 text-erp-primary'
                    : 'text-zinc-500 hover:bg-black/5 hover:text-zinc-900'
                    }`}
                >
                  <tab.icon size={20} className={`shrink-0 ${isActive ? 'text-erp-primary' : 'text-zinc-400'}`} />
                  <AnimatePresence>
                    {isSidebarExpanded && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                        {tab.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
                {!isSidebarExpanded && (
                  <div className="absolute left-full top-2 ml-2 hidden group-hover/navitem:block bg-erp-surface border border-erp-border rounded-lg shadow-xl px-3 py-1.5 z-50 whitespace-nowrap text-xs font-bold text-zinc-900">
                    {tab.label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer (Profile / Logout) */}
        <div className="p-4 border-t border-erp-border shrink-0">
          <Link href="/dashboard/owner/profile" className={`flex items-center gap-3 p-2 rounded-xl hover:bg-black/5 transition-all ${!isSidebarExpanded ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-erp-primary/10 border border-erp-primary/20 flex items-center justify-center text-erp-primary font-bold">
              {userProfile.avatar_url ? (
                <Image src={userProfile.avatar_url} alt="Avatar" width={40} height={40} className="w-full h-full object-cover" />
              ) : (
                <UserCircle size={24} />
              )}
            </div>
            {isSidebarExpanded && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-zinc-900 leading-none capitalize truncate">{userProfile.name}</p>
                <p className="text-[10px] font-bold text-erp-primary hover:underline uppercase tracking-widest mt-1">Ver perfil</p>
              </div>
            )}
          </Link>
          {isSidebarExpanded && (
            <button onClick={handleLogout} className="mt-2 w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
              <LogOut size={16} /> Cerrar Sesión
            </button>
          )}
        </div>
      </motion.aside>

      {/* ─────────────────────────────────────────────────────────────
          MOBILE HEADER
      ───────────────────────────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-20 bg-erp-surface/90 backdrop-blur-2xl border-b border-erp-border flex items-center justify-between px-6 z-[60]">
        <Link href="/dashboard/owner" className="flex items-center gap-3">
          <div className="bg-erp-primary/10 border border-erp-primary/20 p-2.5 rounded-xl">
            <Scissors size={18} className="text-erp-primary" />
          </div>
          <span className="text-xl font-black tracking-tight uppercase text-zinc-900 italic">
            B<span className="text-erp-primary">S</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/owner/profile"
            className="w-10 h-10 rounded-xl border border-erp-primary/20 bg-erp-primary/5 flex items-center justify-center overflow-hidden shadow-inner text-erp-primary"
          >
            {userProfile.avatar_url
              ? <Image src={userProfile.avatar_url} alt={userProfile.name} width={40} height={40} className="w-full h-full object-cover" />
              : <UserCircle size={24} />}
          </Link>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-zinc-400 hover:text-erp-primary transition-all">
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT AREA
      ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        <main className="flex-1 p-4 lg:p-10 pb-28 lg:pb-10 overflow-y-auto relative z-10 custom-scrollbar mt-20 lg:mt-0">
          {children}
        </main>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MOBILE BOTTOM NAV
      ───────────────────────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-erp-surface/95 backdrop-blur-3xl border-t border-erp-border flex items-center justify-around px-2 z-[60] pb-safe">
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
              className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-all relative ${isActive ? 'text-erp-primary' : 'text-zinc-400'}`}
            >
              <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-bold tracking-wide">{tab.label}</span>
              {isActive && <div className="absolute top-0 w-8 h-1 bg-erp-primary rounded-full" />}
            </Link>
          );
        })}

        <div className="relative">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-all ${isMobileMenuOpen ? 'text-erp-primary' : 'text-zinc-400'}`}
          >
            <Menu size={20} />
            <span className="text-[9px] font-bold tracking-wide">Más</span>
          </button>

          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-24 right-4 w-64 bg-erp-surface border border-erp-border rounded-2xl shadow-2xl p-4 space-y-1"
              >
                <p className="text-[10px] font-bold text-erp-primary uppercase tracking-widest mb-3 px-3">Gestión Avanzada</p>
                {[
                  { id: 'calendar', icon: Calendar, label: 'Calendario', href: '/dashboard/owner/calendar' },
                  { id: 'config', icon: Clock, label: 'Horarios', href: '/dashboard/owner/schedules' },
                  { id: 'promociones', icon: Sparkles, label: 'Promociones', href: '/dashboard/owner/promotions' },
                  { id: 'servicios', icon: Scissors, label: 'Servicios', href: '/dashboard/owner/services' },
                  { id: 'gastos', icon: DollarSign, label: 'Gastos', href: '/dashboard/owner/expenses' },
                  { id: 'finanzas', icon: Wallet, label: 'Finanzas', href: '/dashboard/owner/finances' },
                  { id: 'reportes', icon: BarChart3, label: 'Reportes', href: '/dashboard/owner/reports' },
                  { id: 'usuarios', icon: ShieldAlert, label: 'Seguridad', href: '/dashboard/owner/users' },
                  { id: 'perfil', icon: UserCircle, label: 'Mi Perfil', href: '/dashboard/owner/profile' }
                ].map(tab => {
                  const isActive = pathname === tab.href;
                  return (
                    <Link
                      key={tab.id}
                      href={tab.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs font-bold transition-all ${isActive ? 'bg-erp-primary/10 text-erp-primary' : 'text-zinc-600 hover:bg-black/5 hover:text-zinc-900'}`}
                    >
                      <tab.icon size={18} />
                      {tab.label}
                    </Link>
                  );
                })}
                <div className="h-px bg-erp-primary/10 my-3" />
                <button onClick={handleLogout} className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all">
                  <LogOut size={18} />
                  Salir
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </div>
  );
}

