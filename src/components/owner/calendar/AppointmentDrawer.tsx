'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Appointment, Profile, Service, BusinessHour } from '@/types';
import { X, User, Clock, Scissors, Check, Trash2, Calendar, DollarSign, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { format, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface AppointmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  existingAppointment?: Appointment | null;
  selectedSlot?: { start: Date; end: Date } | null;
  barbers: Profile[];
}

const appointmentSchema = z.object({
  clientName: z.string().min(1, 'Ingresa el nombre del cliente'),
  clientPhone: z.string().optional().refine(val => !val || /^3\d{9}$/.test(val), {
    message: 'Debe tener 10 dígitos numéricos y empezar por 3'
  }),
  barberId: z.string().min(1, 'Selecciona un profesional'),
  selectedServiceIds: z.array(z.string()).min(1, 'Selecciona al menos un servicio'),
  selectedDate: z.date(),
  selectedTime: z.string().min(1, 'Selecciona una hora')
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

export function AppointmentDrawer({ isOpen, onClose, existingAppointment, selectedSlot, barbers }: AppointmentDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Availability States
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);

  // Edit Mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const canEdit = existingAppointment && existingAppointment.status !== 'completed' && !existingAppointment.settlement_id;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      clientName: '',
      clientPhone: '',
      barberId: '',
      selectedServiceIds: [],
      selectedDate: selectedSlot?.start || new Date(),
      selectedTime: ''
    }
  });

  const watchClientName = watch('clientName');
  const watchClientPhone = watch('clientPhone');
  const watchBarberId = watch('barberId');
  const watchSelectedServiceIds = watch('selectedServiceIds');
  const watchSelectedDate = watch('selectedDate');
  const watchSelectedTime = watch('selectedTime');

  // Fetch all services
  const { data: allServices = [] } = useQuery({
    queryKey: ['all_services'],
    queryFn: async () => {
      const { data } = await supabase.from('services').select('*').eq('is_active', true);
      return (data as Service[]) || [];
    }
  });

  // Fetch Business Hours once
  useEffect(() => {
    async function loadHours() {
      const { data } = await supabase.from('business_hours').select('*');
      if (data) setBusinessHours(data as BusinessHour[]);
    }
    loadHours();
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Populate data when modal opens
  useEffect(() => {
    if (existingAppointment) {
      reset({
        clientName: existingAppointment.client?.name || existingAppointment.client_name || '',
        clientPhone: existingAppointment.client?.phone || existingAppointment.client_phone || '',
        barberId: existingAppointment.barber_id,
        selectedServiceIds: existingAppointment.services_data.map(s => s.id),
        selectedDate: new Date(existingAppointment.start_time),
        selectedTime: format(new Date(existingAppointment.start_time), 'HH:mm')
      });
    } else {
      reset({
        clientName: '',
        clientPhone: '',
        barberId: '',
        selectedServiceIds: [],
        selectedDate: selectedSlot?.start || new Date(),
        selectedTime: ''
      });
    }
  }, [existingAppointment, selectedSlot, reset]);

  // Calculate available slots dynamically
  useEffect(() => {
    async function calculateAvailableSlots() {
      if (!watchBarberId || watchSelectedServiceIds.length === 0) {
        setAvailableSlots([]);
        return;
      }
      
      setFetchingSlots(true);
      
      const dateString = format(watchSelectedDate, 'yyyy-MM-dd');
      const startOfDay = new Date(`${dateString}T00:00:00`);
      const endOfDay = new Date(`${dateString}T23:59:59`);
      const now = new Date();

      // Total duration needed
      const servicesData = allServices.filter(s => watchSelectedServiceIds.includes(s.id));
      const totalDuration = servicesData.reduce((acc, curr) => acc + curr.duration, 0) || 30; // default 30 if none found (fallback)

      // Fetch existing appointments for this barber on this day
      const { data: appointments } = await supabase
        .from('appointments')
        .select('id, start_time, end_time')
        .eq('barber_id', watchBarberId)
        .neq('status', 'cancelled')
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString());

      const apts = (appointments || []).map(a => {
        // Ignorar la propia cita si estamos editando
        if (existingAppointment && a.id === existingAppointment.id) return null;
        return {
          start: new Date(a.start_time).getTime(),
          end: new Date(a.end_time).getTime()
        };
      }).filter(Boolean) as {start: number, end: number}[];

      const dayOfWeek = startOfDay.getDay(); // 0=Sunday, 1=Monday...
      const daySlotsConfig = businessHours.filter(bh => bh.day_of_week === dayOfWeek && !bh.is_closed);

      if (daySlotsConfig.length === 0) {
        setAvailableSlots([]);
        setFetchingSlots(false);
        return;
      }

      const slots: string[] = [];
      const intervalMinutes = 15;

      daySlotsConfig.forEach(config => {
        const openTimeParts = config.opening_time.split(':');
        const closeTimeParts = config.closing_time.split(':');
        const currentSlot = new Date(`${dateString}T00:00:00`);
        currentSlot.setHours(parseInt(openTimeParts[0]), parseInt(openTimeParts[1]), 0, 0);
        const closeSlot = new Date(`${dateString}T00:00:00`);
        closeSlot.setHours(parseInt(closeTimeParts[0]), parseInt(closeTimeParts[1]), 0, 0);

        while (currentSlot < closeSlot) {
          const slotStartTime = currentSlot.getTime();
          const slotEndTime = slotStartTime + (totalDuration * 60000);
          
          if (slotEndTime > closeSlot.getTime()) {
            currentSlot.setMinutes(currentSlot.getMinutes() + intervalMinutes);
            continue;
          }

          let overlaps = false;
          for (const apt of apts) {
            // Check intersection logic
            if (slotStartTime < apt.end && slotEndTime > apt.start) {
              overlaps = true;
              break;
            }
          }
          
          // Si es un día pasado o una hora pasada de hoy, marcamos solapamiento (excepto si editamos)
          if (!existingAppointment && slotStartTime < now.getTime()) {
             overlaps = true;
          }

          if (!overlaps) {
            const hh = currentSlot.getHours().toString().padStart(2, '0');
            const mm = currentSlot.getMinutes().toString().padStart(2, '0');
            slots.push(`${hh}:${mm}`);
          }
          currentSlot.setMinutes(currentSlot.getMinutes() + intervalMinutes);
        }
      });

      setAvailableSlots([...new Set(slots)].sort());
      setFetchingSlots(false);
    }

    calculateAvailableSlots();
  }, [watchBarberId, watchSelectedDate, watchSelectedServiceIds, allServices, businessHours, existingAppointment]);

  // Generate Date Cards (next 60 days)
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 60; i++) {
      dates.push(addDays(today, i));
    }
    return dates;
  };

  const onSubmit = async (data: AppointmentFormValues) => {
    const servicesData = allServices
      .filter(s => data.selectedServiceIds.includes(s.id))
      .map(s => ({ id: s.id, name: s.name, price: s.price, duration: s.duration }));
    
    const totalPrice = servicesData.reduce((acc, curr) => acc + curr.price, 0);
    const totalDuration = servicesData.reduce((acc, curr) => acc + curr.duration, 0) || 30;
    
    // Construct final Date
    const dateString = format(data.selectedDate, 'yyyy-MM-dd');
    const [hours, mins] = data.selectedTime.split(':').map(Number);
    const finalStartTime = new Date(`${dateString}T00:00:00`);
    finalStartTime.setHours(hours, mins, 0, 0);
    const finalEndTime = new Date(finalStartTime.getTime() + totalDuration * 60000);

    setLoading(true);
    try {
      if (existingAppointment) {
        const { error } = await supabase
          .from('appointments')
          .update({
            barber_id: data.barberId,
            services_data: servicesData,
            start_time: finalStartTime.toISOString(),
            end_time: finalEndTime.toISOString(),
            price: totalPrice,
            client_name: data.clientName, // Actualizar por si lo editaron
            client_phone: data.clientPhone
          })
          .eq('id', existingAppointment.id);
        
        if (error) throw error;
        toast.success('Reserva actualizada exitosamente');
      } else {
        const { error } = await supabase.from('appointments').insert({
          client_name: data.clientName,
          client_phone: data.clientPhone,
          barber_id: data.barberId,
          services_data: servicesData,
          start_time: finalStartTime.toISOString(),
          end_time: finalEndTime.toISOString(),
          price: totalPrice,
          status: 'pending', // Replicar el comportamiento del cliente
        });
        if (error) throw error;
        toast.success('Reserva creada exitosamente');
      }
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Error al procesar la reserva');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!existingAppointment) return;

    const result = await Swal.fire({
      title: '¿Cancelar Reserva?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#333',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Cerrar',
      background: '#18181b',
      color: '#f4f4f5'
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('appointments')
          .update({ status: 'cancelled' })
          .eq('id', existingAppointment.id);
        
        if (error) throw error;
        toast.success('Reserva cancelada');
        onClose();
      } catch (err: unknown) {
        toast.error((err as Error).message || 'Error al cancelar');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleService = (id: string) => {
    const current = watchSelectedServiceIds;
    if (current.includes(id)) {
       setValue('selectedServiceIds', current.filter(s => s !== id), { shouldValidate: true });
    } else {
       setValue('selectedServiceIds', [...current, id], { shouldValidate: true });
    }
    // Reiniciar hora al cambiar servicios porque cambia la duración y disponibilidad
    setValue('selectedTime', '', { shouldValidate: true }); 
  };

  if (!mounted) return null;

  const availableDates = generateDates();

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-0 z-[99999] w-screen h-screen flex flex-col bg-erp-bg font-sans overflow-hidden"
        >
          {/* Cabecera del Modal */}
          <div className="shrink-0 h-20 border-b bg-erp-surface border-erp-border flex items-center justify-between px-6 z-10 shadow-sm">
            <div className="flex flex-col">
              <h2 className="text-xl font-black text-erp-text uppercase tracking-tight flex items-center gap-2">
                <Calendar size={20} className="text-erp-primary" /> 
                {existingAppointment ? (isEditMode ? 'Editar Reserva' : 'Detalles de Reserva') : 'Nueva Reserva'}
              </h2>
            </div>
            
            <div className="flex flex-1 max-w-lg mx-6 items-center gap-3 border-x border-erp-border px-6">
               <div className="w-10 h-10 rounded-full bg-erp-bg flex items-center justify-center shrink-0 border border-erp-border">
                 <User size={18} className="text-erp-text-muted" />
               </div>
               {!existingAppointment || isEditMode ? (
                 <div className="flex-1 flex gap-2">
                   <div className="w-full">
                     <input 
                       {...register('clientName')}
                       placeholder="Nombre del Cliente *"
                       className={`w-full bg-erp-bg border ${errors.clientName ? 'border-red-500/50 focus:border-red-500/50' : 'border-erp-border focus:border-erp-primary/50'} text-erp-text rounded-xl px-3 py-2 text-xs font-bold outline-none transition-all`} 
                     />
                     {errors.clientName && <span className="text-[9px] text-red-500 font-bold ml-1">{errors.clientName.message}</span>}
                   </div>
                   <div className="w-full">
                     <input 
                       {...register('clientPhone')}
                       type="tel"
                       placeholder="Teléfono"
                       className={`w-full bg-erp-bg border ${errors.clientPhone ? 'border-red-500/50 focus:border-red-500/50' : 'border-erp-border focus:border-erp-primary/50'} text-erp-text rounded-xl px-3 py-2 text-xs font-bold outline-none transition-all`} 
                     />
                     {errors.clientPhone && <span className="text-[9px] text-red-500 font-bold ml-1">{errors.clientPhone.message}</span>}
                   </div>
                 </div>
               ) : (
                 <div className="flex-1">
                   <p className="text-sm font-black text-erp-text leading-none">{watchClientName || 'Cliente sin registro'}</p>
                   <p className="text-[10px] text-erp-text-muted font-bold mt-1">{watchClientPhone || 'Sin teléfono'}</p>
                 </div>
               )}
            </div>

            <div className="flex items-center gap-4 shrink-0">
               {existingAppointment && (
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${existingAppointment.status === 'completed' ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/10' : existingAppointment.status === 'cancelled' ? 'border-red-500/20 text-red-500 bg-red-500/10' : 'border-blue-500/20 text-blue-500 bg-blue-500/10'}`}>
                    {existingAppointment.status === 'completed' ? 'Completada / Pagada' : existingAppointment.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                  </span>
               )}
              <button
                onClick={onClose}
                className="w-8 h-8 bg-erp-bg border border-erp-border rounded-lg text-erp-text-muted hover:text-erp-primary hover:border-erp-primary/30 flex items-center justify-center transition-all shadow-sm"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Contenido del Modal a Pantalla Completa */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {existingAppointment && !isEditMode ? (
              // MODO VISTA LECTURA
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                {/* Info Fecha y Barbero */}
                <div className="space-y-6">
                  <div className="bg-erp-surface border border-erp-border p-6 rounded-2xl text-center">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-erp-text-muted mb-3">Fecha y Hora Programada</h3>
                    <p className="text-xl font-black text-erp-text capitalize">
                      {format(new Date(existingAppointment.start_time), 'EEEE, d MMM yyyy', { locale: es })}
                    </p>
                    <p className="text-3xl font-black text-erp-primary mt-1 flex items-center justify-center gap-2">
                       <Clock size={24}/> {format(new Date(existingAppointment.start_time), 'HH:mm')}
                    </p>
                  </div>

                  <div className="bg-erp-surface border border-erp-border p-6 rounded-2xl text-center">
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-erp-text-muted mb-4">Profesional a cargo</h3>
                     {(() => {
                       const assignedBarber = barbers.find(b => b.id === existingAppointment.barber_id);
                       return (
                         <div className="flex flex-col items-center gap-3">
                           <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-erp-primary shadow-lg">
                             {assignedBarber?.avatar_url ? (
                               <Image src={assignedBarber.avatar_url} alt="Barber" fill className="object-cover" />
                             ) : (
                               <div className="w-full h-full bg-erp-bg flex items-center justify-center"><User size={24} className="text-erp-text-muted"/></div>
                             )}
                           </div>
                           <p className="text-lg font-black tracking-tight text-erp-text">{assignedBarber?.nickname || assignedBarber?.name || 'Desconocido'}</p>
                         </div>
                       );
                     })()}
                  </div>
                </div>

                {/* Servicios y Acciones */}
                <div className="bg-erp-surface border border-erp-border p-6 rounded-2xl flex flex-col h-full">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-erp-text-muted mb-4">Servicios Incluidos</h3>
                  <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                    {existingAppointment.services_data.map((s, i) => (
                      <div key={i} className="flex justify-between items-center bg-erp-bg border border-erp-border p-3 rounded-xl">
                        <span className="text-xs font-bold text-erp-text">{s.name}</span>
                        <span className="text-xs font-black text-erp-text">${s.price}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-erp-border">
                    <div className="flex justify-between items-end mb-6">
                      <span className="text-[10px] font-black uppercase tracking-widest text-erp-text-muted">Valor Total</span>
                      <span className="text-3xl font-black text-erp-primary leading-none">${existingAppointment.price}</span>
                    </div>

                    {canEdit && (
                       <div className="flex flex-col gap-3">
                          <button 
                             onClick={() => setIsEditMode(true)}
                             className="w-full bg-erp-primary text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-erp-primary/90 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                          >
                             Editar Reserva
                          </button>
                          <button 
                            onClick={handleCancel}
                            disabled={loading}
                            className="w-full bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <Trash2 size={14} /> Cancelar Reserva
                          </button>
                       </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // MODO CREACIÓN / EDICIÓN WIZARD (3 Columnas de izquierda a derecha)
              <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                
                {/* COLUMNA 1: Profesional (Depende de Cliente) */}
                <div className="relative bg-erp-surface border border-erp-border p-5 rounded-2xl flex flex-col space-y-6 h-[calc(100vh-112px)] shadow-sm overflow-hidden">
                  {(!watchClientName || watchClientName.trim() === '') && (
                     <div className="absolute inset-0 z-10 bg-erp-bg/60 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
                        <div className="bg-erp-surface border border-erp-border p-4 rounded-2xl shadow-lg flex flex-col items-center gap-3">
                           <Lock size={24} className="text-erp-text-muted" />
                           <p className="text-xs font-black uppercase tracking-widest text-erp-text">Datos del Cliente</p>
                           <p className="text-[10px] text-erp-text-muted">Ingresa el nombre del cliente en la barra superior para desbloquear la selección de profesionales.</p>
                        </div>
                     </div>
                  )}

                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-erp-primary flex items-center gap-2">
                         <Scissors size={14}/> 1. Elige Profesional
                      </h3>
                      {errors.barberId && <span className="text-[9px] text-red-500 font-bold ml-1">{errors.barberId.message}</span>}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {barbers.map(b => {
                        const isSelected = watchBarberId === b.id;
                        return (
                          <div 
                            key={b.id}
                            onClick={() => {
                              setValue('barberId', b.id, { shouldValidate: true });
                              setValue('selectedTime', '', { shouldValidate: true }); // Reset time because barber changed
                            }}
                            className={`cursor-pointer border rounded-xl p-2 flex flex-col items-center gap-2 transition-all ${
                              isSelected 
                                ? 'bg-erp-primary/10 border-erp-primary shadow-sm ring-1 ring-erp-primary' 
                                : 'bg-erp-bg border-erp-border hover:border-erp-primary/50'
                            }`}
                          >
                             <div className="relative w-10 h-10 rounded-full overflow-hidden border border-erp-border shrink-0">
                               {b.avatar_url ? (
                                 <Image src={b.avatar_url} alt="Barber" fill className="object-cover" />
                               ) : (
                                 <div className="w-full h-full bg-erp-surface flex items-center justify-center"><User size={16} className="text-erp-text-muted"/></div>
                               )}
                             </div>
                             <p className={`text-[9px] font-black text-center tracking-tight line-clamp-1 ${isSelected ? 'text-erp-primary' : 'text-erp-text'}`}>
                               {b.nickname || b.name}
                             </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* COLUMNA 2: Servicios (Depende de Barber) */}
                <div className="relative bg-erp-surface border border-erp-border p-5 rounded-2xl flex flex-col h-[calc(100vh-112px)] shadow-sm overflow-hidden">
                  {!watchBarberId && (
                     <div className="absolute inset-0 z-10 bg-erp-bg/60 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
                        <div className="bg-erp-surface border border-erp-border p-4 rounded-2xl shadow-lg flex flex-col items-center gap-3">
                           <Lock size={24} className="text-erp-text-muted" />
                           <p className="text-xs font-black uppercase tracking-widest text-erp-text">Selecciona un Profesional</p>
                           <p className="text-[10px] text-erp-text-muted">Para escoger servicios, elige un barbero primero en la columna izquierda.</p>
                        </div>
                     </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-erp-primary flex items-center gap-2">
                       <DollarSign size={14}/> 2. Servicios
                    </h3>
                    {errors.selectedServiceIds && <span className="text-[9px] text-red-500 font-bold ml-1">{errors.selectedServiceIds.message}</span>}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                    {allServices.map(s => {
                      const isSelected = watchSelectedServiceIds.includes(s.id);
                      return (
                        <div 
                          key={s.id}
                          onClick={() => toggleService(s.id)}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-erp-primary/10 border-erp-primary shadow-sm ring-1 ring-erp-primary'
                              : 'bg-erp-bg border-erp-border hover:border-erp-primary/50'
                          }`}
                        >
                          <div>
                            <span className={`block text-xs font-bold ${isSelected ? 'text-erp-primary' : 'text-erp-text'}`}>{s.name}</span>
                            <span className="block text-[9px] font-bold text-erp-text-muted">{s.duration} min</span>
                          </div>
                          <span className={`text-xs font-black ${isSelected ? 'text-erp-primary' : 'text-erp-text'}`}>${s.price}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-4 border-t border-erp-border shrink-0">
                     <div className="flex justify-between items-end">
                       <span className="text-[10px] font-black uppercase tracking-widest text-erp-text-muted">Total (Estimado)</span>
                       <span className="text-2xl font-black text-erp-primary leading-none">
                         ${allServices.filter(s => watchSelectedServiceIds.includes(s.id)).reduce((acc, curr) => acc + curr.price, 0)}
                       </span>
                     </div>
                  </div>
                </div>

                {/* COLUMNA 3: Disponibilidad y Confirmación (Depende de Servicios) */}
                <div className="relative bg-erp-surface border border-erp-border p-5 rounded-2xl flex flex-col h-[calc(100vh-112px)] shadow-sm">
                  {watchSelectedServiceIds.length === 0 && (
                     <div className="absolute inset-0 z-10 bg-erp-bg/60 backdrop-blur-[2px] flex items-center justify-center p-6 text-center rounded-2xl">
                        <div className="bg-erp-surface border border-erp-border p-4 rounded-2xl shadow-lg flex flex-col items-center gap-3">
                           <Lock size={24} className="text-erp-text-muted" />
                           <p className="text-xs font-black uppercase tracking-widest text-erp-text">Selecciona Servicios</p>
                           <p className="text-[10px] text-erp-text-muted">Necesitamos saber qué servicios se realizarán para calcular los horarios disponibles del barbero.</p>
                        </div>
                     </div>
                  )}

                  <h3 className="text-[11px] font-black uppercase tracking-widest text-erp-primary mb-4 flex items-center gap-2">
                     <Clock size={14}/> 3. Disponibilidad
                  </h3>
                  
                  {/* Fechas */}
                  <div className="mb-4">
                    <p className="text-[9px] font-bold text-erp-text-muted uppercase tracking-wider mb-2">Día de la cita</p>
                    <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 snap-x">
                      {availableDates.map(date => {
                        const isSelected = isSameDay(date, watchSelectedDate);
                        return (
                          <div
                            key={date.toISOString()}
                            onClick={() => {
                               setValue('selectedDate', date, { shouldValidate: true });
                               setValue('selectedTime', '', { shouldValidate: true }); // Reset time on date change
                            }}
                            className={`shrink-0 w-14 p-2 rounded-xl flex flex-col items-center justify-center cursor-pointer snap-start transition-all border ${
                              isSelected 
                                ? 'bg-erp-primary text-white border-erp-primary shadow-md ring-1 ring-erp-primary'
                                : 'bg-erp-bg border-erp-border text-erp-text hover:border-erp-primary/50'
                            }`}
                          >
                            <span className="text-[9px] font-black uppercase tracking-widest mb-1">{format(date, 'EEE', { locale: es })}</span>
                            <span className="text-base font-black leading-none">{format(date, 'd')}</span>
                            <span className="text-[9px] font-bold mt-1">{format(date, 'MMM', { locale: es })}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Horas */}
                  <div className="flex-1 overflow-hidden flex flex-col mb-4">
                    <div className="flex justify-between items-center mb-2">
                       <p className="text-[9px] font-bold text-erp-text-muted uppercase tracking-wider">
                          Horas Libres
                       </p>
                       <div className="flex items-center gap-2">
                          {errors.selectedTime && <span className="text-[9px] text-red-500 font-bold">{errors.selectedTime.message}</span>}
                          {fetchingSlots && <span className="animate-pulse text-erp-primary text-[9px] font-bold uppercase">Calculando...</span>}
                       </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                      {!fetchingSlots && availableSlots.length === 0 ? (
                         <div className="h-full flex flex-col items-center justify-center text-center p-4">
                            <Calendar size={24} className="text-erp-text-muted mb-2 opacity-50" />
                            <p className="text-xs font-black text-erp-text">Sin disponibilidad</p>
                            <p className="text-[10px] text-erp-text-muted mt-1">El profesional no tiene tiempo para estos servicios en este día.</p>
                         </div>
                      ) : (
                         <div className="grid grid-cols-4 gap-2">
                           {availableSlots.map(time => {
                             const isSelected = watchSelectedTime === time;
                             return (
                               <div
                                 key={time}
                                 onClick={() => setValue('selectedTime', time, { shouldValidate: true })}
                                 className={`py-2 rounded-xl flex items-center justify-center cursor-pointer transition-all border font-black text-xs ${
                                   isSelected
                                     ? 'bg-erp-primary text-white border-erp-primary shadow-md'
                                     : 'bg-erp-bg border-erp-border text-erp-text hover:border-erp-primary/50'
                                 }`}
                               >
                                 {time}
                               </div>
                             );
                           })}
                         </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-erp-border shrink-0">
                     <div className="flex gap-2">
                       {existingAppointment && isEditMode && (
                         <button 
                           type="button"
                           onClick={() => {
                              setIsEditMode(false);
                              reset({
                                clientName: existingAppointment.client?.name || existingAppointment.client_name || '',
                                clientPhone: existingAppointment.client?.phone || existingAppointment.client_phone || '',
                                barberId: existingAppointment.barber_id,
                                selectedServiceIds: existingAppointment.services_data.map(s => s.id),
                                selectedDate: new Date(existingAppointment.start_time),
                                selectedTime: format(new Date(existingAppointment.start_time), 'HH:mm')
                              });
                           }}
                           disabled={loading}
                           className="flex-1 py-3 bg-erp-bg border border-erp-border rounded-xl text-[10px] font-black uppercase tracking-widest text-erp-text hover:bg-erp-border transition-all"
                         >
                           Cancelar
                         </button>
                       )}
                       <button 
                         type="submit"
                         disabled={loading || availableSlots.length === 0}
                         className="flex-[2] py-3 bg-erp-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-erp-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                       >
                         <Check size={14}/> {existingAppointment ? 'Guardar Cambios' : 'Confirmar Reserva'}
                       </button>
                     </div>
                  </div>
                </div>

              </form>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
