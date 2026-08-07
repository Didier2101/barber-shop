'use client';
import { useState } from 'react';
import { formatPrice } from '@/lib/format';
import { useBarberAgenda, useUpdateAppointmentStatus } from '@/hooks/barber';
import { 
  Calendar, 
  Clock, 
  Check, 
  X, 
  Activity
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { toast } from 'sonner';
import { Appointment } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';

export default function BarberAgendaPage() {
  const params = useParams();
  const barberId = params.id as string;
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  
  const { data: agenda, isLoading } = useBarberAgenda(barberId, selectedDate.toISOString());
  const statusMutation = useUpdateAppointmentStatus();

  const handleStatusChange = async (id: string, newStatus: string) => {
    statusMutation.mutate({ id, status: newStatus, barberId }, {
      onSuccess: () => {
        if (newStatus === 'confirmed') toast.success('Cita confirmada');
        else if (newStatus === 'completed') toast.success('Servicio finalizado');
      }
    });
  };

  const handleCancel = async (apt: Appointment) => {
    const { value: reason } = await Swal.fire({
      title: 'CANCELAR CITA',
      text: 'Indica el motivo de la cancelación para informar al cliente:',
      input: 'textarea',
      inputPlaceholder: 'Ej: Emergencia médica, problema técnico...',
      showCancelButton: true,
      confirmButtonText: 'CONFIRMAR CANCELACIÓN',
      cancelButtonText: 'VOLVER',
      confirmButtonColor: '#ef4444',
      background: '#FFF7EB',
      color: '#18181b',
      inputValidator: (value) => {
        if (!value || value.length < 10) {
          return 'Por favor, escribe un motivo válido (mín. 10 caracteres)';
        }
      }
    });

    if (reason) {
      const finalReason = `[Cancelado por Barbero]: ${reason}`;
      statusMutation.mutate({ id: apt.id, status: 'cancelled', barberId, notes: finalReason }, {
        onSuccess: () => {
          toast.error('Cita cancelada');
          const clientPhone = apt.client?.phone || apt.client_phone;
          if (clientPhone) {
            const date = format(new Date(apt.start_time), "EEEE dd 'de' MMMM", { locale: es });
            const time = format(new Date(apt.start_time), 'HH:mm');
            const message = `Hola, soy tu barbero de BarberShop. Lamento informarte que debo cancelar tu cita del ${date} a las ${time} por el siguiente motivo: ${reason}. Por favor, disculpa las molestias y reagenda cuando gustes.`;
            const waLink = `https://wa.me/57${clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
            
            Swal.fire({
              title: 'NOTIFICAR AL CLIENTE',
              text: '¿Deseas enviar el motivo por WhatsApp ahora?',
              icon: 'info',
              showCancelButton: true,
              confirmButtonText: 'SÍ, ENVIAR WHATSAPP',
              cancelButtonText: 'NO, LUEGO',
              confirmButtonColor: '#10b981',
              background: '#FFF7EB',
              color: '#18181b',
            }).then((res) => {
              if (res.isConfirmed) window.open(waLink, '_blank');
            });
          }
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
      </div>
    );
  }

  const appointments = agenda?.today || [];
  const pending = agenda?.pending || [];
  const upcoming = agenda?.upcoming || [];

  const groupedUpcoming = upcoming.reduce((acc: Record<string, Appointment[]>, apt: Appointment) => {
    const dateKey = format(new Date(apt.start_time), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(apt);
    return acc;
  }, {});

  const upcomingDates = Object.keys(groupedUpcoming).sort();

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-32">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8"
      >
         <div className="space-y-2">
            <p className="text-brand text-[10px] font-black uppercase tracking-[0.4em] mb-1">Gestión de Citas</p>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic leading-none text-zinc-900">Mi Agenda</h1>
         </div>
         <button 
           onClick={() => setShowCalendar(true)}
           className="border border-accent-green/20 px-6 py-4 rounded-xl flex items-center gap-4 hover:border-brand/50 hover:bg-brand/5 transition-all group"
         >
            <Calendar size={20} className="text-zinc-400 group-hover:text-brand transition-colors" />
            <div className="text-left">
               <p className="text-[9px] font-black uppercase text-zinc-500">Agenda de:</p>
               <p className="text-xs font-black uppercase tracking-widest leading-none mt-1 group-hover:text-brand text-zinc-900">{format(selectedDate, 'dd MMMM, yyyy', { locale: es })}</p>
            </div>
         </button>
      </motion.div>

      {/* SOLICITUDES PENDIENTES */}
      {pending.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 px-4">Solicitudes ({pending.length})</h3>
           <div className="flex flex-col border-t border-accent-green/20">
              {pending.map((apt) => (
                 <div key={apt.id} className="border-b border-accent-green/20 py-5 px-2 flex flex-col md:flex-row justify-between items-center gap-4 transition-all relative z-10 hover:bg-brand/5">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                       <div className="w-12 h-12 border border-brand/30 bg-brand/10 rounded-full flex flex-col items-center justify-center text-brand font-black leading-none shrink-0 transition-transform">
                          <span className="text-[6px] uppercase mb-0.5">{format(new Date(apt.start_time), 'MMM')}</span>
                          <span className="text-sm italic leading-none">{format(new Date(apt.start_time), 'dd')}</span>
                       </div>
                       <div className="min-w-0 flex-1">
                          <h4 className="text-[13px] font-black text-zinc-900 uppercase tracking-tight italic leading-none truncate">{apt.client?.name || apt.client_name}</h4>
                          <div className="flex items-center gap-3 text-brand text-[8px] font-black uppercase tracking-widest mt-1.5">
                             <div className="flex items-center gap-1"><Clock size={10} /><span>{format(new Date(apt.start_time), 'HH:mm')}</span></div>
                             <span className="text-zinc-500">{formatPrice(apt.price)}</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                       <button onClick={() => handleStatusChange(apt.id, 'confirmed')} className="flex-1 md:flex-none border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 px-5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all">Aprobar</button>
                       <button onClick={() => handleCancel(apt)} className="flex-1 md:flex-none border border-accent-green/20 text-zinc-400 px-5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500 transition-all">Rechazar</button>
                    </div>
                 </div>
              ))}
           </div>
        </motion.div>
      )}

      {/* AGENDA DE HOY */}
      <div className="space-y-6">
         <div className="flex items-center justify-between px-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand flex items-center gap-3"><Activity size={16} /> Agenda de Hoy</h3>
            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{appointments.length} Citas</span>
         </div>
         <div className="flex flex-col border-t border-accent-green/20">
            {appointments.length === 0 ? (
               <div className="py-24 text-center border-b border-accent-green/20 opacity-30 flex flex-col items-center justify-center gap-4">
                  <Calendar size={40} className="text-zinc-500" />
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-900">Sin citas para hoy</p>
               </div>
            ) : (
               appointments.map((apt, idx) => (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} key={apt.id} className="border-b border-accent-green/20 py-6 px-2 transition-all relative z-10 hover:bg-brand/5">
                      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                         <div className="flex items-center gap-4 md:gap-6">
                            <div className="border border-accent-green/20 w-14 h-14 rounded-full flex items-center justify-center transition-all shrink-0 text-zinc-900"><p className="text-sm font-black italic tracking-tighter leading-none">{format(new Date(apt.start_time), 'HH:mm')}</p></div>
                            <div className="min-w-0">
                               <div className="flex items-center gap-2 mb-1.5">
                                  <h4 className="text-sm md:text-lg font-black text-zinc-900 uppercase tracking-tight italic truncate leading-none">{apt.client?.name || apt.client_name}</h4>
                                  {apt.status === 'completed' && <span className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-md text-[6px] font-black uppercase tracking-widest">Listo</span>}
                               </div>
                               <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest truncate">{Array.isArray(apt.services_data) ? (apt.services_data as { name: string }[]).map((s: { name: string }) => s.name).join(', ') : 'Servicio'}</p>
                            </div>
                         </div>
                         <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0">
                            <p className="text-lg font-black italic text-zinc-900 tracking-tighter leading-none">{formatPrice(apt.price)}</p>
                            <div className="flex gap-2">
                               {apt.status === 'confirmed' && (
                                  <>
                                    <button onClick={() => handleStatusChange(apt.id, 'completed')} className="border border-brand/50 text-brand hover:bg-brand/10 px-5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"><Check size={12} /> Cobrar</button>
                                    <button onClick={() => handleCancel(apt)} className="w-9 h-9 rounded-xl border border-accent-green/20 text-zinc-400 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500 transition-all flex items-center justify-center"><X size={14} /></button>
                                  </>
                               )}
                            </div>
                         </div>
                      </div>

                      {apt.status === 'cancelled' && apt.notes && (
                        <div className="w-full mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                           <p className="text-[9px] font-black uppercase tracking-widest text-red-500 mb-1">
                              {apt.notes.startsWith('[Cancelado por Cliente]:') 
                                 ? 'Cancelado por el Cliente' 
                                 : apt.notes.startsWith('[Cancelado por Barbero]:') 
                                    ? 'Cancelado por ti'
                                    : 'Motivo de Cancelación'}
                           </p>
                           <p className="text-xs text-zinc-600 italic">
                              {apt.notes.startsWith('[Cancelado por Cliente]:') 
                                 ? `El cliente canceló porque: ${apt.notes.replace('[Cancelado por Cliente]:', '').trim()}`
                                 : apt.notes.startsWith('[Cancelado por Barbero]:') 
                                    ? `Tú cancelaste porque: ${apt.notes.replace('[Cancelado por Barbero]:', '').trim()}`
                                    : apt.notes}
                           </p>
                        </div>
                      )}
                   </motion.div>
               ))
            )}
         </div>
      </div>

      {/* PRÓXIMAS CITAS */}
      {upcomingDates.length > 0 && (
        <div className="space-y-10 pt-16 border-t border-accent-green/20">
           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 px-4">Próximas Citas</h3>
           <div className="space-y-12">
              {upcomingDates.map(dateKey => (
                 <div key={dateKey} className="space-y-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand italic px-4">{format(new Date(dateKey + 'T12:00:00'), "EEEE dd 'de' MMMM", { locale: es })}</p>
                    <div className="flex flex-col border-t border-accent-green/20">
                        {groupedUpcoming[dateKey].map((apt: Appointment) => (
                         <div key={apt.id} className="border-b border-accent-green/20 py-5 px-2 flex flex-col sm:flex-row justify-between items-center gap-4 transition-all relative z-10 hover:bg-brand/5">
                            <div className="flex items-center gap-5 w-full sm:w-auto">
                               <div className="border border-accent-green/20 w-12 h-12 rounded-full flex items-center justify-center text-brand font-black text-xs italic shrink-0">{format(new Date(apt.start_time), 'HH:mm')}</div>
                               <div className="min-w-0"><p className="text-sm font-black text-zinc-900 uppercase tracking-tight truncate leading-none mb-1">{apt.client?.name || apt.client_name}</p></div>
                            </div>
                            <div className="flex items-center gap-6 justify-between w-full sm:w-auto pt-3 sm:pt-0">
                               <p className="text-lg font-black italic text-zinc-900 tracking-tighter leading-none">{formatPrice(apt.price)}</p>
                               <button onClick={() => handleCancel(apt)} className="w-9 h-9 rounded-xl border border-accent-green/20 text-zinc-400 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500 transition-all flex items-center justify-center"><X size={16} /></button>
                            </div>
                         </div>
                        ))}
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* CALENDARIO POPUP */}
      <AnimatePresence>
        {showCalendar && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCalendar(false)} />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-surface border border-accent-green/20 rounded-2xl p-10 shadow-2xl max-w-[420px] w-full">
                 <div className="flex justify-between items-center mb-8 border-b border-accent-green/20 pb-6">
                    <div className="space-y-1"><h3 className="text-brand text-[10px] font-black uppercase tracking-[0.4em]">Explorar</h3><p className="text-2xl font-black text-zinc-900 italic tracking-tighter">Calendario</p></div>
                    <button onClick={() => setShowCalendar(false)} className="text-zinc-400 hover:text-zinc-900 transition-colors"><X size={24} /></button>
                 </div>
                 <div className="flex justify-center">
                    <DayPicker mode="single" selected={selectedDate} onSelect={(d) => { if (d) { setSelectedDate(d); setShowCalendar(false); } }} locale={es} showOutsideDays className="rdp-barber-custom" />
                 </div>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>

      <style>{`
         .rdp-barber-custom { --rdp-cell-size: 48px; --rdp-accent-color: var(--color-accent-pink); color: #18181b; font-family: inherit; }
         .rdp-day_selected { background-color: var(--color-accent-pink) !important; color: white !important; font-weight: 900; border-radius: 16px; }
         .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: rgba(204, 58, 99, 0.1); color: var(--color-accent-pink); border-radius: 16px; }
         .rdp-head_cell { text-transform: uppercase; font-size: 10px; letter-spacing: 0.2em; opacity: 0.5; font-weight: 900; color: #71717a; }
      `}</style>
    </div>
  );
}
