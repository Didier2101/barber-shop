'use client';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { startOfDay, endOfDay } from 'date-fns';

export function useBarberStats(barberId: string, filter: 'today' | 'custom', range?: { from: Date, to?: Date }) {
  return useQuery({
    queryKey: ['barber-stats', barberId, filter, range],
    queryFn: async () => {
      let start = startOfDay(new Date());
      let end = endOfDay(new Date());

      if (filter === 'custom' && range?.from) {
        start = startOfDay(range.from);
        end = range.to ? endOfDay(range.to) : endOfDay(range.from);
      }

      const { data: apts } = await supabase
        .from('appointments')
        .select('price, status')
        .eq('barber_id', barberId)
        .eq('status', 'completed')
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString());

      const income = apts?.reduce((acc, curr) => acc + Number(curr.price), 0) || 0;
      const count = apts?.length || 0;

      return { income, serviceCount: count };
    },
    enabled: !!barberId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}
