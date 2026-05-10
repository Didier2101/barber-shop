'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Appointment, Promotion } from '@/types';

// Hook para obtener las citas del cliente
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

// Hook para obtener promociones activas
export function usePromotions() {
  return useQuery({
    queryKey: ['promotions', 'active'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Comparar contra el inicio del día

      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', today.toISOString());
      
      if (error) throw error;
      return data as Promotion[];
    },
    staleTime: 0, // Forzamos datos siempre frescos durante las pruebas
  });
}

// Hook para mutaciones (ej: cancelar cita)
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
      // Invalidar el cache para que se refresquen las listas automáticamente
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
// Hook para obtener configuración de lealtad
export function useLoyaltySettings() {
  return useQuery({
    queryKey: ['loyalty-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_settings')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (error) throw error;
      return data;
    },
    staleTime: 0, // Siempre verificar el estado más reciente
  });
}
