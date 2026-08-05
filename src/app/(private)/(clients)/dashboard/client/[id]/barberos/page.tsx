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
        <p className="text-[#f59e0b] text-[9px] font-black uppercase tracking-[0.4em] mb-1">Directorio Elite</p>
        <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none text-white">
          Nuestros <span className="text-[#f59e0b]">Barberos</span>
        </h1>
        <p className="text-sm font-medium text-white/40 max-w-md pt-2">
          Conoce al equipo de profesionales que transformará tu estilo. Explora sus perfiles, servicios y calificaciones.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-[#f59e0b]/20 border-t-[#f59e0b] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Cargando profesionales...</p>
        </div>
      ) : barbers.length === 0 ? (
        <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-30 flex flex-col items-center justify-center gap-6">
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.4em]">No hay barberos disponibles</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {barbers.map((barber: Profile) => (
            <div 
              key={barber.id} 
              className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden group cursor-pointer hover:border-white/20 transition-all hover:shadow-2xl hover:shadow-[#f59e0b]/5 relative"
              onClick={() => setViewingBarberId(barber.id)}
            >
              <div className="p-6 flex items-center gap-5">
                <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden border-2 border-white/5 group-hover:border-[#f59e0b]/30 transition-all shrink-0 shadow-lg relative bg-white/5">
                  {barber.avatar_url ? (
                    <Image src={barber.avatar_url} alt={barber.nickname || barber.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserCircle size={32} className="text-white/20" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-white uppercase tracking-tight truncate">
                    {barber.nickname || barber.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Star size={12} className="text-[#f59e0b] fill-[#f59e0b]" />
                    <p className="text-[9px] font-black text-[#f59e0b] uppercase tracking-[0.2em]">
                      Barbero Profesional
                    </p>
                  </div>
                  
                  {barber.specialty && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="bg-white/5 text-white/60 px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest truncate max-w-full">
                        {barber.specialty}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#f59e0b] group-hover:text-black transition-all shrink-0">
                  <ChevronRight size={18} />
                </div>
              </div>
              
              <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between group-hover:bg-[#f59e0b]/5 transition-all">
                <div className="flex items-center gap-2 text-white/40 group-hover:text-[#f59e0b] transition-all">
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
            className="fixed inset-0 z-[150] bg-black flex flex-col overflow-hidden"
          >
            <div className="shrink-0 h-20 border-b border-white/5 bg-black/60 backdrop-blur-xl flex items-center justify-between px-6 z-50 relative">
              <h2 className="text-xl font-black text-white uppercase italic">Perfil del Barbero</h2>
              <button 
                onClick={() => setViewingBarberId(null)} 
                className="w-10 h-10 bg-white/5 text-white rounded-full flex items-center justify-center hover:bg-white/10 transition-all active:scale-90"
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
