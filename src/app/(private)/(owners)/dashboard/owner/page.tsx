'use client';
import { useOwnerBaseData, useOwnerStats, useTodayAppointments } from '@/hooks/useOwnerData';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Activity, 
  TrendingDown, 
  Sparkles,
  Briefcase
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function OwnerDashboardPage() {
  const { isLoading: baseLoading } = useOwnerBaseData();
  const { data: currentStats } = useOwnerStats();
  const { data: todayApts = [] } = useTodayAppointments();

  const stats = currentStats || {
    grossIncome: 0,
    ownerIncome: 0,
    pendingOwnerIncome: 0,
    settledOwnerIncome: 0,
    expense: 0,
    profit: 0,
    margin: 0,
  };

  if (baseLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#f59e0b]/20 border-t-[#f59e0b] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-32">
      {/* HEADER SERIO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-black/80 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl">
            <LayoutDashboard size={28} className="text-[#f59e0b]" />
          </div>
          <div>
            <p className="text-[#f59e0b] text-[10px] font-black uppercase tracking-[0.4em] mb-1">Visión General</p>
            <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">Inicio de Cuenta</h2>
          </div>
        </div>
        <div className="bg-black/40 border border-white/5 px-6 py-3 rounded-2xl">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Estado del Negocio</p>
          <p className="text-sm font-black text-[#f59e0b] uppercase tracking-tighter italic">Operativo • {format(new Date(), 'dd MMM yyyy')}</p>
        </div>
      </div>

      {/* MÉTRICAS DE PRECISIÓN (ESTILO TICKER) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 flex flex-col lg:flex-row -space-y-px lg:-space-y-0 lg:-space-x-px">
        {[
          { label: 'Ventas Brutas', value: stats.grossIncome, icon: TrendingUp, color: 'text-white', sub: 'Facturación Total' },
          { label: 'En Caja (Pendiente)', value: stats.pendingOwnerIncome, icon: Activity, color: 'text-[#f59e0b]', sub: 'Por Liquidar' },
          { label: 'Gastos del Mes', value: stats.expense, icon: TrendingDown, color: 'text-red-500', sub: 'Salida de Capital' },
          { label: 'Utilidad Neta', value: stats.profit, icon: Sparkles, color: 'text-emerald-500', sub: 'Beneficio Final' }
        ].map((item, idx, arr) => (
          <div 
            key={item.label}
            className={`
              bg-black/80 border border-white/10 p-6 md:p-8 flex flex-col justify-between transition-all group hover:bg-black/90
              ${idx === 0 ? 'rounded-t-[2.5rem] lg:rounded-tr-none lg:rounded-l-[2.5rem]' : ''}
              ${idx === arr.length - 1 ? 'rounded-b-[2.5rem] lg:rounded-bl-none lg:rounded-r-[2.5rem]' : ''}
            `}
          >
            <div className="flex justify-between items-start mb-6">
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{item.label}</p>
              <item.icon size={16} className={`${item.color} opacity-40 group-hover:opacity-100 transition-all`} />
            </div>
            <div className="space-y-1">
              <p className={`text-3xl md:text-4xl font-black italic tracking-tighter leading-none ${item.color}`}>
                ${new Intl.NumberFormat('de-DE').format(item.value)}
              </p>
              <p className="text-[8px] font-black uppercase tracking-widest text-white/10">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* MONITOR DE ACTIVIDAD (AGENDA) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#f59e0b] flex items-center gap-3">
            <Briefcase size={16} /> Agenda de Operaciones
          </h3>
          <span className="text-[8px] font-black text-white/20 uppercase tracking-widest italic">{todayApts.length} Servicios registrados hoy</span>
        </div>
        
        <div className="flex flex-col -space-y-px">
          {todayApts.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-30 flex flex-col items-center justify-center gap-4">
              <Activity size={40} className="text-white/20" />
              <p className="text-[9px] font-black uppercase tracking-[0.3em]">Sin actividad registrada hoy</p>
            </div>
          ) : (
            todayApts.map((apt, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={apt.id} 
                className={`
                  bg-black/80 border border-white/10 p-5 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4 transition-all group relative z-10 hover:z-20
                  ${idx === 0 ? 'rounded-t-[2rem]' : ''}
                  ${idx === todayApts.length - 1 ? 'rounded-b-[2rem]' : ''}
                `}
              >
                <div className="flex items-center gap-6 w-full md:w-auto">
                  <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-center min-w-[70px] group-hover:bg-[#f59e0b] group-hover:text-black transition-all">
                    <p className="text-lg font-black italic tracking-tighter leading-none">{format(new Date(apt.start_time), 'HH:mm')}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm md:text-lg font-black text-white uppercase tracking-tight italic truncate leading-none mb-1.5">{apt.client?.name || apt.client_name}</p>
                    <div className="flex items-center gap-2">
                       <span className="text-[8px] text-white/20 font-black uppercase tracking-widest">Atendido por:</span>
                       <span className="text-[8px] text-[#f59e0b] font-black uppercase tracking-widest italic">{apt.barber?.name}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                  <div className="text-right">
                    <p className="text-xl font-black italic text-white tracking-tighter leading-none">${new Intl.NumberFormat('de-DE').format(apt.price)}</p>
                  </div>
                  <span className={`text-[7px] font-black px-3 py-1 rounded-md uppercase tracking-widest ${apt.status === 'completed' ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20' : 'text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20'}`}>
                    {apt.status === 'completed' ? 'Liquidado' : 'Pendiente'}
                  </span>
                </div>
              </motion.div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}
