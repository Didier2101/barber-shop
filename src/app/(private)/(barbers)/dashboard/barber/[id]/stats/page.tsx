'use client';
import { useState } from 'react';
import { useBarberFinance, useBarberStats } from '@/hooks/barber';
import {
   Clock,
   Calendar,
   X,
   User,
   CheckCircle2
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useGlobalStore } from '@/store/useGlobalStore';
import { Appointment, Settlement } from '@/types';
import Image from 'next/image';
import { formatPrice } from '@/lib/format';
import { motion } from 'framer-motion';

export default function BarberStatsPage() {
   const params = useParams();
   const barberId = params.id as string;
   const userProfile = useGlobalStore(state => state.userProfile);

   const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('today');
   const [range, setRange] = useState<DateRange | undefined>();
   const [showCalendar, setShowCalendar] = useState(false);

   const { data: bStats } = useBarberStats(barberId, timeFilter, range?.from ? { from: range.from, to: range.to } : undefined);
   const { data: financeData, isLoading } = useBarberFinance(barberId);

   if (isLoading) {
      return (
         <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
         </div>
      );
   }

   const commission = userProfile?.commission_percentage || 50;

   const currentStats = bStats ? {
      income: bStats.income,
      serviceCount: bStats.serviceCount,
      barberEarnings: (bStats.income * commission) / 100,
      shopEarnings: bStats.income - (bStats.income * commission) / 100
   } : { income: 0, serviceCount: 0, barberEarnings: 0, shopEarnings: 0 };

   const finance = financeData || { appointments: [], settlements: [] };

   const pendingApps = finance.appointments.filter(a => !a.settlement_id);
   const totalPendingPayment = pendingApps.reduce((a, c) => a + Number(c.price), 0);
   const myPendingEarnings = (totalPendingPayment * commission) / 100;

   const myAlreadySettledEarnings = finance.settlements.reduce((a, s) => a + Number(s.barber_earnings), 0);

   return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
               <p className="text-brand text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em]">Finanzas y Rendimiento</p>
               <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter italic leading-none text-zinc-900">Mi Billetera</h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
               {(['today', 'week', 'month', 'year'] as const).map(f => (
                 <button
                   key={f}
                   onClick={() => { setTimeFilter(f); setRange(undefined); }}
                   className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl border ${timeFilter === f ? 'bg-brand/10 border-brand/30 text-brand' : 'border-accent-green/20 text-zinc-400 hover:text-zinc-900'}`}
                 >
                   {f === 'today' ? 'Hoy' : f === 'week' ? 'Semana' : f === 'month' ? 'Mes' : 'Año'}
                 </button>
               ))}
               <button
                  onClick={() => setShowCalendar(true)}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl flex items-center gap-2 border ${timeFilter === 'custom' ? 'bg-brand/10 border-brand/30 text-brand' : 'border-accent-green/20 text-zinc-400 hover:text-zinc-900'}`}
               >
                  <Calendar size={14} />
                  {timeFilter === 'custom' && range?.from ? `${format(range.from, 'dd MMM')}` : 'Filtro'}
               </button>
            </div>
         </div>

         <div className="flex flex-col border-t border-accent-green/20 mt-6 pt-4">
            <motion.div
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="border-b border-accent-green/20 py-6 relative group flex items-center justify-between"
            >
               <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-1">Total Bruto</p>
                  <p className="text-xl md:text-2xl font-black italic text-zinc-900 tracking-tighter leading-none">{formatPrice(currentStats.income)}</p>
               </div>
               <span className="text-[9px] font-black uppercase tracking-widest text-brand px-4 py-2 border border-brand/20 bg-brand/5 rounded-xl">{currentStats.serviceCount} Servicios</span>
            </motion.div>

            <motion.div
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="border-b border-accent-green/20 py-6 relative group"
            >
               <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500 mb-1">Mi Ganancia ({commission}%)</p>
               <p className="text-xl md:text-2xl font-black italic text-zinc-900 tracking-tighter leading-none">{formatPrice(currentStats.barberEarnings)}</p>
            </motion.div>

            <motion.div
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="border-b border-accent-green/20 py-6 relative group"
            >
               <p className="text-[8px] font-black uppercase tracking-widest text-amber-500 mb-1">Aporte Local</p>
               <p className="text-xl md:text-2xl font-black italic text-zinc-900 tracking-tighter leading-none">{formatPrice(currentStats.shopEarnings)}</p>
            </motion.div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* SECCION DE COBROS PENDIENTES */}
            <div className="space-y-8">
               <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400 px-2 flex items-center gap-3">
                  <Clock size={16} /> Estado de Pagos
               </h3>
               <div className="flex flex-col border-t border-accent-green/20 mt-4">
                  <motion.div
                     initial={{ opacity: 0, x: -20 }}
                     whileInView={{ opacity: 1, x: 0 }}
                     className="border-b border-accent-green/20 py-6 space-y-2"
                  >
                     <p className="text-[8px] font-black uppercase tracking-widest text-brand">Por Cobrar</p>
                     <p className="text-xl md:text-2xl font-black italic text-zinc-900 tracking-tighter leading-none">{formatPrice(myPendingEarnings)}</p>
                     <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest pt-2">{pendingApps.length} servicios pendientes</p>
                  </motion.div>
                  <motion.div
                     initial={{ opacity: 0, x: 20 }}
                     whileInView={{ opacity: 1, x: 0 }}
                     className="border-b border-accent-green/20 py-6 space-y-2"
                  >
                     <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Ya Recibido</p>
                     <p className="text-xl md:text-2xl font-black italic text-zinc-900 tracking-tighter leading-none">{formatPrice(myAlreadySettledEarnings)}</p>
                     <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest pt-2">Liquidado</p>
                  </motion.div>
               </div>

               <div className="pt-8">
                  <div className="flex justify-between items-center pb-4 border-b border-accent-green/20">
                     <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic">Últimos Servicios Cobrados</h4>
                     <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                  </div>
                  <div className="flex flex-col border-t border-accent-green/20">
                     {pendingApps.length === 0 ? (
                        <p className="text-[9px] text-zinc-400 font-black uppercase py-10 italic text-center tracking-[0.3em] border-b border-accent-green/20">Todo Liquidado</p>
                     ) : (
                        pendingApps.slice(0, 10).map((apt) => (
                           <div
                              key={apt.id}
                              className="border-b border-accent-green/20 py-5 flex justify-between items-center group hover:bg-brand/5 transition-all relative z-10"
                           >
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand/50 border border-brand/20 shrink-0 overflow-hidden">
                                    {(apt as Appointment).client?.avatar_url ? <Image src={(apt as Appointment).client!.avatar_url!} width={40} height={40} alt={apt.client?.name || 'Cliente'} className="w-full h-full object-cover" /> : <User size={16} />}
                                 </div>
                                 <div className="min-w-0">
                                    <p className="text-[11px] font-black text-zinc-900 uppercase truncate max-w-[140px] leading-none mb-1">{apt.client?.name || apt.client_name}</p>
                                    <div className="flex items-center gap-2">
                                       <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{format(new Date(apt.start_time), 'dd/MM/yy')}</span>
                                    </div>
                                 </div>
                              </div>
                              <p className="text-[12px] font-black italic text-brand">{formatPrice((Number(apt.price) * commission) / 100)}</p>
                           </div>
                        ))
                     )}
                  </div>
               </div>
            </div>

            {/* SECCION DE HISTORIAL DE LIQUIDACIONES */}
            <div className="space-y-8">
               <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400 px-2 flex items-center gap-3">
                  <CheckCircle2 size={16} /> Historial de Cierres
               </h3>
               <div className="mb-24 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar border-t border-accent-green/20 mt-4">
                  {finance.settlements.length === 0 ? (
                     <div className="py-20 text-center border-b border-accent-green/20 opacity-30">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Sin pagos registrados</p>
                     </div>
                  ) : (
                     <div className="flex flex-col border-t border-accent-green/20">
                        {finance.settlements.map((s: Settlement) => (
                           <div
                              key={s.id}
                              className="border-b border-accent-green/20 py-6 transition-all group relative hover:bg-brand/5 px-2 z-10"
                           >
                              <div className="relative z-10 flex justify-between items-center">
                                 <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-brand">{format(new Date(s.created_at), 'dd/MM/yyyy')}</p>
                                    <p className="text-[12px] font-black text-zinc-900 uppercase tracking-tight italic">Cierre Efectuado</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-xl font-black italic text-emerald-500 leading-none">{formatPrice(s.barber_earnings)}</p>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* CALENDARIO DE FILTRO */}
         {showCalendar && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
               <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCalendar(false)} />
               <div className="relative bg-surface border border-accent-green/20 rounded-2xl p-10 shadow-2xl animate-in zoom-in-95 duration-300 max-w-[420px] w-full">
                  <div className="flex justify-between items-center mb-8 border-b border-accent-green/20 pb-6">
                     <div className="space-y-1">
                        <h3 className="text-brand text-[10px] font-black uppercase tracking-[0.4em]">Filtro</h3>
                        <p className="text-2xl font-black text-zinc-900 italic tracking-tighter">Periodo</p>
                     </div>
                     <button onClick={() => setShowCalendar(false)} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                        <X size={24} />
                     </button>
                  </div>
                  <div className="flex justify-center bg-brand/5 rounded-3xl p-4 border border-brand/20">
                     <DayPicker
                        mode="range"
                        selected={range}
                        onSelect={(r) => { setRange(r); if (r?.from) setTimeFilter('custom'); }}
                        locale={es}
                        className="rdp-stats-custom"
                     />
                  </div>
                  <div className="pt-8 mt-6 border-t border-accent-green/20">
                     <button
                        onClick={() => setShowCalendar(false)}
                        className="w-full border border-brand/30 text-brand hover:bg-brand/10 py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] transition-all"
                     >
                        Aplicar Filtro
                     </button>
                  </div>
               </div>
            </div>
         )}

         <style>{`
         .rdp-stats-custom { --rdp-cell-size: 45px; --rdp-accent-color: var(--color-accent-pink); color: #18181b; }
         .rdp-day_selected { background-color: var(--color-accent-pink) !important; color: white !important; font-weight: 900; }
      `}</style>
      </div>
   );
}

