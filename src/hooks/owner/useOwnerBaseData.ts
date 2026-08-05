'use client';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Profile, Service, BusinessHour, Promotion } from '@/types';

export function useOwnerBaseData() {
  return useQuery({
    queryKey: ['owner-base-data'],
    queryFn: async () => {
      const [barbers, services, hours, settings, promotions, loyalty, authRes] = await Promise.all([
        supabase.from('profiles').select('*, barber_services(service_id)').eq('role', 'barber').order('name'),
        supabase.from('services').select('*').order('created_at', { ascending: true }),
        supabase.from('business_hours').select('*').order('day_of_week', { ascending: true }),
        supabase.from('shop_settings').select('*').eq('id', 1).single(),
        supabase.from('promotions').select('*').order('created_at', { ascending: false }),
        supabase.from('loyalty_settings').select('*').eq('id', 1).single(),
        fetch('/api/admin/get-auth-users').then(res => res.json().catch(() => ({}))),
      ]);

      const now = new Date().toISOString().split('T')[0];
      const filteredPromotions = (promotions.data || []).filter(p => p.end_date >= now);
      
      const authUsers = authRes?.users || [];
      const barbersWithEmails = (barbers.data || []).map((b: Profile) => {
        const match = authUsers.find((u: { id: string, email: string }) => u.id === b.id);
        return { ...b, email: match ? match.email : b.email };
      });

      return {
        barbers: barbersWithEmails as Profile[],
        services: (services.data || []) as Service[],
        businessHours: (hours.data || []) as BusinessHour[],
        shopSettings: settings.data,
        promotions: filteredPromotions as Promotion[],
        loyaltySettings: loyalty.data,
      };
    },
    staleTime: 1000 * 60 * 10,
  });
}
