/* eslint-disable @next/next/no-img-element */
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useClientAppointments, usePromotions, useLoyaltySettings } from '@/hooks/useClientData';
import { Scissors, Star, CalendarIcon, Sparkles, UserCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Profile } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

export function ClientDashboard({ profile }: { profile: Profile }) {
  const [showRules, setShowRules] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const router = useRouter();

  // Optimized Fetching with React Query (Senior Pattern)
  const { data: barbers = [] } = useQuery({
    queryKey: ['barbers-active'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'barber').eq('is_active', true);
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });

  const { data: aptsRaw = [], isLoading: loadingApts } = useClientAppointments(profile.id);
  const { data: promos, isLoading: loadingPromos } = usePromotions();

  // Intelligent Sorting for Dashboard (Senior UX Pattern)
  const apts = [...aptsRaw].sort((a, b) => {
    const isUpcoming = (s: string) => s === 'pending' || s === 'confirmed';
    const aUp = isUpcoming(a.status);
    const bUp = isUpcoming(b.status);
    if (aUp && !bUp) return -1;
    if (!aUp && bUp) return 1;
    const dateA = new Date(a.start_time).getTime();
    const dateB = new Date(b.start_time).getTime();
    return aUp ? dateA - dateB : dateB - dateA;
  });
  const { data: loyalty, isLoading: loadingLoyalty } = useLoyaltySettings();

  const loyaltyThreshold = loyalty?.appointments_threshold || 10;
  const isLoyaltyEnabled = !!loyalty?.is_enabled;

  const completedCount = apts?.filter(a => {
    if (a.status !== 'completed') return false;
    if (a.is_loyalty_reward) return false;

    // Filtro por fecha de vigencia
    if (loyalty?.start_date && new Date(a.start_time) < new Date(loyalty.start_date)) return false;
    if (loyalty?.end_date && new Date(a.start_time) > new Date(loyalty.end_date)) return false;

    // Filtro por servicios autorizados
    if (loyalty?.service_ids && loyalty.service_ids.length > 0) {
      // Verificar si alguno de los servicios de la cita está en la lista de autorizados
      const hasAuthorizedService = a.services_data?.some(srv =>
        loyalty.service_ids?.includes(srv.id)
      );
      if (!hasAuthorizedService) return false;
    }

    return true;
  }).length || 0;

  const activePromos = promos || [];
  const loading = loadingApts || loadingPromos || loadingLoyalty;

  const formatPrice = (price: number) => new Intl.NumberFormat('de-DE').format(price);

  return (
    <div className="relative overflow-x-hidden">
      {/* Background Photo - Hero Style */}
      <div className="fixed inset-0 h-[100dvh] w-full z-0 overflow-hidden">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="BG" className="w-full h-full object-cover opacity-30" />
        ) : (
          <img src="/nathon-oski-EW_rqoSdDes-unsplash.jpg" alt="Shop" className="w-full h-full object-cover opacity-25" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
      </div>

      <div className="relative z-10 max-w-md mx-auto p-4 space-y-5 pt-6">

        {/* Welcome - Mas compacto */}
        <div className="space-y-0.5 px-1">
          <p className="text-amber-500 text-[9px] font-black uppercase tracking-[0.4em]">Mi Perfil</p>
          <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none">¡Hola, {profile.nickname || profile.name.split(' ')[0]}!</h1>
        </div>

        {/* Loyalty Program Section - Mas compacta */}
        {isLoyaltyEnabled && (
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-5 shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-amber-500">
                  <Scissors size={12} />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">Club Elite Rewards</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowRules(true)}
                    className="text-[8px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors border border-white/10 px-2 py-0.5 rounded-md bg-white/5"
                  >
                    Reglas
                  </button>
                  <span className="text-lg font-black italic text-white leading-none">{completedCount % loyaltyThreshold}/{loyaltyThreshold}</span>
                </div>
              </div>

              <div className="h-2 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.3)] transition-all duration-1000"
                  style={{ width: `${((completedCount % loyaltyThreshold) / loyaltyThreshold) * 100}%` }}
                />
              </div>

              <div className="flex justify-between items-center">
                <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest leading-tight max-w-[200px]">
                  {completedCount % loyaltyThreshold === 0 && completedCount > 0
                    ? "¡Corte GRATIS disponible!"
                    : `${loyaltyThreshold - (completedCount % loyaltyThreshold)} visitas para tu premio`}
                </p>
                <Star size={14} className={completedCount % loyaltyThreshold === 0 && completedCount > 0 ? "text-amber-500 animate-pulse" : "text-white/10"} fill="currentColor" />
              </div>
            </div>
          </div>
        )}

        {/* Modal de Reglas */}
        {showRules && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-zinc-900 border border-white/10 rounded-[3rem] p-10 max-w-sm w-full space-y-6 relative">
              <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star size={32} fill="currentColor" />
              </div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-center">Reglas del <span className="text-amber-500">Programa</span></h3>
              <div className="space-y-4">
                <p className="text-xs text-white/70 font-medium italic leading-relaxed text-center">
                  &quot;{loyalty?.description || 'Completa tu meta de visitas para obtener un servicio gratis.'}&quot;
                </p>
                <div className="bg-white/5 p-5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-zinc-500 uppercase">Vigencia desde</span>
                    <span className="text-[9px] font-black text-white uppercase">{loyalty?.start_date ? format(new Date(loyalty.start_date), 'dd MMM yyyy') : 'No definida'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-zinc-500 uppercase">Vigencia hasta</span>
                    <span className="text-[9px] font-black text-white uppercase">{loyalty?.end_date ? format(new Date(loyalty.end_date), 'dd MMM yyyy') : 'No definida'}</span>
                  </div>
                  <div className="pt-3 border-t border-white/5">
                    <p className="text-[8px] font-black text-zinc-500 uppercase text-center">Válido para servicios seleccionados por la administración</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowRules(false)}
                className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-[10px]"
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        {/* Active Promotions Section */}
        {activePromos.length > 0 && (
          <div className="space-y-4 animate-in slide-in-from-left-4 duration-500">
             <div className="flex items-center gap-3 px-1">
                <Sparkles size={16} className="text-[#f59e0b]" />
                <h3 className="text-sm font-black uppercase tracking-widest italic">Ofertas Elite</h3>
             </div>
             <div className="grid grid-cols-1 gap-3">
                {activePromos.map(promo => (
                   <div key={promo.id} className="bg-white/[0.03] backdrop-blur-md border border-white/5 rounded-[1.5rem] p-4 flex justify-between items-center group hover:bg-white/[0.06] transition-all">
                      <div className="space-y-1">
                         <p className="text-[10px] font-black uppercase tracking-widest text-white">{promo.name}</p>
                         <p className="text-[8px] font-medium text-white/40 uppercase tracking-tighter italic">{promo.description}</p>
                      </div>
                      <div className="text-right">
                         <span className="text-xs font-black text-[#f59e0b] italic">
                            {promo.discount_type === 'percentage' ? `-${promo.discount_value}%` : `-$${formatPrice(promo.discount_value)}`}
                         </span>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* Botón Agendar Cita - Integrado en el flujo */}
        <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
           <button 
            onClick={() => setShowBooking(true)}
            className="w-full bg-[#f59e0b] text-black py-6 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group"
           >
             <CalendarIcon size={20} className="group-hover:rotate-12 transition-transform" /> 
             AGENDAR CITA
           </button>
        </div>
      </div>

      {/* Booking Drawer Overlay */}
        <AnimatePresence>
          {showBooking && (
            <div className="fixed inset-0 z-[120] flex items-end justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={() => setShowBooking(false)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-lg bg-[#0a0a0a] border-t border-white/10 rounded-t-[3rem] p-8 pb-32 space-y-8 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
              >
                {/* Handle */}
                <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto" />

                <div className="space-y-1 text-center">
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Selecciona tu <span className="text-[#f59e0b]">Barbero</span></h2>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Nuestros maestros del estilo</p>
                </div>

                <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                 {barbers.map((barber, index) => (
                    <motion.div 
                      key={barber.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/[0.03] border border-white/5 p-4 rounded-[2rem] flex items-center gap-4 group hover:bg-white/[0.06] transition-all"
                    >
                       {/* Foto */}
                       <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                          {barber.avatar_url ? (
                             <img src={barber.avatar_url} alt={barber.name} className="w-full h-full object-cover" />
                          ) : (
                             <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-white/20">
                                <UserCircle size={30} />
                             </div>
                          )}
                       </div>

                       {/* Info */}
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                             <p className="text-sm font-black uppercase tracking-tight text-white truncate">{barber.nickname || barber.name.split(' ')[0]}</p>
                             <div className={`w-1.5 h-1.5 rounded-full ${barber.is_online ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                          </div>
                          <p className="text-[8px] font-bold text-[#f59e0b] uppercase tracking-[0.2em] opacity-70">Master Barber</p>
                       </div>

                       {/* Acciones */}
                       <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => router.push(`/profile/${barber.id}`)}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-zinc-400 transition-all"
                          >
                             Perfil
                          </button>
                          <button 
                            onClick={() => router.push(`/barber/${barber.id}`)}
                            className="px-4 py-2 bg-[#f59e0b] hover:bg-[#f59e0b]/80 text-black rounded-xl text-[8px] font-black uppercase tracking-widest transition-all"
                          >
                             Agendar
                          </button>
                       </div>
                    </motion.div>
                 ))}
                </div>

                <button
                  onClick={() => setShowBooking(false)}
                  className="w-full text-[10px] font-black uppercase tracking-widest text-zinc-500 py-2"
                >
                  Cancelar
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      {loading && (
        <div className="fixed inset-0 z-[100] bg-[#050505] p-4 pt-24 space-y-6 overflow-hidden">
           {/* Skeleton Header */}
           <div className="space-y-2">
              <div className="w-24 h-4 bg-white/5 rounded-full animate-pulse" />
              <div className="w-48 h-10 bg-white/5 rounded-xl animate-pulse" />
           </div>
           {/* Skeleton Card */}
           <div className="h-48 w-full bg-white/5 rounded-[2.5rem] animate-pulse" />
           {/* Skeleton List */}
           <div className="space-y-4">
              <div className="w-32 h-4 bg-white/5 rounded-full animate-pulse" />
              <div className="h-24 w-full bg-white/5 rounded-3xl animate-pulse" />
              <div className="h-24 w-full bg-white/5 rounded-3xl animate-pulse" />
           </div>
        </div>
      )}
    </div>
  );
}
