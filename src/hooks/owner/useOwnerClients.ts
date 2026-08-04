'use client';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Profile, Appointment } from '@/types';

export function useOwnerClientsPaginated(page: number, limit: number = 10, searchTerm: string = '') {
  return useQuery({
    queryKey: ['owner-clients-paginated', page, limit, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, name, avatar_url, phone, is_active', { count: 'exact' })
        .eq('role', 'client')
        .order('name');
        
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }
      
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, count, error } = await query.range(from, to);
      
      if (error) throw error;
      
      return {
        clients: (data || []) as Profile[],
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
      };
    }
  });
}

export function useOwnerClients() {
  return useQuery({
    queryKey: ['owner-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, appointments!client_id(start_time)')
        .eq('role', 'client')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      
      return (data || []).map(p => {
        const appointments = (p as unknown as { appointments: { start_time: string }[] }).appointments;
        const lastApt = appointments && appointments.length > 0 
          ? appointments.reduce((prev, current) => 
              (new Date(prev.start_time) > new Date(current.start_time)) ? prev : current
            ).start_time
          : null;
          
        return {
          ...p,
          last_appointment: lastApt
        };
      }) as (Profile & { last_appointment: string | null })[];
    },
  });
}

export function useClientDetails(clientId: string | null) {
  return useQuery({
    queryKey: ['client-details', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const [profile, appointments] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', clientId).single(),
        supabase.from('appointments')
          .select('*, service:service_id(name), barber:barber_id(name)')
          .eq('client_id', clientId)
          .order('start_time', { ascending: false })
      ]);

      return {
        profile: profile.data as Profile,
        appointments: (appointments.data || []) as (Appointment & { service: { name: string }, barber: { name: string } })[],
      };
    },
    enabled: !!clientId,
  });
}
