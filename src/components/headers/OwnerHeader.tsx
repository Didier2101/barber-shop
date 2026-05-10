/* eslint-disable @next/next/no-img-element */
'use client';
import Link from 'next/link';
import { Scissors, UserCircle, Menu, X } from 'lucide-react';
import { Profile } from '@/types';

interface OwnerHeaderProps {
  userProfile: Profile;
  isMobileMenuOpen: boolean;
  onToggleMenu: () => void;
}

export function OwnerHeader({ userProfile, isMobileMenuOpen, onToggleMenu }: OwnerHeaderProps) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 z-[60]">
      <Link href="/dashboard/owner" className="flex items-center gap-2">
        <div className="bg-[#0061ff] p-1.5 rounded-lg">
          <Scissors size={14} className="text-white" />
        </div>
        <span className="text-lg font-black tracking-tighter uppercase text-gray-900">
          B<span className="text-[#0061ff]">S</span>
        </span>
      </Link>
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/owner/profile"
          className="w-8 h-8 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden"
        >
          {userProfile.avatar_url
            ? <img src={userProfile.avatar_url} alt={userProfile.name} className="w-full h-full object-cover" />
            : <UserCircle size={20} className="text-gray-400" />}
        </Link>
        <button onClick={onToggleMenu} className="p-2 text-gray-900">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
}
