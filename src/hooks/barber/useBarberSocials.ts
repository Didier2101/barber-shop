'use client';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BarberSocial } from '@/types';

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
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}
