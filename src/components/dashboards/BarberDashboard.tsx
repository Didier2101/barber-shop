/* eslint-disable @next/next/no-img-element */
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { useBarberAgenda, useBarberStats, useBarberSocials, useBarberClients, useUpdateAppointmentStatus, useBarberFinance } from '@/hooks/useBarberData';
import {
  Upload,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  User,
  Eye,
  EyeOff,
  Edit2,
  X
} from 'lucide-react';
import { Profile, Service, Settlement } from '@/types';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useGlobalStore } from '@/store/useGlobalStore';

const calendarStyles = `
  .rdp {
    --rdp-cell-size: 45px;
    --rdp-accent-color: #f59e0b;
    --rdp-background-color: #f59e0b20;
    margin: 1em;
    font-family: inherit;
  }
  .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover {
    background-color: #f59e0b !important;
    color: black !important;
    font-weight: bold;
    border-radius: 12px;
  }
  .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
    background-color: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
    border-radius: 12px;
  }
  .rdp-day {
    border-radius: 12px;
  }
`;

export function BarberDashboard({ profile: initialProfile }: { profile: Profile }) {
  const queryClient = useQueryClient();
  const setGlobalProfile = useGlobalStore(state => state.setUserProfile);
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [timeFilter, setTimeFilter] = useState<'today' | 'custom'>('today');
  const [range, setRange] = useState<DateRange | undefined>();
  const [showCalendar, setShowCalendar] = useState(false);
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'inicio');
  const [selectedAgendaDate, setSelectedAgendaDate] = useState<Date>(new Date());

  useEffect(() => {
    if (tabParam) setActiveTab(tabParam);
  }, [tabParam]);
  const [uploading, setUploading] = useState(false);
  const [showWalkinForm, setShowWalkinForm] = useState(false);
  const [showAgendaCalendar, setShowAgendaCalendar] = useState(false);

  // Queries
  const { data: todayAgenda } = useBarberAgenda(profile.id);
  const { data: specificAgenda } = useBarberAgenda(profile.id, selectedAgendaDate.toISOString());

  // Para la vista inicio (siempre es hoy)
  const todayPendingAppointments = todayAgenda?.pending || [];
  const agendaAppointmentsListList = todayAgenda?.today || [];

  // Para la vista agenda (depende del calendario)
  const agendaPendingAppointments = specificAgenda?.pending || [];
  const agendaAppointmentsList = specificAgenda?.today || [];
  const { data: bStats } = useBarberStats(profile.id, timeFilter, range?.from ? { from: range.from, to: range.to } : undefined);
  const { data: barberSocials = [] } = useBarberSocials(profile.id);
  const { data: barberClients = [] } = useBarberClients(profile.id);

  // Finanzas del barbero
  const { data: financeData } = useBarberFinance(profile.id);

  const statusMutation = useUpdateAppointmentStatus();

  // Derived financial state
  const comm = profile.commission_percentage || 50;

  // Totales basados en el filtro de tiempo (bStats)
  const currentStats = bStats ? {
    income: bStats.income,
    serviceCount: bStats.serviceCount,
    barberEarnings: (bStats.income * comm) / 100,
    shopEarnings: bStats.income - (bStats.income * comm) / 100
  } : { income: 0, serviceCount: 0, barberEarnings: 0, shopEarnings: 0 };

  // Totales históricos (Acumulados)
  const finance = financeData || { appointments: [], settlements: [] };
  const totalHistoricallyGenerated = finance.appointments.reduce((a, c) => a + Number(c.price), 0);

  const pendingApps = finance.appointments.filter(a => !a.settlement_id);
  const totalPendingPayment = pendingApps.reduce((a, c) => a + Number(c.price), 0);
  const myPendingEarnings = (totalPendingPayment * comm) / 100;

  const settledApps = finance.appointments.filter(a => !!a.settlement_id);
  const totalAlreadySettled = settledApps.reduce((a, c) => a + Number(c.price), 0);
  const myAlreadySettledEarnings = (totalAlreadySettled * comm) / 100;

  const clients = barberClients;
  // const loading = loadingAgenda || loadingStats || loadingSocials || loadingClients;

  // Manual loading for some things (like services)
  const [services, setServices] = useState<Service[]>([]);

  // Profile Form
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: profile.name || '',
    nickname: profile.nickname || '',
    bio: profile.bio || '',
    phone: profile.phone || '',
    email: profile.email || '',
    document_id: profile.document_id || '',
    password: ''
  });

  const [newSocial, setNewSocial] = useState({ platform: 'Instagram', url: '' });
  const [clientName, setClientName] = useState('');
  const [selectedWalkinServices, setSelectedWalkinServices] = useState<Service[]>([]);

  useEffect(() => {
    async function fetchServices() {
      const { data } = await supabase.from('services').select('*').eq('is_active', true);
      if (data) setServices(data);
    }
    fetchServices();
  }, []);

  async function addSocial() {
    if (!newSocial.url) return toast.error('Ingresa una URL válida');
    const { error } = await supabase.from('barber_socials').insert({
      barber_id: profile.id,
      platform: newSocial.platform,
      url: newSocial.url
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Red social añadida');
      setNewSocial({ ...newSocial, url: '' });
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    statusMutation.mutate({ id, status: newStatus, barberId: profile.id }, {
      onSuccess: () => {
        if (newStatus === 'confirmed') toast.success('Cita aceptada correctamente');
        else if (newStatus === 'completed') toast.success('¡Excelente! Cita finalizada y cobrada con éxito');
        else if (newStatus === 'cancelled') toast.error('Cita rechazada o cancelada');
      }
    });
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      // 1. Upload to storage (using the existing bucket)
      const { error: uploadError } = await supabase.storage.from('imagenes-barberos').upload(filePath, file);
      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('imagenes-barberos').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // 2. Persist in Database
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (dbError) throw dbError;

      const updatedProfile = { ...profile, avatar_url: publicUrl };
      setProfile(updatedProfile);
      setGlobalProfile(updatedProfile);
      toast.success('¡Foto de perfil actualizada!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error(error);
      toast.error('Error al subir: ' + message);
    } finally {
      setUploading(false);
    }
  };

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (profileForm.email !== profile.email || profileForm.password) {
        const updateData: { email?: string; password?: string } = {};
        if (profileForm.email !== profile.email) updateData.email = profileForm.email;
        if (profileForm.password) updateData.password = profileForm.password;
        await supabase.auth.updateUser(updateData);
      }
      const { error: profError } = await supabase
        .from('profiles')
        .update({
          name: profileForm.name,
          nickname: profileForm.nickname,
          bio: profileForm.bio,
          phone: profileForm.phone,
          document_id: profileForm.document_id
        })
        .eq('id', profile.id);

      if (profError) throw profError;

      const updatedProfile = {
        ...profile,
        name: profileForm.name,
        nickname: profileForm.nickname,
        bio: profileForm.bio,
        phone: profileForm.phone,
        email: profileForm.email,
        document_id: profileForm.document_id
      };
      setProfile(updatedProfile);
      setGlobalProfile(updatedProfile);
      setIsEditing(false);
      setProfileForm({ ...profileForm, password: '' });
      toast.success('Perfil actualizado correctamente');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(message);
    }
  }



  async function deleteSocial(id: number) {
    const { error } = await supabase.from('barber_socials').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Red social eliminada');
      queryClient.invalidateQueries({ queryKey: ['barber-socials', profile.id] });
    }
  }

  const toggleWalkinService = (s: Service) => {
    if (selectedWalkinServices.find(x => x.id === s.id)) setSelectedWalkinServices(selectedWalkinServices.filter(x => x.id !== s.id));
    else setSelectedWalkinServices([...selectedWalkinServices, s]);
  };

  async function handleCreateWalkin(e: React.FormEvent) {
    e.preventDefault();
    if (selectedWalkinServices.length === 0) return toast.error('Selecciona al menos un servicio');

    const duration = selectedWalkinServices.reduce((a, c) => a + c.duration, 0);
    const price = selectedWalkinServices.reduce((a, c) => a + Number(c.price), 0);
    const start_time = new Date();
    const end_time = new Date(start_time.getTime() + duration * 60000);

    const { error } = await supabase.from('appointments').insert({
      barber_id: profile.id,
      services_data: selectedWalkinServices,
      client_name: clientName.trim() || 'Cliente Walk-in',
      start_time: start_time.toISOString(),
      end_time: end_time.toISOString(),
      price: price,
      status: 'completed'
    });

    if (error) toast.error(error.message);
    else {
      // Incrementar el contador en el perfil del barbero para Venta Rápida
      await supabase.rpc('increment_services_completed', { target_id: profile.id });

      setShowWalkinForm(false);
      setClientName('');
      setSelectedWalkinServices([]);
      toast.success('Venta registrada con éxito');
      queryClient.invalidateQueries({ queryKey: ['barber-agenda', profile.id] });
      queryClient.invalidateQueries({ queryKey: ['barber-stats', profile.id] });
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE').format(price);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <style>{calendarStyles}</style>


      {/* Background Photo - Hero Style (Visible en todas las pestañas para coherencia) */}
      <div className="fixed inset-0 z-0">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="BG" className="w-full h-full object-cover opacity-15" />
        ) : (
          <img src="/nathon-oski-EW_rqoSdDes-unsplash.jpg" alt="Shop" className="w-full h-full object-cover opacity-10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-[#050505]/40" />
      </div>

      <div className={`relative z-10 max-w-lg mx-auto pt-10 pb-24`}>

        {/* ==== VISTA INICIO (RESUMEN DE HOY Y VENTA RÁPIDA) ==== */}
        {activeTab === 'inicio' && (
          <div className="space-y-8 px-4">
            <div className="space-y-1">
              <p className="text-[#f59e0b] text-[10px] font-black uppercase tracking-[0.4em]">Mi Dashboard</p>
              <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none text-white">¡Hola, {profile.nickname || profile.name.split(' ')[0]}!</h1>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-1">{profile.email}</p>
            </div>

            <div className="bg-black border border-[#f59e0b]/30 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f59e0b]">Citas de Hoy</span>
                  <span className="text-xl font-black italic text-white leading-none">{agendaAppointmentsListList.length}</span>
                </div>

                {todayPendingAppointments.length > 0 && (
                  <div className="mt-4 bg-[#f59e0b]/20 text-[#f59e0b] text-xs font-bold p-3 rounded-xl border border-[#f59e0b]/30">
                    Tienes {todayPendingAppointments.length} citas pendientes. ¡Ve a la Agenda!
                  </div>
                )}

                <div className="mt-6 space-y-2">
                  {agendaAppointmentsListList.slice(0, 3).map(apt => (
                    <div key={apt.id} className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                      <span className="font-bold text-white uppercase">{apt.client?.name || apt.client_name}</span>
                      <span className="text-[#f59e0b] font-black">{format(new Date(apt.start_time), 'HH:mm')}</span>
                    </div>
                  ))}
                  {agendaAppointmentsListList.length === 0 && (
                    <p className="text-white/40 text-xs italic">No hay citas confirmadas para hoy.</p>
                  )}
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                <CalendarIcon size={120} className="text-white" />
              </div>
            </div>

            <button
              onClick={() => { 
                setShowWalkinForm(true);
                setClientName('Cliente Walk-in');
              }}
              className="w-full bg-[#f59e0b] text-black py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-[12px] flex items-center justify-center gap-3 shadow-2xl hover:scale-105 transition-all active:scale-95 group"
            >
              <Plus size={20} className="group-hover:rotate-12 transition-transform" />
              Registrar Venta Rápida
            </button>

            {/* MODAL: VENTA RÁPIDA (Walk-in) */}
            {showWalkinForm && (
              <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowWalkinForm(false)} />
                <div className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-8 sm:p-10 shadow-2xl animate-in slide-in-from-bottom-full duration-500 overflow-y-auto max-h-[90vh] custom-scrollbar">
                  <div className="flex justify-between items-center mb-8">
                    <div className="space-y-1">
                      <h3 className="text-[#f59e0b] text-[10px] font-black uppercase tracking-[0.4em]">Nueva Venta</h3>
                      <p className="text-2xl font-black text-white italic tracking-tighter">Registro Directo</p>
                    </div>
                    <button onClick={() => setShowWalkinForm(false)} className="bg-white/5 p-2 rounded-full text-white/40"><X size={20}/></button>
                  </div>

                  <form onSubmit={handleCreateWalkin} className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Nombre (Opcional)</label>
                      <input
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white focus:outline-none focus:border-[#f59e0b] transition-all font-bold"
                        value={clientName}
                        onChange={e => setClientName(e.target.value)}
                        placeholder="Nombre del cliente..."
                      />
                    </div>
                    <div className="space-y-6">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Servicios</label>
                      <div className="grid grid-cols-1 gap-3">
                        {services.map(s => {
                          const isSelected = selectedWalkinServices.find(x => x.id === s.id);
                          return (
                            <div
                              key={s.id}
                              onClick={() => toggleWalkinService(s)}
                              className={`cursor-pointer border p-5 rounded-2xl transition-all flex justify-between items-center ${isSelected ? 'border-[#f59e0b] bg-[#f59e0b]/10' : 'border-white/5 bg-white/5'}`}
                            >
                              <p className="text-[11px] font-black uppercase tracking-widest text-white leading-tight">{s.name}</p>
                              <p className="text-sm font-black text-[#f59e0b] italic">${formatPrice(s.price)}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <button className="w-full bg-[#f59e0b] text-black py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] hover:scale-[1.02] active:scale-95 transition-all shadow-xl" type="submit">Finalizar y Cobrar</button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
        {/* ==== TAB: AGENDA ==== */}
        {activeTab === 'agenda' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* SECCIÓN: PENDIENTES DE APROBACIÓN */}
            {agendaPendingAppointments.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <h2 className="text-xl font-black uppercase tracking-tight text-black dark:text-white italic">Por Aprobar ({agendaPendingAppointments.length})</h2>
                </div>
                <div className="grid gap-4">
                  {agendaPendingAppointments.map(apt => (
                    <div key={apt.id} className="bg-amber-500/5 border border-amber-500/20 rounded-[2rem] p-6 shadow-sm hover:border-amber-500/50 transition-all">
                      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6">
                          <div className="text-center bg-amber-500 text-black px-4 py-2 rounded-2xl font-black">
                            <p className="text-[10px] leading-none uppercase">{format(new Date(apt.start_time), 'MMM', { locale: es })}</p>
                            <p className="text-xl leading-none">{format(new Date(apt.start_time), 'dd')}</p>
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-black dark:text-white uppercase leading-none">{apt.client?.name || apt.client_name}</h3>
                            <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mt-1">
                              {format(new Date(apt.start_time), 'HH:mm')} - ${formatPrice(apt.price)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusChange(apt.id, 'confirmed')}
                            className="bg-emerald-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => handleStatusChange(apt.id, 'cancelled')}
                            className="bg-white/5 text-zinc-500 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all"
                          >
                            Rechazar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-6 border-b border-gray-200 dark:border-white/5 pb-6">
              <h2 className="text-2xl font-black uppercase tracking-tight text-black dark:text-white italic">
                Agenda: <span className="text-[#f59e0b]">{format(selectedAgendaDate, 'dd MMMM', { locale: es })}</span>
              </h2>
              <button
                onClick={() => setShowAgendaCalendar(true)}
                className="bg-white dark:bg-white/5 text-black dark:text-white border border-gray-200 dark:border-white/10 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#f59e0b] hover:text-black hover:border-[#f59e0b] transition-all flex items-center gap-3 shadow-lg"
              >
                <CalendarIcon size={16} />
                Seleccionar Día
              </button>
            </div>

            {showAgendaCalendar && (
              <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-[3rem] p-8 shadow-2xl relative max-w-[420px] w-full animate-in zoom-in-95 duration-300">
                  <button
                    onClick={() => setShowAgendaCalendar(false)}
                    className="absolute top-6 right-6 p-2 bg-gray-100 dark:bg-white/5 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                  >
                    <X size={20} />
                  </button>
                  <div className="text-center mb-6">
                    <h3 className="text-[#f59e0b] text-[10px] font-black uppercase tracking-[0.4em]">Navegador</h3>
                    <p className="text-2xl font-black text-black dark:text-white italic tracking-tighter">Tu Calendario</p>
                  </div>
                  <div className="flex justify-center bg-gray-50 dark:bg-black/50 rounded-[2rem] p-4 border border-gray-100 dark:border-white/5">
                    <DayPicker
                      mode="single"
                      selected={selectedAgendaDate}
                      onSelect={(d) => { if (d) { setSelectedAgendaDate(d); setShowAgendaCalendar(false); } }}
                      locale={es}
                      showOutsideDays
                    />
                  </div>
                </div>
              </div>
            )}

            {showWalkinForm && (
              <div className="bg-[#f59e0b]/5 border border-[#f59e0b]/20 rounded-[3rem] p-10 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                <form onSubmit={handleCreateWalkin} className="space-y-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f59e0b] ml-1">Nombre del Cliente</label>
                    <input
                      className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl py-5 px-6 text-black dark:text-white focus:outline-none focus:border-[#f59e0b] transition-all font-bold"
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      placeholder="Escribe el nombre aquí..."
                    />
                  </div>
                  <div className="space-y-6">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f59e0b] ml-1">Servicios Realizados</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {services.map(s => {
                        const isSelected = selectedWalkinServices.find(x => x.id === s.id);
                        return (
                          <div
                            key={s.id}
                            onClick={() => toggleWalkinService(s)}
                            className={`cursor-pointer border-2 p-6 rounded-[2rem] transition-all duration-300 ${isSelected ? 'border-[#f59e0b] bg-[#f59e0b]/10 scale-105' : 'border-gray-200 dark:border-white/5 bg-white dark:bg-white/5 hover:border-gray-300 dark:hover:border-white/10'}`}
                          >
                            <p className="text-[11px] font-black uppercase tracking-widest text-black dark:text-white leading-tight">{s.name}</p>
                            <p className="text-lg font-black text-[#f59e0b] mt-2 italic">${formatPrice(s.price)}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <button className="w-full bg-black dark:bg-[#f59e0b] text-white dark:text-black py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] hover:scale-[1.02] active:scale-95 transition-all shadow-xl" type="submit">Finalizar y Cobrar</button>
                </form>
              </div>
            )}

            <div className="grid gap-6">
              {agendaAppointmentsList.length === 0 ? (
                <div className="py-24 text-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[3rem] opacity-30">
                  <p className="text-gray-500 font-black uppercase tracking-[0.5em] text-xs">Sin actividad para hoy</p>
                </div>
              ) : (
                agendaAppointmentsList.map(apt => (
                  <div key={apt.id} className="group bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-3xl p-8 transition-all hover:border-[#f59e0b]/40 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest">
                            <Clock size={16} className="text-[#f59e0b]" />
                            {new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <span className={`text-[9px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full ${apt.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {apt.status}
                          </span>
                        </div>
                        <h3 className="text-2xl font-black text-black dark:text-white uppercase tracking-tight italic">{apt.client?.name || apt.client_name || 'Walk-in'}</h3>
                      </div>
                      <div className="flex items-center gap-6 border-t md:border-t-0 border-gray-200 dark:border-white/5 pt-6 md:pt-0">
                        <p className="text-3xl font-black italic text-black dark:text-white leading-none">${formatPrice(apt.price)}</p>
                        {apt.status === 'confirmed' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleStatusChange(apt.id, 'completed')} 
                              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                            >
                              Finalizar y Cobrar
                            </button>
                            <button 
                              onClick={() => handleStatusChange(apt.id, 'cancelled')} 
                              className="bg-white/5 text-zinc-500 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-95 border border-white/5"
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==== TAB: FINANZAS (Updated) ==== */}
        {activeTab === 'estadisticas' && (
          <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <h2 className="text-2xl font-black uppercase tracking-tight text-white italic">Mi Billetera</h2>
              <div className="flex flex-col gap-4">
                <div className="flex bg-white/5 p-1 rounded-[1.5rem] overflow-hidden border border-white/10 backdrop-blur-md">
                  <button onClick={() => { setTimeFilter('today'); setRange(undefined); }} className={`px-10 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${timeFilter === 'today' ? 'bg-[#f59e0b] text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>Hoy</button>
                  <button onClick={() => setShowCalendar(true)} className={`px-10 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 border-l border-white/5 ${timeFilter === 'custom' ? 'bg-[#f59e0b] text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                    <CalendarIcon size={14} />
                    {timeFilter === 'custom' && range?.from ? `${format(range.from, 'dd MMM', { locale: es })}...` : "Filtrar"}
                  </button>
                </div>

                {showCalendar && (
                  <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-8 shadow-2xl max-w-[420px] w-full animate-in zoom-in-95 duration-300">
                      <div className="flex justify-between items-center mb-6">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#f59e0b]">Periodo de Tiempo</span>
                          <p className="text-2xl font-black text-white italic tracking-tighter">Seleccionar Rango</p>
                        </div>
                        <X size={20} className="cursor-pointer text-white/40" onClick={() => setShowCalendar(false)} />
                      </div>
                      <div className="bg-white/5 rounded-[2rem] p-4 border border-white/5 flex justify-center">
                        <DayPicker mode="range" selected={range} onSelect={(r) => { setRange(r); if (r?.from) setTimeFilter('custom'); }} locale={es} />
                      </div>
                      <button onClick={() => setShowCalendar(false)} className="w-full mt-6 bg-[#f59e0b] text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Aplicar Filtro</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Resumen de Filtro (Hoy / Rango) - Cards Compactas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 shadow-sm group hover:border-[#f59e0b]/30 transition-all">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-4">Total Periodo</p>
                <p className="text-4xl font-black text-white italic leading-none">${formatPrice(currentStats.income)}</p>
                <div className="mt-6 pt-4 border-t border-white/5">
                  <p className="text-[8px] font-black uppercase text-white/20 tracking-widest">{currentStats.serviceCount} Servicios</p>
                </div>
              </div>

              <div className="bg-white/[0.03] backdrop-blur-xl border border-emerald-500/10 rounded-[2.5rem] p-6 shadow-sm group hover:border-emerald-500/40 transition-all">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-500/40 mb-4">Mi Ganancia ({comm}%)</p>
                <p className="text-4xl font-black text-emerald-500 italic leading-none">${formatPrice(currentStats.barberEarnings)}</p>
                <div className="mt-6 pt-4 border-t border-emerald-500/5">
                  <p className="text-[8px] font-black uppercase text-emerald-500/20 tracking-widest italic text-right">Por filtro</p>
                </div>
              </div>

              <div className="bg-white/[0.03] backdrop-blur-xl border border-amber-500/10 rounded-[2.5rem] p-6 shadow-sm group hover:border-amber-500/40 transition-all">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-amber-500/40 mb-4">Barbería</p>
                <p className="text-4xl font-black text-amber-500 italic leading-none">${formatPrice(currentStats.shopEarnings)}</p>
                <div className="mt-6 pt-4 border-t border-amber-500/5">
                  <p className="text-[8px] font-black uppercase text-amber-500/20 tracking-widest italic text-right">Local</p>
                </div>
              </div>
            </div>

            {/* Sección de Liquidaciones Reales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8">
              <div className="space-y-8">
                <h3 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-3">
                  <Clock className="text-[#f59e0b]" />
                  Estado de Cobros
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-[#f59e0b]/5 border border-[#f59e0b]/20 rounded-[2.5rem] p-8">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#f59e0b] mb-4">Pendiente de Cobro</p>
                    <p className="text-3xl font-black italic text-white leading-none">${formatPrice(myPendingEarnings)}</p>
                    <p className="text-[8px] font-black text-white/40 uppercase mt-4">{pendingApps.length} servicios sin liquidar</p>
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[2.5rem] p-8">
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-4">Ya Liquidado</p>
                    <p className="text-3xl font-black italic text-white leading-none">${formatPrice(myAlreadySettledEarnings)}</p>
                    <p className="text-[8px] font-black text-white/40 uppercase mt-4">Total histórico cobrado</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-[2.5rem] p-10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6">Total Generado Histórico</p>
                  <div className="flex justify-between items-end">
                    <p className="text-4xl font-black italic text-white leading-none">${formatPrice(totalHistoricallyGenerated)}</p>
                    <p className="text-[9px] font-black text-[#f59e0b] uppercase tracking-widest">Servicios Totales: {finance.appointments.length}</p>
                  </div>
                </div>

                {/* List of Pending Services */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 pl-2">Servicios Pendientes por Cobrar</h4>
                  <div className="grid gap-3">
                    {pendingApps.length === 0 ? (
                      <p className="text-[9px] text-zinc-600 uppercase font-bold pl-2 italic">No tienes servicios pendientes de pago</p>
                    ) : (
                      pendingApps.slice(0, 5).map(apt => (
                        <div key={apt.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                          <div>
                            <p className="text-[10px] font-black text-white uppercase leading-none mb-1">{apt.client?.name || apt.client_name || 'Walk-in'}</p>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase">{format(new Date(apt.start_time), 'dd MMM, HH:mm')}</p>
                          </div>
                          <p className="text-sm font-black text-amber-500 italic">${formatPrice((Number(apt.price) * comm) / 100)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <h3 className="text-xl font-black uppercase italic tracking-tight">Historial de Pagos Recibidos</h3>
                <div className="grid gap-4">
                  {finance.settlements.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-30">
                      <p className="text-xs font-black uppercase tracking-[0.5em]">No has recibido pagos aún</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {finance.settlements.map((s: Settlement) => (
                        <div key={s.id} className="bg-white dark:bg-white/[0.01] border border-gray-200 dark:border-white/5 p-6 rounded-[2rem] flex justify-between items-center group hover:bg-emerald-500/[0.02] transition-all">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#f59e0b]">{format(new Date(s.created_at), 'dd MMMM yyyy', { locale: es })}</p>
                            <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">Liquidado por: {s.settled_by_profile?.name || 'Admin'}</p>
                            {s.notes && <p className="text-[8px] italic text-gray-500 mt-2">&quot;{s.notes}&quot;</p>}
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-black italic text-emerald-500 leading-none">${formatPrice(s.barber_earnings)}</p>
                            <p className="text-[8px] font-black text-gray-500 uppercase mt-2">Comisión: {s.commission_applied}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {settledApps.length > 0 && (
                    <div className="pt-8 space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 pl-2">Detalle de Servicios Cobrados</h4>
                      <div className="grid gap-3">
                        {settledApps.slice(0, 10).map(apt => (
                          <div key={apt.id} className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex justify-between items-center">
                            <div>
                              <p className="text-[10px] font-black text-white uppercase leading-none mb-1">{apt.client?.name || apt.client_name || 'Walk-in'}</p>
                              <p className="text-[8px] font-bold text-zinc-500 uppercase">{format(new Date(apt.start_time), 'dd MMM, HH:mm')}</p>
                            </div>
                            <p className="text-sm font-black text-emerald-500 italic">${formatPrice((Number(apt.price) * comm) / 100)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==== TAB: CLIENTES ==== */}
        {activeTab === 'clientes' && (
          <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black uppercase tracking-tight text-black dark:text-white italic">Mis Clientes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {clients.map(c => (
                <div key={c.id} className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-[3rem] p-10 transition-all hover:border-[#f59e0b]/30 shadow-sm">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden bg-gray-100 dark:bg-white/5 border-2 border-gray-200 dark:border-white/10">
                      {c.avatar ? <img src={c.avatar} className="w-full h-full object-cover" alt={c.name} /> : <User size={32} className="w-full h-full p-6 text-gray-400" />}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-black dark:text-white uppercase tracking-tight leading-none">{c.name}</h3>
                      <p className="text-[10px] font-black text-[#f59e0b] uppercase tracking-[0.2em]">Cita: {new Date(c.lastService).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="mt-10 pt-8 border-t border-gray-200 dark:border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Inversión Total</span>
                    <span className="text-2xl font-black text-black dark:text-white italic leading-none">${formatPrice(c.totalSpent)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==== TAB: AJUSTES ==== */}
        {activeTab === 'perfil' && (
          <div className="max-w-4xl mx-auto py-12 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-[3.5rem] p-16 shadow-2xl">
              <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-10">
                <div className="flex items-center gap-8">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden bg-gray-100 dark:bg-white/5 border-4 border-[#f59e0b]/20 shadow-2xl transition-transform group-hover:scale-105">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Perfil del Barbero" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <User size={48} />
                        </div>
                      )}
                      {uploading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 p-3 bg-[#f59e0b] text-black rounded-2xl shadow-xl cursor-pointer hover:scale-110 transition-all">
                      <Upload size={18} />
                      <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                    </label>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-[#f59e0b]">Configuración</h3>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest opacity-60">Personaliza tu identidad visual</p>
                  </div>
                </div>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-black dark:bg-white/5 text-white dark:text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
                    <Edit2 size={16} /> Editar Datos
                  </button>
                )}
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f59e0b] ml-1">Nombre Completo</label>
                    <input className={`w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-5 px-8 text-black dark:text-white font-black text-lg ${!isEditing && 'opacity-50 pointer-events-none'}`} value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} required />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f59e0b] ml-1">Teléfono Personal</label>
                    <input className={`w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-5 px-8 text-black dark:text-white font-black text-lg ${!isEditing && 'opacity-50 pointer-events-none'}`} value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f59e0b] ml-1">Apodo / Nombre Artístico</label>
                    <input className={`w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-5 px-8 text-black dark:text-white font-black text-lg ${!isEditing && 'opacity-50 pointer-events-none'}`} value={profileForm.nickname} onChange={e => setProfileForm({ ...profileForm, nickname: e.target.value })} placeholder="Ej: The Barber King" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f59e0b] ml-1">Cédula / Documento</label>
                    <input className={`w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-5 px-8 text-black dark:text-white font-black text-lg ${!isEditing && 'opacity-50 pointer-events-none'}`} value={profileForm.document_id} onChange={e => setProfileForm({ ...profileForm, document_id: e.target.value })} required />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f59e0b] ml-1">Sobre Mí (Bio Profesional)</label>
                  <textarea
                    className={`w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-5 px-8 text-black dark:text-white font-medium text-lg min-h-[150px] ${!isEditing && 'opacity-50 pointer-events-none'}`}
                    value={profileForm.bio}
                    onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                    placeholder="Cuéntale a tus clientes sobre tu experiencia y estilo..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f59e0b] ml-1">Email Profesional</label>
                    <input type="email" className={`w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-5 px-8 text-black dark:text-white font-black text-lg ${!isEditing && 'opacity-50 pointer-events-none'}`} value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} required />
                  </div>
                </div>

                {isEditing && (
                  <div className="space-y-3 pt-4 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f59e0b] ml-1">Seguridad: Nueva Contraseña</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-5 px-8 text-black dark:text-white font-black text-lg" value={profileForm.password} onChange={e => setProfileForm({ ...profileForm, password: e.target.value })} placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#f59e0b]">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                )}

                {isEditing && (
                  <div className="flex gap-6 pt-12">
                    <button type="submit" className="flex-1 bg-[#f59e0b] text-black py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-[0_20px_40px_-10px_rgba(245,158,11,0.5)] hover:-translate-y-1 active:scale-95 transition-all">Guardar Ajustes</button>
                    <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-gray-100 dark:bg-white/5 text-gray-500 py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] hover:bg-red-500/10 hover:text-red-500 transition-all">Cancelar</button>
                  </div>
                )}
              </form>

              {/* Gestión de Redes Sociales */}
              <div className="mt-20 pt-20 border-t border-gray-100 dark:border-white/5 space-y-10">
                <div className="space-y-2">
                  <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-[#f59e0b]">Mis Redes Sociales</h3>
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest opacity-60">Conecta con tus clientes en otras plataformas</p>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <select
                    className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-4 px-6 text-black dark:text-white font-black text-xs uppercase tracking-widest outline-none"
                    value={newSocial.platform}
                    onChange={e => setNewSocial({ ...newSocial, platform: e.target.value })}
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Facebook">Facebook</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Portfolio">Otro / Portafolio</option>
                  </select>
                  <input
                    className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-4 px-6 text-black dark:text-white font-medium text-xs outline-none"
                    placeholder="Pega aquí la URL o enlace..."
                    value={newSocial.url}
                    onChange={e => setNewSocial({ ...newSocial, url: e.target.value })}
                  />
                  <button
                    onClick={addSocial}
                    className="bg-black dark:bg-white/10 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#f59e0b] hover:text-black transition-all"
                  >
                    Añadir
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {barberSocials.map(social => (
                    <div key={social.id} className="flex justify-between items-center bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 p-6 rounded-2xl">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#f59e0b]">{social.platform}</p>
                        <p className="text-[10px] text-gray-500 truncate max-w-[200px]">{social.url}</p>
                      </div>
                      <button onClick={() => deleteSocial(social.id)} className="p-3 text-gray-400 hover:text-red-500 transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
