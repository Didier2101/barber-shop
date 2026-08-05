'use client';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';
import { startOfDay, endOfDay, startOfMonth, format } from 'date-fns';

export function useOwnerStats(filter: string = 'today', range?: { from: Date; to?: Date }) {
  return useQuery({
    queryKey: ['owner-stats', filter, range],
    queryFn: async () => {
      const now = new Date();
      let start = startOfDay(now);
      let end = endOfDay(now);

      if (filter === 'week') {
        const day = now.getDay() || 7;
        start = startOfDay(new Date(now));
        start.setDate(now.getDate() - (day - 1));
      } else if (filter === 'month') {
        start = startOfMonth(now);
      } else if (filter === 'custom' && range?.from) {
        start = startOfDay(range.from);
        end = range.to ? endOfDay(range.to) : endOfDay(range.from);
      }

      const startYMD = format(start, 'yyyy-MM-dd');
      const endYMD = format(end, 'yyyy-MM-dd');

      const [apts, expenses] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, price, status, barber_id, settlement_id, start_time, client_name, barber:barber_id(name, commission_percentage)')
          .eq('status', 'completed')
          .gte('start_time', start.toISOString())
          .lte('start_time', end.toISOString()),
        supabase
          .from('expenses')
          .select('id, amount, description, category, expense_date')
          .gte('expense_date', startYMD)
          .lte('expense_date', endYMD),
      ]);

      let grossIncome = 0;
      let ownerIncome = 0;
      let pendingOwnerIncome = 0; // citas no liquidadas
      let settledOwnerIncome = 0; // citas ya liquidadas
      let totalServices = 0;

      apts.data?.forEach(apt => {
        const price = Number(apt.price);
        const comm = (apt.barber as unknown as Profile)?.commission_percentage ?? 50;
        const ownerCut = price - (price * comm) / 100;
        grossIncome += price;
        ownerIncome += ownerCut;
        totalServices++;
        if (apt.settlement_id) settledOwnerIncome += ownerCut;
        else pendingOwnerIncome += ownerCut;
      });

      const expense = expenses.data?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
      const profit = ownerIncome - expense;
      const margin = ownerIncome > 0 ? (profit / ownerIncome) * 100 : 0;

      return {
        grossIncome,
        ownerIncome,
        pendingOwnerIncome,
        settledOwnerIncome,
        expense,
        profit,
        totalServices,
        margin,
        rawApts: apts.data || [],
        rawExpenses: expenses.data || [],
      };
    },
  });
}
