'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Profile, Service, BusinessHour, Expense, ExpenseCategory, Settlement, Appointment, Promotion } from '@/types';
import { startOfDay, endOfDay, startOfMonth, format } from 'date-fns';
import { toast } from 'sonner';

// ─── 1. Datos base del dueño ────────────────────────────────────────────────
export function useOwnerBaseData() {
  return useQuery({
    queryKey: ['owner-base-data'],
    queryFn: async () => {
      const [barbers, services, hours, settings, promotions, loyalty] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'barber').order('name'),
        supabase.from('services').select('*').order('created_at', { ascending: true }),
        supabase.from('business_hours').select('*').order('day_of_week', { ascending: true }),
        supabase.from('shop_settings').select('*').eq('id', 1).single(),
        supabase.from('promotions').select('*').order('created_at', { ascending: false }),
        supabase.from('loyalty_settings').select('*').eq('id', 1).single(),
      ]);

      const now = new Date().toISOString().split('T')[0];
      const filteredPromotions = (promotions.data || []).filter(p => p.end_date >= now);

      return {
        barbers: (barbers.data || []) as Profile[],
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

// ─── 2. Gastos por período (mes) ─────────────────────────────────────────────
export function useOwnerExpenses(period?: string) {
  const currentPeriod = period || format(new Date(), 'yyyy-MM');
  return useQuery({
    queryKey: ['owner-expenses', currentPeriod],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('period', currentPeriod)
        .order('expense_date', { ascending: false });
      if (error) throw error;
      return (data || []) as Expense[];
    },
  });
}

// ─── 3. Categorías de gastos ─────────────────────────────────────────────────
export function useExpenseCategories() {
  return useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data || []) as ExpenseCategory[];
    },
    staleTime: 1000 * 60 * 30,
  });
}

// ─── 4. Liquidaciones ────────────────────────────────────────────────────────
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

// ─── 5. Citas NO liquidadas de un barbero (para preview del cierre) ───────────
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

// ─── 6. Estadísticas financieras del dueño ───────────────────────────────────
export function useOwnerStats(filter: string = 'today', range?: { from: Date; to?: Date }) {
  return useQuery({
    queryKey: ['owner-stats', filter, range],
    queryFn: async () => {
      const now = new Date();
      let start = startOfDay(now);
      let end = endOfDay(now);

      if (filter === 'week') {
        const day = now.getDay() || 7;
        start = startOfDay(new Date(now));
        start.setDate(now.getDate() - (day - 1));
      } else if (filter === 'month') {
        start = startOfMonth(now);
      } else if (filter === 'custom' && range?.from) {
        start = startOfDay(range.from);
        end = range.to ? endOfDay(range.to) : endOfDay(range.from);
      }

      const periodKey = format(start, 'yyyy-MM');

      const [apts, expenses] = await Promise.all([
        supabase
          .from('appointments')
          .select('price, status, barber_id, settlement_id, barber:barber_id(commission_percentage)')
          .eq('status', 'completed')
          .gte('start_time', start.toISOString())
          .lte('start_time', end.toISOString()),
        supabase
          .from('expenses')
          .select('amount')
          .eq('period', periodKey),
      ]);

      let grossIncome = 0;
      let ownerIncome = 0;
      let pendingOwnerIncome = 0; // citas no liquidadas
      let settledOwnerIncome = 0; // citas ya liquidadas
      let totalServices = 0;

      apts.data?.forEach(apt => {
        const price = Number(apt.price);
        const comm = (apt.barber as unknown as Profile)?.commission_percentage ?? 50;
        const ownerCut = price - (price * comm) / 100;
        grossIncome += price;
        ownerIncome += ownerCut;
        totalServices++;
        if (apt.settlement_id) settledOwnerIncome += ownerCut;
        else pendingOwnerIncome += ownerCut;
      });

      const expense = expenses.data?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
      const profit = ownerIncome - expense;
      const margin = ownerIncome > 0 ? (profit / ownerIncome) * 100 : 0;

      return {
        grossIncome,
        ownerIncome,
        pendingOwnerIncome,
        settledOwnerIncome,
        expense,
        profit,
        totalServices,
        margin,
      };
    },
  });
}

