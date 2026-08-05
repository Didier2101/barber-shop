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
        .select(`*, barber:profiles!appointments_barber_id_fkey(name, phone)`)
        .eq('client_id', clientId)
        .order('start_time', { ascending: false });
      
      if (error) throw error;
      
      // Ensure barber is correctly assigned as an object, in case supabase returns an array
      const mappedData = data?.map(apt => ({
        ...apt,
        barber: Array.isArray(apt.barber) ? apt.barber[0] : apt.barber
      }));
      
      return mappedData as Appointment[];
    },
    enabled: !!clientId,
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string, notes?: string }) => {
      const updateData: { status: string; notes?: string } = { status: 'cancelled' };
      if (notes) updateData.notes = notes;

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
