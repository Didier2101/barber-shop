'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Scissors, UserCircle, LogOut } from 'lucide-react';
import { Profile } from '@/types';

interface BarberHeaderProps {
  userProfile: Profile;
  barberId: string | string[];
  onLogout: () => void;
}

export function BarberHeader({ userProfile, barberId, onLogout }: BarberHeaderProps) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-6 z-[60]">
      <Link href={`/dashboard/barber/${barberId}`} className="flex items-center gap-3">
        <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/20 p-2 rounded-xl">
          <Scissors size={18} className="text-[#f59e0b]" />
        </div>
        <span className="text-xl font-black tracking-tighter uppercase text-white italic">
          B<span className="text-[#f59e0b]">S</span>
        </span>
      </Link>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={onLogout}
          className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={18} />
        </button>
        <Link
          href={`/dashboard/barber/${barberId}/profile`}
          className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden"
        >
          {userProfile.avatar_url
            ? <Image src={userProfile.avatar_url} alt={userProfile.name} width={40} height={40} className="w-full h-full object-cover" />
            : <UserCircle size={24} className="text-white/20" />}
        </Link>
      </div>
    </header>
  );
}
