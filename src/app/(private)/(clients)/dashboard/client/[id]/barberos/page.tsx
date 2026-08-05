'use client';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';
import { useState } from 'react';
import Image from 'next/image';
import { UserCircle, Star, Scissors, ChevronRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FullProfileView } from '@/components/FullProfileView';

export default function ClientBarbersPage() {
  const [viewingBarberId, setViewingBarberId] = useState<string | null>(null);

  const { data: barbers = [], isLoading } = useQuery({
    queryKey: ['barbers-active'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'barber')
        .eq('is_active', true);
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 max-w-4xl mx-auto">
      <div className="space-y-1">
        <p className="text-accent-green text-[9px] font-black uppercase tracking-[0.4em] mb-1">Directorio Elite</p>
        <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none text-zinc-900">
          Nuestros <span className="text-brand">Especialistas</span>
        </h1>
        <p className="text-sm font-medium text-zinc-500 max-w-md pt-2">
          Conoce al equipo de profesionales que transformará tu estilo. Explora sus perfiles, servicios y calificaciones.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Cargando profesionales...</p>
        </div>
      ) : barbers.length === 0 ? (
        <div className="py-32 text-center border-2 border-dashed border-accent-green/20 rounded-[3rem] flex flex-col items-center justify-center gap-6">
          <div className="space-y-2 text-zinc-400">
            <p className="text-[11px] font-black uppercase tracking-[0.4em]">No hay especialistas disponibles</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {barbers.map((barber: Profile) => (
            <div 
              key={barber.id} 
              className="bg-surface backdrop-blur-xl border border-accent-green/20 rounded-[2.5rem] overflow-hidden group cursor-pointer hover:border-brand/30 transition-all hover:shadow-[0_-10px_40px_rgba(0,0,0,0.1)] relative"
              onClick={() => setViewingBarberId(barber.id)}
            >
              <div className="p-6 flex items-center gap-5">
                <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden border-2 border-accent-green/20 group-hover:border-brand/30 transition-all shrink-0 shadow-sm relative bg-white">
                  {barber.avatar_url ? (
                    <Image src={barber.avatar_url} alt={barber.nickname || barber.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserCircle size={32} className="text-zinc-300" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight truncate">
                    {barber.nickname || barber.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Star size={12} className="text-brand fill-brand" />
                    <p className="text-[9px] font-black text-brand uppercase tracking-[0.2em]">
                      Profesional
                    </p>
                  </div>
                  
                  {barber.specialty && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="bg-black/5 text-zinc-600 px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest truncate max-w-full">
                        {barber.specialty}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-zinc-500 group-hover:bg-brand group-hover:text-white transition-all shrink-0">
                  <ChevronRight size={18} />
                </div>
              </div>
              
              <div className="px-6 py-4 bg-black/[0.02] border-t border-accent-green/10 flex items-center justify-between group-hover:bg-brand/5 transition-all">
                <div className="flex items-center gap-2 text-zinc-500 group-hover:text-brand transition-all">
                  <Scissors size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Ver Perfil & Servicios</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PROFILE VIEWER MODAL */}
      <AnimatePresence>
        {viewingBarberId && (
          <motion.div 
            initial={{ x: "100%" }} 
            animate={{ x: 0 }} 
            exit={{ x: "100%" }} 
            transition={{ type: "spring", damping: 25, stiffness: 200 }} 
            className="fixed inset-0 z-[150] bg-bg-base flex flex-col overflow-hidden"
          >
            <div className="shrink-0 h-20 border-b border-accent-green/20 bg-surface/95 backdrop-blur-xl flex items-center justify-between px-6 z-50 relative">
              <h2 className="text-xl font-black text-zinc-900 uppercase italic">Perfil del Especialista</h2>
              <button 
                onClick={() => setViewingBarberId(null)} 
                className="w-10 h-10 bg-black/5 text-zinc-900 rounded-full flex items-center justify-center hover:bg-black/10 transition-all active:scale-90"
              >
                <ArrowLeft size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pt-10 pb-20">
              <FullProfileView profileId={viewingBarberId} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
