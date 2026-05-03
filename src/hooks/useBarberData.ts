'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Appointment, BarberSocial } from '@/types';
import { startOfDay, endOfDay } from 'date-fns';

// 1. Hook para citas del barbero (Pendientes y Agenda de Hoy/Día)
export function useBarberAgenda(barberId: string, dateStr?: string) {
  return useQuery({
    queryKey: ['barber-agenda', barberId, dateStr],
    queryFn: async () => {
      // Cargar pendientes
      const { data: pending } = await supabase
        .from('appointments')
        .select(`*, client:client_id(name)`)
        .eq('barber_id', barberId)
        .eq('status', 'pending')
        .order('start_time', { ascending: true });

      // Cargar agenda de día objetivo
      const targetDate = dateStr ? new Date(dateStr) : new Date();
      const start = startOfDay(targetDate);
      const end = endOfDay(targetDate);
      const { data: today } = await supabase
        .from('appointments')
        .select(`*, client:client_id(name)`)
        .eq('barber_id', barberId)
        .neq('status', 'pending')
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time', { ascending: true });

      return {
        pending: (pending || []) as Appointment[],
        today: (today || []) as Appointment[]
      };
    },
    enabled: !!barberId,
  });
}

// 2. Hook para estadísticas del barbero
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
  });
}

// 3. Hook para Redes Sociales
export function useBarberSocials(barberId: string) {
  return useQuery({
    queryKey: ['barber-socials', barberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('barber_socials')
        .select('*')
        .eq('barber_id', barberId);
      if (error) throw error;
      return data as BarberSocial[];
    },
    enabled: !!barberId,
  });
}

// 4. Hook para Clientes del Barbero
export function useBarberClients(barberId: string) {
  return useQuery({
    queryKey: ['barber-clients', barberId],
    queryFn: async () => {
      const { data: apts } = await supabase
        .from('appointments')
        .select(`*, client:client_id(name, phone, avatar_url)`)
        .eq('barber_id', barberId)
        .eq('status', 'completed')
        .order('start_time', { ascending: false });

      if (!apts) return [];

      interface BarberClient {
        id: string;
        name: string;
        lastService: string;
        totalSpent: number;
        avatar?: string;
      }
      const uniqueClients: BarberClient[] = [];
      const seen = new Set();

      apts.forEach(apt => {
        const clientId = apt.client_id || apt.client_name || 'unknown';
        if (!seen.has(clientId)) {
          seen.add(clientId);
          uniqueClients.push({
            id: clientId,
            name: apt.client?.name || apt.client_name || 'Desconocido',
            lastService: apt.start_time,
            totalSpent: Number(apt.price),
            avatar: apt.client?.avatar_url
          });
        } else {
          const idx = uniqueClients.findIndex(c => c.id === clientId);
          uniqueClients[idx].totalSpent += Number(apt.price);
        }
      });
      return uniqueClients;
    },
    enabled: !!barberId,
  });
}

// 5. Mutaciones
export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, barberId }: { id: string, status: string, barberId: string }) => {
      const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
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
// 6. Hook para Finanzas del Barbero (Pendiente vs Liquidado)
export function useBarberFinance(barberId: string) {
  return useQuery({
    queryKey: ['barber-finance', barberId],
    queryFn: async () => {
      // 1. Obtener todas las citas completadas
      const { data: apts, error: aptsError } = await supabase
        .from('appointments')
        .select('*, client:client_id(name)')
        .eq('barber_id', barberId)
        .eq('status', 'completed')
        .order('start_time', { ascending: false });

      if (aptsError) throw aptsError;

      // 2. Obtener historial de liquidaciones
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
  });
}
