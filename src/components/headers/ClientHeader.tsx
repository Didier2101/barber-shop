/* eslint-disable @next/next/no-img-element */
'use client';
import Link from 'next/link';
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
    <header className="lg:hidden flex items-center justify-between px-5 h-16 bg-black/60 backdrop-blur-md border-b border-white/5 shrink-0 z-40 relative">
      {/* Logo */}
      <Link href={`/dashboard/client/${clientId}`} className="flex items-center gap-2.5">
        <div className="bg-[#f59e0b] p-1.5 rounded-lg">
          <Scissors size={14} className="text-black" />
        </div>
        <span className="text-base font-black tracking-tighter uppercase text-white">
          B<span className="text-[#f59e0b]">S</span>
        </span>
      </Link>

      {/* Page title centered */}
      {pageTitle && (
        <span className="text-[10px] font-black uppercase tracking-widest text-white/40 absolute left-1/2 -translate-x-1/2">
          {pageTitle}
        </span>
      )}

      {/* Avatar → profile link */}
      <Link
        href={`/dashboard/client/${clientId}/profile`}
        className="w-9 h-9 rounded-full border-2 border-[#f59e0b]/40 overflow-hidden bg-white/5 flex items-center justify-center shrink-0"
      >
        {userProfile.avatar_url
          ? <img src={userProfile.avatar_url} alt={userProfile.name} className="w-full h-full object-cover" />
          : <span className="text-xs font-black text-[#f59e0b]">{userProfile.name?.charAt(0)}</span>}
      </Link>
    </header>
  );
}
