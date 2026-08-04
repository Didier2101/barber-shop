'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, barberId, notes }: { id: string, status: string, barberId: string, notes?: string }) => {
      const updateData: { status: string; notes?: string } = { status };
      if (notes) updateData.notes = notes;
      
      const { error } = await supabase.from('appointments').update(updateData).eq('id', id);
      if (error) throw error;
      if (status === 'completed') {
        await supabase.rpc('increment_services_completed', { target_id: barberId });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['barber-agenda', variables.barberId] });
      queryClient.invalidateQueries({ queryKey: ['barber-stats', variables.barberId] });
    }
  });
}
