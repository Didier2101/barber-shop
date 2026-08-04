'use client';
import { useState, useEffect, useCallback } from 'react';
import { useClientAppointments, useCancelAppointment } from '@/hooks/client';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { History, Star, Trash2, MessageCircle, Clock, CheckCircle2, Settings, X, Calendar as CalendarIcon, Save, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useGlobalStore } from '@/store/useGlobalStore';
import { Appointment, AppointmentService, BusinessHour } from '@/types';
import { supabase } from '@/lib/supabase';

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
    
    const opening = new Date(`${newDate}T${String(hOpen).padStart(2,'0')}:${String(mOpen).padStart(2,'0')}:00`);
    const closing = new Date(`${newDate}T${String(hClose).padStart(2,'0')}:${String(mClose).padStart(2,'0')}:00`);

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
        <div className="flex items-center gap-1 text-[#f59e0b]">
          {[1, 2, 3, 4, 5].map(star => (
            <Star key={star} size={10} fill={star <= ratingValue ? 'currentColor' : 'none'} className={star <= ratingValue ? '' : 'text-white/10'} />
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
            className={star <= (hover || 0) ? 'text-[#f59e0b]' : 'text-white/20'}
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

    const result = await Swal.fire({
      title: '¿CANCELAR CITA?',
      text: "Se notificará al barbero con tu motivo.",
      icon: 'warning',
      background: '#0a0a0a',
      color: '#fff',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'SÍ, CANCELAR',
      cancelButtonText: 'VOLVER'
    });

    if (result.isConfirmed) {
      // Guardamos la nota antes de cancelar
      await supabase.from('appointments').update({ notes: note }).eq('id', selectedApt.id);
      cancelMutation.mutate(selectedApt.id);
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
      <div className="flex items-center justify-between">
        <div className="space-y-2">
           <p className="text-[#f59e0b] text-[10px] font-black uppercase tracking-[0.4em] mb-1">Historial y Control</p>
           <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none text-white">Mis Reservas</h1>
        </div>
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
           <History size={24} className="text-[#f59e0b]" />
        </div>
      </div>

      <div className="flex flex-col -space-y-px max-w-4xl">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-[#f59e0b]/20 border-t-[#f59e0b] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Cargando reservas...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-30 flex flex-col items-center justify-center gap-6">
             <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.4em]">No tienes citas registradas</p>
             </div>
          </div>
        ) : (
          appointments.map((apt, index) => (
            <div 
              key={apt.id} 
              className={`
                bg-black/80 backdrop-blur-xl border border-white/10 p-4 lg:p-5 transition-all group relative overflow-hidden z-10 hover:z-20
                ${index === 0 ? 'rounded-t-[2.5rem]' : ''}
                ${index === appointments.length - 1 ? 'rounded-b-[2.5rem]' : ''}
              `}
            >
               <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-start gap-3">
                     <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#f59e0b]/10 rounded-xl flex flex-col items-center justify-center text-center border border-[#f59e0b]/20 shrink-0">
                           <span className="text-[6px] font-black uppercase text-[#f59e0b] leading-none mb-0.5">{format(new Date(apt.start_time), 'MMM', { locale: es })}</span>
                           <span className="text-lg font-black text-[#f59e0b] italic leading-none">{format(new Date(apt.start_time), 'dd')}</span>
                        </div>
                        <div className="min-w-0">
                           <h3 className="text-[13px] font-black text-white uppercase italic tracking-tight truncate leading-tight">
                              {(apt as Appointment & { barber_profile?: { nickname?: string; name?: string } }).barber_profile?.nickname || (apt as Appointment & { barber_profile?: { nickname?: string; name?: string } }).barber_profile?.name || apt.barber?.name || 'Barbero'}
                           </h3>
                           <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1 text-[8px] font-black text-white/40 uppercase tracking-widest">
                                 <Clock size={9} />
                                 <span>{format(new Date(apt.start_time), 'HH:mm')}</span>
                              </div>
                              <span className={`text-[6px] font-black uppercase px-1.5 py-0.5 rounded-md border ${
                                 apt.status === 'confirmed' ? 'border-blue-500/30 text-blue-400 bg-blue-500/5' :
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
                           <button onClick={() => handleOpenManagement(apt)} className="w-8 h-8 bg-white/5 text-white/40 rounded-lg hover:bg-[#f59e0b] hover:text-black transition-all flex items-center justify-center border border-white/5">
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

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-3">
                     <div className="flex flex-wrap gap-1.5 flex-1">
                        {Array.isArray(apt.services_data) && (apt.services_data as AppointmentService[]).map((s) => (
                           <div key={s.id} className="bg-black/40 px-2 py-1 rounded-md border border-white/5 flex items-center gap-2">
                              <span className="text-[7px] font-black text-white/80 uppercase tracking-widest leading-none">{s.name}</span>
                              <ServiceRating service={s} apt={apt} onRate={handleRateService} />
                           </div>
                        ))}
                     </div>
                     <div className="text-right shrink-0">
                        <p className="text-lg font-black italic text-[#f59e0b] leading-none tracking-tighter">${new Intl.NumberFormat('de-DE').format(apt.price)}</p>
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
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex justify-end"
            onClick={() => setIsManaging(false)}
          >
            <motion.div 
              className="w-full max-w-md bg-[#0a0a0a] border-l border-white/10 h-full shadow-2xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/10 text-[#f59e0b] flex items-center justify-center">
                    <Settings size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Gestionar Cita</h2>
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mt-1">ID: {selectedApt.id.slice(0,8)}</p>
                  </div>
                </div>
                <button onClick={() => setIsManaging(false)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-all text-white/40">
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {/* Resumen Card */}
                <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-[#f59e0b]/10 rounded-2xl flex flex-col items-center justify-center text-center border border-[#f59e0b]/20 shrink-0">
                        <span className="text-[8px] font-black uppercase text-[#f59e0b] leading-none mb-0.5">{format(new Date(selectedApt.start_time), 'MMM', { locale: es })}</span>
                        <span className="text-xl font-black text-[#f59e0b] italic leading-none">{format(new Date(selectedApt.start_time), 'dd')}</span>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Tu Barbero</p>
                        <p className="text-lg font-black text-white uppercase italic tracking-tighter">
                          {(selectedApt as Appointment & { barber_profile?: { nickname?: string; name?: string } }).barber_profile?.nickname || (selectedApt as Appointment & { barber_profile?: { nickname?: string; name?: string } }).barber_profile?.name || selectedApt.barber?.name}
                        </p>
                     </div>
                  </div>
                </div>

                {/* Nota Obligatoria para Cancelación o Reprogramación */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1 text-[#f59e0b]">
                    <MessageCircle size={14} />
                    <label className="text-[10px] font-black uppercase tracking-widest">Motivo / Notas Especiales</label>
                  </div>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Ej: No puedo ir hoy por trabajo, deseo moverla para mañana..."
                    className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#f59e0b]/40 transition-all min-h-[100px] resize-none"
                  />
                  <p className="text-[7px] font-bold text-white/20 uppercase tracking-widest ml-1">* Obligatorio para cancelar</p>
                </div>

                {/* Reprogramar Inteligente (Bloqueado si es Promo) */}
                <div className="space-y-4">
                   {selectedApt.applied_promo_id ? (
                     <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center gap-2 text-amber-500">
                           <Zap size={14} />
                           <p className="text-[10px] font-black uppercase tracking-widest">Cita con Promoción</p>
                        </div>
                        <p className="text-[8px] font-medium text-white/40 leading-relaxed uppercase tracking-widest">
                           Esta cita incluye una oferta especial exclusiva. Las promociones no permiten reprogramación, solo cancelación definitiva.
                        </p>
                     </div>
                   ) : (
                     <>
                       <button 
                         onClick={() => setIsRescheduling(!isRescheduling)}
                         className={`w-full py-4 rounded-2xl border transition-all flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] ${isRescheduling ? 'bg-[#f59e0b] text-black border-[#f59e0b]' : 'bg-white/5 border-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
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
                                <label className="text-[8px] font-black text-white/40 uppercase tracking-widest ml-1">Elegir Nueva Fecha</label>
                                <input 
                                  type="date" 
                                  value={newDate}
                                  min={new Date().toISOString().split('T')[0]}
                                  onChange={e => setNewDate(e.target.value)}
                                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-4 text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-[#f59e0b]" 
                                />
                             </div>

                             {newDate && (
                               <div className="space-y-4">
                                 <label className="text-[8px] font-black text-white/40 uppercase tracking-widest ml-1">Horas Disponibles</label>
                                 {fetchingSlots ? (
                                   <div className="flex flex-col items-center py-6 gap-2">
                                      <div className="w-6 h-6 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin" />
                                      <p className="text-[8px] font-black uppercase tracking-widest text-white/20">Consultando Agenda...</p>
                                   </div>
                                 ) : availableSlots.length === 0 ? (
                                   <div className="py-6 px-4 bg-red-500/5 rounded-2xl border border-red-500/10 text-center">
                                     <p className="text-[9px] text-red-500 font-black uppercase tracking-widest">Sin disponibilidad este día</p>
                                   </div>
                                 ) : (
                                   <div className="grid grid-cols-4 gap-2">
                                     {availableSlots.map(time => (
                                       <button
                                         key={time}
                                         type="button"
                                         onClick={() => setNewTime(time)}
                                         className={`py-3 rounded-xl text-[10px] font-black transition-all ${newTime === time ? 'bg-[#f59e0b] text-black shadow-lg scale-110' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}
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

                {/* Zona de Peligro */}
                <div className="pt-8 border-t border-white/5 space-y-4">
                  <p className="text-[9px] font-black text-red-500/50 uppercase tracking-[0.3em] text-center italic">Zona de Cancelación</p>
                  <button 
                    onClick={handleCancelAction}
                    className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3"
                  >
                    <Trash2 size={16} />
                    Cancelar Cita Definitivamente
                  </button>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-xl">
                 <button 
                   onClick={handleUpdateApt}
                   disabled={isSaving || (isRescheduling && (!newDate || !newTime))}
                   className="w-full bg-[#f59e0b] text-black py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 shadow-xl shadow-amber-500/10 active:scale-95 disabled:opacity-20 transition-all"
                 >
                   {isSaving ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Save size={18} />}
                   {isRescheduling ? 'Confirmar Reprogramación' : 'Guardar Cambios'}
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
