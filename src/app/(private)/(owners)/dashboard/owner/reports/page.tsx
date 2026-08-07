'use client';

import { useState } from 'react';
import { 
  BarChart3,
  History,
  TrendingDown,
  TrendingUp,
  Download
} from 'lucide-react';
import { useOwnerStats } from '@/hooks/owner';
import { format } from 'date-fns';
import { useMemo } from 'react';
import { formatPrice } from '@/lib/format';

export default function ReportsPage() {
  const [historyFilter, setHistoryFilter] = useState('month');
  const [customRange] = useState({ from: new Date(), to: new Date() });
  
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-32 font-sans">
      
      {/* HEADER ERP */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-erp-bg border border-erp-border p-6 rounded-2xl shadow-sm">
         <div className="flex items-center gap-5">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 shadow-sm shrink-0">
               <BarChart3 size={24} />
            </div>
            <div>
               <h2 className="text-2xl font-black text-erp-text tracking-tight uppercase">Reportes y Auditoría</h2>
               <p className="text-sm font-medium text-erp-text-muted mt-0.5">Analiza el historial de transacciones de tu barbería</p>
            </div>
         </div>
         
         <div className="flex items-center gap-2 bg-erp-surface border border-erp-border p-1.5 rounded-xl shadow-sm">
            {[
              { id: 'today', label: 'Hoy' },
              { id: 'week', label: 'Semana' },
              { id: 'month', label: 'Mes' },
              { id: 'year', label: 'Año' },
              { id: 'all', label: 'Todo' }
            ].map(f => (
               <button
                  key={f.id}
                  onClick={() => setHistoryFilter(f.id)}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${historyFilter === f.id ? 'bg-erp-primary text-white shadow-sm' : 'text-erp-text-muted hover:text-erp-text'}`}
               >
                  {f.label}
               </button>
            ))}
         </div>
      </div>

      <div className="bg-erp-surface border border-erp-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[50vh]">
         {/* HEADER TABLA */}
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 border-b border-erp-border bg-erp-bg">
            <h3 className="text-lg font-black uppercase tracking-tight text-erp-text flex items-center gap-2">
               <History size={18} className="text-erp-primary" /> Historial de Transacciones
            </h3>
            
            <button 
               onClick={exportToExcel}
               disabled={transactions.length === 0}
               className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
               <Download size={14} />
               Exportar Excel CSV
            </button>
         </div>

         {/* DATA GRID (TABLA) */}
         {historyLoading ? (
            <div className="flex-1 flex items-center justify-center py-20">
               <div className="w-8 h-8 border-4 border-erp-primary/20 border-t-erp-primary rounded-full animate-spin"></div>
            </div>
         ) : transactions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 p-12">
               <History size={48} className="text-erp-text-muted mb-4" />
               <p className="text-sm font-bold text-erp-text uppercase tracking-widest">No hay transacciones</p>
               <p className="text-xs text-erp-text-muted mt-2">Prueba cambiando el rango de fechas</p>
            </div>
         ) : (
            <div className="flex-1 overflow-x-auto custom-scrollbar">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-erp-bg border-b border-erp-border">
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-erp-text-muted whitespace-nowrap">Fecha</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-erp-text-muted whitespace-nowrap">Concepto</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-erp-text-muted whitespace-nowrap">Barbero (Si aplica)</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-erp-text-muted text-right whitespace-nowrap">Bruto</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-erp-text-muted text-right whitespace-nowrap">Comisión</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-erp-text-muted text-right whitespace-nowrap">Neto Local</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-erp-border">
                     {transactions.map((t, i) => (
                        <tr
                           key={`${t.id}-${i}`}
                           className="group hover:bg-erp-bg transition-colors"
                        >
                           <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-erp-text-muted">
                              {format(t.date, 'dd/MM/yyyy HH:mm')}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                 {t.type === 'Ingreso' ? (
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                                       <TrendingUp size={14} />
                                    </div>
                                 ) : (
                                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shrink-0">
                                       <TrendingDown size={14} />
                                    </div>
                                 )}
                                 <div>
                                    <p className="text-xs font-black text-erp-text uppercase tracking-tight">{t.type}</p>
                                    <p className="text-[10px] font-bold text-erp-text-muted uppercase tracking-wider">{t.description}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-xs font-bold text-erp-text">{t.barber}</span>
                           </td>
                           <td className="px-6 py-4 text-right whitespace-nowrap">
                              <span className={`text-xs font-black ${t.gross > 0 ? 'text-emerald-600' : 'text-erp-text-muted'}`}>
                                 {t.gross > 0 ? formatPrice(t.gross) : '-'}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right whitespace-nowrap">
                              <span className={`text-xs font-black ${t.commission > 0 ? 'text-red-600' : 'text-erp-text-muted'}`}>
                                 {t.commission > 0 ? `-${formatPrice(t.commission)}` : '-'}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right whitespace-nowrap">
                              <span className={`text-sm font-black ${t.net > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                 {t.net > 0 ? '+' : ''}{formatPrice(t.net)}
                              </span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>

    </div>
  );
}
