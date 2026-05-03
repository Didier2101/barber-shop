/* eslint-disable @next/next/no-img-element */
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { createBarberAction } from '@/app/actions/owner';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Check,
  Activity,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  DollarSign,
  Clock,
  Sparkles,
  Scissors,
  Trash2 as Trash,
  Edit2 as Edit,
  Plus,
  X,
  User,
  LayoutDashboard,
  Gift
} from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { format, startOfDay, endOfDay } from 'date-fns';
import { Profile, Appointment, Service, BusinessHour, Settlement, Expense } from '@/types';
import { useOwnerBaseData, useOwnerStats, useOwnerMutations, useOwnerExpenses, useOwnerSettlements, useBarberPendingSettlement } from '@/hooks/useOwnerData';
import { DateRange } from 'react-day-picker';

export function OwnerDashboard({ profile: ownerProfile }: { profile: Profile }) {
  const [activeTab, setActiveTab] = useState<string>('resumen');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [timeFilter, setTimeFilter] = useState('today');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [range, setRange] = useState<DateRange | undefined>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showCalendar, setShowCalendar] = useState(false);

  const { data: baseData, refetch: loadData } = useOwnerBaseData();
  const { data: currentStats } = useOwnerStats(timeFilter, range?.from ? { from: range.from, to: range.to } : undefined);
  const { 
    deleteService: deleteServiceMutation, 
    createService: createServiceMutation,
    createExpense,
    updateExpense,
    deleteExpense,
    createSettlement,
    updateLoyalty
  } = useOwnerMutations();

  // New financial hooks
  const [currentExpensePeriod, setCurrentExpensePeriod] = useState(format(new Date(), 'yyyy-MM'));
  const { data: monthlyExpenses = [] } = useOwnerExpenses(currentExpensePeriod);
  const { data: allSettlements = [] } = useOwnerSettlements();

  // Selected barber for settlement
  const [settlementBarberId, setSettlementBarberId] = useState<string | null>(null);
  const { data: pendingSettlementData } = useBarberPendingSettlement(settlementBarberId);

  // Derived state
  const barbers = baseData?.barbers || [];
  const services = baseData?.services || [];
  const businessHours = baseData?.businessHours || [];
  const shopSettings = baseData?.shopSettings || { opening_time: '09:00', closing_time: '20:00', accounting_period: 'monthly' };
  const promotions = baseData?.promotions || [];
  const loyaltySettings = baseData?.loyaltySettings || { appointments_threshold: 10, is_enabled: true };
  const stats = currentStats || { 
    grossIncome: 0, 
    ownerIncome: 0, 
    pendingOwnerIncome: 0, 
    settledOwnerIncome: 0, 
    expense: 0, 
    profit: 0, 
    margin: 0, 
    totalServices: 0 
  };

  const [todayApts, setTodayApts] = useState<Appointment[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<Profile | null>(null);
  const [lastSettlement, setLastSettlement] = useState<Settlement | null>(null);
  const [pendingServices, setPendingServices] = useState<Appointment[]>([]);

  // Local Form States
  const [formShopSettings, setFormShopSettings] = useState(shopSettings);
  useEffect(() => {
    if (baseData?.shopSettings) setFormShopSettings(baseData.shopSettings);
  }, [baseData?.shopSettings]);

  // Performance Calculation
  const barberPerformance = barbers.map(barber => {
    const barberTodayApts = todayApts.filter(a => a.barber_id === barber.id && a.status === 'completed');
    const todayTotal = barberTodayApts.reduce((acc, curr) => acc + Number(curr.price), 0);
    const comm = barber.commission_percentage || 50;
    return {
      ...barber,
      todayIncome: todayTotal,
      todayBarberCut: (todayTotal * comm) / 100,
      todayOwnerCut: todayTotal - (todayTotal * comm) / 100
    };
  });

  // Forms
  const [newService, setNewService] = useState({ name: '', price: '', duration: '60' });
  const [newExpense, setNewExpense] = useState({ amount: '', description: '', category: '', expense_date: new Date().toISOString().split('T')[0] });

  const [editBarber, setEditBarber] = useState<Partial<Profile> | null>(null);
  const [editService, setEditService] = useState<Partial<Service> | null>(null);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);

  useEffect(() => {
    async function loadTodayAppointments() {
      const s = startOfDay(new Date());
      const e = endOfDay(new Date());
      const { data } = await supabase.from('appointments')
        .select('*, client:client_id(name), barber:barber_id(name)')
        .gte('start_time', s.toISOString())
        .lte('start_time', e.toISOString())
        .order('start_time', { ascending: true });
      if (data) setTodayApts(data);
    }
    loadTodayAppointments();
  }, []);

  async function loadBarberDetail(barber: Profile) {
    setSelectedBarber(barber);
    const { data: lastS } = await supabase.from('settlements')
      .select('*')
      .eq('barber_id', barber.id)
      .order('end_date', { ascending: false })
      .limit(1);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const lastDate = lastS && lastS[0] ? new Date(lastS[0].end_date) : new Date(2020, 0, 1);
    setLastSettlement(lastS && lastS[0] ? lastS[0] : null);

    const { data: pSrvs } = await supabase.from('appointments')
      .select('*')
      .eq('barber_id', barber.id)
      .eq('status', 'completed')
      .is('settlement_id', null)
      .order('start_time', { ascending: false });

    if (pSrvs) setPendingServices(pSrvs);
  }

  async function updateShopSettings(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('shop_settings')
      .update({
        opening_time: `${formShopSettings.opening_time}:00`,
        closing_time: `${formShopSettings.closing_time}:00`,
        accounting_period: formShopSettings.accounting_period
      })
      .eq('id', 1);
    if (error) toast.error(error.message); else {
      toast.success('Configuración actualizada');
      loadData();
    }
  }

  async function deleteBusinessHour(id: string) {
    const { error } = await supabase.from('business_hours').delete().eq('id', id);
    if (error) toast.error(error.message); else loadData();
  }

  async function addBusinessHour(dayNum: number, dayName: string) {
    const { error } = await supabase.from('business_hours').insert({
      day_of_week: dayNum,
      day_name: dayName,
      opening_time: '08:00:00',
      closing_time: '20:00:00',
      is_closed: false
    });
    if (error) toast.error(error.message); else {
      toast.success('Franja horaria añadida');
      loadData();
    }
  }

  async function updateBusinessHour(id: string, updates: Partial<BusinessHour>) {
    const { error } = await supabase.from('business_hours').update(updates).eq('id', id);
    if (error) toast.error(error.message); else loadData();
  }

  // ==== BARBERS CRUD ====
  async function handleCreateBarber(e: React.FormEvent) {
    e.preventDefault();
    if (!editBarber) return;
    const formData = new FormData();
    formData.append('name', editBarber.name || '');
    formData.append('email', editBarber.email || '');
    formData.append('document_id', editBarber.document_id || '');
    formData.append('phone', editBarber.phone || '');
    formData.append('address', editBarber.address || '');
    formData.append('commission_percentage', String(editBarber.commission_percentage || 50));
    const res = await createBarberAction(formData);
    if (res.error) toast.error(res.error);
    else {
      toast.success('Barbero contratado con éxito');
      setEditBarber(null);
      loadData();
    }
  }

  async function handleUpdateBarber(e: React.FormEvent) {
    e.preventDefault();
    if (!editBarber) return;
    const { error } = await supabase.from('profiles').update({
      name: editBarber.name,
      phone: editBarber.phone || '',
      address: editBarber.address || '',
      commission_percentage: Number(editBarber.commission_percentage) || 50
    }).eq('id', editBarber.id);
    if (!error) { setEditBarber(null); loadData(); toast.success('Barbero actualizado'); } else toast.error(error.message);
  }

  async function toggleBarberStatus(id: string, current: boolean) {
    await supabase.from('profiles').update({ is_active: !current }).eq('id', id);
    loadData();
  }

  // ==== SERVICES CRUD ====
  async function handleCreateService(e: React.FormEvent) {
    e.preventDefault();
    createServiceMutation.mutate({
      name: newService.name,
      price: parseFloat(newService.price),
      duration: parseInt(newService.duration)
    }, {
      onSuccess: () => {
        setNewService({ name: '', price: '', duration: '60' });
        toast.success('Servicio creado');
      },
      onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'Error inesperado')
    });
  }

  async function handleUpdateService(e: React.FormEvent) {
    e.preventDefault();
    if (!editService) return;
    const { error } = await supabase.from('services').update({ name: editService.name, price: Number(editService.price), duration: Number(editService.duration) }).eq('id', editService.id);
    if (!error) { setEditService(null); toast.success('Servicio actualizado'); loadData(); } else toast.error(error.message);
  }

  async function toggleServiceStatus(id: string, current: boolean) {
    const { error } = await supabase.from('services').update({ is_active: !current }).eq('id', id);
    if (error) toast.error(error.message); else { toast.success('Estado actualizado'); loadData(); }
  }

  async function deleteService(id: string) {
    const result = await Swal.fire({ title: '¿Eliminar servicio?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', background: '#111', color: '#fff' });
    if (result.isConfirmed) {
      deleteServiceMutation.mutate(id, {
        onSuccess: () => toast.success('Servicio eliminado'),
        onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'Error inesperado')
      });
    }
  }

  // ==== EXPENSES CRUD (Updated) ====
  async function handleCreateExpense(e: React.FormEvent) {
    e.preventDefault();
    createExpense.mutate({
      amount: parseFloat(newExpense.amount),
      description: newExpense.description,
      category: newExpense.category.trim() || 'Otros',
      expense_date: newExpense.expense_date,
      period: format(new Date(newExpense.expense_date), 'yyyy-MM')
    }, {
      onSuccess: () => {
        setNewExpense({ amount: '', description: '', category: '', expense_date: new Date().toISOString().split('T')[0] });
        toast.success('Gasto registrado con éxito');
      },
      onError: (err: Error) => toast.error(err.message)
    });
  }

  async function handleUpdateExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!editExpense) return;
    
    updateExpense.mutate({
      id: editExpense.id,
      amount: Number(editExpense.amount),
      description: editExpense.description,
      category: editExpense.category.trim() || 'Otros',
      expense_date: editExpense.expense_date,
      period: format(new Date(editExpense.expense_date), 'yyyy-MM')
    }, {
      onSuccess: () => {
        setEditExpense(null);
        toast.success('Gasto actualizado');
      },
      onError: (err: Error) => toast.error(err.message)
    });
  }

  async function handleDeleteExpense(id: string) {
    const result = await Swal.fire({ 
      title: '¿Eliminar gasto?', 
      icon: 'warning', 
      showCancelButton: true, 
      confirmButtonColor: '#ef4444', 
      background: '#111', 
      color: '#fff' 
    });
    
    if (result.isConfirmed) {
      deleteExpense.mutate(id, {
        onSuccess: () => toast.success('Gasto eliminado'),
        onError: (err: Error) => toast.error(err.message)
      });
    }
  }

  // ==== SETTLEMENTS (Updated) ====
  async function handleExecuteSettlement(barberId: string, appointments: Appointment[], commission: number, notes?: string) {
    if (appointments.length === 0) return toast.error('No hay servicios pendientes');

    const barber = barbers.find(b => b.id === barberId);
    if (!barber) return toast.error('No se encontró el perfil del barbero');

    createSettlement.mutate({
      barberId,
      appointments,
      commission,
      ownerId: ownerProfile.id,
      notes: notes?.replace(/'/g, "\\'")
    }, {
      onSuccess: () => {
        toast.success('Liquidación completada y citas marcadas como pagadas');
        // Refrescar datos dependiendo de dónde se originó la liquidación
        if (selectedBarber?.id === barberId) loadBarberDetail(barber);
        loadData();
      },
      onError: (err: Error) => toast.error(err.message)
    });
  }

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex flex-wrap gap-4 border-b border-gray-200 dark:border-white/5 pb-1">
        {[
          { id: 'resumen', icon: Activity, label: 'Resumen' },
          { id: 'analiticas', icon: TrendingUp, label: 'BI Avanzado' },
          { id: 'liquidaciones', icon: Check, label: 'Liquidaciones' },
          { id: 'config', icon: Clock, label: 'Horarios' },
          { id: 'barberos', icon: Users, label: 'Performance' },
          { id: 'promociones', icon: Sparkles, label: 'Promos' },
          { id: 'servicios', icon: Scissors, label: 'Servicios' },
          { id: 'gastos', icon: DollarSign, label: 'Gastos' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 px-2 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === tab.id ? 'text-[#f59e0b]' : 'text-gray-400 hover:text-black dark:hover:text-white'}`}
          >
            <div className="flex items-center gap-2">
              <tab.icon size={14} />
              {tab.label}
            </div>
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#f59e0b] rounded-t-full shadow-[0_-4px_15px_rgba(245,158,11,0.6)]" />}
          </button>
        ))}
      </div>

      {/* SECCIÓN DE RESUMEN OPERATIVO */}
      {activeTab === 'resumen' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-[#f59e0b] rounded-[1.5rem] shadow-[0_10px_20px_-5px_rgba(245,158,11,0.5)]">
              <LayoutDashboard size={32} className="text-black" />
            </div>
            <div>
              <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Operaciones <span className="text-[#f59e0b]">Hoy</span></h2>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mt-2">Visión inmediata de la caja y agenda</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group">
              <div className="relative z-10 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Ventas Brutas</p>
                <p className="text-4xl font-black italic tracking-tighter text-black dark:text-white leading-none">${new Intl.NumberFormat('de-DE').format(stats.grossIncome)}</p>
                <p className="text-[8px] font-black bg-gray-500/10 text-gray-500 px-3 py-1 rounded-full inline-block uppercase tracking-widest">Facturación Total</p>
              </div>
            </div>

            <div className="bg-white dark:bg-white/[0.02] border border-blue-500/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
              <div className="relative z-10 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Pendiente x Liquidar</p>
                <p className="text-3xl font-black italic tracking-tighter text-blue-500 leading-none">${new Intl.NumberFormat('de-DE').format(stats.pendingOwnerIncome)}</p>
                <p className="text-[8px] font-black bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full inline-block uppercase tracking-widest">En Caja (Parte Barbería)</p>
              </div>
            </div>

            <div className="bg-white dark:bg-white/[0.02] border border-emerald-500/10 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-[0_20px_40px_-15px_rgba(16,185,129,0.1)]">
              <div className="relative z-10 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Ingreso Real Empresa</p>
                <p className="text-4xl font-black italic tracking-tighter text-emerald-500 leading-none">${new Intl.NumberFormat('de-DE').format(stats.ownerIncome)}</p>
                <p className="text-[8px] font-black bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full inline-block uppercase tracking-widest">Post-Comisiones</p>
              </div>
            </div>

            <div className="bg-white dark:bg-white/[0.02] border border-red-500/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
              <div className="relative z-10 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">Gastos</p>
                <p className="text-4xl font-black italic tracking-tighter text-red-500 leading-none">${new Intl.NumberFormat('de-DE').format(stats.expense)}</p>
                <p className="text-[8px] font-black bg-red-500/10 text-red-500 px-3 py-1 rounded-full inline-block uppercase tracking-widest">Salida de Capital</p>
              </div>
            </div>

            <div className="bg-white dark:bg-white/[0.02] border border-[#f59e0b]/20 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-[0_20px_40px_-15px_rgba(245,158,11,0.2)]">
              <div className="relative z-10 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#f59e0b]">Utilidad Neta</p>
                <p className={`text-4xl font-black italic tracking-tighter leading-none ${stats.profit >= 0 ? 'text-[#f59e0b]' : 'text-red-500'}`}>
                  ${new Intl.NumberFormat('de-DE').format(stats.profit)}
                </p>
                <p className="text-[8px] font-black bg-[#f59e0b]/10 text-[#f59e0b] px-3 py-1 rounded-full inline-block uppercase tracking-widest">Beneficio Final</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-[3.5rem] p-12">
            <h3 className="text-xl font-black uppercase tracking-tight italic mb-10">Agenda del Día <span className="text-[#f59e0b] ml-2 text-sm not-italic">({todayApts.length} servicios)</span></h3>
            <div className="grid gap-6">
              {todayApts.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl opacity-40">
                  <p className="text-gray-500 font-black uppercase tracking-[0.4em] text-xs">No hay actividad registrada para hoy</p>
                </div>
              ) : (
                todayApts.map(apt => (
                  <div key={apt.id} className="flex items-center justify-between p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-transparent hover:border-[#f59e0b]/30 transition-all group">
                    <div className="flex items-center gap-6">
                      <div className="bg-black dark:bg-white/10 p-4 rounded-2xl text-center min-w-[80px]">
                        <p className="text-[#f59e0b] text-lg font-black italic">{format(new Date(apt.start_time), 'HH:mm')}</p>
                      </div>
                      <div>
                        <p className="text-lg font-black uppercase tracking-tight italic">{apt.client?.name || apt.client_name}</p>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Barbero: {apt.barber?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black italic">${new Intl.NumberFormat('de-DE').format(apt.price)}</p>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${apt.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        {apt.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==== ANALÍTICAS AVANZADAS (BI) ==== */}
      {activeTab === 'analiticas' && (
        <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-center bg-black p-8 rounded-[3rem] border border-white/10 shadow-2xl">
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-white italic">Inteligencia de Datos</h2>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Cálculos de largo plazo basados en periodos personalizados</p>
            </div>
            <button
              onClick={() => setShowCalendar(true)}
              className="bg-[#f59e0b] text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-[0_15px_30px_-10px_rgba(245,158,11,0.5)]"
            >
              <CalendarIcon size={16} />
              {range?.from ? `${format(range.from, 'dd MMM')} - ${range.to ? format(range.to, 'dd MMM') : ''}` : 'Seleccionar Rango de Auditoría'}
            </button>
          </div>

          {timeFilter !== 'custom' ? (
            <div className="py-24 text-center">
              <p className="text-gray-400 font-black uppercase tracking-[0.5em] text-xs">Usa el calendario para iniciar el análisis avanzado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="col-span-1 md:col-span-2 bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-[3rem] p-12">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 mb-10">Proyección de Rentabilidad en el Periodo</h3>
                <div className="space-y-8">
                  <div className="flex justify-between items-center border-b border-gray-200 dark:border-white/5 pb-6">
                    <span className="text-sm font-black uppercase text-black dark:text-white">Ingresos Auditados</span>
                    <span className="text-3xl font-black italic text-emerald-500">${new Intl.NumberFormat('de-DE').format(stats.ownerIncome)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200 dark:border-white/5 pb-6">
                    <span className="text-sm font-black uppercase text-black dark:text-white">Gastos Registrados</span>
                    <span className="text-3xl font-black italic text-red-500">-${new Intl.NumberFormat('de-DE').format(stats.expense)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4">
                    <span className="text-sm font-black uppercase text-[#f59e0b]">Balance Neto</span>
                    <span className="text-5xl font-black italic text-[#f59e0b]">${new Intl.NumberFormat('de-DE').format(stats.profit)}</span>
                  </div>
                </div>
              </div>
              <div className="bg-black p-10 rounded-[3rem] border border-[#f59e0b]/30 flex flex-col justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-[#f59e0b]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="text-[#f59e0b]" size={32} />
                </div>
                <h4 className="text-white font-black uppercase tracking-[0.2em] text-xs">Margen de Operación</h4>
                <p className="text-6xl font-black text-[#f59e0b] italic">{stats.margin.toFixed(1)}%</p>
                <p className="text-[10px] font-medium text-gray-500 leading-relaxed uppercase tracking-widest px-6">Rendimiento basado en el flujo de caja del periodo seleccionado</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==== LIQUIDACIONES (Updated Logic) ==== */}
      {activeTab === 'liquidaciones' && (
        <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-[3rem] p-10">
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">Liquidación de Barberos</h2>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Cierre de cuentas individual basado en servicios completados</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <select 
                className="bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl py-4 px-6 text-black dark:text-white font-black text-xs uppercase tracking-widest outline-none"
                value={settlementBarberId || ''}
                onChange={e => setSettlementBarberId(e.target.value || null)}
              >
                <option value="">Seleccionar Barbero...</option>
                {barbers.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              
              {settlementBarberId && pendingSettlementData && pendingSettlementData.appointments.length > 0 && (
                <button
                  onClick={() => {
                    const barber = barbers.find(b => b.id === settlementBarberId);
                    const comm = barber?.commission_percentage || 50;
                    const total = pendingSettlementData.appointments.reduce((a, c) => a + Number(c.price), 0);
                    const payout = (total * comm) / 100;

                    Swal.fire({
                      title: 'Confirmar Liquidación',
                      html: `
                        <div class="text-left space-y-4">
                          <p class="text-sm">Barbero: <b>${barber?.name}</b></p>
                          <p class="text-sm">Servicios pendientes: <b>${pendingSettlementData.appointments.length}</b></p>
                          <p class="text-sm">Venta Bruta: <b>$${new Intl.NumberFormat('de-DE').format(total)}</b></p>
                          <p class="text-lg text-[#f59e0b] font-bold">Pago al Barbero (${comm}%): $${new Intl.NumberFormat('de-DE').format(payout)}</p>
                          <textarea id="settlement-notes" class="swal2-textarea" placeholder="Notas opcionales..."></textarea>
                        </div>
                      `,
                      icon: 'info',
                      showCancelButton: true,
                      confirmButtonText: 'Procesar Pago',
                      confirmButtonColor: '#f59e0b',
                      background: '#111',
                      color: '#fff',
                      preConfirm: () => {
                        return (document.getElementById('settlement-notes') as HTMLTextAreaElement).value;
                      }
                    }).then((result) => {
                      if (result.isConfirmed) {
                        handleExecuteSettlement(
                          settlementBarberId!, 
                          pendingSettlementData.appointments, 
                          comm, 
                          result.value
                        );
                      }
                    });
                  }}
                  className="bg-[#f59e0b] text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  Liquidar Pendientes
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Listado de Servicios Pendientes (Preview) */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xl font-black uppercase italic tracking-tight">Pendientes de Pago</h3>
              {!settlementBarberId ? (
                <div className="py-24 text-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[3rem] opacity-30">
                  <p className="text-xs font-black uppercase tracking-[0.5em]">Selecciona un barbero para ver sus servicios pendientes</p>
                </div>
              ) : pendingSettlementData?.appointments.length === 0 ? (
                <div className="py-24 text-center border-2 border-dashed border-emerald-500/20 rounded-[3rem] bg-emerald-500/5">
                  <p className="text-xs font-black uppercase tracking-[0.5em] text-emerald-500">¡Todo al día! No hay servicios pendientes</p>
                  {pendingSettlementData.lastSettlement && (
                    <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest">Último cierre: {format(new Date(pendingSettlementData.lastSettlement.created_at), 'dd MMM yyyy HH:mm')}</p>
                  )}
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingSettlementData?.appointments.map(apt => (
                    <div key={apt.id} className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-3xl p-6 flex justify-between items-center group hover:border-[#f59e0b]/30 transition-all">
                      <div className="flex items-center gap-6">
                        <div className="bg-black/10 dark:bg-white/5 p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500">
                          {format(new Date(apt.start_time), 'dd MMM HH:mm')}
                        </div>
                        <div>
                          <p className="font-black uppercase tracking-tight italic">{apt.client_name || 'Walk-in'}</p>
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{apt.services_data?.[0]?.name || 'Servicio'}</p>
                        </div>
                      </div>
                      <p className="text-lg font-black italic text-black dark:text-white">${new Intl.NumberFormat('de-DE').format(apt.price)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Historial de Liquidaciones Recientes */}
            <div className="space-y-6">
              <h3 className="text-xl font-black uppercase italic tracking-tight">Historial de Cierres</h3>
              <div className="grid gap-4">
                {allSettlements.slice(0, 10).map(s => (
                  <div key={s.id} className="bg-white dark:bg-white/[0.01] border border-gray-200 dark:border-white/5 rounded-[2rem] p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-black dark:text-white uppercase text-sm leading-none">{s.barber?.name}</h4>
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-2">
                          {format(new Date(s.created_at), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                      <p className="text-lg font-black italic text-emerald-500 leading-none">
                        ${new Intl.NumberFormat('de-DE').format(s.barber_earnings)}
                      </p>
                    </div>
                    {s.notes && (
                      <p className="text-[9px] text-gray-500 italic border-t border-gray-200 dark:border-white/5 pt-3">
                        &quot;{s.notes}&quot;
                      </p>
                    )}
                    <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-gray-500">
                      <span>Venta: ${new Intl.NumberFormat('de-DE').format(s.total_revenue)}</span>
                      <span>Por: {s.settled_by_profile?.name || 'Sistema'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==== PROMOCIONES & LEALTAD ==== */}
      {activeTab === 'promociones' && (
        <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-black text-white rounded-[3.5rem] p-12 border border-[#f59e0b]/30 shadow-2xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#f59e0b] text-black rounded-2xl flex items-center justify-center">
                    <Sparkles size={28} />
                  </div>
                  <h3 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Centro de <span className="text-[#f59e0b]">Marketing</span></h3>
                </div>
                <p className="text-gray-400 text-sm max-w-md font-medium leading-relaxed">
                  Gestiona el programa de lealtad, crea ofertas flash y analiza el impacto de tus promociones en una interfaz dedicada de alta precisión.
                </p>
              </div>
              <Link
                href="/promotions"
                className="bg-[#f59e0b] text-black px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-4"
              >
                Abrir Panel de Control <ChevronRight size={18} />
              </Link>
            </div>
            <Sparkles size={200} className="absolute -bottom-10 -right-10 opacity-5" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Promos Activas</p>
              <p className="text-4xl font-black italic">{promotions.filter(p => p.is_active && new Date(p.end_date) > new Date()).length}</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Meta de Lealtad</p>
              <p className="text-4xl font-black italic">{loyaltySettings.threshold} <span className="text-sm not-italic opacity-40">CORTES</span></p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Estado</p>
              <p className={`text-4xl font-black italic ${loyaltySettings.is_enabled ? 'text-emerald-500' : 'text-red-500'}`}>
                {loyaltySettings.is_enabled ? 'ACTIVO' : 'PAUSA'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==== CONFIGURACIÓN ==== */}
      {activeTab === 'config' && (
        <div className="max-w-4xl mx-auto space-y-10 py-12 animate-in fade-in duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black tracking-tighter uppercase italic text-black dark:text-white leading-none">Ajustes <span className="text-[#f59e0b]">Master</span></h2>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Control total de la inteligencia financiera</p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* PANEL DE HORARIOS SEMANALES */}
            <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-[3rem] p-10 space-y-10 shadow-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tight">Horario Semanal</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">Configura la apertura por cada día</p>
                </div>
                <CalendarIcon className="text-[#f59e0b]" size={32} />
              </div>

              <div className="grid gap-8">
                {[
                  { n: 1, name: 'Lunes' }, { n: 2, name: 'Martes' }, { n: 3, name: 'Miércoles' },
                  { n: 4, name: 'Jueves' }, { n: 5, name: 'Viernes' }, { n: 6, name: 'Sábado' }, { n: 0, name: 'Domingo' }
                ].map((dayInfo) => {
                  const daySlots = businessHours.filter(bh => bh.day_of_week === dayInfo.n);
                  const isClosed = daySlots.length === 0 || daySlots.every(s => s.is_closed);

                  return (
                    <div key={dayInfo.n} className={`p-8 rounded-[2.5rem] border transition-all space-y-6 ${isClosed ? 'bg-red-500/5 border-red-500/10' : 'bg-gray-50 dark:bg-white/5 border-transparent'}`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-6">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg ${isClosed ? 'bg-red-500 text-white' : 'bg-black dark:bg-white text-white dark:text-black'}`}>
                            {dayInfo.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black uppercase tracking-tight text-xl italic">{dayInfo.name}</p>
                            <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${isClosed ? 'text-gray-400' : 'text-emerald-500'}`}>
                              {isClosed ? 'Pulsa + para añadir horario' : `${daySlots.length} Franjas Activas`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => addBusinessHour(dayInfo.n, dayInfo.name)}
                          className="p-4 bg-[#f59e0b] text-black rounded-2xl hover:scale-110 transition-all shadow-lg"
                        >
                          <Plus size={20} />
                        </button>
                      </div>

                      <div className="grid gap-3">
                        {daySlots.map((slot) => (
                          <div key={slot.id} className="flex items-center gap-4 bg-white dark:bg-black/40 p-4 rounded-3xl border border-gray-200 dark:border-white/5 group animate-in fade-in slide-in-from-right-4">
                            <div className="flex-1 grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase text-gray-400 ml-2">Apertura</label>
                                <input
                                  type="time"
                                  className="w-full bg-gray-100 dark:bg-white/5 border-none rounded-xl text-sm font-black text-black dark:text-white"
                                  value={slot.opening_time.substring(0, 5)}
                                  onChange={(e) => updateBusinessHour(slot.id, { opening_time: e.target.value, is_closed: false })}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase text-gray-400 ml-2">Cierre</label>
                                <input
                                  type="time"
                                  className="w-full bg-gray-100 dark:bg-white/5 border-none rounded-xl text-sm font-black text-black dark:text-white"
                                  value={slot.closing_time.substring(0, 5)}
                                  onChange={(e) => updateBusinessHour(slot.id, { closing_time: e.target.value, is_closed: false })}
                                />
                              </div>
                            </div>
                            <button onClick={() => deleteBusinessHour(slot.id)} className="p-3 text-gray-400 hover:text-red-500 transition-all">
                              <Trash size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AJUSTES CONTABLES */}
            <form onSubmit={updateShopSettings} className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-[3rem] p-10 space-y-8 shadow-xl">
              <h3 className="text-xl font-black uppercase italic tracking-tight">Ajustes Contables</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f59e0b] ml-1">Ciclo de Reportes</label>
                  <select
                    className="w-full bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl py-4 px-4 text-black dark:text-white font-black appearance-none"
                    value={formShopSettings.accounting_period}
                    onChange={e => setFormShopSettings({ ...formShopSettings, accounting_period: e.target.value })}
                  >
                    <option value="monthly">MENSUAL</option>
                    <option value="weekly">SEMANAL</option>
                    <option value="yearly">ANUAL</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-[#f59e0b] text-black py-4 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all shadow-xl hover:-translate-y-1">
                  Guardar Configuración General
                </button>
              </div>
            </form>

            {/* PROGRAMA DE LEALTAD (DYNAMIC) */}
            <div className="bg-black border border-amber-500/20 rounded-[3rem] p-10 space-y-8 shadow-2xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Gift className="text-amber-500" size={20} />
                    <h3 className="text-xl font-black uppercase italic tracking-tight text-white">Programa Elite Rewards</h3>
                  </div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Configuración dinámica de visitas y premios</p>
                </div>
                <button 
                  onClick={() => updateLoyalty.mutate({ 
                    appointments_threshold: loyaltySettings.appointments_threshold, 
                    is_enabled: !loyaltySettings.is_enabled 
                  })}
                  className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${loyaltySettings.is_enabled ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                >
                  {loyaltySettings.is_enabled ? 'PROGRAMA ACTIVO' : 'PROGRAMA PAUSADO'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/60 ml-1">Meta de Visitas</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="number" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-2xl font-black text-white italic outline-none focus:border-amber-500/50 transition-all"
                      value={loyaltySettings.appointments_threshold}
                      onChange={(e) => updateLoyalty.mutate({ 
                        appointments_threshold: parseInt(e.target.value) || 10, 
                        is_enabled: loyaltySettings.is_enabled 
                      })}
                    />
                  </div>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase italic">Cada {loyaltySettings.appointments_threshold} visitas, el cliente recibe un servicio gratis.</p>
                </div>

                <div className="space-y-4 opacity-40 grayscale pointer-events-none">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Público Objetivo (Próximamente)</label>
                   <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-xs font-black uppercase tracking-widest text-zinc-500 appearance-none">
                      <option>TODOS LOS CLIENTES</option>
                      <option>SOLO NUEVOS</option>
                   </select>
                </div>

                <div className="space-y-4 opacity-40 grayscale pointer-events-none">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Vigencia (Próximamente)</label>
                   <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      <CalendarIcon size={14} />
                      SIN FECHA LÍMITE
                   </div>
                </div>
              </div>
              
              <div className="absolute -right-20 -bottom-20 opacity-[0.02] pointer-events-none">
                 <Scissors size={300} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==== PERFORMANCE & BARBER DETAIL ==== */}
      {activeTab === 'barberos' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          {!selectedBarber ? (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black uppercase tracking-tighter italic">Nuestros <span className="text-[#f59e0b]">Socios</span></h2>
                <button onClick={() => setEditBarber({})} className="bg-[#f59e0b] text-black px-8 py-3 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center gap-3 hover:scale-105 shadow-xl">
                  <Plus size={14} /> Nuevo Barbero
                </button>
              </div>

              <div className="grid gap-6">
                {barberPerformance.map(b => (
                  <div key={b.id} onClick={() => loadBarberDetail(b)} className="cursor-pointer group bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8 hover:border-[#f59e0b]/40 transition-all shadow-lg">
                    <div className="flex items-center gap-8">
                      <div className="w-24 h-24 rounded-3xl overflow-hidden bg-gray-100 dark:bg-white/5 border-2 border-[#f59e0b]/20 relative">
                        {b.avatar_url ? <img src={b.avatar_url} className="w-full h-full object-cover" alt={b.name} /> : <User size={40} className="w-full h-full p-6 text-gray-400" />}
                        {b.is_active === false && <div className="absolute inset-0 bg-red-500/40 flex items-center justify-center"><p className="text-[8px] font-black text-white uppercase tracking-widest bg-red-600 px-2 py-1 rounded">Pausado</p></div>}
                      </div>
                      <div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white leading-none mb-3 italic">{b.name}</h3>
                        <div className="flex gap-2">
                          <span className="text-[8px] font-black bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full uppercase tracking-widest">{b.commission_percentage}% Comisión</span>
                          <span className="text-[8px] font-black bg-gray-100 dark:bg-white/10 text-gray-400 px-3 py-1 rounded-full uppercase tracking-widest max-w-[150px] truncate">{(b as Profile).address || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-10 bg-gray-50 dark:bg-white/5 px-10 py-6 rounded-[2rem] border border-gray-200 dark:border-white/5">
                      <div className="text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Ventas Hoy</p>
                        <p className="text-2xl font-black italic text-black dark:text-white">${new Intl.NumberFormat('de-DE').format(b.todayIncome)}</p>
                      </div>
                      <div className="w-px h-10 bg-gray-200 dark:bg-white/10 hidden md:block" />
                      <div className="text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500/60 mb-2">Su Ganancia</p>
                        <p className="text-2xl font-black italic text-emerald-500">${new Intl.NumberFormat('de-DE').format(b.todayBarberCut)}</p>
                      </div>
                      <div className="w-px h-10 bg-gray-200 dark:bg-white/10 hidden md:block" />
                      <div className="text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-500/60 mb-2">Tu Ganancia</p>
                        <p className="text-2xl font-black italic text-amber-500">${new Intl.NumberFormat('de-DE').format(b.todayOwnerCut)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button onClick={(e) => { e.stopPropagation(); setEditBarber(b); }} className="p-4 bg-gray-100 dark:bg-white/5 rounded-2xl hover:bg-[#f59e0b]/20 hover:text-[#f59e0b] transition-all"><Edit size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); toggleBarberStatus(b.id, b.is_active); }} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${b.is_active === false ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : 'border-red-500 text-red-500 bg-red-500/10'}`}>
                        {b.is_active === false ? 'Activar' : 'Pausar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="flex items-center gap-6">
                <button onClick={() => setSelectedBarber(null)} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all"><ChevronLeft size={24} /></button>
                <div className="space-y-1">
                  <h2 className="text-4xl font-black uppercase tracking-tighter italic">Perfil de <span className="text-[#f59e0b]">{selectedBarber.name}</span></h2>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Hoja de vida operativa y liquidaciones</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* PENDIENTE DE LIQUIDACIÓN */}
                <div className="md:col-span-2 bg-[#f59e0b] rounded-[3.5rem] p-12 text-black relative overflow-hidden">
                  <div className="relative z-10 space-y-8">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">Por Liquidar desde {lastSettlement?.end_date ? format(new Date(lastSettlement.end_date), 'dd MMM yyyy') : 'Siempre'}</p>
                        <p className="text-7xl font-black italic tracking-tighter leading-none">${new Intl.NumberFormat('de-DE').format(pendingServices.reduce((a, c) => a + Number(c.price), 0))}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">Su Comisión ({selectedBarber.commission_percentage || 50}%)</p>
                        <p className="text-4xl font-black italic tracking-tighter leading-none">${new Intl.NumberFormat('de-DE').format(pendingServices.reduce((a, c) => a + Number(c.price), 0) * (selectedBarber.commission_percentage || 50) / 100)}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          const totalGross = pendingServices.reduce((a, c) => a + Number(c.price), 0);
                          const commission = selectedBarber.commission_percentage || 50;
                          const barberPayment = (totalGross * commission) / 100;

                          Swal.fire({
                            title: '<span class="text-xs font-black uppercase tracking-[0.4em] text-amber-500">Recibo de Pago</span>',
                            html: `
                              <div className="text-left space-y-6 pt-4">
                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic text-center mb-8">Confirmar Liquidación</h3>
                                
                                <div className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Barbero</span>
                                    <span className="text-sm font-black text-white uppercase">${selectedBarber.name}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Servicios a pagar</span>
                                    <span className="text-sm font-black text-white">${pendingServices.length}</span>
                                  </div>
                                  <div className="h-px bg-white/10 my-2"></div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Venta Bruta</span>
                                    <span className="text-sm font-black text-zinc-400">$${new Intl.NumberFormat('de-DE').format(totalGross)}</span>
                                  </div>
                                  <div className="flex justify-between items-center pt-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">Pago Neto (Socio)</span>
                                    <span className="text-2xl font-black text-white italic">$${new Intl.NumberFormat('de-DE').format(barberPayment)}</span>
                                  </div>
                                </div>
                                
                                <p className="text-[9px] text-zinc-500 text-center mt-6 uppercase font-bold tracking-widest">
                                  Al confirmar, estos servicios se marcarán como pagados.
                                </p>
                              </div>
                            `,
                            background: '#0a0a0a',
                            color: '#fff',
                            showCancelButton: true,
                            confirmButtonText: 'PROCESAR PAGO AHORA',
                            cancelButtonText: 'CANCELAR',
                            confirmButtonColor: '#f59e0b',
                            cancelButtonColor: '#1a1a1a',
                            customClass: {
                              popup: 'rounded-[3rem] border border-white/10 shadow-2xl',
                              confirmButton: 'rounded-2xl font-black uppercase tracking-widest text-[10px] px-8 py-4',
                              cancelButton: 'rounded-2xl font-black uppercase tracking-widest text-[10px] px-8 py-4'
                            }
                          }).then((result) => {
                            if (result.isConfirmed) {
                              handleExecuteSettlement(selectedBarber.id,
                                pendingServices,
                                selectedBarber.commission_percentage || 50
                              );
                            }
                          });
                        }}
                        className="bg-black text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-2xl"
                      >
                        Realizar Liquidación Ahora
                      </button>
                    </div>
                  </div>
                  <Activity size={200} className="absolute -bottom-10 -right-10 opacity-10" />
                </div>

                <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-[3.5rem] p-12 space-y-8">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Información de Contacto</p>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-100 dark:bg-white/5 rounded-xl"><User size={18} /></div>
                        <p className="text-sm font-black uppercase italic">{selectedBarber.document_id || 'N/A'}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-100 dark:bg-white/5 rounded-xl"><Activity size={18} /></div>
                        <p className="text-sm font-black uppercase italic">{selectedBarber.phone || 'N/A'}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-100 dark:bg-white/5 rounded-xl"><LayoutDashboard size={18} /></div>
                        <p className="text-xs font-black uppercase italic text-gray-500">{selectedBarber.address || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-[3.5rem] p-12">
                <h3 className="text-xl font-black uppercase tracking-tight italic mb-10">Servicios Recientes <span className="text-[#f59e0b] ml-2 text-sm not-italic">({pendingServices.length} pendientes)</span></h3>
                <div className="grid gap-4">
                  {pendingServices.map(s => (
                    <div key={s.id} className="flex justify-between items-center p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-transparent hover:border-[#f59e0b]/20 transition-all">
                      <div className="flex items-center gap-6">
                        <div className="bg-black/10 dark:bg-white/5 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">{format(new Date(s.start_time), 'dd MMM HH:mm')}</div>
                        <div>
                          <p className="text-lg font-black uppercase tracking-tight italic">{s.client_name || 'Walk-in'}</p>
                        </div>
                      </div>
                      <p className="text-xl font-black italic text-[#f59e0b]">${new Intl.NumberFormat('de-DE').format(s.price)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==== SERVICIOS ==== */}
      {activeTab === 'servicios' && (
        <div className="space-y-12">
          <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-black tracking-tighter uppercase mb-8">Nuevo Servicio</h2>
            <form onSubmit={handleCreateService} className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1 space-y-1"><label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Nombre</label><input className="w-full bg-gray-100 dark:bg-black/40 border-none rounded-xl py-3 px-4 text-sm" value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} placeholder="Corte Clásico" required /></div>
              <div className="md:col-span-1 space-y-1"><label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Precio</label><input type="number" className="w-full bg-gray-100 dark:bg-black/40 border-none rounded-xl py-3 px-4 text-sm font-black text-[#f59e0b]" value={newService.price} onChange={e => setNewService({ ...newService, price: e.target.value })} required /></div>
              <div className="md:col-span-1 space-y-1"><label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Duración (min)</label><input type="number" className="w-full bg-gray-100 dark:bg-black/40 border-none rounded-xl py-3 px-4 text-sm" value={newService.duration} onChange={e => setNewService({ ...newService, duration: e.target.value })} required /></div>
              <div className="flex items-end"><button className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all hover:bg-[#f59e0b] hover:text-black shadow-lg" type="submit">Crear</button></div>
            </form>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {services.map(s => (
              <div key={s.id} className="bg-white dark:bg-white/[0.01] border border-gray-200 dark:border-white/5 rounded-2xl p-6 transition-all hover:border-[#f59e0b]/30">
                {editService?.id === s.id ? (
                  <form onSubmit={handleUpdateService} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                    <div className="sm:col-span-2"><input className="w-full bg-gray-100 dark:bg-white/10 rounded-xl p-2 text-sm" value={editService.name} onChange={e => setEditService({ ...editService, name: e.target.value })} required /></div>
                    <div><input type="number" className="w-full bg-gray-100 dark:bg-white/10 rounded-xl p-2 text-sm text-[#f59e0b] font-black" value={editService.price} onChange={e => setEditService({ ...editService, price: Number(e.target.value) })} required /></div>
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 bg-emerald-500 text-white p-2 rounded-xl"><Check size={20} /></button>
                      <button type="button" onClick={() => setEditService(null)} className="flex-1 bg-gray-500 text-white p-2 rounded-xl"><X size={20} /></button>
                    </div>
                  </form>
                ) : (
                  <div className="flex justify-between items-center gap-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-black text-black dark:text-white uppercase tracking-tight leading-none">{s.name}</p>
                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${s.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{s.is_active ? 'Activo' : 'Inactivo'}</span>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2">{s.duration} MINUTOS</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <p className="text-xl font-black text-[#f59e0b] italic">${new Intl.NumberFormat('de-DE').format(s.price)}</p>
                      <div className="flex gap-2">
                        <button onClick={() => toggleServiceStatus(s.id, s.is_active)} className="p-2 text-gray-400 hover:text-black dark:hover:text-white" title={s.is_active ? 'Desactivar' : 'Activar'}>
                          {s.is_active ? <X size={18} /> : <Check size={18} />}
                        </button>
                        <button onClick={() => setEditService(s)} className="p-2 text-gray-400 hover:text-black dark:hover:text-white"><Edit size={18} /></button>
                        <button onClick={() => deleteService(s.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash size={18} /></button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==== GASTOS (Updated Logic) ==== */}
      {activeTab === 'gastos' && (
        <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-[3rem] p-10">
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">Gastos Operativos</h2>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Gestión de costos fijos y variables por mes</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Periodo:</label>
              <input 
                type="month" 
                className="bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-black text-[#f59e0b] outline-none"
                value={currentExpensePeriod}
                onChange={e => setCurrentExpensePeriod(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Formulario de Registro */}
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-sm">
                <h3 className="text-lg font-black uppercase tracking-tight italic mb-8">Registrar Gasto</h3>
                <form onSubmit={handleCreateExpense} className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Descripción</label>
                    <input 
                      className="w-full bg-gray-100 dark:bg-black/40 border-none rounded-xl py-4 px-4 text-sm" 
                      value={newExpense.description} 
                      onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} 
                      placeholder="Pago arriendo" 
                      required 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Monto (COP)</label>
                      <input 
                        type="number" 
                        min="0" 
                        className="w-full bg-gray-100 dark:bg-black/40 border-none rounded-xl py-4 px-4 text-sm font-black text-red-500" 
                        value={newExpense.amount} 
                        onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} 
                        required 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Fecha</label>
                      <input 
                        type="date" 
                        className="w-full bg-gray-100 dark:bg-black/40 border-none rounded-xl py-4 px-4 text-sm" 
                        value={newExpense.expense_date} 
                        onChange={e => setNewExpense({ ...newExpense, expense_date: e.target.value })} 
                        required 
                      />
                    </div>
                  </div>
                  <button className="w-full bg-red-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:bg-red-600 shadow-xl" type="submit">
                    Guardar Gasto
                  </button>
                </form>
              </div>
            </div>

            {/* Listado de Gastos */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center px-4">
                <h3 className="text-xl font-black uppercase italic tracking-tight">Desglose de {format(new Date(currentExpensePeriod + '-02'), 'MMMM yyyy')}</h3>
                <p className="text-xl font-black text-red-500 italic">Total: -${new Intl.NumberFormat('de-DE').format(monthlyExpenses.reduce((a, c) => a + Number(c.amount), 0))}</p>
              </div>
              
              <div className="grid gap-4">
                {monthlyExpenses.map(exp => (
                  <div key={exp.id} className="bg-white dark:bg-white/[0.01] border border-gray-200 dark:border-white/5 rounded-3xl p-6 transition-all hover:border-red-500/30">
                    {editExpense?.id === exp.id ? (
                      <form onSubmit={handleUpdateExpense} className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
                        <div className="sm:col-span-2">
                          <input className="w-full bg-gray-100 dark:bg-white/10 rounded-xl p-3 text-sm" value={editExpense.description} onChange={e => setEditExpense({ ...editExpense, description: e.target.value })} required />
                        </div>
                        <div>
                          <input type="number" min="0" className="w-full bg-gray-100 dark:bg-white/10 rounded-xl p-3 text-sm text-red-500 font-black" value={editExpense.amount} onChange={e => setEditExpense({ ...editExpense, amount: Number(e.target.value) })} required />
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" className="flex-1 bg-emerald-500 text-white p-3 rounded-xl"><Check size={20} /></button>
                          <button type="button" onClick={() => setEditExpense(null)} className="flex-1 bg-gray-500 text-white p-3 rounded-xl"><X size={20} /></button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                          <div className="p-4 bg-red-500/10 rounded-2xl text-red-500">
                            <TrendingDown size={24} />
                          </div>
                          <div>
                            <p className="font-black text-black dark:text-white uppercase tracking-tight italic">{exp.description}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mt-1">
                              {exp.category} • {format(new Date(exp.expense_date), 'dd MMM')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <p className="text-2xl font-black text-red-500 italic leading-none">-${new Intl.NumberFormat('de-DE').format(exp.amount)}</p>
                          <div className="flex gap-2">
                            <button onClick={() => setEditExpense(exp)} className="p-3 text-gray-400 hover:text-black dark:hover:text-white transition-colors"><Edit size={18} /></button>
                            <button onClick={() => handleDeleteExpense(exp.id)} className="p-3 text-gray-400 hover:text-red-500 transition-colors"><Trash size={18} /></button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {monthlyExpenses.length === 0 && (
                  <div className="py-20 text-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[3rem] opacity-40">
                    <p className="text-gray-500 font-black uppercase tracking-[0.4em] text-xs">No hay gastos para este mes</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ==== MODAL CREACIÓN/EDICIÓN BARBERO ==== */}
      {editBarber && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-[3rem] p-10 w-full max-w-2xl shadow-2xl">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">
                  {editBarber.id ? 'Editar Socio' : 'Contratar Nuevo Socio'}
                </h3>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">
                  {editBarber.id ? 'Actualiza los términos del acuerdo' : 'Ingresa los datos para el nuevo perfil y acceso'}
                </p>
              </div>
              <button onClick={() => setEditBarber(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <form
              onSubmit={editBarber.id ? handleUpdateBarber : handleCreateBarber}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="space-y-1"><label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Nombre Completo</label><input className="w-full bg-gray-100 dark:bg-white/5 rounded-xl py-3 px-4 text-black dark:text-white" value={editBarber.name || ''} onChange={e => setEditBarber({ ...editBarber, name: e.target.value })} required /></div>

              {!editBarber.id && (
                <div className="space-y-1"><label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Correo Electrónico</label><input type="email" className="w-full bg-gray-100 dark:bg-white/5 rounded-xl py-3 px-4 text-black dark:text-white" value={editBarber.email || ''} onChange={e => setEditBarber({ ...editBarber, email: e.target.value })} required /></div>
              )}

              <div className="space-y-1"><label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Cédula / ID</label><input className="w-full bg-gray-100 dark:bg-white/5 rounded-xl py-3 px-4 text-black dark:text-white" value={editBarber.document_id || ''} onChange={e => setEditBarber({ ...editBarber, document_id: e.target.value })} required /></div>
              <div className="space-y-1"><label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Teléfono</label><input className="w-full bg-gray-100 dark:bg-white/5 rounded-xl py-3 px-4 text-black dark:text-white" value={editBarber.phone || ''} onChange={e => setEditBarber({ ...editBarber, phone: e.target.value })} required /></div>
              <div className="space-y-1 md:col-span-1"><label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Dirección de Residencia</label><input className="w-full bg-gray-100 dark:bg-white/5 rounded-xl py-3 px-4 text-black dark:text-white" value={editBarber.address || ''} onChange={e => setEditBarber({ ...editBarber, address: e.target.value })} required /></div>
              <div className="space-y-1 md:col-span-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-[#f59e0b] ml-1">% Ganancia para el Barbero</label>
                <input type="number" className="w-full bg-gray-100 dark:bg-white/5 rounded-xl py-3 px-4 font-black text-[#f59e0b]" value={editBarber.commission_percentage || 50} onChange={e => setEditBarber({ ...editBarber, commission_percentage: Number(e.target.value) })} placeholder="Ej: 60" required />
                <p className="text-[8px] text-gray-500 italic ml-1 mt-1">El resto se asignará automáticamente a la barbería.</p>
              </div>

              <div className="md:col-span-2 flex gap-4 mt-4">
                <button type="submit" className="flex-1 bg-[#f59e0b] text-black py-4 rounded-xl font-black uppercase tracking-widest text-[10px]">
                  {editBarber.id ? 'Guardar Cambios' : 'Confirmar Contratación'}
                </button>
                <button type="button" onClick={() => setEditBarber(null)} className="flex-1 bg-gray-100 dark:bg-white/5 text-gray-400 py-4 rounded-xl font-black uppercase tracking-widest text-[10px]">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
