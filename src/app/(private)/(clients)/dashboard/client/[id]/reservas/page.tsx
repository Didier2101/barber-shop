'use client';
import { useState, useEffect, useCallback } from 'react';
import { useClientAppointments, useCancelAppointment } from '@/hooks/client';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Star, Trash2, MessageCircle, Clock, CheckCircle2, Settings, Calendar as CalendarIcon, Save, Zap, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useGlobalStore } from '@/store/useGlobalStore';
import { Appointment, AppointmentService, BusinessHour } from '@/types';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';

export default function MisReservasPage() {
  const profile = useGlobalStore(state => state.userProfile);
  const queryClient = useQueryClient();
  const params = useParams();
  const clientId = params.id as string;
  const { data: appointmentsRaw = [], isLoading: loading } = useClientAppointments(clientId || profile?.id || '');
  const cancelMutation = useCancelAppointment();

  // Gestión de Cita seleccionada
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [isManaging, setIsManaging] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Lógica de Disponibilidad para Reprogramación
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);

  // Cargar Business Hours una sola vez
  useEffect(() => {
    async function loadHours() {
      const { data } = await supabase.from('business_hours').select('*');
      if (data) setBusinessHours(data);
    }
    loadHours();
  }, []);

  const calculateAvailableSlots = useCallback(async () => {
    if (!selectedApt || !newDate) return;
    setFetchingSlots(true);

    const barberId = selectedApt.barber_id;
    const totalDuration = Array.isArray(selectedApt.services_data)
      ? (selectedApt.services_data as AppointmentService[]).reduce((acc, curr) => acc + (curr.duration || 60), 0)
      : 60;

    const startOfDay = new Date(`${newDate}T00:00:00`);
    const endOfDay = new Date(`${newDate}T23:59:59`);
    const now = new Date();

    const { data: appointments } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('barber_id', barberId)
      .neq('id', selectedApt.id)
      .neq('status', 'cancelled')
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString());

    const dateObj = new Date(`${newDate}T12:00:00`);
    const dayOfWeek = dateObj.getDay();
    const dayConfig = businessHours.find(h => h.day_of_week === dayOfWeek);

    if (!dayConfig || dayConfig.is_closed) {
      setAvailableSlots([]);
      setFetchingSlots(false);
      return;
    }

    const slots: string[] = [];
    const [hOpen, mOpen] = dayConfig.opening_time.split(':').map(Number);
    const [hClose, mClose] = dayConfig.closing_time.split(':').map(Number);

    const opening = new Date(`${newDate}T${String(hOpen).padStart(2, '0')}:${String(mOpen).padStart(2, '0')}:00`);
    const closing = new Date(`${newDate}T${String(hClose).padStart(2, '0')}:${String(mClose).padStart(2, '0')}:00`);

    const currentSlot = new Date(opening);
    const intervalMinutes = 30;

    while (currentSlot.getTime() + totalDuration * 60000 <= closing.getTime()) {
      const slotStartTime = currentSlot.getTime();
      const slotEndTime = slotStartTime + (totalDuration * 60000);

      let overlaps = false;
      if (appointments) {
        for (const apt of appointments) {
          const aStart = new Date(apt.start_time).getTime();
          const aEnd = new Date(apt.end_time).getTime();
          if (slotStartTime < aEnd && slotEndTime > aStart) {
            overlaps = true;
            break;
          }
        }
      }

      if (slotStartTime < now.getTime()) overlaps = true;

      if (!overlaps) {
        slots.push(format(currentSlot, 'HH:mm'));
      }
      currentSlot.setMinutes(currentSlot.getMinutes() + intervalMinutes);
    }

    setAvailableSlots(slots);
    setFetchingSlots(false);
  }, [selectedApt, newDate, businessHours]);

  // Calcular slots cuando cambia la fecha de reprogramación
  useEffect(() => {
    if (isRescheduling && newDate && selectedApt) {
      calculateAvailableSlots();
    } else {
      setAvailableSlots([]);
      setNewTime('');
    }
  }, [newDate, isRescheduling, selectedApt, calculateAvailableSlots]);

  // Intelligent Sorting
  const appointments = [...appointmentsRaw].sort((a, b) => {
    const isUpcoming = (s: string) => s === 'pending' || s === 'confirmed';
    const aUp = isUpcoming(a.status);
    const bUp = isUpcoming(b.status);
    if (aUp && !bUp) return -1;
    if (!aUp && bUp) return 1;
    const dateA = new Date(a.start_time).getTime();
    const dateB = new Date(b.start_time).getTime();
    return aUp ? dateA - dateB : dateB - dateA;
  });

  const ServiceRating = ({ service, apt, onRate }: { service: AppointmentService, apt: Appointment, onRate: (aptId: string, serviceId: string, rating: number) => void }) => {
    const [hover, setHover] = useState(0);
    if (service.rating) {
      const ratingValue = service.rating;
      return (
        <div className="flex items-center gap-1 text-brand">
          {[1, 2, 3, 4, 5].map(star => (
            <Star key={star} size={10} fill={star <= ratingValue ? 'currentColor' : 'none'} className={star <= ratingValue ? '' : 'text-zinc-300'} />
          ))}
        </div>
      );
    }
    if (apt.status !== 'completed') return null;

    return (
      <div className="flex items-center gap-1 cursor-pointer">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            size={12}
            className={star <= (hover || 0) ? 'text-brand' : 'text-zinc-300'}
            fill={star <= (hover || 0) ? 'currentColor' : 'none'}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onRate(apt.id, service.id, star)}
          />
        ))}
      </div>
    );
  };

  async function handleCancelAction() {
    if (!selectedApt) return;

    if (!note || note.trim().length < 10) {
      return toast.error('Por favor, indica el motivo en las notas (mínimo 10 caracteres)');
    }

    const now = new Date();
    const aptTime = new Date(selectedApt.start_time);
    const diffHours = (aptTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let title = '¿CANCELAR CITA?';
    let text = 'Se notificará al barbero con tu motivo.';

    if (diffHours >= 0 && diffHours < 1) {
      title = '¡ATENCIÓN! CITA PRÓXIMA';
      text = 'Estás cancelando con menos de 1 hora de anticipación. Si no asistes, el barbero pierde el espacio y el dinero de ese turno. ¿Estás seguro de cancelar?';
    } else if (diffHours < 0) {
      title = '¿CANCELAR CITA PASADA?';
      text = 'Esta cita ya pasó su hora de inicio.';
    }

    const result = await Swal.fire({
      title,
      text,
      icon: 'warning',
      background: '#0a0a0a',
      color: '#fff',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'SÍ, CANCELAR',
      cancelButtonText: 'VOLVER'
    });

    if (result.isConfirmed) {
      const finalNote = `[Cancelado por Cliente]: ${note}`;
      cancelMutation.mutate({ id: selectedApt.id, notes: finalNote });
      setIsManaging(false);
    }
  }

  async function handleRateService(aptId: string, serviceId: string, ratingNum: number) {
    const apt = appointments.find(a => a.id === aptId);
    if (!apt) return;
    const newServicesData = apt.services_data.map((s: AppointmentService) => s.id === serviceId ? { ...s, rating: ratingNum } : s);
    const allRated = newServicesData.every((s: AppointmentService) => s.rating);
    const updateObj: Partial<Appointment> = { services_data: newServicesData };
    if (allRated) {
      updateObj.rating = newServicesData.reduce((a: number, c: AppointmentService) => a + (c.rating || 0), 0) / newServicesData.length;
    }
    const { error } = await supabase.from('appointments').update(updateObj).eq('id', aptId);
    if (!error) {
      toast.success('¡Gracias por calificar!');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    }
  }

  const handleWhatsAppContact = (apt: Appointment) => {
    const barberPhone = apt.barber?.phone || (apt as Appointment & { barber_profile?: { phone: string } }).barber_profile?.phone;
    if (!barberPhone) return toast.error('El barbero no tiene un número registrado');
    const date = format(new Date(apt.start_time), "EEEE d 'de' MMMM", { locale: es });
    const time = format(new Date(apt.start_time), 'HH:mm');
    const message = `Hola, soy ${profile?.name}. Deseo informar sobre mi cita del día ${date} a las ${time}.`;
    window.open(`https://wa.me/57${barberPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleOpenManagement = (apt: Appointment) => {
    setSelectedApt(apt);
    setNote(apt.notes || '');
    setIsManaging(true);
    setIsRescheduling(false);
    setNewDate('');
    setNewTime('');
  };

  const handleUpdateApt = async () => {
    if (!selectedApt) return;
    try {
      setIsSaving(true);

      const updateData: { notes: string; start_time?: string; end_time?: string } = { notes: note };

      if (isRescheduling) {
        if (!newDate || !newTime) {
          toast.warning('Selecciona fecha y hora disponible');
          setIsSaving(false);
          return;
        }
        const start = new Date(`${newDate}T${newTime}:00`);
        const duration = (new Date(selectedApt.end_time).getTime() - new Date(selectedApt.start_time).getTime()) / (1000 * 60);
        const end = new Date(start.getTime() + duration * 60000);
        updateData.start_time = start.toISOString();
        updateData.end_time = end.toISOString();
      }

      const { error } = await supabase.from('appointments').update(updateData).eq('id', selectedApt.id);
      if (error) throw error;

      toast.success('Cita actualizada correctamente');
      setIsManaging(false);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al actualizar';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between mb-2">
        <div className="space-y-2">
          <h1 className="text-4xl font-black capitalize tracking-tighter italic leading-none text-zinc-900">Mis Reservas</h1>
        </div>
      </div>

      <div className="flex flex-col max-w-4xl pt-6 border-t border-accent-green/10">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Cargando reservas...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-accent-green/20 rounded-[3rem] flex flex-col items-center justify-center gap-6">
            <div className="space-y-2 text-zinc-400">
              <p className="text-[11px] font-black uppercase tracking-[0.4em]">No tienes citas registradas</p>
            </div>
          </div>
        ) : (
          appointments.map((apt) => (
            <div
              key={apt.id}
              className="border-b border-accent-green/10 pb-6 mb-2 transition-all relative overflow-hidden z-10"
            >
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-brand/10 rounded-xl flex flex-col items-center justify-center text-center border border-brand/20 shrink-0">
                      <span className="text-[6px] font-black uppercase text-brand leading-none mb-0.5">{format(new Date(apt.start_time), 'MMM', { locale: es })}</span>
                      <span className="text-lg font-black text-brand italic leading-none">{format(new Date(apt.start_time), 'dd')}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[13px] font-black text-zinc-900 uppercase italic tracking-tight truncate leading-tight">
                        {(apt as Appointment & { barber_profile?: { nickname?: string; name?: string } }).barber_profile?.nickname || (apt as Appointment & { barber_profile?: { nickname?: string; name?: string } }).barber_profile?.name || apt.barber?.name || 'Barbero'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                          <Clock size={9} />
                          <span>{format(new Date(apt.start_time), 'HH:mm')}</span>
                        </div>
                        <span className={`text-[6px] font-black uppercase px-1.5 py-0.5 rounded-md border ${apt.status === 'confirmed' ? 'border-blue-500/30 text-blue-400 bg-blue-500/5' :
                          apt.status === 'completed' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' :
                            apt.status === 'cancelled' ? 'border-red-500/30 text-red-500 bg-red-500/5' :
                              'border-amber-500/30 text-amber-500 bg-amber-500/5'
                          }`}>
                          {apt.status === 'pending' ? 'Pendiente' :
                            apt.status === 'confirmed' ? 'Confirmada' :
                              apt.status === 'completed' ? 'Finalizada' : 'Cancelada'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {(apt.status === 'pending' || apt.status === 'confirmed') && (
                      <button onClick={() => handleOpenManagement(apt)} className="w-8 h-8 bg-transparent text-zinc-400 rounded-lg hover:text-brand transition-all flex items-center justify-center">
                        <Settings size={13} />
                      </button>
                    )}
                    {apt.status === 'confirmed' && (
                      <button onClick={() => handleWhatsAppContact(apt)} className="w-8 h-8 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center">
                        <MessageCircle size={13} />
                      </button>
                    )}
                    {apt.status === 'completed' && (
                      <div className="w-8 h-8 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center border border-emerald-500/20">
                        <CheckCircle2 size={12} />
                      </div>
                    )}
                  </div>
                </div>

                {apt.status === 'cancelled' && (
                  <div className="my-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-red-500 mb-1">
                      {apt.notes?.startsWith('[Cancelado por Barbero]:')
                        ? 'Cancelado por el Barbero'
                        : apt.notes?.startsWith('[Cancelado por Cliente]:')
                          ? 'Cancelado por ti'
                          : 'Motivo de Cancelación'}
                    </p>
                    <p className="text-xs text-zinc-700 italic">
                      {apt.notes?.startsWith('[Cancelado por Barbero]:')
                        ? `El barbero canceló porque: ${apt.notes.replace('[Cancelado por Barbero]:', '').trim()}`
                        : apt.notes?.startsWith('[Cancelado por Cliente]:')
                          ? `Tú cancelaste porque: ${apt.notes.replace('[Cancelado por Cliente]:', '').trim()}`
                          : (apt.notes || 'Cita cancelada (motivo no registrado)')}
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t border-accent-green/10 flex items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {Array.isArray(apt.services_data) && (apt.services_data as AppointmentService[]).map((s) => (
                      <div key={s.id} className="bg-bg-base px-2 py-1 rounded-md border border-accent-green/10 flex items-center gap-2">
                        <span className="text-[7px] font-black text-zinc-700 uppercase tracking-widest leading-none">{s.name}</span>
                        <ServiceRating service={s} apt={apt} onRate={handleRateService} />
                      </div>
                    ))}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black italic text-brand leading-none tracking-tighter">{formatPrice(apt.price)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PANEL DE GESTIÓN LATERAL */}
      <AnimatePresence>
        {isManaging && selectedApt && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[200] bg-bg-base/80 backdrop-blur-sm flex justify-end"
            onClick={() => setIsManaging(false)}
          >
            <motion.div
              className="w-full max-w-md bg-surface border-l border-accent-green/20 h-full shadow-2xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="shrink-0 h-14 border-b border-accent-green/10 flex items-center justify-between px-6 bg-surface/95 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-black text-zinc-900 uppercase italic tracking-tighter">Gestionar Cita</h2>
                </div>
                <button onClick={() => setIsManaging(false)} className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-all active:scale-90">
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Content - scroll contains everything including save button */}
              <div className="flex-1 overflow-y-auto px-6 pt-6 pb-10 space-y-8 custom-scrollbar">
                {/* Resumen */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand/10 rounded-2xl flex flex-col items-center justify-center text-center border border-brand/20 shrink-0">
                    <span className="text-[8px] font-black uppercase text-brand leading-none mb-0.5">{format(new Date(selectedApt.start_time), 'MMM', { locale: es })}</span>
                    <span className="text-xl font-black text-brand italic leading-none">{format(new Date(selectedApt.start_time), 'dd')}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tu Barbero</p>
                    <p className="text-lg font-black text-zinc-900 uppercase italic tracking-tighter">
                      {(selectedApt as Appointment & { barber_profile?: { nickname?: string; name?: string } }).barber_profile?.nickname || (selectedApt as Appointment & { barber_profile?: { nickname?: string; name?: string } }).barber_profile?.name || selectedApt.barber?.name}
                    </p>
                  </div>
                </div>

                {/* Nota */}
                <div className="space-y-3 border-t border-accent-green/10 pt-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Motivo / Notas Especiales</label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Ej: No puedo ir hoy por trabajo, deseo moverla para mañana..."
                    className="w-full bg-transparent border border-accent-green/20 rounded-2xl p-4 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-brand/40 transition-all min-h-[100px] resize-none"
                  />
                  <p className="text-[7px] font-bold text-zinc-400 uppercase tracking-widest">* Obligatorio para cancelar</p>
                </div>

                {/* Reprogramar */}
                <div className="space-y-4 border-t border-accent-green/10 pt-6">
                  {selectedApt.applied_promo_id ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-amber-500">
                        <Zap size={14} />
                        <p className="text-[10px] font-black uppercase tracking-widest">Cita con Promoción</p>
                      </div>
                      <p className="text-[8px] font-medium text-zinc-500 leading-relaxed uppercase tracking-widest">
                        Esta cita incluye una oferta especial exclusiva. Las promociones no permiten reprogramación, solo cancelación definitiva.
                      </p>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsRescheduling(!isRescheduling)}
                        className={`w-full py-4 rounded-2xl border transition-all flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] ${isRescheduling ? 'bg-brand text-white border-brand' : 'bg-transparent border-accent-green/20 text-zinc-500 hover:text-zinc-900 hover:bg-black/5'}`}
                      >
                        <CalendarIcon size={16} />
                        {isRescheduling ? 'Cerrar Selector' : 'Reprogramar para otro día'}
                      </button>

                      <AnimatePresence>
                        {isRescheduling && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden space-y-6 pt-2"
                          >
                            <div className="space-y-2">
                              <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest ml-1">Elegir Nueva Fecha</label>
                              <input
                                type="date"
                                value={newDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={e => setNewDate(e.target.value)}
                                className="w-full bg-transparent border border-accent-green/20 rounded-xl px-4 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-900 outline-none focus:border-brand"
                              />
                            </div>

                            {newDate && (
                              <div className="space-y-4">
                                <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest ml-1">Horas Disponibles</label>
                                {fetchingSlots ? (
                                  <div className="flex flex-col items-center py-6 gap-2">
                                    <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Consultando Agenda...</p>
                                  </div>
                                ) : availableSlots.length === 0 ? (
                                  <p className="text-[9px] text-red-500 font-black uppercase tracking-widest text-center py-4">Sin disponibilidad este día</p>
                                ) : (
                                  <div className="grid grid-cols-4 gap-2">
                                    {availableSlots.map(time => (
                                      <button
                                        key={time}
                                        type="button"
                                        onClick={() => setNewTime(time)}
                                        className={`py-3 rounded-xl text-[10px] font-black transition-all ${newTime === time ? 'bg-brand text-white shadow-lg scale-110' : 'bg-transparent text-zinc-500 hover:bg-black/5 border border-accent-green/20'}`}
                                      >
                                        {time}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>

                {/* Zona de Cancelación */}
                <div className="border-t border-accent-green/10 pt-6 space-y-4">
                  <p className="text-[9px] font-black text-red-500 uppercase tracking-[0.3em] italic">Zona de Cancelación</p>
                  <button
                    onClick={handleCancelAction}
                    className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3"
                  >
                    <Trash2 size={16} />
                    Cancelar Cita Definitivamente
                  </button>
                </div>

                {/* Guardar Cambios — dentro del scroll para que siempre sea visible */}
                <div className="pt-2 pb-4">
                  <button
                    onClick={handleUpdateApt}
                    disabled={isSaving || (isRescheduling && (!newDate || !newTime))}
                    className="w-full bg-brand hover:bg-accent-green text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 shadow-xl shadow-brand/20 active:scale-95 disabled:opacity-20 transition-all"
                  >
                    {isSaving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                    {isRescheduling ? 'Confirmar Reprogramación' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
