'use client';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Profile, Appointment } from '@/types';
import { startOfDay, endOfDay } from 'date-fns';

export function useTodayAppointments() {
  return useQuery({
    queryKey: ['owner-today-appointments'],
    queryFn: async () => {
      const start = startOfDay(new Date());
      const end = endOfDay(new Date());
      const { data, error } = await supabase
        .from('appointments')
        .select('*, barber:barber_id(name)')
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time', { ascending: true });
      if (error) throw error;
      return (data || []) as (Appointment & { barber: { name: string } })[];
    },
    staleTime: 1000 * 60 * 5,
  });
}
