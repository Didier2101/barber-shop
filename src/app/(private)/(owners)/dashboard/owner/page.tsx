'use client';
import { useOwnerBaseData, useTodayAppointments } from '@/hooks/owner';
import {
  Activity,
  Briefcase,
  Users,
  LayoutDashboard
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { formatPrice } from '@/lib/format';

export default function OwnerDashboardPage() {
  const [totalClients, setTotalClients] = useState(0);
  const [totalBarbers, setTotalBarbers] = useState(0);

  useEffect(() => {
    async function fetchCounts() {
      const [{ count: clientsCount }, { count: barbersCount }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'barber').eq('is_active', true)
      ]);
      setTotalClients(clientsCount || 0);
      setTotalBarbers(barbersCount || 0);
    }
    fetchCounts();
  }, []);
  const { isLoading: baseLoading } = useOwnerBaseData();
  const { data: todayApts = [] } = useTodayAppointments();

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

      {/* TARJETAS DE ACCESOS DIRECTOS Y ESTADO EN VIVO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/dashboard/owner/team" className="group">
          <div className="bg-black/80 border border-white/10 rounded-3xl p-6 hover:bg-[#f59e0b]/10 hover:border-[#f59e0b]/30 transition-all flex flex-col justify-between h-full relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#f59e0b]/10 rounded-full blur-3xl group-hover:bg-[#f59e0b]/20 transition-all"></div>
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="p-3 bg-white/5 rounded-2xl text-white group-hover:text-[#f59e0b] transition-colors">
                <Briefcase size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#f59e0b]">Equipo</span>
            </div>
            <div className="relative z-10">
              <p className="text-4xl font-black italic tracking-tighter text-white">{totalBarbers}</p>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">Barberos Activos</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/owner/clients" className="group">
          <div className="bg-black/80 border border-white/10 rounded-3xl p-6 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between h-full relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="p-3 bg-white/5 rounded-2xl text-white group-hover:text-emerald-500 transition-colors">
                <Users size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Cartera</span>
            </div>
            <div className="relative z-10">
              <p className="text-4xl font-black italic tracking-tighter text-white">{totalClients}</p>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">Clientes Registrados</p>
            </div>
          </div>
        </Link>

        <div className="bg-black/80 border border-white/10 rounded-3xl p-6 flex flex-col justify-between h-full relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl transition-all"></div>
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
              <Activity size={24} className="animate-pulse" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">En Vivo</span>
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-black italic tracking-tighter text-white">
              {todayApts.filter(a => a.status === 'occupied').length}
            </p>
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">Barberos Cortando</p>
          </div>
        </div>
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
                    <p className="text-xl font-black italic text-white tracking-tighter leading-none">{formatPrice(apt.price)}</p>
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
