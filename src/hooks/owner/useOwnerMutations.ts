'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Service, Promotion } from '@/types';
import { toast } from 'sonner';

export function useOwnerMutations() {
  const queryClient = useQueryClient();

  const toggleClientStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('profiles').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-clients-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['client-details'] });
    }
  });

  const createService = useMutation({
    mutationFn: async (service: { name: string; price: number; duration: number }) => {
      const { error } = await supabase.from('services').insert([service]);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-base-data'] }),
  });

  const updateService = useMutation({
    mutationFn: async ({ id, ...service }: { id: string; name: string; price: number; duration: number }) => {
      const { error } = await supabase.from('services').update(service).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-base-data'] }),
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-base-data'] }),
  });

  const createExpense = useMutation({
    mutationFn: async (expense: { amount: number; description: string; category: string; expense_date: string; period?: string }) => {
      const period = expense.period || expense.expense_date.substring(0, 7);
      const { error } = await supabase.from('expenses').insert({ ...expense, period });
      if (error) throw error;
      return period;
    },
    onSuccess: (period) => queryClient.invalidateQueries({ queryKey: ['owner-expenses', period] }),
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; amount: number; description: string; category: string; expense_date: string; period: string }) => {
      const { error } = await supabase.from('expenses').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => queryClient.invalidateQueries({ queryKey: ['owner-expenses', vars.period] }),
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-expenses'] }),
  });

  const createCategory = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from('expense_categories').insert({ name });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expense-categories'] }),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expense_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expense-categories'] }),
  });

  const createSettlement = useMutation({
    mutationFn: async ({
      barber_id,
      total_gross,
      barber_payment,
      owner_payment,
      appointment_ids,
      start_date,
      end_date
    }: {
      barber_id: string;
      total_gross: number;
      barber_payment: number;
      owner_payment: number;
      appointment_ids: string[];
      start_date: string;
      end_date: string;
    }) => {
      if (appointment_ids.length === 0) throw new Error('No hay servicios seleccionados');

      const { data: settlement, error: sError } = await supabase
        .from('settlements')
        .insert({
          barber_id,
          total_revenue: total_gross,
          barber_earnings: barber_payment,
          owner_earnings: owner_payment,
          commission_applied: (barber_payment / total_gross) * 100,
          start_date,
          end_date
        })
        .select()
        .single();

      if (sError || !settlement) throw sError || new Error('Error creando liquidación');

      const { error: aError } = await supabase
        .from('appointments')
        .update({ settlement_id: settlement.id })
        .in('id', appointment_ids);

      if (aError) throw aError;

      return settlement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-settlements'] });
      queryClient.invalidateQueries({ queryKey: ['barber-pending-settlement'] });
      queryClient.invalidateQueries({ queryKey: ['owner-stats'] });
      queryClient.invalidateQueries({ queryKey: ['barber-finance'] });
      queryClient.invalidateQueries({ queryKey: ['barbers-pending-services'] });
    },
  });

  const updateLoyalty = useMutation({
    mutationFn: async (settings: { 
      appointments_threshold: number; 
      is_enabled: boolean;
      start_date?: string;
      end_date?: string;
      target_audience?: string;
      description?: string;
      service_ids?: string[];
    }) => {
      const { error } = await supabase.from('loyalty_settings').update(settings).eq('id', 1);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-base-data'] }),
  });

  const createPromotion = useMutation({
    mutationFn: async (promo: Partial<Promotion>) => {
      const { error } = await supabase.from('promotions').insert([promo]);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-base-data'] }),
  });

  const updatePromotion = useMutation({
    mutationFn: async ({ id, ...promo }: Partial<Promotion> & { id: string }) => {
      const { error } = await supabase.from('promotions').update(promo).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-base-data'] }),
  });

  const deletePromotion = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('appointments').update({ applied_promo_id: null }).eq('applied_promo_id', id);
      const { error } = await supabase.from('promotions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-base-data'] }),
  });

  const deleteUserStrict = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('No se encontró una sesión administrativa activa');

      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, requesterToken: token })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en el servidor al eliminar usuario');
      }
      return userId;
    },
    onSuccess: () => {
      toast.success('Cuenta eliminada permanentemente del sistema');
      queryClient.invalidateQueries({ queryKey: ['owner-clients'] });
      queryClient.invalidateQueries({ queryKey: ['owner-base-data'] });
      queryClient.invalidateQueries({ queryKey: ['owner-stats'] });
    },
    onError: (err: Error) => {
      toast.error('No se pudo eliminar: ' + err.message);
    }
  });

  const createBarber = useMutation({
    mutationFn: async (barber: { name: string; email: string; password?: string; commission_percentage?: number }) => {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(barber)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear barbero');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast.success('Barbero añadido con éxito al equipo');
      queryClient.invalidateQueries({ queryKey: ['owner-base-data'] });
    },
    onError: (err: Error) => {
      toast.error('No se pudo añadir: ' + err.message);
    }
  });

  return { 
    createService, 
    updateService,
    deleteService, 
    createExpense, 
    updateExpense, 
    deleteExpense, 
    createCategory, 
    deleteCategory, 
    createSettlement, 
    updateLoyalty,
    deleteClient: deleteUserStrict, toggleClientStatus,
    deleteUserStrict,
    createPromotion,
    updatePromotion,
    deletePromotion,
    createBarber
  };
}
