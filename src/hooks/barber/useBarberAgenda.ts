'use client';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Appointment } from '@/types';
import { startOfDay, endOfDay } from 'date-fns';

export function useBarberAgenda(barberId: string, dateStr?: string) {
  return useQuery({
    queryKey: ['barber-agenda', barberId, dateStr],
    queryFn: async () => {
      const { data: pending } = await supabase
        .from('appointments')
        .select(`*, client:client_id(name, phone)`)
        .eq('barber_id', barberId)
        .eq('status', 'pending')
        .order('start_time', { ascending: true });

      const targetDate = dateStr ? new Date(dateStr) : new Date();
      const start = startOfDay(targetDate);
      const end = endOfDay(targetDate);
      
      const { data: today } = await supabase
        .from('appointments')
        .select(`*, client:client_id(name, phone)`)
        .eq('barber_id', barberId)
        .neq('status', 'pending')
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time', { ascending: true });

      const { data: upcoming } = await supabase
        .from('appointments')
        .select(`*, client:client_id(name, phone)`)
        .eq('barber_id', barberId)
        .neq('status', 'pending')
        .neq('status', 'cancelled')
        .gt('start_time', end.toISOString())
        .order('start_time', { ascending: true });

      return {
        pending: (pending || []) as Appointment[],
        today: (today || []) as Appointment[],
        upcoming: (upcoming || []) as Appointment[]
      };
    },
    enabled: !!barberId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}
