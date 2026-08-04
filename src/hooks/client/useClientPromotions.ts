'use client';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Promotion } from '@/types';

export function usePromotions() {
  return useQuery({
    queryKey: ['promotions', 'active'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', today.toISOString());
      
      if (error) throw error;
      return data as Promotion[];
    },
    staleTime: 0,
  });
}

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
    staleTime: 0,
  });
}
