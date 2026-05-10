'use client';
import { useState } from 'react';
import { useBarberFinance, useBarberStats } from '@/hooks/useBarberData';
import { 
  TrendingUp, 
  Clock, 
  Calendar, 
  X, 
  Activity,
  User,
  CheckCircle2
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useGlobalStore } from '@/store/useGlobalStore';
import { Settlement } from '@/types';

export default function BarberStatsPage() {
  const params = useParams();
  const barberId = params.id as string;
  const userProfile = useGlobalStore(state => state.userProfile);
  
  const [timeFilter, setTimeFilter] = useState<'today' | 'custom'>('today');
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
         <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-xl">
            <button 
              onClick={() => { setTimeFilter('today'); setRange(undefined); }}
              className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${timeFilter === 'today' ? 'bg-[#f59e0b] text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              Hoy
            </button>
            <button 
              onClick={() => setShowCalendar(true)}
              className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl flex items-center gap-3 ${timeFilter === 'custom' ? 'bg-[#f59e0b] text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              <Calendar size={14} />
              {timeFilter === 'custom' && range?.from ? `${format(range.from, 'dd MMM')}...` : 'Filtrar'}
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
         <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden group">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 md:mb-4">Total Periodo</p>
            <p className="text-2xl md:text-4xl font-black italic text-white tracking-tighter leading-none">${new Intl.NumberFormat('de-DE').format(currentStats.income)}</p>
            <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-white/5 flex items-center justify-between">
               <span className="text-[9px] font-black uppercase tracking-widest text-[#f59e0b]">{currentStats.serviceCount} Servicios</span>
            </div>
         </div>

         <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden group">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2 md:mb-4">Mi Ganancia ({commission}%)</p>
            <p className="text-2xl md:text-4xl font-black italic text-white tracking-tighter leading-none">${new Intl.NumberFormat('de-DE').format(currentStats.barberEarnings)}</p>
            <Activity size={180} className="absolute -bottom-16 -right-16 opacity-5 text-emerald-500 group-hover:scale-110 transition-transform duration-1000" />
         </div>

         <div className="bg-amber-500/10 border border-amber-500/20 rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden group">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2 md:mb-4">Aporte Local</p>
            <p className="text-2xl md:text-4xl font-black italic text-white tracking-tighter leading-none">${new Intl.NumberFormat('de-DE').format(currentStats.shopEarnings)}</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
         {/* SECCION DE COBROS PENDIENTES */}
         <div className="space-y-8">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/30 px-2 flex items-center gap-3">
               <Clock size={16} /> Estado de Pagos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-6 md:p-8 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#f59e0b]">Por Cobrar</p>
                  <p className="text-2xl md:text-4xl font-black italic text-white tracking-tighter leading-none">${new Intl.NumberFormat('de-DE').format(myPendingEarnings)}</p>
                  <div className="h-px bg-white/5 w-full mt-4 md:mt-6" />
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{pendingApps.length} servicios sin liquidar</p>
               </div>
               <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[2.5rem] p-6 md:p-8 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Recibido Total</p>
                  <p className="text-2xl md:text-4xl font-black italic text-white tracking-tighter leading-none">${new Intl.NumberFormat('de-DE').format(myAlreadySettledEarnings)}</p>
                  <div className="h-px bg-white/5 w-full mt-4 md:mt-6" />
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Liquidaciones históricas</p>
               </div>
            </div>

            <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-10 space-y-6">
               <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30">Próximos Pagos</h4>
                  <span className="text-[9px] font-black uppercase text-[#f59e0b] underline">Ver todos</span>
               </div>
               <div className="space-y-3">
                  {pendingApps.length === 0 ? (
                    <p className="text-[10px] text-white/20 font-bold uppercase py-6 italic text-center">Todo al día</p>
                  ) : (
                    pendingApps.slice(0, 4).map(apt => (
                      <div key={apt.id} className="bg-white/5 border border-white/5 p-5 rounded-2xl flex justify-between items-center group hover:bg-[#f59e0b]/5 transition-all">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20">
                               <User size={18} />
                            </div>
                            <div>
                               <p className="text-[11px] font-black text-white uppercase truncate max-w-[120px]">{apt.client?.name || apt.client_name}</p>
                               <p className="text-[8px] font-black text-white/30 uppercase">{format(new Date(apt.start_time), 'dd MMM')}</p>
                            </div>
                         </div>
                         <p className="text-lg font-black italic text-[#f59e0b]">${new Intl.NumberFormat('de-DE').format((Number(apt.price) * commission) / 100)}</p>
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
            <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-10 space-y-8 max-h-[600px] overflow-y-auto custom-scrollbar">
               {finance.settlements.length === 0 ? (
                  <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-20">
                     <p className="text-[10px] font-black uppercase tracking-[0.4em]">Sin pagos registrados</p>
                  </div>
               ) : (
                  <div className="space-y-6">
                      {finance.settlements.map((s: Settlement) => (
                         <div key={s.id} className="bg-white/5 border border-white/5 p-8 rounded-[2rem] hover:bg-emerald-500/5 hover:border-emerald-500/20 transition-all group relative overflow-hidden">
                            <div className="relative z-10 flex justify-between items-center">
                               <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-[#f59e0b] mb-2">{format(new Date(s.created_at), 'dd MMMM, yyyy', { locale: es })}</p>
                                  <p className="text-xs font-black text-white uppercase tracking-tight italic">Cierre Efectuado</p>
                                  {s.notes && <p className="text-[9px] text-white/40 mt-3 font-medium max-w-[200px]">&quot;{s.notes}&quot;</p>}
                               </div>
                              <div className="text-right">
                                 <p className="text-2xl font-black italic text-emerald-500 leading-none">${new Intl.NumberFormat('de-DE').format(s.barber_earnings)}</p>
                                 <p className="text-[8px] font-black text-white/20 uppercase mt-4 tracking-widest">Liquidado por: {s.settled_by_profile?.name || 'Admin'}</p>
                              </div>
                           </div>
                           <TrendingUp size={160} className="absolute -bottom-16 -right-16 opacity-[0.02] text-emerald-500" />
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
