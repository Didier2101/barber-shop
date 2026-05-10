'use client';
import { useState } from 'react';
import { useClientAppointments, useCancelAppointment } from '@/hooks/useClientData';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { History, Star, Trash2, MessageCircle, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useGlobalStore } from '@/store/useGlobalStore';
import { Appointment, AppointmentService } from '@/types';
import { supabase } from '@/lib/supabase';

export default function MisReservasPage() {
  const profile = useGlobalStore(state => state.userProfile);
  const queryClient = useQueryClient();
  const params = useParams();
  const clientId = params.id as string;
  const { data: appointmentsRaw = [], isLoading: loading } = useClientAppointments(profile?.id || '');
  const cancelMutation = useCancelAppointment();

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
            <Star key={star} size={12} fill={star <= ratingValue ? 'currentColor' : 'none'} className={star <= ratingValue ? '' : 'text-white/10'} />
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
            size={14}
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

  async function handleCancel(id: string) {
    const result = await Swal.fire({
      title: '¿CANCELAR CITA?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      background: '#0a0a0a',
      color: '#fff',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'SÍ, CANCELAR',
      cancelButtonText: 'VOLVER'
    });
    if (result.isConfirmed) {
      cancelMutation.mutate(id);
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
      queryClient.invalidateQueries({ queryKey: ['client-appointments'] });
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

  if (!profile) return null;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
           <p className="text-[#f59e0b] text-[10px] font-black uppercase tracking-[0.4em]">Historial y Control</p>
           <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none text-white">Mis Reservas</h1>
        </div>
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
           <History size={24} className="text-[#f59e0b]" />
        </div>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-[#f59e0b]/20 border-t-[#f59e0b] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Cargando reservas...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-30 flex flex-col items-center justify-center gap-6">
             <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.4em]">No tienes citas registradas</p>
                <Link href={`/dashboard/client/${clientId}/reservas/select-barber`} className="mt-6 inline-block text-[#f59e0b] text-[9px] font-black uppercase tracking-widest border border-[#f59e0b]/20 px-8 py-4 rounded-full hover:bg-[#f59e0b] hover:text-black transition-all">
                  Agendar Mi Primera Cita
                </Link>
             </div>
          </div>
        ) : (
          appointments.map(apt => (
            <div key={apt.id} className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 hover:bg-white/[0.06] transition-all group relative overflow-hidden">
               <div className="relative z-10 space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex flex-col items-center justify-center text-center border border-white/5">
                           <span className="text-[10px] font-black uppercase text-white/30">{format(new Date(apt.start_time), 'MMM', { locale: es })}</span>
                           <span className="text-2xl font-black text-white italic leading-none">{format(new Date(apt.start_time), 'dd')}</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                               <h3 className="text-xl font-black text-white uppercase italic tracking-tight">{(apt as Appointment & { barber_profile?: { nickname?: string; name?: string } }).barber_profile?.nickname || (apt as Appointment & { barber_profile?: { nickname?: string; name?: string } }).barber_profile?.name || apt.barber?.name || 'Barbero'}</h3>
                              <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full border ${
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
                           <div className="flex items-center gap-3 text-[10px] font-black text-[#f59e0b] uppercase tracking-widest">
                              <Clock size={12} />
                              <span>{format(new Date(apt.start_time), 'HH:mm')}</span>
                              <span>•</span>
                              <span>${new Intl.NumberFormat('de-DE').format(apt.price)}</span>
                           </div>
                        </div>
                     </div>
                     
                     <div className="flex items-center gap-2">
                        {(apt.status === 'pending' || apt.status === 'confirmed') && (
                          <button onClick={() => handleCancel(apt.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                             <Trash2 size={16} />
                          </button>
                        )}
                        {apt.status === 'confirmed' && (
                          <button onClick={() => handleWhatsAppContact(apt)} className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all">
                             <MessageCircle size={16} />
                          </button>
                        )}
                        {apt.status === 'completed' && (
                           <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/5 px-4 py-2 rounded-xl border border-emerald-500/20">
                              <CheckCircle2 size={14} />
                              <span className="text-[9px] font-black uppercase tracking-widest">Realizado</span>
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 flex flex-wrap gap-2">
                     {Array.isArray(apt.services_data) && (apt.services_data as AppointmentService[]).map((s) => (
                        <div key={s.id} className="bg-black/40 px-4 py-3 rounded-xl border border-white/5 flex flex-col gap-2">
                           <span className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none">{s.name}</span>
                           <ServiceRating service={s} apt={apt} onRate={handleRateService} />
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
