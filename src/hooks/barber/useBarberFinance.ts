'use client';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Appointment } from '@/types';

export function useBarberFinance(barberId: string) {
  return useQuery({
    queryKey: ['barber-finance', barberId],
    queryFn: async () => {
      const { data: apts, error: aptsError } = await supabase
        .from('appointments')
        .select('*, client:client_id(name)')
        .eq('barber_id', barberId)
        .eq('status', 'completed')
        .order('start_time', { ascending: false });

      if (aptsError) throw aptsError;

      const { data: settlements, error: setError } = await supabase
        .from('settlements')
        .select('*')
        .eq('barber_id', barberId)
        .order('created_at', { ascending: false });

      if (setError) throw setError;

      return {
        appointments: (apts || []) as (Appointment & { settlement_id: string | null })[],
        settlements: (settlements || [])
      };
    },
    enabled: !!barberId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}
