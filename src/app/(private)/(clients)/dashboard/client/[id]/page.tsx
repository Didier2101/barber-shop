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
   Zap,
   ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGlobalStore } from '@/store/useGlobalStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Profile } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { FullProfileView } from '@/components/FullProfileView';
import Image from 'next/image';
import { formatPrice } from '@/lib/format';

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
         const { data } = await supabase
            .from('profiles')
            .select('*, barber_services(service_id)')
            .eq('role', 'barber')
            .eq('is_active', true);
         
         // Filtrar barberos que tienen al menos un servicio asignado
         return (data || []).filter((b: Profile) => b.barber_services && b.barber_services.length > 0);
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
         <div className="mb-4">
            <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none text-zinc-900">¡Hola, {userProfile.nickname || userProfile.name.split(' ')[0]}!</h1>
         </div>

         {/* LOYALTY CARD */}
         {isLoyaltyEnabled && (
            <div className="border-b border-accent-green/10 pb-8 mb-2 relative transition-all duration-500">
               <div className="relative z-10 space-y-5 px-2">
                  <div className="flex justify-between items-center">
                     <div className="flex items-center gap-3 text-brand">
                        <Scissors size={14} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Club Elite Rewards</span>
                     </div>
                     <span className="text-xl font-black italic text-zinc-900 leading-none">{completedCount % loyaltyThreshold}/{loyaltyThreshold}</span>
                  </div>
                  <div className="h-2.5 bg-white rounded-full overflow-hidden p-0.5 border border-accent-green/20">
                     <div className="h-full bg-brand rounded-full shadow-[0_0_15px_rgba(204,58,99,0.4)] transition-all duration-1000" style={{ width: `${((completedCount % loyaltyThreshold) / loyaltyThreshold) * 100}%` }} />
                  </div>
                  <div className="flex justify-between items-center">
                     <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-tight">
                        {completedCount % loyaltyThreshold === 0 && completedCount > 0 ? "¡Corte GRATIS disponible!" : `${loyaltyThreshold - (completedCount % loyaltyThreshold)} visitas para tu premio`}
                     </p>
                     <button onClick={() => setShowRules(true)} className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-brand underline underline-offset-4 decoration-accent-green/20">Reglas</button>
                  </div>
               </div>
            </div>
         )}

         {/* OFERTAS ESPECIALES */}
         {promos.length > 0 && (
            <div className="space-y-4">
               <div className="flex items-center gap-3 px-1"><Sparkles size={16} className="text-accent-green" /><h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Ofertas Especiales</h3></div>
               <div className="flex flex-col -space-y-px">
                  {promos.map((promo, idx) => (
                     <button key={promo.id} onClick={() => { setSelectedPromoId(promo.id); setShowBooking(true); }} className={`bg-surface border border-accent-green/20 p-5 text-left transition-all group relative z-10 hover:z-20 hover:border-brand/30 hover:shadow-[0_-10px_40px_rgba(0,0,0,0.1)] ${idx === 0 ? 'rounded-t-[2rem]' : ''} ${idx === promos.length - 1 ? 'rounded-b-[2rem]' : ''}`}>
                        <div className="flex items-center justify-between gap-4">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center shrink-0 group-hover:bg-brand/20 transition-all"><Gift size={18} className="text-brand" /></div>
                              <div className="min-w-0">
                                 <p className="text-[11px] font-black uppercase tracking-widest text-zinc-900 leading-tight">{promo.name}</p>
                                 <p className="text-[9px] font-medium text-zinc-500 italic truncate mt-1">{promo.description}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <span className="text-sm font-black text-brand italic">{promo.discount_type === 'percentage' ? `-${promo.discount_value}%` : `-${formatPrice(promo.discount_value)}`}</span>
                              <ChevronRight size={14} className="text-accent-green/40 group-hover:translate-x-1 transition-all" />
                           </div>
                        </div>
                     </button>
                  ))}
               </div>
            </div>
         )}

         {/* BOTÓN AGENDAR */}
         <button onClick={() => { setSelectedPromoId(null); setShowBooking(true); }} className="w-full bg-brand hover:bg-accent-green text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[12px] shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group">
            <Calendar size={20} className="group-hover:rotate-12 transition-transform" /> Agendar Mi Cita
         </button>

         {/* BOOKING FLOW */}
         <AnimatePresence>
            {showBooking && (
               <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-0 z-[120] bg-bg-base flex flex-col overflow-hidden">
                  <div className="shrink-0 h-14 border-b border-accent-green/20 bg-surface/95 backdrop-blur-xl flex items-center justify-between px-6 z-50 relative">
                     <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-transparent text-brand flex items-center justify-center"><Scissors size={20} /></div><div><h2 className="text-base font-black text-zinc-900 uppercase tracking-tighter italic">Reservar</h2><p className="text-[8px] font-black text-zinc-400 uppercase mt-1 tracking-[0.3em]">Paso 1: Tu Barbero</p></div></div>
                     <button onClick={() => setShowBooking(false)} className="w-10 h-10 bg-transparent text-zinc-900 rounded-full flex items-center justify-center hover:bg-black/5 transition-all active:scale-90"><ArrowLeft size={20} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-32">
                     <div className="text-center space-y-2"><h3 className="text-2xl font-black uppercase italic tracking-tighter text-zinc-900">Elige a tu <span className="text-brand font-light">Especialista</span></h3><p className="text-[10px] font-medium text-zinc-500 max-w-xs mx-auto">Selecciona al profesional que se encargará de transformar tu estilo hoy.</p></div>
                     <div className="border-t border-accent-green/10">
                        {barbers.map((barber: Profile) => (
                           <div key={barber.id} className="border-b border-accent-green/10 py-5 flex items-center gap-4">
                              {/* Avatar */}
                              <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-100 shrink-0 cursor-pointer" onClick={() => handleSelectBarber(barber.id)}>
                                 {barber.avatar_url ? <Image src={barber.avatar_url} alt={barber.nickname || barber.name} width={56} height={56} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-400"><UserCircle size={24} /></div>}
                              </div>
                              {/* Info */}
                              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleSelectBarber(barber.id)}>
                                 <div className="flex items-center gap-2">
                                    <p className="text-sm font-black text-zinc-900 uppercase tracking-tighter truncate">{barber.nickname || barber.name}</p>
                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${barber.is_active ? 'bg-accent-green' : 'bg-zinc-300'}`} />
                                 </div>
                                 <div className="flex items-center gap-1 text-brand mt-0.5">
                                    <Star size={9} className="fill-brand" />
                                    <p className="text-[8px] font-black uppercase tracking-widest">Profesional</p>
                                 </div>
                                 <button onClick={(e) => { e.stopPropagation(); setViewingBarberId(barber.id); }} className="text-[8px] font-black uppercase tracking-widest text-zinc-400 hover:text-brand transition-all flex items-center gap-1 mt-1">
                                    <UserCircle size={10} /> Ver perfil
                                 </button>
                              </div>
                              {/* Acción */}
                              <button onClick={() => handleSelectBarber(barber.id)} className="shrink-0 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-brand text-white hover:bg-accent-green active:scale-95 transition-all">
                                 Elegir
                              </button>
                           </div>
                        ))}
                     </div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* PROFILE VIEWER */}
         <AnimatePresence>{viewingBarberId && (
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-0 z-[150] bg-bg-base flex flex-col overflow-hidden">
               <div className="shrink-0 h-14 border-b border-accent-green/20 bg-surface/95 backdrop-blur-xl flex items-center justify-between px-6 z-10"><h2 className="text-base font-black text-zinc-900 uppercase italic">Perfil Profesional</h2><button onClick={() => setViewingBarberId(null)} className="w-10 h-10 bg-transparent hover:bg-black/5 text-zinc-900 rounded-full flex items-center justify-center transition-all active:scale-90"><ChevronRight size={20} /></button></div>
               <div className="flex-1 overflow-y-auto custom-scrollbar pt-4"><FullProfileView profileId={viewingBarberId} /></div>
            </motion.div>
         )}</AnimatePresence>

         {/* RULES */}
         <AnimatePresence>{showRules && (
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-0 z-[130] bg-bg-base flex flex-col overflow-hidden">
               <div className="shrink-0 h-14 border-b border-accent-green/20 bg-surface/95 backdrop-blur-xl flex items-center justify-between px-6"><h2 className="text-base font-black text-zinc-900 uppercase italic">Reglas Elite</h2><button onClick={() => setShowRules(false)} className="w-10 h-10 bg-transparent hover:bg-black/5 rounded-full flex items-center justify-center text-zinc-900 transition-all active:scale-90"><ChevronRight size={20} /></button></div>
               <div className="flex-1 p-10 flex flex-col items-center justify-center text-center space-y-8">
                  <div className="w-32 h-32 bg-brand/10 text-brand rounded-[3rem] flex items-center justify-center animate-pulse"><Star size={60} fill="currentColor" /></div>
                  <div className="space-y-4 max-w-xs"><h3 className="text-3xl font-black uppercase italic tracking-tighter text-zinc-900">Programa <span className="text-brand font-light">Fidelidad</span></h3><p className="text-sm text-zinc-500 font-medium italic">&quot;{loyalty?.description || 'Cada visita te acerca a un servicio totalmente gratuito.'}&quot;</p><div className="pt-6 grid gap-3"><div className="bg-surface p-4 rounded-2xl border border-accent-green/20 flex items-center gap-4 text-left shadow-sm"><Zap size={18} className="text-accent-green" /><p className="text-[10px] font-bold uppercase text-zinc-700">Meta: {loyaltyThreshold} Visitas</p></div><div className="bg-surface p-4 rounded-2xl border border-accent-green/20 flex items-center gap-4 text-left shadow-sm"><Gift size={18} className="text-accent-green" /><p className="text-[10px] font-bold uppercase text-zinc-700">Premio: Corte Gratis</p></div></div></div>
                  <button onClick={() => setShowRules(false)} className="w-full max-w-xs bg-brand hover:bg-accent-green text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] mt-10 transition-colors">Entendido</button>
               </div>
            </motion.div>
         )}</AnimatePresence>
      </div>
   );
}