// ─── 7. Barberos con servicios pendientes (para lista de cierres) ────────────
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

// ─── 8. Citas de Hoy para el Dueño ──────────────────────────────────────────
export function useTodayAppointments() {
  return useQuery({
    queryKey: ['owner-today-appointments'],
    queryFn: async () => {
      const start = startOfDay(new Date());
      const end = endOfDay(new Date());
      const { data, error } = await supabase
        .from('appointments')
        .select('*, barber:barber_id(name)')
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time', { ascending: true });
      if (error) throw error;
      return (data || []) as (Appointment & { barber: { name: string } })[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ─── 8. Gestión de Clientes ────────────────────────────────────────────────
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
      
      // Mapear para extraer la fecha del último servicio
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

// ─── 8. Mutaciones ───────────────────────────────────────────────────────────
export function useOwnerMutations() {
  const queryClient = useQueryClient();

  const createService = useMutation({
    mutationFn: async (service: Partial<Service>) => {
      const { error } = await supabase.from('services').insert(service);
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
      const period = expense.period || expense.expense_date.substring(0, 7); // yyyy-MM
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

  /**
   * Crea una liquidación y marca todas las citas incluidas con el settlement_id.
   * Usa el settled_by del perfil actual del dueño.
   */
  const createSettlement = useMutation({
    mutationFn: async ({
      barber_id,
      total_gross,
      barber_payment,
      owner_payment,
      notes,
      appointment_ids,
    }: {
      barber_id: string;
      total_gross: number;
      barber_payment: number;
      owner_payment: number;
      notes?: string;
      appointment_ids: string[];
    }) => {
      if (appointment_ids.length === 0) throw new Error('No hay servicios seleccionados');

      // 1. Crear el settlement
      const { data: settlement, error: sError } = await supabase
        .from('settlements')
        .insert({
          barber_id,
          total_revenue: total_gross,
          barber_earnings: barber_payment,
          owner_earnings: owner_payment,
          commission_applied: (barber_payment / total_gross) * 100,
          notes: notes
        })
        .select()
        .single();

      if (sError || !settlement) throw sError || new Error('Error creando liquidación');

      // 2. Marcar todas las citas con el settlement_id
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
      // First remove FK references in appointments to avoid constraint error
      await supabase.from('appointments').update({ applied_promo_id: null }).eq('applied_promo_id', id);
      const { error } = await supabase.from('promotions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-base-data'] }),
  });

  const deleteClient = useMutation({
    mutationFn: async (clientId: string) => {
      // 1. Anonimizar citas para no perder datos contables
      const { error: updateAptError } = await supabase
        .from('appointments')
        .update({ 
          client_id: null,
          client_name: 'Usuario Eliminado (Privacidad)'
        })
        .eq('client_id', clientId);
      
      if (updateAptError) throw updateAptError;

      // 2. Anonimizar el perfil (en lugar de borrarlo físicamente)
      const { data, error: updateProfileError } = await supabase
        .from('profiles')
        .update({ 
          name: 'Usuario Eliminado',
          phone: '0000000000',
          document_id: null,
          address: null,
          avatar_url: null,
          nickname: null,
          bio: null,
          is_active: false
        })
        .eq('id', clientId)
        .select();
      
      if (updateProfileError) throw updateProfileError;
      if (!data || data.length === 0) {
        throw new Error('No se pudo anonimizar el perfil. Verifica tus permisos de edición.');
      }
    },
    onSuccess: () => {
      toast.success('Cliente eliminado y datos anonimizados');
      // Forzar un refetch inmediato
      queryClient.refetchQueries({ queryKey: ['owner-clients'] });
      queryClient.invalidateQueries({ queryKey: ['owner-stats'] });
    },
    onError: (err: Error) => {
      console.error('Error al eliminar cliente:', err);
      toast.error('No se pudo eliminar el cliente: ' + (err.message || 'Error desconocido'));
    }
  });

  return { 
    createService, 
    deleteService, 
    createExpense, 
    updateExpense, 
    deleteExpense, 
    createCategory, 
    deleteCategory, 
    createSettlement, 
    updateLoyalty,
    deleteClient,
    createPromotion,
    updatePromotion,
    deletePromotion
  };
}
