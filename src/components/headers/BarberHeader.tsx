/* eslint-disable @next/next/no-img-element */
'use client';
import Link from 'next/link';
import { Scissors, UserCircle, LogOut } from 'lucide-react';
import { Profile } from '@/types';

interface BarberHeaderProps {
  userProfile: Profile;
  barberId: string | string[];
  onLogout: () => void;
}

export function BarberHeader({ userProfile, barberId, onLogout }: BarberHeaderProps) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-[60]">
      <Link href={`/dashboard/barber/${barberId}`} className="flex items-center gap-2">
        <div className="bg-[#f59e0b] p-1.5 rounded-lg">
          <Scissors size={14} className="text-black" />
        </div>
        <span className="text-lg font-black tracking-tighter uppercase text-white">
          B<span className="text-[#f59e0b]">S</span>
        </span>
      </Link>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={onLogout}
          className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/40 hover:text-red-500 transition-colors"
        >
          <LogOut size={16} />
        </button>
        <Link
          href={`/dashboard/barber/${barberId}/profile`}
          className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden"
        >
          {userProfile.avatar_url
            ? <img src={userProfile.avatar_url} alt={userProfile.name} className="w-full h-full object-cover" />
            : <UserCircle size={20} className="text-white/40" />}
        </Link>
      </div>
    </header>
  );
}
