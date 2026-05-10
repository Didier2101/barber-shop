'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useClientAppointments, usePromotions, useLoyaltySettings } from '@/hooks/useClientData';
import {
   Scissors,
   Star,
   Calendar,
   Sparkles,
   UserCircle,
   ChevronRight,
   Gift,
   Zap,
   Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGlobalStore } from '@/store/useGlobalStore';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Profile } from '@/types';
import { useQuery } from '@tanstack/react-query';

export default function ClientDashboardPage() {
   const userProfile = useGlobalStore(state => state.userProfile);
   const [showRules, setShowRules] = useState(false);
   const [showBooking, setShowBooking] = useState(false);
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

   const completedCount = apts.filter(a => {
      if (a.status !== 'completed') return false;
      if (a.is_loyalty_reward) return false;
      // Las citas con promo TAMBIÉN suman al contador de lealtad
      return true;
   }).length || 0;

   if (!userProfile) return null;

   return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
         <div className="space-y-1">
            <p className="text-[#f59e0b] text-[9px] font-black uppercase tracking-[0.4em]">Mi Dashboard</p>
            <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none text-white">¡Hola, {userProfile.nickname || userProfile.name.split(' ')[0]}!</h1>
         </div>

         {/* LOYALTY CARD */}
         {isLoyaltyEnabled && (
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
               <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-center">
                     <div className="flex items-center gap-3 text-[#f59e0b]">
                        <Scissors size={14} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Club Elite Rewards</span>
                     </div>
                     <span className="text-xl font-black italic text-white leading-none">{completedCount % loyaltyThreshold}/{loyaltyThreshold}</span>
                  </div>

                  <div className="h-2.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                     <div
                        className="h-full bg-[#f59e0b] rounded-full shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all duration-1000"
                        style={{ width: `${((completedCount % loyaltyThreshold) / loyaltyThreshold) * 100}%` }}
                     />
                  </div>

                  <div className="flex justify-between items-center">
                     <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest leading-tight">
                        {completedCount % loyaltyThreshold === 0 && completedCount > 0
                           ? "¡Corte GRATIS disponible!"
                           : `${loyaltyThreshold - (completedCount % loyaltyThreshold)} visitas para tu premio`}
                     </p>
                     <button onClick={() => setShowRules(true)} className="text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white">Reglas</button>
                  </div>
               </div>
            </div>
         )}

         {promos.length > 0 && (
            <div className="space-y-4">
               <div className="flex items-center gap-3 px-1">
                  <Sparkles size={16} className="text-[#f59e0b]" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Ofertas Especiales</h3>
               </div>
               <div className="grid gap-3">
                  {promos.map(promo => {
                     const discountLabel =
                        promo.discount_type === 'percentage' ? `-${promo.discount_value}%` :
                        promo.discount_type === 'fixed'      ? `-$${new Intl.NumberFormat('de-DE').format(promo.discount_value)}` :
                        'GRATIS';

                     return (
                        <button
                           key={promo.id}
                           onClick={() => router.push(`/dashboard/client/${userProfile.id}/reservas/select-barber?promo_id=${promo.id}`)}
                           className="w-full text-left bg-gradient-to-br from-[#f59e0b]/10 to-white/[0.02] border border-[#f59e0b]/20 rounded-[1.5rem] p-5 hover:border-[#f59e0b]/50 hover:bg-[#f59e0b]/15 active:scale-[0.98] transition-all group"
                        >
                           <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-2xl bg-[#f59e0b]/15 flex items-center justify-center shrink-0 group-hover:bg-[#f59e0b]/25 transition-colors">
                                    <Gift size={18} className="text-[#f59e0b]" />
                                 </div>
                                 <div className="space-y-1 min-w-0 flex-1 py-1">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-white leading-tight">{promo.name}</p>
                                    <p className="text-[9px] font-medium text-white/40 italic leading-relaxed">{promo.description}</p>
                                    
                                    {/* Fechas de vigencia */}
                                    <div className="flex items-center gap-1.5 pt-1">
                                       <Clock size={10} className="text-[#f59e0b]/60" />
                                       <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
                                          Vence: {format(new Date(promo.end_date.split('T')[0] + 'T12:00:00'), 'dd MMM yyyy')}
                                       </p>
                                    </div>
                                 </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                 <span className="text-base font-black text-[#f59e0b] italic">{discountLabel}</span>
                                 <div className="w-7 h-7 rounded-xl bg-[#f59e0b] flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Zap size={14} className="text-black" />
                                 </div>
                              </div>
                           </div>

                           {/* CTA hint */}
                           <p className="mt-3 text-[8px] font-black uppercase tracking-[0.25em] text-[#f59e0b]/50 group-hover:text-[#f59e0b]/70 transition-colors">
                              Toca para aplicar esta oferta →
                           </p>
                        </button>
                     );
                  })}
               </div>
            </div>
         )}

         {/* AGENDAR BUTTON */}
         <div className="pt-4">
            <button
               onClick={() => setShowBooking(true)}
               className="w-full bg-[#f59e0b] text-black py-6 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[12px] shadow-2xl shadow-amber-500/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group"
            >
               <Calendar size={20} className="group-hover:rotate-12 transition-transform" />
               Agendar Mi Cita
            </button>
         </div>

         {/* BOOKING MODAL */}
         <AnimatePresence>
            {showBooking && (
               <div className="fixed inset-0 z-[120] flex items-end justify-center">
                  <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                     onClick={() => setShowBooking(false)}
                  />
                  <motion.div
                     initial={{ y: "100%" }}
                     animate={{ y: 0 }}
                     exit={{ y: "100%" }}
                     transition={{ type: "spring", damping: 25, stiffness: 200 }}
                     className="relative w-full max-w-lg bg-[#0a0a0a] border-t border-white/10 rounded-t-[3rem] p-10 pb-32 space-y-10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
                  >
                     <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto" />
                     <div className="space-y-2 text-center">
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Elige a tu <span className="text-[#f59e0b]">Barbero</span></h2>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Artesanos del Estilo</p>
                     </div>

                     <div className="grid gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                        {barbers.map((barber: Profile) => (
                           <div
                              key={barber.id}
                              className="bg-white/5 border border-white/5 p-5 rounded-[2rem] flex items-center gap-5 hover:bg-white/10 transition-all cursor-pointer group"
                              onClick={() => router.push(`/dashboard/client/${userProfile.id}/reservas/barber/${barber.id}`)}
                           >
                              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                                 {barber.avatar_url ? <img src={barber.avatar_url} alt={barber.name} className="w-full h-full object-cover" /> : <UserCircle size={32} className="w-full h-full p-4 text-white/20" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-2">
                                    <p className="text-base font-black text-white uppercase tracking-tight truncate">{barber.nickname || barber.name}</p>
                                    <div className={`w-1.5 h-1.5 rounded-full ${barber.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                                 </div>
                                 <p className="text-[9px] font-black text-[#f59e0b] uppercase tracking-[0.2em] opacity-60">Barbero Profesional</p>
                              </div>
                              <ChevronRight size={20} className="text-white/20 group-hover:text-[#f59e0b] transition-all" />
                           </div>
                        ))}
                     </div>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>

         {/* LOYALTY RULES MODAL */}
         {showRules && (
            <div className="fixed inset-0 z-[130] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
               <div className="bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-10 max-w-sm w-full space-y-8 relative text-center">
                  <div className="w-20 h-20 bg-[#f59e0b]/10 text-[#f59e0b] rounded-[2rem] flex items-center justify-center mx-auto">
                     <Star size={40} fill="currentColor" />
                  </div>
                  <div className="space-y-4">
                     <h3 className="text-2xl font-black uppercase italic tracking-tighter">Programa <span className="text-[#f59e0b]">Elite</span></h3>
                     <p className="text-xs text-white/50 font-medium leading-relaxed italic">
                        &quot;{loyalty?.description || 'Completa tu meta de visitas para obtener un servicio totalmente gratis.'}&quot;
                     </p>
                  </div>
                  <button onClick={() => setShowRules(false)} className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-[10px]">Cerrar</button>
               </div>
            </div>
         )}
      </div>
   );
}
