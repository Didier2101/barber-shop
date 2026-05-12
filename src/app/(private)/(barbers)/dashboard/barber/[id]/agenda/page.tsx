'use client';
import { useState } from 'react';
import { useBarberAgenda, useUpdateAppointmentStatus } from '@/hooks/useBarberData';
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
      background: '#0a0a0a',
      color: '#fff',
      inputValidator: (value) => {
        if (!value || value.length < 10) {
          return 'Por favor, escribe un motivo válido (mín. 10 caracteres)';
        }
      }
    });

    if (reason) {
      statusMutation.mutate({ id: apt.id, status: 'cancelled', barberId, notes: reason }, {
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
              background: '#0a0a0a',
              color: '#fff',
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
        <div className="w-10 h-10 border-4 border-[#f59e0b]/20 border-t-[#f59e0b] rounded-full animate-spin"></div>
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
            <p className="text-[#f59e0b] text-[10px] font-black uppercase tracking-[0.4em] mb-1">Gestión de Citas</p>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic leading-none text-white">Mi Agenda</h1>
         </div>
         <button 
           onClick={() => setShowCalendar(true)}
           className="bg-black/80 border border-white/10 px-8 py-5 rounded-[2rem] flex items-center gap-4 hover:bg-[#f59e0b] hover:text-black transition-all group shadow-2xl backdrop-blur-xl"
         >
            <Calendar size={20} className="group-hover:scale-110 transition-transform" />
            <div className="text-left">
               <p className="text-[9px] font-black uppercase opacity-40">Agenda de:</p>
               <p className="text-xs font-black uppercase tracking-widest leading-none mt-1">{format(selectedDate, 'dd MMMM, yyyy', { locale: es })}</p>
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
           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 px-4">Solicitudes ({pending.length})</h3>
           <div className="flex flex-col -space-y-px">
              {pending.map((apt, index) => (
                 <div key={apt.id} className={`bg-black/80 border border-white/10 p-4 md:p-5 flex flex-col md:flex-row justify-between items-center gap-4 transition-all group relative z-10 hover:z-20 ${index === 0 ? 'rounded-t-2xl' : ''} ${index === pending.length - 1 ? 'rounded-b-2xl' : ''}`}>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                       <div className="w-10 h-10 bg-[#f59e0b] rounded-lg flex flex-col items-center justify-center text-black font-black leading-none shrink-0 group-hover:rotate-6 transition-transform">
                          <span className="text-[6px] uppercase mb-0.5">{format(new Date(apt.start_time), 'MMM')}</span>
                          <span className="text-sm italic leading-none">{format(new Date(apt.start_time), 'dd')}</span>
                       </div>
                       <div className="min-w-0 flex-1">
                          <h4 className="text-[13px] font-black text-white uppercase tracking-tight italic leading-none truncate">{apt.client?.name || apt.client_name}</h4>
                          <div className="flex items-center gap-3 text-[#f59e0b] text-[8px] font-black uppercase tracking-widest mt-1.5">
                             <div className="flex items-center gap-1"><Clock size={10} /><span>{format(new Date(apt.start_time), 'HH:mm')}</span></div>
                             <span className="text-white/20">${new Intl.NumberFormat('de-DE').format(apt.price)}</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                       <button onClick={() => handleStatusChange(apt.id, 'confirmed')} className="flex-1 md:flex-none bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest hover:scale-105 transition-all">Aprobar</button>
                       <button onClick={() => handleCancel(apt)} className="flex-1 md:flex-none bg-white/5 text-white/30 px-5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all border border-white/5">Rechazar</button>
                    </div>
                 </div>
              ))}
           </div>
        </motion.div>
      )}

      {/* AGENDA DE HOY */}
      <div className="space-y-6">
         <div className="flex items-center justify-between px-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#f59e0b] flex items-center gap-3"><Activity size={16} /> Agenda de Hoy</h3>
            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{appointments.length} Citas</span>
         </div>
         <div className="flex flex-col -space-y-px">
            {appointments.length === 0 ? (
               <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-30 flex flex-col items-center justify-center gap-4">
                  <Calendar size={40} className="text-white/20" />
                  <p className="text-[9px] font-black uppercase tracking-[0.4em]">Sin citas para hoy</p>
               </div>
            ) : (
               appointments.map((apt, idx) => (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} key={apt.id} className={`bg-black/80 border border-white/10 p-4 md:p-5 transition-all group relative z-10 hover:z-20 ${idx === 0 ? 'rounded-t-2xl' : ''} ${idx === appointments.length - 1 ? 'rounded-b-2xl' : ''}`}>
                      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                         <div className="flex items-center gap-4 md:gap-6">
                            <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-center min-w-[70px] group-hover:bg-[#f59e0b] group-hover:text-black transition-all shrink-0"><p className="text-lg font-black italic tracking-tighter leading-none">{format(new Date(apt.start_time), 'HH:mm')}</p></div>
                            <div className="min-w-0">
                               <div className="flex items-center gap-2 mb-1.5">
                                  <h4 className="text-sm md:text-lg font-black text-white uppercase tracking-tight italic truncate leading-none">{apt.client?.name || apt.client_name}</h4>
                                  {apt.status === 'completed' && <span className="bg-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded-md text-[6px] font-black uppercase tracking-widest">Listo</span>}
                               </div>
                               <p className="text-[8px] font-black text-white/30 uppercase tracking-widest truncate">{Array.isArray(apt.services_data) ? (apt.services_data as { name: string }[]).map((s: { name: string }) => s.name).join(', ') : 'Servicio'}</p>
                            </div>
                         </div>
                         <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                            <p className="text-lg font-black italic text-white tracking-tighter leading-none">${new Intl.NumberFormat('de-DE').format(apt.price)}</p>
                            <div className="flex gap-2">
                               {apt.status === 'confirmed' && (
                                  <>
                                    <button onClick={() => handleStatusChange(apt.id, 'completed')} className="bg-[#f59e0b] text-black px-5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"><Check size={12} /> Cobrar</button>
                                    <button onClick={() => handleCancel(apt)} className="w-9 h-9 rounded-xl bg-red-500/5 text-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-white/5"><X size={14} /></button>
                                  </>
                               )}
                            </div>
                         </div>
                      </div>
                   </motion.div>
               ))
            )}
         </div>
      </div>

      {/* PRÓXIMAS CITAS */}
      {upcomingDates.length > 0 && (
        <div className="space-y-10 pt-16 border-t border-white/10">
           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 px-4">Próximas Citas</h3>
           <div className="space-y-12">
              {upcomingDates.map(dateKey => (
                 <div key={dateKey} className="space-y-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#f59e0b] italic px-4">{format(new Date(dateKey + 'T12:00:00'), "EEEE dd 'de' MMMM", { locale: es })}</p>
                    <div className="flex flex-col -space-y-px">
                        {groupedUpcoming[dateKey].map((apt: Appointment, index: number) => (
                         <div key={apt.id} className={`bg-black/80 border border-white/10 p-4 flex flex-col sm:flex-row justify-between items-center gap-4 transition-all group relative z-10 hover:z-20 ${index === 0 ? 'rounded-t-2xl' : ''} ${index === groupedUpcoming[dateKey].length - 1 ? 'rounded-b-2xl' : ''}`}>
                            <div className="flex items-center gap-5 w-full sm:w-auto">
                               <div className="bg-white/5 px-4 py-2 rounded-xl text-[#f59e0b] font-black text-xs italic shrink-0">{format(new Date(apt.start_time), 'HH:mm')}</div>
                               <div className="min-w-0"><p className="text-sm font-black text-white uppercase tracking-tight truncate leading-none mb-1">{apt.client?.name || apt.client_name}</p></div>
                            </div>
                            <div className="flex items-center gap-6 justify-between w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                               <p className="text-lg font-black italic text-white tracking-tighter leading-none">${new Intl.NumberFormat('de-DE').format(apt.price)}</p>
                               <button onClick={() => handleCancel(apt)} className="w-9 h-9 rounded-xl bg-red-500/5 text-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-white/5"><X size={16} /></button>
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
              <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowCalendar(false)} />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-[#0a0a0a] border border-white/10 rounded-[4rem] p-10 shadow-2xl max-w-[420px] w-full">
                 <div className="flex justify-between items-center mb-10">
                    <div className="space-y-1"><h3 className="text-[#f59e0b] text-[10px] font-black uppercase tracking-[0.4em]">Explorar</h3><p className="text-2xl font-black text-white italic tracking-tighter">Calendario</p></div>
                    <button onClick={() => setShowCalendar(false)} className="bg-white/5 p-4 rounded-3xl text-white/40 hover:text-white transition-colors"><X size={24} /></button>
                 </div>
                 <div className="bg-white/5 rounded-[3rem] p-8 border border-white/10 flex justify-center shadow-inner">
                    <DayPicker mode="single" selected={selectedDate} onSelect={(d) => { if (d) { setSelectedDate(d); setShowCalendar(false); } }} locale={es} showOutsideDays className="rdp-barber-custom" />
                 </div>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>

      <style>{`
         .rdp-barber-custom { --rdp-cell-size: 48px; --rdp-accent-color: #f59e0b; color: white; font-family: inherit; }
         .rdp-day_selected { background-color: #f59e0b !important; color: black !important; font-weight: 900; border-radius: 16px; }
         .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; border-radius: 16px; }
         .rdp-head_cell { text-transform: uppercase; font-size: 10px; letter-spacing: 0.2em; opacity: 0.3; font-weight: 900; }
      `}</style>
    </div>
  );
}
