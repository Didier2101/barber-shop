'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useClientAppointments, usePromotions, useLoyaltySettings } from '@/hooks/client';
import {
   Scissors,
   Star,
   Calendar,
   Sparkles,
   UserCircle,
   ChevronRight,
   Gift,
   Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGlobalStore } from '@/store/useGlobalStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Profile } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { FullProfileView } from '@/components/FullProfileView';
import Image from 'next/image';

export default function ClientDashboardPage() {
   const userProfile = useGlobalStore(state => state.userProfile);
   const [showRules, setShowRules] = useState(false);
   const [showBooking, setShowBooking] = useState(false);
   const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null);
   const [viewingBarberId, setViewingBarberId] = useState<string | null>(null);
   const router = useRouter();

   const { data: barbers = [] } = useQuery({
      queryKey: ['barbers-active'],
      queryFn: async () => {
         const { data } = await supabase.from('profiles').select('*').eq('role', 'barber').eq('is_active', true);
         return data || [];
      },
      staleTime: 1000 * 60 * 5,
   });

   const { data: apts = [] } = useClientAppointments(userProfile?.id || '');
   const { data: promos = [] } = usePromotions();
   const { data: loyalty } = useLoyaltySettings();

   const loyaltyThreshold = loyalty?.appointments_threshold || 10;
   const isLoyaltyEnabled = !!loyalty?.is_enabled;

   const completedCount = apts.filter(a => a.status === 'completed' && !a.is_loyalty_reward).length || 0;

   if (!userProfile) return null;

   const handleSelectBarber = (barberId: string) => {
      const url = `/dashboard/client/${userProfile.id}/reservas/barber/${barberId}${selectedPromoId ? `?promo_id=${selectedPromoId}` : ''}`;
      router.push(url);
   };

   return (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 max-w-4xl mx-auto">
         <div className="space-y-1">
            <p className="text-[#f59e0b] text-[9px] font-black uppercase tracking-[0.4em] mb-1">Mi Dashboard</p>
            <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none text-white">¡Hola, {userProfile.nickname || userProfile.name.split(' ')[0]}!</h1>
         </div>

         {/* LOYALTY CARD */}
         {isLoyaltyEnabled && (
            <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
               <div className="relative z-10 space-y-5">
                  <div className="flex justify-between items-center">
                     <div className="flex items-center gap-3 text-[#f59e0b]">
                        <Scissors size={14} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Club Elite Rewards</span>
                     </div>
                     <span className="text-xl font-black italic text-white leading-none">{completedCount % loyaltyThreshold}/{loyaltyThreshold}</span>
                  </div>
                  <div className="h-2.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                     <div className="h-full bg-[#f59e0b] rounded-full shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all duration-1000" style={{ width: `${((completedCount % loyaltyThreshold) / loyaltyThreshold) * 100}%` }} />
                  </div>
                  <div className="flex justify-between items-center">
                     <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest leading-tight">
                        {completedCount % loyaltyThreshold === 0 && completedCount > 0 ? "¡Corte GRATIS disponible!" : `${loyaltyThreshold - (completedCount % loyaltyThreshold)} visitas para tu premio`}
                     </p>
                     <button onClick={() => setShowRules(true)} className="text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-white underline underline-offset-4 decoration-white/20">Reglas</button>
                  </div>
               </div>
            </div>
         )}

         {/* OFERTAS ESPECIALES */}
         {promos.length > 0 && (
            <div className="space-y-4">
               <div className="flex items-center gap-3 px-1"><Sparkles size={16} className="text-[#f59e0b]" /><h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Ofertas Especiales</h3></div>
               <div className="flex flex-col -space-y-px">
                  {promos.map((promo, idx) => (
                     <button key={promo.id} onClick={() => { setSelectedPromoId(promo.id); setShowBooking(true); }} className={`bg-black/80 border border-white/10 p-5 text-left transition-all group relative z-10 hover:z-20 ${idx === 0 ? 'rounded-t-[2rem]' : ''} ${idx === promos.length - 1 ? 'rounded-b-[2rem]' : ''}`}>
                        <div className="flex items-center justify-between gap-4">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-2xl bg-[#f59e0b]/10 flex items-center justify-center shrink-0 group-hover:bg-[#f59e0b]/20 transition-all"><Gift size={18} className="text-[#f59e0b]" /></div>
                              <div className="min-w-0">
                                 <p className="text-[11px] font-black uppercase tracking-widest text-white leading-tight">{promo.name}</p>
                                 <p className="text-[9px] font-medium text-white/40 italic truncate mt-1">{promo.description}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <span className="text-sm font-black text-[#f59e0b] italic">{promo.discount_type === 'percentage' ? `-${promo.discount_value}%` : `-$${new Intl.NumberFormat('de-DE').format(promo.discount_value)}`}</span>
                              <ChevronRight size={14} className="text-white/20 group-hover:translate-x-1 transition-all" />
                           </div>
                        </div>
                     </button>
                  ))}
               </div>
            </div>
         )}

         {/* BOTÓN AGENDAR */}
         <button onClick={() => { setSelectedPromoId(null); setShowBooking(true); }} className="w-full bg-[#f59e0b] text-black py-6 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[12px] shadow-2xl shadow-amber-500/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group">
            <Calendar size={20} className="group-hover:rotate-12 transition-transform" /> Agendar Mi Cita
         </button>

         {/* BOOKING FLOW */}
         <AnimatePresence>
            {showBooking && (
               <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-0 z-[120] bg-black flex flex-col overflow-hidden">
                  <div className="shrink-0 h-20 border-b border-white/5 bg-black/60 backdrop-blur-xl flex items-center justify-between px-6">
                     <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-[#f59e0b]/10 text-[#f59e0b] flex items-center justify-center"><Scissors size={20} /></div><div><h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Reservar</h2><p className="text-[8px] font-black text-white/20 uppercase mt-1 tracking-[0.3em]">Paso 1: Tu Barbero</p></div></div>
                     <button onClick={() => setShowBooking(false)} className="w-10 h-10 bg-white/5 text-white rounded-full flex items-center justify-center"><ChevronRight size={24} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-32">
                     <div className="text-center space-y-2"><h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Elige a tu <span className="text-[#f59e0b]">Artesano</span></h3><p className="text-[10px] font-medium text-white/40 max-w-xs mx-auto">Selecciona al profesional que se encargará de transformar tu estilo hoy.</p></div>
                     <div className="flex flex-col -space-y-px">
                        {barbers.map((barber: Profile, idx: number) => (
                           <div key={barber.id} className={`bg-black/80 border border-white/10 flex flex-col transition-all group relative z-10 hover:z-20 ${idx === 0 ? 'rounded-t-[3rem]' : ''} ${idx === barbers.length - 1 ? 'rounded-b-[3rem]' : ''}`}>
                              <div className="p-6 flex items-center gap-5 border-b border-white/5 cursor-pointer" onClick={() => handleSelectBarber(barber.id)}>
                                 <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/5 group-hover:border-[#f59e0b]/30 transition-all shrink-0 shadow-lg">{barber.avatar_url ? <Image src={barber.avatar_url} alt={barber.nickname || barber.name} width={64} height={64} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/5 flex items-center justify-center"><UserCircle size={24} className="text-white/20" /></div>}</div>
                                 <div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><p className="text-lg font-black text-white uppercase tracking-tight truncate">{barber.nickname || barber.name}</p><div className={`w-1.5 h-1.5 rounded-full ${barber.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-600'}`} /></div><div className="flex items-center gap-1.5"><Star size={10} className="text-[#f59e0b] fill-[#f59e0b]" /><p className="text-[9px] font-black text-[#f59e0b] uppercase tracking-[0.2em]">Profesional</p></div></div>
                                 <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#f59e0b] group-hover:text-black transition-all"><ChevronRight size={18} /></div>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); setViewingBarberId(barber.id); }} className="w-full py-3 bg-white/[0.01] hover:bg-white/[0.03] text-[8px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-[#f59e0b] transition-all flex items-center justify-center gap-2"><UserCircle size={12} /> Ver Perfil Profesional</button>
                           </div>
                        ))}
                     </div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* PROFILE VIEWER */}
         <AnimatePresence>{viewingBarberId && (
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-0 z-[150] bg-black flex flex-col overflow-hidden">
               <div className="shrink-0 h-20 border-b border-white/5 bg-black/60 backdrop-blur-xl flex items-center justify-between px-6 z-10"><h2 className="text-xl font-black text-white uppercase italic">Perfil Profesional</h2><button onClick={() => setViewingBarberId(null)} className="w-10 h-10 bg-white/5 text-white rounded-full flex items-center justify-center"><ChevronRight size={24} /></button></div>
               <div className="flex-1 overflow-y-auto custom-scrollbar pt-10"><FullProfileView profileId={viewingBarberId} /></div>
            </motion.div>
         )}</AnimatePresence>

         {/* RULES */}
         <AnimatePresence>{showRules && (
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-0 z-[130] bg-black flex flex-col overflow-hidden">
               <div className="shrink-0 h-20 border-b border-white/5 flex items-center justify-between px-6"><h2 className="text-xl font-black text-white uppercase italic">Reglas Elite</h2><button onClick={() => setShowRules(false)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center"><ChevronRight size={24} /></button></div>
               <div className="flex-1 p-10 flex flex-col items-center justify-center text-center space-y-8">
                  <div className="w-32 h-32 bg-[#f59e0b]/10 text-[#f59e0b] rounded-[3rem] flex items-center justify-center animate-pulse"><Star size={60} fill="currentColor" /></div>
                  <div className="space-y-4 max-w-xs"><h3 className="text-3xl font-black uppercase italic tracking-tighter">Programa <span className="text-[#f59e0b]">Fidelidad</span></h3><p className="text-sm text-white/60 font-medium italic">&quot;{loyalty?.description || 'Cada visita te acerca a un servicio totalmente gratuito.'}&quot;</p><div className="pt-6 grid gap-3"><div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4 text-left"><Zap size={18} className="text-[#f59e0b]" /><p className="text-[10px] font-bold uppercase text-white/80">Meta: {loyaltyThreshold} Visitas</p></div><div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4 text-left"><Gift size={18} className="text-[#f59e0b]" /><p className="text-[10px] font-bold uppercase text-white/80">Premio: Corte Gratis</p></div></div></div>
                  <button onClick={() => setShowRules(false)} className="w-full max-w-xs bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] mt-10">Entendido</button>
               </div>
            </motion.div>
         )}</AnimatePresence>
      </div>
   );
}
