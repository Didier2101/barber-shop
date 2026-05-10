'use client';
import { useOwnerBaseData, useOwnerStats, useTodayAppointments } from '@/hooks/useOwnerData';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Activity, 
  Check, 
  TrendingDown, 
  Sparkles 
} from 'lucide-react';
import { format } from 'date-fns';

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
        <div className="w-8 h-8 border-4 border-[#0061ff] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
          <LayoutDashboard size={24} className="text-[#0061ff]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 uppercase">Inicio de la cuenta</h2>
          <p className="text-[11px] text-gray-500 font-medium tracking-wider">Visión general del estado actual de tu negocio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm group hover:border-[#0061ff]/20 transition-all">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Ventas Brutas</p>
          <p className="text-3xl font-black text-gray-900 leading-none group-hover:text-[#0061ff] transition-colors">${new Intl.NumberFormat('de-DE').format(stats.grossIncome)}</p>
          <div className="mt-8 pt-6 border-t border-gray-50 flex items-center gap-2">
            <TrendingUp size={14} className="text-emerald-500" />
            <span className="text-[10px] text-emerald-600 font-black tracking-widest uppercase">Facturación Total</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm group hover:border-[#0061ff]/20 transition-all">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">En Caja (Pendiente)</p>
          <p className="text-3xl font-black text-gray-900 leading-none group-hover:text-[#0061ff] transition-colors">${new Intl.NumberFormat('de-DE').format(stats.pendingOwnerIncome)}</p>
          <div className="mt-8 pt-6 border-t border-gray-50 flex items-center gap-2">
            <Activity size={14} className="text-[#0061ff]" />
            <span className="text-[10px] text-[#0061ff] font-black tracking-widest uppercase">Por Liquidar</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm group hover:border-[#0061ff]/20 transition-all">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Ganancia Neta</p>
          <p className="text-3xl font-black text-gray-900 leading-none group-hover:text-[#0061ff] transition-colors">${new Intl.NumberFormat('de-DE').format(stats.ownerIncome)}</p>
          <div className="mt-8 pt-6 border-t border-gray-50 flex items-center gap-2">
            <Check size={14} className="text-emerald-500" />
            <span className="text-[10px] text-emerald-600 font-black tracking-widest uppercase">Post-Comisiones</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm group hover:border-[#0061ff]/20 transition-all">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Gastos del Mes</p>
          <p className="text-3xl font-black text-gray-900 leading-none group-hover:text-[#0061ff] transition-colors">${new Intl.NumberFormat('de-DE').format(stats.expense)}</p>
          <div className="mt-8 pt-6 border-t border-gray-50 flex items-center gap-2">
            <TrendingDown size={14} className="text-red-500" />
            <span className="text-[10px] text-red-600 font-black tracking-widest uppercase">Salida de Capital</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm group hover:border-[#0061ff]/20 transition-all">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Utilidad Final</p>
          <p className="text-3xl font-black text-gray-900 leading-none group-hover:text-[#0061ff] transition-colors">${new Intl.NumberFormat('de-DE').format(stats.profit)}</p>
          <div className="mt-8 pt-6 border-t border-gray-50 flex items-center gap-2">
            <Sparkles size={14} className="text-blue-400" />
            <span className="text-[10px] text-blue-500 font-black tracking-widest uppercase">Beneficio Neto</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-[0.2em] px-2">Agenda del Día <span className="text-gray-400 ml-4 text-[10px] font-normal italic">({todayApts.length} servicios registrados)</span></h3>
        <div className="grid gap-4">
          {todayApts.length === 0 ? (
            <div className="py-24 text-center border border-dashed border-gray-200 rounded-[2rem] bg-gray-50/30">
              <p className="text-gray-400 font-bold text-[11px] tracking-[0.2em] uppercase">No hay actividad registrada para hoy</p>
            </div>
          ) : (
            todayApts.map(apt => (
              <div key={apt.id} className="flex items-center justify-between p-8 bg-white border border-gray-100 rounded-[2rem] hover:border-[#0061ff]/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all group cursor-default">
                <div className="flex items-center gap-8">
                  <div className="bg-blue-50/50 border border-blue-100/50 px-6 py-4 rounded-2xl text-center min-w-[100px] group-hover:bg-[#0061ff] group-hover:text-white transition-colors">
                    <p className="text-[#0061ff] group-hover:text-white text-lg font-black tracking-tight">{format(new Date(apt.start_time), 'HH:mm')}</p>
                  </div>
                  <div>
                    <p className="text-xl font-black text-gray-900 mb-1 uppercase tracking-tight">{apt.client?.name || apt.client_name}</p>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Barbero:</span>
                       <span className="text-[10px] text-[#0061ff] font-black uppercase tracking-widest">{apt.barber?.name}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <p className="text-2xl font-black text-gray-900">${new Intl.NumberFormat('de-DE').format(apt.price)}</p>
                  <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${apt.status === 'completed' ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' : 'text-blue-600 bg-blue-50 border border-blue-100'}`}>
                    {apt.status === 'completed' ? 'Completado' : 'En espera'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
