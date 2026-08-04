'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Appointment } from '@/types';

export function useClientAppointments(clientId: string) {
  return useQuery({
    queryKey: ['appointments', 'client', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`*, barber:barber_id(name, phone)`)
        .eq('client_id', clientId)
        .order('start_time', { ascending: false });
      
      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!clientId,
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
