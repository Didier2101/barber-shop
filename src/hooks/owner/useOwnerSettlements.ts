'use client';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Settlement, Appointment, Profile } from '@/types';

export function useOwnerSettlements() {
  return useQuery({
    queryKey: ['owner-settlements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settlements')
        .select('*, barber:barber_id(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Settlement[];
    },
  });
}

export function useBarberPendingSettlement(barberId: string | null) {
  return useQuery({
    queryKey: ['barber-pending-settlement', barberId],
    queryFn: async () => {
      if (!barberId) return { appointments: [], lastSettlement: null };

      // Último cierre de este barbero
      const { data: lastS } = await supabase
        .from('settlements')
        .select('*')
        .eq('barber_id', barberId)
        .order('end_date', { ascending: false })
        .limit(1);

      const lastSettlement = lastS?.[0] as Settlement | null;

      // Citas completadas SIN settlement_id (o posteriores al último cierre)
      const { data: apts } = await supabase
        .from('appointments')
        .select('*')
        .eq('barber_id', barberId)
        .eq('status', 'completed')
        .is('settlement_id', null)
        .order('start_time', { ascending: false });

      return {
        appointments: (apts || []) as Appointment[],
        lastSettlement,
      };
    },
    enabled: !!barberId,
  });
}

export function useBarbersWithPendingServices() {
  return useQuery({
    queryKey: ['barbers-pending-services'],
    queryFn: async () => {
      const { data: apts } = await supabase
        .from('appointments')
        .select('barber_id, price, barber:barber_id(name, avatar_url, commission_percentage)')
        .eq('status', 'completed')
        .is('settlement_id', null);

      const barbersMap: Record<string, { 
        id: string; 
        name: string; 
        avatar_url?: string; 
        commission_percentage: number; 
        pendingCount: number; 
        pendingTotal: number 
      }> = {};

      apts?.forEach(apt => {
        const b = apt.barber as unknown as Profile;
        if (!barbersMap[apt.barber_id]) {
          barbersMap[apt.barber_id] = {
            id: apt.barber_id,
            name: b.name,
            avatar_url: b.avatar_url,
            commission_percentage: b.commission_percentage || 50,
            pendingCount: 0,
            pendingTotal: 0
          };
        }
        barbersMap[apt.barber_id].pendingCount++;
        barbersMap[apt.barber_id].pendingTotal += Number(apt.price);
      });

      return Object.values(barbersMap);
    }
  });
}
