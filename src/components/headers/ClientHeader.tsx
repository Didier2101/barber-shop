'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Scissors } from 'lucide-react';
import { Profile } from '@/types';

interface ClientHeaderProps {
  userProfile: Profile;
  clientId: string | string[];
  pageTitle?: string;
}

/**
 * Mobile top bar for the client dashboard.
 * Navigation is handled by the bottom tab bar — no hamburger needed.
 */
export function ClientHeader({ userProfile, clientId, pageTitle }: ClientHeaderProps) {
  return (
    <header className="lg:hidden flex items-center justify-between px-6 h-20 bg-black/80 backdrop-blur-2xl border-b border-white/5 shrink-0 z-40 relative">
      {/* Logo */}
      <Link href={`/dashboard/client/${clientId}`} className="flex items-center gap-3">
        <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/20 p-2 rounded-xl">
          <Scissors size={18} className="text-[#f59e0b]" />
        </div>
        <span className="text-xl font-black tracking-tighter uppercase text-white italic">
          B<span className="text-[#f59e0b]">S</span>
        </span>
      </Link>

      {/* Page title centered */}
      {pageTitle && (
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 absolute left-1/2 -translate-x-1/2 italic">
          {pageTitle}
        </span>
      )}

      {/* Avatar → profile link */}
      <Link
        href={`/dashboard/client/${clientId}/profile`}
        className="w-10 h-10 rounded-xl border border-[#f59e0b]/20 overflow-hidden bg-black flex items-center justify-center shrink-0"
      >
        {userProfile.avatar_url
          ? <Image src={userProfile.avatar_url} alt={userProfile.name} width={40} height={40} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
          : <span className="text-xs font-black text-[#f59e0b] italic">{userProfile.name?.charAt(0)}</span>}
      </Link>
    </header>
  );
}
