'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Profile, Service, BusinessHour, Expense, ExpenseCategory, Settlement, Appointment } from '@/types';
import { startOfDay, endOfDay, startOfMonth, format } from 'date-fns';

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

      return {
        barbers: (barbers.data || []) as Profile[],
        services: (services.data || []) as Service[],
        businessHours: (hours.data || []) as BusinessHour[],
        shopSettings: settings.data,
        promotions: (promotions.data || []),
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
export function useOwnerStats(filter: string, range?: { from: Date; to?: Date }) {
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

// ─── 7. Mutaciones ───────────────────────────────────────────────────────────
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
    mutationFn: async (expense: { amount: number; description: string; category: string; expense_date: string; period: string }) => {
      const { error } = await supabase.from('expenses').insert(expense);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => queryClient.invalidateQueries({ queryKey: ['owner-expenses', vars.period] }),
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
      barberId,
      appointments,
      commission,
      ownerId,
      notes,
    }: {
      barberId: string;
      appointments: Appointment[];
      commission: number;
      ownerId: string;
      notes?: string;
    }) => {
      if (appointments.length === 0) throw new Error('No hay servicios pendientes de liquidar');

      const totalRevenue = appointments.reduce((a, c) => a + Number(c.price), 0);
      const barberEarnings = (totalRevenue * commission) / 100;
      const ownerEarnings = totalRevenue - barberEarnings;

      const startDate = appointments[appointments.length - 1].start_time; // más antigua
      const endDate = appointments[0].start_time; // más reciente

      // 1. Crear el settlement
      const { data: settlement, error: sError } = await supabase
        .from('settlements')
        .insert({
          barber_id: barberId,
          start_date: startDate,
          end_date: endDate,
          total_revenue: totalRevenue,
          barber_earnings: barberEarnings,
          owner_earnings: ownerEarnings,
          commission_applied: commission,
          settled_by: ownerId,
          notes: notes
        })
        .select()
        .single();

      if (sError || !settlement) throw sError || new Error('Error creando liquidación');

      // 2. Marcar todas las citas con el settlement_id
      const appointmentIds = appointments.map(a => a.id);
      const { error: aError } = await supabase
        .from('appointments')
        .update({ settlement_id: settlement.id })
        .in('id', appointmentIds);

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

  return { createService, deleteService, createExpense, updateExpense, deleteExpense, createCategory, deleteCategory, createSettlement, updateLoyalty };
}
