'use client';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Expense, ExpenseCategory } from '@/types';
import { format } from 'date-fns';

export function useOwnerExpenses(period?: string) {
  const currentPeriod = period || format(new Date(), 'yyyy-MM');
  return useQuery({
    queryKey: ['owner-expenses', currentPeriod],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('period', currentPeriod)
        .order('expense_date', { ascending: false });
      if (error) throw error;
      return (data || []) as Expense[];
    },
  });
}

export function useExpenseCategories() {
  return useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data || []) as ExpenseCategory[];
    },
    staleTime: 1000 * 60 * 30,
  });
}
