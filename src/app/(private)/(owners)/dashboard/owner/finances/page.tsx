'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Wallet,
  Calendar,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Scissors
} from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/format';
import { useEffect } from 'react';

export default function FinancesPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [isLoading, setIsLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  
  const [stats, setStats] = useState({
    grossSales: 0,
    barberCuts: 0,
    shopEarnings: 0,
    totalExpenses: 0,
    netProfit: 0,
    unsettledCount: 0
  });
  
  const [closedBalance, setClosedBalance] = useState<Record<string, unknown> | null>(null);

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  useEffect(() => {
    fetchMonthData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

  const fetchMonthData = async () => {
    setIsLoading(true);
    try {
      const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
      
      const { data: balanceData } = await supabase
        .from('shop_monthly_balances')
        .select('*')
        .eq('month', monthStr)
        .maybeSingle();

      if (balanceData) {
        setClosedBalance(balanceData);
        setStats({
          grossSales: Number(balanceData.total_sales),
          barberCuts: Number(balanceData.barbers_cut),
          shopEarnings: Number(balanceData.shop_earnings),
          totalExpenses: Number(balanceData.total_expenses),
          netProfit: Number(balanceData.net_profit),
          unsettledCount: 0
        });
        setIsLoading(false);
        return;
      }

      setClosedBalance(null);

      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();
      const startYMD = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
      const endYMD = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

      const { data: appointments, error: appError } = await supabase
        .from('appointments')
        .select(`price, settlement_id, barber:profiles!appointments_barber_id_fkey(commission_percentage)`)
        .eq('status', 'completed')
        .gte('start_time', startISO)
        .lte('start_time', endISO);

      if (appError) throw appError;

      const { data: expenses, error: expError } = await supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', startYMD)
        .lte('expense_date', endYMD);

      if (expError) throw expError;

      let grossSales = 0;
      let barberCuts = 0;
      let unsettled = 0;

      appointments?.forEach((app) => {
        const price = Number(app.price || 0);
        const barberData = Array.isArray(app.barber) ? app.barber[0] : app.barber;
        const comm = barberData?.commission_percentage != null ? Number(barberData.commission_percentage) : 50;
        
        const barberShare = price * (comm / 100);
        grossSales += price;
        barberCuts += barberShare;
        
        if (!app.settlement_id) unsettled++;
      });

      const shopEarnings = grossSales - barberCuts;
      const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const netProfit = shopEarnings - totalExpenses;

      setStats({
        grossSales,
        barberCuts,
        shopEarnings,
        totalExpenses,
        netProfit,
        unsettledCount: unsettled
      });

    } catch (error) {
      console.error(error);
      toast.error('Error al cargar datos financieros');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseMonth = async () => {
    if (stats.unsettledCount > 0) {
      toast.error(`Existen ${stats.unsettledCount} cortes sin liquidar. Liquídalos antes de cerrar el mes.`);
      return;
    }
    
    if (!window.confirm(`¿Estás seguro de cerrar el mes de ${months[selectedMonth]} ${selectedYear}? Esta acción guardará el balance y es irreversible.`)) {
      return;
    }

    setIsClosing(true);
    const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

    try {
      const { error } = await supabase.from('shop_monthly_balances').insert({
        month: monthStr,
        total_sales: stats.grossSales,
        barbers_cut: stats.barberCuts,
        shop_earnings: stats.shopEarnings,
        total_expenses: stats.totalExpenses,
        net_profit: stats.netProfit,
        closed_at: new Date().toISOString()
      });

      if (error) throw error;
      toast.success('Mes cerrado exitosamente');
      fetchMonthData();
    } catch (e: unknown) {
      toast.error('Error al cerrar mes: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-32 font-sans">
      
      {/* HEADER Y FILTROS ERP */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-erp-bg border border-erp-border p-6 rounded-2xl shadow-sm">
         <div className="flex items-center gap-5">
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 shadow-sm shrink-0">
               <Wallet size={24} />
            </div>
            <div>
               <h2 className="text-2xl font-black text-erp-text tracking-tight uppercase">Balance Financiero</h2>
               <p className="text-sm font-medium text-erp-text-muted mt-0.5">Control de ingresos, gastos y cierres de mes</p>
            </div>
         </div>

         <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-erp-surface border border-erp-border rounded-xl px-4 py-2 shadow-sm">
               <Calendar size={16} className="text-erp-text-muted" />
               <select 
                  className="bg-transparent text-sm font-bold text-erp-text outline-none cursor-pointer uppercase tracking-widest"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
               >
                  {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
               </select>
               <select
                  className="bg-transparent text-sm font-bold text-erp-text outline-none cursor-pointer"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
               >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
               </select>
            </div>
         </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-erp-primary/20 border-t-erp-primary rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {closedBalance && (
            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex items-start gap-4 shadow-sm mb-4">
              <CheckCircle2 className="text-emerald-600 shrink-0 mt-1" size={24} />
              <div>
                <h4 className="text-emerald-800 font-black uppercase tracking-tight text-lg">Balance Cerrado</h4>
                <p className="text-emerald-700/80 text-sm font-medium mt-1">Este mes ya fue cerrado y los datos son de solo lectura. Ningún corte o gasto nuevo afectará este balance histórico.</p>
              </div>
            </div>
          )}

          {/* TABLEROS KPI */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-erp-surface border border-erp-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Scissors size={18} /></div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-erp-text-muted">Ventas Brutas</h3>
               </div>
               <p className="text-3xl font-black text-erp-text tracking-tight">{formatPrice(stats.grossSales)}</p>
               <p className="text-xs font-bold text-erp-text-muted mt-2 uppercase tracking-widest">Total facturado en cortes</p>
            </div>

            <div className="bg-erp-surface border border-erp-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><DollarSign size={18} /></div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-erp-text-muted">Pago a Barberos</h3>
               </div>
               <p className="text-3xl font-black text-purple-600 tracking-tight">-{formatPrice(stats.barberCuts)}</p>
               <p className="text-xs font-bold text-erp-text-muted mt-2 uppercase tracking-widest">Comisiones deducidas</p>
            </div>

            <div className="bg-erp-surface border border-erp-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-50 text-red-600 rounded-lg"><TrendingDown size={18} /></div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-erp-text-muted">Gastos Local</h3>
               </div>
               <p className="text-3xl font-black text-red-600 tracking-tight">-{formatPrice(stats.totalExpenses)}</p>
               <p className="text-xs font-bold text-erp-text-muted mt-2 uppercase tracking-widest">Egresos operativos</p>
            </div>

            <div className="bg-erp-bg border-2 border-erp-primary/20 p-6 rounded-2xl shadow-sm relative overflow-hidden">
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="p-2 bg-erp-primary text-white rounded-lg shadow-sm"><TrendingUp size={18} /></div>
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-erp-text-muted">Utilidad Neta</h3>
                  </div>
                  <p className="text-4xl font-black text-erp-text tracking-tight">{formatPrice(stats.netProfit)}</p>
                  <p className="text-xs font-bold text-erp-text-muted mt-2 uppercase tracking-widest">Ganancia real del dueño</p>
               </div>
               <TrendingUp size={150} className="absolute -bottom-10 -right-10 opacity-5 text-erp-primary pointer-events-none" />
            </div>
          </div>

          {/* ACCIÓN DE CIERRE */}
          {!closedBalance && (
            <div className="mt-8 bg-erp-surface border border-erp-border rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
              <div>
                <h3 className="text-xl font-black text-erp-text tracking-tight uppercase">Cierre de Mes</h3>
                <p className="text-sm font-medium text-erp-text-muted mt-1 max-w-xl">
                  Al cerrar el mes, los totales se guardan como un registro histórico inmutable. Asegúrate de haber liquidado a todos los barberos y registrado todos los gastos.
                </p>
                {stats.unsettledCount > 0 && (
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg text-xs font-bold mt-4 w-fit border border-amber-200 uppercase tracking-widest">
                    <AlertCircle size={14} /> Faltan {stats.unsettledCount} cortes por liquidar a barberos
                  </div>
                )}
              </div>
              <button
                onClick={handleCloseMonth}
                disabled={isClosing || stats.unsettledCount > 0}
                className="w-full md:w-auto px-8 py-4 bg-erp-text text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isClosing ? 'CERRANDO...' : 'CERRAR BALANCE MENSUAL'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
