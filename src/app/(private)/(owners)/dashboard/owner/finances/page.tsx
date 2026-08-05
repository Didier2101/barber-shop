'use client';

import { useState, useEffect } from 'react';
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
      let unsettledCount = 0;

      appointments?.forEach((app: { price?: number | string; settlement_id?: string; barber?: { commission_percentage?: number | string }[] | { commission_percentage?: number | string } | null }) => {
        const price = Number(app.price || 0);
        grossSales += price;
        const barberData = Array.isArray(app.barber) ? app.barber[0] : app.barber;
        const comm = barberData?.commission_percentage != null ? Number(barberData.commission_percentage) : 50;
        barberCuts += price * (comm / 100);
        if (!app.settlement_id) unsettledCount++;
      });

      const shopEarnings = grossSales - barberCuts;
      const totalExpenses = expenses?.reduce((acc: number, exp: { amount?: number | string }) => acc + Number(exp.amount || 0), 0) || 0;
      const netProfit = shopEarnings - totalExpenses;

      setStats({
        grossSales, barberCuts, shopEarnings, totalExpenses, netProfit, unsettledCount
      });

    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseMonth = async () => {
    setIsClosing(true);
    try {
      const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
      const { error } = await supabase.from('shop_monthly_balances').insert({
        month: monthStr,
        total_sales: stats.grossSales,
        barbers_cut: stats.barberCuts,
        shop_earnings: stats.shopEarnings,
        total_expenses: stats.totalExpenses,
        net_profit: stats.netProfit,
        status: 'closed'
      });

      if (error) {
        console.error('Error supabase:', error);
        throw error;
      }
      
      toast.success(`El mes de ${months[selectedMonth]} ha sido cerrado con éxito.`);
      fetchMonthData();
    } catch (error: unknown) {
      console.error('Error closing month:', error instanceof Error ? error.message : error);
      toast.error('Ocurrió un error al intentar cerrar el mes.');
    } finally {
      setIsClosing(false);
    }
  };

  const today = new Date();
  const endOfSelectedMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
  const canCloseByDate = today >= endOfSelectedMonth;
  const hasUnsettled = stats.unsettledCount > 0;
  const canClose = !closedBalance && canCloseByDate && !hasUnsettled;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-32">
      <div className="flex items-center gap-5 mb-8">
        <div className="p-4 bg-surface border border-white/5 rounded-2xl shadow-xl text-brand">
          <Wallet size={28} />
        </div>
        <div>
          <p className="text-brand text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Administración Contable</p>
          <h2 className="text-3xl font-bold tracking-tight text-white uppercase">Cierre de Mes</h2>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="text-lg font-bold uppercase tracking-widest text-white flex items-center gap-2">
            <Calendar size={18} className="text-brand" /> Cierre Contable Oficial
          </h3>
          <div className="flex items-center gap-2 bg-surface border border-white/5 p-1 rounded-xl">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-sm text-white outline-none cursor-pointer uppercase tracking-wider font-medium px-2 py-1"
            >
              {months.map((m, i) => <option key={i} value={i} className="bg-bg-base">{m}</option>)}
            </select>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-sm text-brand outline-none cursor-pointer font-bold px-2 py-1"
            >
              {years.map(y => <option key={y} value={y} className="bg-bg-base">{y}</option>)}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="w-8 h-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-surface border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl pointer-events-none"></div>
            
            {closedBalance ? (
              <div className="bg-brand/10 border border-brand/20 text-brand p-4 rounded-xl flex items-center gap-3 mb-6">
                <CheckCircle2 size={24} />
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wider">Mes Cerrado</h4>
                  <p className="text-xs opacity-80 mt-1">Registros congelados permanentemente.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 mb-6">
                {!canCloseByDate && (
                  <div className="bg-white/5 border border-white/10 text-white/70 p-3 rounded-xl flex items-center gap-3">
                    <AlertCircle size={16} className="text-brand flex-shrink-0" />
                    <p className="text-xs">Solo se puede cerrar el último día del mes o después.</p>
                  </div>
                )}
                {hasUnsettled && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center gap-3">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <p className="text-xs">Hay {stats.unsettledCount} citas sin liquidar a barberos. Requerido para cerrar.</p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                <span className="text-xs text-white/50 uppercase tracking-widest flex items-center gap-2"><DollarSign size={14}/> Ingresos Brutos</span>
                <span className="font-black text-lg">{formatPrice(stats.grossSales)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                <span className="text-xs text-red-500/70 uppercase tracking-widest flex items-center gap-2"><Scissors size={14}/> Comisiones (Barberos)</span>
                <span className="font-black text-lg text-red-500">-{formatPrice(stats.barberCuts)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-500/5 rounded-xl border border-orange-500/10">
                <span className="text-xs text-orange-500/70 uppercase tracking-widest flex items-center gap-2"><TrendingDown size={14}/> Gastos Operativos</span>
                <span className="font-black text-lg text-orange-500">-{formatPrice(stats.totalExpenses)}</span>
              </div>
              <div className={`flex justify-between items-center p-4 rounded-xl border mt-6 shadow-lg ${stats.netProfit >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <span className={`text-xs uppercase tracking-widest font-bold flex items-center gap-2 ${stats.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  <TrendingUp size={14}/> Utilidad Neta
                </span>
                <span className={`font-black text-3xl ${stats.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPrice(stats.netProfit)}
                </span>
              </div>
            </div>

            {!closedBalance && (
              <button
                onClick={handleCloseMonth}
                disabled={!canClose || isClosing}
                className="w-full mt-6 bg-brand text-black px-6 py-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isClosing ? 'CERRANDO...' : 'EJECUTAR CIERRE DE MES'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
