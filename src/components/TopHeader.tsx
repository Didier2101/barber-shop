'use client';
import { useGlobalStore } from '@/store/useGlobalStore';
import { HelpCircle, UserCircle, Plus } from 'lucide-react';

export function TopHeader() {
  const userProfile = useGlobalStore(state => state.userProfile);

  return (
    <header className="hidden md:flex items-center justify-between h-14 px-8 bg-white border-b border-gray-200 sticky top-0 z-[100]">
      <div className="flex items-center gap-4">
        {/* Breadcrumb style text */}
        <span className="text-xs font-medium text-gray-900 truncate max-w-[200px]">
          {userProfile?.email}
        </span>
      </div>

      <div className="flex items-center gap-6">
        <button className="flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-gray-900 transition-all">
          <Plus size={16} className="text-gray-400" />
          <span>Ask AI</span>
        </button>
        <button className="flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-gray-900 transition-all">
          <HelpCircle size={16} className="text-gray-400" />
          <span>Asistencia</span>
        </button>
        
        <div className="h-4 w-px bg-gray-200" />
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500">
            <UserCircle size={20} />
          </div>
        </div>
      </div>
    </header>
  );
}


