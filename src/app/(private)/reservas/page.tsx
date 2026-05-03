'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useClientAppointments, useCancelAppointment } from '@/hooks/useClientData';
import { useQueryClient } from '@tanstack/react-query';
import { History, Star, ChevronLeft, Trash2, MessageCircle } from 'lucide-react';
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
  const { data: appointmentsRaw = [], isLoading: loading } = useClientAppointments(profile?.id || '');
  const cancelMutation = useCancelAppointment();

  // Intelligent Sorting (Senior UX Pattern)
  const appointments = [...appointmentsRaw].sort((a, b) => {
    const isUpcoming = (s: string) => s === 'pending' || s === 'confirmed';
    const aUp = isUpcoming(a.status);
    const bUp = isUpcoming(b.status);

    if (aUp && !bUp) return -1;
    if (!aUp && bUp) return 1;

    // If both are upcoming or both are past, sort by date
    const dateA = new Date(a.start_time).getTime();
    const dateB = new Date(b.start_time).getTime();
    
    // For upcoming: closest first. For past: newest first.
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
    if (apt.status !== 'completed') return <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Pendiente</span>;

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
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    }
  }

  const formatPrice = (price: number) => new Intl.NumberFormat('de-DE').format(price);

  const handleWhatsAppContact = (apt: Appointment) => {
    const barberPhone = apt.barber?.phone;
    if (!barberPhone) return toast.error('El barbero no tiene un numero registrado');
    
    const date = format(new Date(apt.start_time), "EEEE d 'de' MMMM", { locale: es });
    const time = format(new Date(apt.start_time), 'HH:mm');
    const message = `Hola ${apt.barber?.name || 'Barbero'}, soy ${profile?.name}. Te escribo para informarte que deseo cancelar mi cita del dia ${date} a las ${time}.`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/57${barberPhone.replace(/\D/g, '')}?text=${encodedMessage}`, '_blank');
  };

  if (!profile) return null;

  return (
    <div className="relative min-h-screen bg-[#050505] text-white pb-20 pt-24 px-4 sm:px-6 overflow-x-hidden">
      
      {/* Background Photo - Hero Style */}
      <div className="fixed inset-0 h-[100dvh] w-full z-0 overflow-hidden">
        {profile?.avatar_url ? (
          <Image 
            src={profile.avatar_url} 
            alt="BG" 
            fill 
            className="object-cover opacity-20" 
            priority
          />
        ) : (
          <Image 
            src="/nathon-oski-EW_rqoSdDes-unsplash.jpg" 
            alt="Shop" 
            fill 
            className="object-cover opacity-15" 
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Link href="/dashboard" className="text-amber-500 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest mb-2 hover:gap-3 transition-all">
              <ChevronLeft size={12} /> Inicio
            </Link>
            <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Mis <span className="text-amber-500">Reservas</span></h1>
            <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest ml-1 italic">Tu historial elite</p>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
             <History size={20} className="text-amber-500" />
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-24 text-center">
               <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Cargando...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-24 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-[2.5rem] backdrop-blur-md">
              <p className="text-zinc-600 font-black uppercase tracking-widest text-[10px]">Sin citas registradas</p>
              <Link href="/select-barber" className="mt-6 inline-block text-amber-500 text-[9px] font-black uppercase tracking-widest border border-amber-500/20 px-6 py-3 rounded-full hover:bg-amber-500 hover:text-black transition-all">
                 Agendar Nueva
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {appointments.map(apt => (
                <div key={apt.id} className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[2rem] p-4 sm:p-5 hover:border-white/20 transition-all group shadow-xl">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex items-center gap-4">
                      <div className="text-center bg-amber-500/10 px-4 py-3 rounded-2xl border border-amber-500/20 min-w-[70px]">
                        <p className="text-[9px] font-black uppercase text-amber-500 leading-none mb-1">{format(new Date(apt.start_time), 'MMM', { locale: es })}</p>
                        <p className="text-2xl font-black text-white leading-none">{format(new Date(apt.start_time), 'dd')}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1 leading-none">
                          {format(new Date(apt.start_time), 'HH:mm')} • {format(new Date(apt.start_time), 'yyyy')}
                        </p>
                        <h3 className="text-lg font-black uppercase tracking-tight italic text-white leading-tight">{apt.barber?.name}</h3>
                        <p className="text-sm font-black text-zinc-500 italic leading-none mt-1">${formatPrice(apt.price)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className={`flex-1 sm:flex-none text-center text-[7px] font-black uppercase tracking-widest px-4 py-2 rounded-full border ${
                          apt.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                          apt.status === 'cancelled' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                          'bg-amber-500/10 border-amber-500/20 text-amber-500'
                        }`}>
                          {apt.status === 'confirmed' ? 'Aceptada' : 
                           apt.status === 'pending' ? 'Pendiente' : 
                           apt.status === 'completed' ? 'Finalizada' : 
                           apt.status === 'cancelled' ? 'Cancelada' : apt.status}
                        </span>

                        {apt.status === 'pending' && (
                          <button 
                            onClick={() => handleCancel(apt.id)} 
                            className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20"
                            title="Cancelar"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}

                        {apt.status === 'confirmed' && (
                          <button 
                            onClick={() => handleWhatsAppContact(apt)} 
                            className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all border border-emerald-500/20 flex items-center gap-2 px-3"
                            title="Contactar"
                          >
                            <MessageCircle size={14} />
                            <span className="text-[7px] font-black uppercase tracking-widest">Avisar Cancelación</span>
                          </button>
                        )}
                     </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex flex-wrap gap-2">
                      {apt.services_data?.map((s: AppointmentService, idx: number) => (
                        <div key={s.id || idx} className="bg-black/40 px-3 py-2 rounded-xl border border-white/5 flex flex-col gap-1.5">
                          <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider leading-none">{s.name}</span>
                          <ServiceRating service={s} apt={apt} onRate={handleRateService} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
