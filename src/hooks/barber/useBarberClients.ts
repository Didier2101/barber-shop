'use client';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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
        servicesCount: number;
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
            servicesCount: 1,
            avatar: apt.client?.avatar_url
          });
        } else {
          const idx = uniqueClients.findIndex(c => c.id === clientId);
          uniqueClients[idx].totalSpent += Number(apt.price);
          uniqueClients[idx].servicesCount += 1;
        }
      });
      return uniqueClients;
    },
    enabled: !!barberId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}
