'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, History, UserCircle, CalendarDays, TrendingUp } from 'lucide-react';
import { useGlobalStore } from '@/store/useGlobalStore';

export function MobileBottomNav() {
  const pathname = usePathname();
  const userProfile = useGlobalStore(state => state.userProfile);

  if (!userProfile) return null;

  const links = userProfile.role === 'client' ? [
    { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
    { href: '/reservas', label: 'Reservas', icon: History },
    { href: `/profile/${userProfile.id}`, label: 'Perfil', icon: UserCircle },
  ] : userProfile.role === 'barber' ? [
    { href: `/dashboard/barber/${userProfile.id}?tab=inicio`, label: 'Dashboard', icon: LayoutDashboard },
    { href: `/dashboard/barber/${userProfile.id}?tab=agenda`, label: 'Agenda', icon: CalendarDays },
    { href: `/dashboard/barber/${userProfile.id}?tab=estadisticas`, label: 'Finanzas', icon: TrendingUp },
  ] : [
     // Owner links can go here or keep top nav
     { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  ];

  // Don't show bottom nav for owners on mobile as their dashboard is complex
  if (userProfile.role === 'owner') return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 pb-6 pointer-events-none">
      <nav className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] h-16 flex items-center justify-around px-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href.includes('tab') && pathname.includes(link.href.split('?')[0]));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-all ${
                isActive ? 'text-[#f59e0b]' : 'text-zinc-500'
              }`}
            >
              <link.icon size={20} className={isActive ? 'scale-110' : 'scale-100'} />
              <span className="text-[8px] font-black uppercase tracking-widest">{link.label}</span>
              {isActive && (
                <div className="w-1 h-1 bg-[#f59e0b] rounded-full absolute bottom-2" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
