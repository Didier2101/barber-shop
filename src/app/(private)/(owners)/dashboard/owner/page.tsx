'use client';
import { useOwnerBaseData, useTodayAppointments } from '@/hooks/owner';
import {
  Activity,
  Briefcase,
  Users,
  LayoutDashboard,
  CheckCircle2,
  Clock
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
        <div className="w-8 h-8 border-4 border-erp-primary/20 border-t-brand rounded-full animate-spin"></div>
      </div>
    );
  }

  const occupiedCount = todayApts.filter(a => a.status === 'occupied').length;
  const completedCount = todayApts.filter(a => a.status === 'completed').length;
  const pendingCount = todayApts.filter(a => a.status === 'confirmed').length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-32 font-sans">

      {/* ERP HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-zinc-900 uppercase">Resumen Operativo</h2>
          <p className="text-zinc-500 text-sm font-medium mt-1">Control general de las operaciones de la barbería</p>
        </div>

        <div className="bg-erp-surface border border-erp-border px-5 py-3 rounded-xl flex items-center gap-4 shadow-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Fecha Operativa</p>
            <p className="text-sm font-black text-erp-primary uppercase tracking-tight">{format(new Date(), 'dd MMM yyyy')}</p>
          </div>
          <div className="w-px h-8 bg-erp-primary/20 mx-2" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">En Línea</span>
          </div>
        </div>
      </div>

      {/* KPI CARDS (ERP STYLE - DENSE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/owner/team" className="group">
          <div className="bg-erp-surface border border-erp-border rounded-xl p-5 hover:border-erp-primary/30 hover:shadow-md transition-all h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-erp-primary/10 text-erp-primary rounded-lg group-hover:scale-110 transition-transform">
                <Briefcase size={18} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-zinc-900 leading-none">{totalBarbers}</p>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Equipo Activo</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/owner/clients" className="group">
          <div className="bg-erp-surface border border-erp-border rounded-xl p-5 hover:border-emerald-500/30 hover:shadow-md transition-all h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                <Users size={18} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-zinc-900 leading-none">{totalClients}</p>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Directorio Clientes</p>
            </div>
          </div>
        </Link>

        <div className="bg-erp-surface border border-erp-border rounded-xl p-5 h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-lg">
              <Activity size={18} className="animate-pulse" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-blue-500/10 text-blue-600 rounded-md">En Curso</span>
          </div>
          <div>
            <p className="text-2xl font-black text-zinc-900 leading-none">{occupiedCount}</p>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Servicios Activos</p>
          </div>
        </div>

        <div className="bg-erp-surface border border-erp-border rounded-xl p-5 h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-zinc-100 text-zinc-600 rounded-lg">
              <Clock size={18} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-zinc-100 text-zinc-600 rounded-md">Pendientes</span>
          </div>
          <div>
            <p className="text-2xl font-black text-zinc-900 leading-none">{pendingCount}</p>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Citas Por Atender</p>
          </div>
        </div>
      </div>

      {/* MONITOR DE ACTIVIDAD (DATA GRID ERP STYLE) */}
      <div className="bg-erp-surface border border-erp-border rounded-xl overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border-b border-erp-border bg-erp-bg">
          <div>
            <h3 className="text-base font-black uppercase tracking-tight text-zinc-900 flex items-center gap-2">
              <LayoutDashboard size={18} className="text-erp-primary" /> Registro de Operaciones (Hoy)
            </h3>
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mt-0.5">{todayApts.length} registros totales</p>
          </div>

          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{completedCount} Liquidados</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          {todayApts.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3 bg-erp-surface">
              <Activity size={32} className="text-zinc-300" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Sin operaciones registradas hoy</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-erp-bg/50 border-b border-erp-border">
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 whitespace-nowrap">Hora</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 whitespace-nowrap">Cliente</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 whitespace-nowrap">Profesional</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right whitespace-nowrap">Monto</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center whitespace-nowrap">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent-green/10">
                {todayApts.map((apt, idx) => (
                  <motion.tr
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    key={apt.id}
                    className="hover:bg-erp-primary/5 transition-colors group"
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-sm font-bold text-zinc-900 font-mono">{format(new Date(apt.start_time), 'HH:mm')}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-zinc-900 capitalize truncate max-w-[150px]">{apt.client?.name || apt.client_name}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-erp-primary/10 text-erp-primary flex items-center justify-center text-[10px] font-bold">
                          {apt.barber?.name?.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-xs font-semibold text-zinc-600 truncate max-w-[120px]">{apt.barber?.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <p className="text-sm font-black text-zinc-900 font-mono">{formatPrice(apt.price)}</p>
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border
                        ${apt.status === 'completed' ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' :
                          apt.status === 'occupied' ? 'text-blue-600 bg-blue-500/10 border-blue-500/20' :
                            'text-erp-primary bg-erp-primary/10 border-erp-primary/20'}
                      `}>
                        {apt.status === 'completed' ? <CheckCircle2 size={10} /> :
                          apt.status === 'occupied' ? <Activity size={10} className="animate-pulse" /> :
                            <Clock size={10} />}
                        {apt.status === 'completed' ? 'Liquidado' :
                          apt.status === 'occupied' ? 'En Curso' : 'Pendiente'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

