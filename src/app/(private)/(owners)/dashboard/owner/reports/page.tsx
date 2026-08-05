'use client';

import { useState } from 'react';
import { 
  BarChart3,
  History,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Download
} from 'lucide-react';
import { useOwnerStats } from '@/hooks/owner';
import { format } from 'date-fns';
import { useMemo } from 'react';
import { formatPrice } from '@/lib/format';

export default function ReportsPage() {
  const [historyFilter, setHistoryFilter] = useState('month');
  const [customRange, setCustomRange] = useState({ from: new Date(), to: new Date() });
  
  const { data: historicalStats, isLoading: historyLoading } = useOwnerStats(
    historyFilter, 
    historyFilter === 'custom' ? customRange : undefined
  );

  const transactions = useMemo(() => {
    if (!historicalStats) return [];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apts = historicalStats.rawApts.map((a: any) => {
      const barberData = Array.isArray(a.barber) ? a.barber[0] : a.barber;
      const comm = barberData?.commission_percentage != null ? Number(barberData.commission_percentage) : 50;
      const ownerCut = Number(a.price) - (Number(a.price) * comm / 100);
      return {
        id: a.id,
        type: 'Ingreso',
        date: new Date(a.start_time),
        description: `Corte a ${a.client_name || 'Cliente'}`,
        barber: barberData?.name || 'Desconocido',
        gross: Number(a.price),
        commission: Number(a.price) * comm / 100,
        net: ownerCut
      };
    });

    const expenses = historicalStats.rawExpenses.map((e: { id: string; expense_date: string; description?: string; category?: string; amount: number | string }) => ({
      id: e.id,
      type: 'Gasto',
      date: new Date(e.expense_date),
      description: e.description || e.category,
      barber: '-',
      gross: -Number(e.amount),
      commission: 0,
      net: -Number(e.amount)
    }));

    return [...apts, ...expenses].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [historicalStats]);

  const exportToExcel = () => {
    if (transactions.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    // Cabeceras
    csvContent += "Fecha,Tipo,Concepto,Barbero,Ingreso Bruto,Pago Barbero,Neto Local\n";
    
    transactions.forEach(t => {
      const row = [
        format(t.date, 'dd/MM/yyyy HH:mm'),
        t.type,
        `"${t.description}"`,
        `"${t.barber}"`,
        t.gross > 0 ? t.gross : '', // Si es gasto, no tiene ingreso bruto
        t.commission > 0 ? t.commission : '',
        t.net
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_${historyFilter}_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-surface border border-white/5 rounded-2xl shadow-xl text-blue-400">
            <BarChart3 size={28} />
          </div>
          <div>
            <p className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Análisis Histórico</p>
            <h2 className="text-3xl font-bold tracking-tight text-white uppercase">Reportes Financieros</h2>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          <select 
            value={historyFilter}
            onChange={(e) => setHistoryFilter(e.target.value)}
            className="bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none cursor-pointer font-bold uppercase tracking-widest focus:border-blue-500 transition-all"
          >
            <option value="today">Hoy</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mes</option>
            <option value="custom">Rango Personalizado</option>
          </select>
        </div>
      </div>

      {historyFilter === 'custom' && (
        <div className="flex items-center justify-end gap-2 mb-4 bg-surface/50 p-3 rounded-2xl border border-white/5 w-fit ml-auto">
          <input 
            type="date" 
            value={format(customRange.from, 'yyyy-MM-dd')}
            onChange={(e) => setCustomRange(prev => ({ ...prev, from: new Date(e.target.value) }))}
            className="bg-bg-base border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500"
          />
          <span className="text-white/40 font-bold px-2">-</span>
          <input 
            type="date" 
            value={format(customRange.to, 'yyyy-MM-dd')}
            onChange={(e) => setCustomRange(prev => ({ ...prev, to: new Date(e.target.value) }))}
            className="bg-bg-base border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500"
          />
        </div>
      )}

      {historyLoading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-white/10 transition-all shadow-xl">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all"></div>
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="p-3 bg-white/5 rounded-2xl text-white">
                <DollarSign size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Ventas Brutas</span>
            </div>
            <div className="relative z-10">
              <p className="text-4xl font-black italic tracking-tighter text-white">${historicalStats?.grossIncome?.toLocaleString() || 0}</p>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">Total Ingresado</p>
            </div>
          </div>

          <div className="bg-surface border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-red-500/30 transition-all shadow-xl">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-all"></div>
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="p-3 bg-red-500/10 rounded-2xl text-red-500">
                <TrendingDown size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Egresos</span>
            </div>
            <div className="relative z-10">
              <p className="text-4xl font-black italic tracking-tighter text-red-500">-${historicalStats?.expense?.toLocaleString() || 0}</p>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">Gastos Operativos</p>
            </div>
          </div>

          <div className="bg-surface border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-emerald-500/30 transition-all shadow-xl">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all"></div>
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                <TrendingUp size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Utilidad Libre</span>
            </div>
            <div className="relative z-10">
              <p className={`text-4xl font-black italic tracking-tighter ${((historicalStats?.profit || 0) >= 0) ? 'text-emerald-500' : 'text-red-500'}`}>
                ${historicalStats?.profit?.toLocaleString() || 0}
              </p>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1 flex items-center justify-between">
                <span>Ganancia Neta</span>
                <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded text-[9px]">Margen: {historicalStats?.margin?.toFixed(1) || 0}%</span>
              </p>
            </div>
          </div>
        </div>

        {/* TABLA DETALLADA */}
        <div className="bg-surface border border-white/5 rounded-3xl p-6 shadow-xl mt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
            <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <History size={18} className="text-blue-400"/> Detalle de Transacciones
            </h3>
            <button 
              onClick={exportToExcel}
              disabled={transactions.length === 0}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Download size={16} /> Descargar Excel
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40">
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Concepto</th>
                  <th className="p-4">Barbero</th>
                  <th className="p-4 text-right">Ingreso Bruto</th>
                  <th className="p-4 text-right text-red-400">Pago Barbero</th>
                  <th className="p-4 text-right text-emerald-400">Neto Local</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-white/30 text-sm italic font-bold uppercase tracking-widest">
                      No hay transacciones en este periodo
                    </td>
                  </tr>
                ) : (
                  transactions.map(t => (
                    <tr key={`${t.type}-${t.id}`} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-xs font-medium text-white/70 whitespace-nowrap">{format(t.date, 'dd/MM/yyyy HH:mm')}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${t.type === 'Ingreso' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-bold text-white max-w-[200px] truncate" title={t.description}>{t.description}</td>
                      <td className="p-4 text-xs font-bold text-white/70">{t.barber}</td>
                      <td className="p-4 text-right font-black italic tracking-tighter text-white">
                        {t.gross > 0 ? formatPrice(t.gross) : '-'}
                      </td>
                      <td className="p-4 text-right font-black italic tracking-tighter text-red-400">
                        {t.commission > 0 ? `-${formatPrice(t.commission)}` : '-'}
                      </td>
                      <td className={`p-4 text-right font-black italic tracking-tighter ${t.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatPrice(t.net)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
