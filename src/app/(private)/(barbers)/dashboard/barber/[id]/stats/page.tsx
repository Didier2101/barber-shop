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
            <div className="w-8 h-8 border-4 border-[#f59e0b] border-t-transparent rounded-full animate-spin"></div>
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
               <p className="text-[#f59e0b] text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em]">Finanzas y Rendimiento</p>
               <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter italic leading-none text-white">Mi Billetera</h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
               {(['today', 'week', 'month', 'year'] as const).map(f => (
                 <button
                   key={f}
                   onClick={() => { setTimeFilter(f); setRange(undefined); }}
                   className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${timeFilter === f ? 'bg-[#f59e0b] text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                 >
                   {f === 'today' ? 'Hoy' : f === 'week' ? 'Semana' : f === 'month' ? 'Mes' : 'Año'}
                 </button>
               ))}
               <button
                  onClick={() => setShowCalendar(true)}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl flex items-center gap-2 ${timeFilter === 'custom' ? 'bg-[#f59e0b] text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
               >
                  <Calendar size={14} />
                  {timeFilter === 'custom' && range?.from ? `${format(range.from, 'dd MMM')}` : 'Filtro'}
               </button>
            </div>
         </div>

         <div className="flex flex-col -space-y-px">
            <motion.div
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="bg-black/80 border border-white/10 backdrop-blur-2xl rounded-t-2xl p-4 md:p-5 relative overflow-hidden group"
            >
               <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Total Bruto</p>
               <p className="text-xl md:text-2xl font-black italic text-white tracking-tighter leading-none">{formatPrice(currentStats.income)}</p>
               <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[7px] font-black uppercase tracking-widest text-[#f59e0b]">{currentStats.serviceCount} Servicios</span>
               </div>
            </motion.div>

            <motion.div
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="bg-black/80 border border-white/10 backdrop-blur-2xl p-4 md:p-5 relative overflow-hidden group"
            >
               <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500 mb-1">Mi Ganancia ({commission}%)</p>
               <p className="text-xl md:text-2xl font-black italic text-white tracking-tighter leading-none">{formatPrice(currentStats.barberEarnings)}</p>
            </motion.div>

            <motion.div
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="bg-black/80 border border-white/10 backdrop-blur-2xl rounded-b-2xl p-4 md:p-5 relative overflow-hidden group"
            >
               <p className="text-[8px] font-black uppercase tracking-widest text-amber-500 mb-1">Aporte Local</p>
               <p className="text-xl md:text-2xl font-black italic text-white tracking-tighter leading-none">{formatPrice(currentStats.shopEarnings)}</p>
            </motion.div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* SECCION DE COBROS PENDIENTES */}
            <div className="space-y-8">
               <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/30 px-2 flex items-center gap-3">
                  <Clock size={16} /> Estado de Pagos
               </h3>
               <div className="flex flex-col -space-y-px">
                  <motion.div
                     initial={{ opacity: 0, x: -20 }}
                     whileInView={{ opacity: 1, x: 0 }}
                     className="bg-black/80 border border-white/10 backdrop-blur-2xl rounded-t-2xl p-4 md:p-5 space-y-2"
                  >
                     <p className="text-[8px] font-black uppercase tracking-widest text-[#f59e0b]">Por Cobrar</p>
                     <p className="text-xl md:text-2xl font-black italic text-white tracking-tighter leading-none">{formatPrice(myPendingEarnings)}</p>
                     <div className="h-px bg-white/5 w-full mt-2" />
                     <p className="text-[7px] font-black text-white/30 uppercase tracking-widest">{pendingApps.length} servicios pendientes</p>
                  </motion.div>
                  <motion.div
                     initial={{ opacity: 0, x: 20 }}
                     whileInView={{ opacity: 1, x: 0 }}
                     className="bg-black/80 border border-white/10 backdrop-blur-2xl rounded-b-2xl p-4 md:p-5 space-y-2"
                  >
                     <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Ya Recibido</p>
                     <p className="text-xl md:text-2xl font-black italic text-white tracking-tighter leading-none">{formatPrice(myAlreadySettledEarnings)}</p>
                     <div className="h-px bg-white/5 w-full mt-2" />
                     <p className="text-[7px] font-black text-white/30 uppercase tracking-widest">Liquidado</p>
                  </motion.div>
               </div>

               <div className="bg-black/80 border border-white/10 backdrop-blur-2xl rounded-2xl p-4 md:p-5 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                     <h4 className="text-[8px] font-black uppercase tracking-widest text-white/30 italic">Últimos Servicios Cobrados</h4>
                     <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
                  </div>
                  <div className="flex flex-col -space-y-px">
                     {pendingApps.length === 0 ? (
                        <p className="text-[8px] text-white/10 font-black uppercase py-8 italic text-center tracking-[0.3em] bg-black/40 rounded-2xl border border-white/5">Todo Liquidado</p>
                     ) : (
                        pendingApps.slice(0, 10).map((apt, idx, arr) => (
                           <div
                              key={apt.id}
                              className={`
                          bg-black/80 border border-white/10 p-3 flex justify-between items-center group hover:bg-white/[0.02] transition-all relative z-10 hover:z-20
                          ${idx === 0 ? 'rounded-t-2xl' : ''}
                          ${idx === arr.length - 1 ? 'rounded-b-2xl' : ''}
                        `}
                           >
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 border border-white/5 shrink-0 overflow-hidden">
                                    {(apt as Appointment).client?.avatar_url ? <Image src={(apt as Appointment).client!.avatar_url!} width={32} height={32} alt={apt.client?.name || 'Cliente'} className="w-full h-full object-cover" /> : <User size={14} />}
                                 </div>
                                 <div className="min-w-0">
                                    <p className="text-[10px] font-black text-white uppercase truncate max-w-[120px] leading-none mb-1">{apt.client?.name || apt.client_name}</p>
                                    <div className="flex items-center gap-2">
                                       <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">{format(new Date(apt.start_time), 'dd/MM')}</span>
                                    </div>
                                 </div>
                              </div>
                              <p className="text-[11px] font-black italic text-[#f59e0b]">{formatPrice((Number(apt.price) * commission) / 100)}</p>
                           </div>
                        ))
                     )}
                  </div>
               </div>
            </div>

            {/* SECCION DE HISTORIAL DE LIQUIDACIONES */}
            <div className="space-y-8">
               <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/30 px-2 flex items-center gap-3">
                  <CheckCircle2 size={16} /> Historial de Cierres
               </h3>
               <div className="mb-24 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {finance.settlements.length === 0 ? (
                     <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-20">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Sin pagos registrados</p>
                     </div>
                  ) : (
                     <div className="flex flex-col -space-y-px">
                        {finance.settlements.map((s: Settlement, idx, arr) => (
                           <div
                              key={s.id}
                              className={`
                             bg-black/80 border border-white/10 p-4 transition-all group relative overflow-hidden z-10 hover:z-20 hover:bg-white/[0.02]
                             ${idx === 0 ? 'rounded-t-2xl' : ''}
                             ${idx === arr.length - 1 ? 'rounded-b-2xl' : ''}
                           `}
                           >
                              <div className="relative z-10 flex justify-between items-center">
                                 <div className="space-y-1">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-[#f59e0b]">{format(new Date(s.created_at), 'dd/MM/yyyy')}</p>
                                    <p className="text-[11px] font-black text-white uppercase tracking-tight italic">Cierre Efectuado</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-lg font-black italic text-emerald-500 leading-none">{formatPrice(s.barber_earnings)}</p>
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
               <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowCalendar(false)} />
               <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300 max-w-[420px] w-full">
                  <div className="flex justify-between items-center mb-10">
                     <div className="space-y-1">
                        <h3 className="text-[#f59e0b] text-[10px] font-black uppercase tracking-[0.4em]">Filtro</h3>
                        <p className="text-2xl font-black text-white italic tracking-tighter">Periodo de Tiempo</p>
                     </div>
                     <button onClick={() => setShowCalendar(false)} className="bg-white/5 p-3 rounded-2xl text-white/40 hover:text-white transition-colors">
                        <X size={24} />
                     </button>
                  </div>
                  <div className="bg-white rounded-[2.5rem] p-6 flex justify-center">
                     <DayPicker
                        mode="range"
                        selected={range}
                        onSelect={(r) => { setRange(r); if (r?.from) setTimeFilter('custom'); }}
                        locale={es}
                        className="rdp-stats-custom"
                     />
                  </div>
                  <button
                     onClick={() => setShowCalendar(false)}
                     className="w-full mt-10 bg-[#f59e0b] text-black py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-amber-500/10 active:scale-95 transition-all"
                  >
                     Aplicar Filtro
                  </button>
               </div>
            </div>
         )}

         <style>{`
         .rdp-stats-custom { --rdp-cell-size: 45px; --rdp-accent-color: #f59e0b; color: #111; }
         .rdp-day_selected { background-color: #f59e0b !important; color: black !important; font-weight: 900; }
      `}</style>
      </div>
   );
}

