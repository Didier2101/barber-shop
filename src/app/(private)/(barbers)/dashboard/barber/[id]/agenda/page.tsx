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
        else if (newStatus === 'cancelled') toast.error('Cita cancelada');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#f59e0b] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const appointments = agenda?.today || [];
  const pending = agenda?.pending || [];
  const upcoming = agenda?.upcoming || [];

  // Agrupar próximas citas por fecha
  const groupedUpcoming = upcoming.reduce((acc: Record<string, Appointment[]>, apt: Appointment) => {
    const dateKey = format(new Date(apt.start_time), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(apt);
    return acc;
  }, {});

  const upcomingDates = Object.keys(groupedUpcoming).sort();

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
         <div className="space-y-2">
            <p className="text-[#f59e0b] text-[10px] font-black uppercase tracking-[0.4em]">Gestión de Citas</p>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none text-white">Mi Agenda</h1>
         </div>
         <button 
           onClick={() => setShowCalendar(true)}
           className="bg-white/5 border border-white/10 px-8 py-4 rounded-2xl flex items-center gap-4 hover:bg-[#f59e0b] hover:text-black transition-all group shadow-xl"
         >
            <Calendar size={18} className="group-hover:scale-110 transition-transform" />
            <div className="text-left">
               <p className="text-[9px] font-black uppercase opacity-40">Viendo agenda de:</p>
               <p className="text-xs font-black uppercase tracking-widest">{format(selectedDate, 'dd MMMM, yyyy', { locale: es })}</p>
            </div>
         </button>
      </div>

      {/* PENDIENTES DE APROBACIÓN */}
      {pending.length > 0 && (
        <div className="space-y-6">
           <div className="flex items-center gap-4 px-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Solicitudes Pendientes ({pending.length})</h3>
           </div>
           <div className="grid gap-4">
              {pending.map(apt => (
                 <div key={apt.id} className="bg-amber-500/5 border border-amber-500/20 rounded-[2.5rem] p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8 shadow-2xl">
                    <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto">
                       <div className="w-12 h-12 md:w-16 md:h-16 bg-amber-500 rounded-2xl flex flex-col items-center justify-center text-black font-black leading-none shrink-0">
                          <span className="text-[7px] md:text-[9px] uppercase mb-1">{format(new Date(apt.start_time), 'MMM')}</span>
                          <span className="text-xl md:text-2xl">{format(new Date(apt.start_time), 'dd')}</span>
                       </div>
                       <div className="min-w-0 flex-1">
                          <h4 className="text-lg md:text-xl font-black text-white uppercase tracking-tight italic mb-1 truncate">{apt.client?.name || apt.client_name}</h4>
                          <div className="flex items-center gap-3 text-[#f59e0b] text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                             <Clock size={12} />
                             <span>{format(new Date(apt.start_time), 'HH:mm')}</span>
                             <span>•</span>
                             <span>${new Intl.NumberFormat('de-DE').format(apt.price)}</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                       <button 
                         onClick={() => handleStatusChange(apt.id, 'confirmed')}
                         className="flex-1 md:flex-none bg-emerald-500 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
                       >
                          Aprobar
                       </button>
                       <button 
                         onClick={() => handleStatusChange(apt.id, 'cancelled')}
                         className="flex-1 md:flex-none bg-white/5 text-white/40 px-6 md:px-8 py-3 md:py-4 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all"
                       >
                          Rechazar
                       </button>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* LISTADO PRINCIPAL DE LA AGENDA (HOY) */}
      <div className="space-y-6">
         <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#f59e0b] px-2 flex items-center gap-3">
           <Activity size={16} /> Agenda de Hoy
         </h3>
         <div className="grid gap-4">
            {appointments.length === 0 ? (
               <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-30 flex flex-col items-center justify-center gap-4">
                  <Calendar size={48} />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em]">Sin citas para hoy</p>
               </div>
            ) : (
               appointments.map(apt => (
                  <div key={apt.id} className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 md:p-8 hover:border-[#f59e0b]/30 transition-all group relative overflow-hidden">
                      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
                         <div className="flex items-center gap-4 md:gap-8">
                            <div className="bg-white/5 border border-white/5 px-4 md:px-6 py-3 md:py-4 rounded-2xl text-center min-w-[80px] md:min-w-[100px] group-hover:bg-[#f59e0b] group-hover:text-black transition-all shrink-0">
                               <p className="text-lg md:text-xl font-black italic">{format(new Date(apt.start_time), 'HH:mm')}</p>
                            </div>
                            <div className="min-w-0">
                               <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
                                  <h4 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight italic truncate">{apt.client?.name || apt.client_name || 'Cita Rápida'}</h4>
                                  <span className={`text-[7px] md:text-[8px] font-black uppercase px-2 py-0.5 md:px-3 md:py-1 rounded-full border ${apt.status === 'completed' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-amber-500/30 text-amber-500 bg-amber-500/5'}`}>
                                     {apt.status}
                                  </span>
                               </div>
                               <div className="flex items-center gap-2">
                                  <span className="hidden sm:inline text-[9px] font-black text-white/30 uppercase tracking-widest">Servicio:</span>
                                  <span className="text-[8px] md:text-[9px] font-black text-[#f59e0b] uppercase tracking-widest truncate">
                                     {Array.isArray(apt.services_data) ? (apt.services_data as { name: string }[]).map((s: { name: string }) => s.name).join(', ') : 'Servicio Estándar'}
                                  </span>
                               </div>
                            </div>
                         </div>

                         <div className="flex items-center justify-between md:justify-end gap-6 md:gap-8 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                            <p className="text-2xl md:text-3xl font-black italic text-white leading-none">${new Intl.NumberFormat('de-DE').format(apt.price)}</p>
                            {apt.status === 'confirmed' && (
                               <button 
                                  onClick={() => handleStatusChange(apt.id, 'completed')}
                                  className="bg-emerald-500 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                               >
                                  <Check size={16} /> Finalizar y Cobrar
                               </button>
                            )}
                         </div>
                      </div>
                      <Activity size={180} className="absolute -bottom-16 -right-16 opacity-[0.02] text-[#f59e0b] group-hover:scale-110 transition-transform duration-1000" />
                   </div>
               ))
            )}
         </div>
      </div>

      {/* PRÓXIMAS CITAS (TIMELINE) */}
      {upcomingDates.length > 0 && (
        <div className="space-y-10 pt-10 border-t border-white/5">
           <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/30 px-2 flex items-center gap-3">
             <Calendar size={16} /> Próximas Citas
           </h3>
           
           <div className="space-y-12">
              {upcomingDates.map(dateKey => (
                <div key={dateKey} className="space-y-6">
                   <div className="sticky top-16 lg:top-20 z-20 py-3 bg-[#050505]/95 backdrop-blur-xl border-b border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#f59e0b]">
                        {format(new Date(dateKey + 'T12:00:00'), "EEEE dd 'de' MMMM", { locale: es })}
                      </p>
                   </div>
                   
                   <div className="grid gap-3">
                       {groupedUpcoming[dateKey].map((apt: Appointment) => (
                        <div key={apt.id} className="bg-white/5 border border-white/5 rounded-3xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 hover:bg-white/[0.07] transition-all">
                           <div className="flex items-center gap-5 w-full sm:w-auto">
                              <div className="bg-white/10 px-4 py-2 rounded-xl text-[#f59e0b] font-black text-xs italic shrink-0">
                                 {format(new Date(apt.start_time), 'HH:mm')}
                              </div>
                              <div className="min-w-0">
                                 <p className="text-base font-black text-white uppercase tracking-tight truncate">{apt.client?.name || apt.client_name}</p>
                                 <p className="text-[8px] font-black text-white/40 uppercase tracking-widest truncate">
                                    {Array.isArray(apt.services_data) ? (apt.services_data as { name: string }[]).map((s: { name: string }) => s.name).join(', ') : 'Servicio'}
                                 </p>
                              </div>
                           </div>
                           <div className="flex items-center gap-6 justify-between w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                              <p className="text-lg font-black italic text-white">${new Intl.NumberFormat('de-DE').format(apt.price)}</p>
                              <div className="px-3 py-1 rounded-full border border-white/10 text-[7px] font-black uppercase text-white/30">
                                 {apt.status}
                              </div>
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
      {showCalendar && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowCalendar(false)} />
            <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300 max-w-[420px] w-full">
               <div className="flex justify-between items-center mb-10">
                  <div className="space-y-1">
                     <h3 className="text-[#f59e0b] text-[10px] font-black uppercase tracking-[0.4em]">Calendario</h3>
                     <p className="text-2xl font-black text-white italic tracking-tighter">Explorar Fechas</p>
                  </div>
                  <button onClick={() => setShowCalendar(false)} className="bg-white/5 p-3 rounded-2xl text-white/40 hover:text-white transition-colors">
                     <X size={24} />
                  </button>
               </div>
               <div className="bg-white/5 rounded-[2.5rem] p-6 border border-white/5 flex justify-center">
                  <DayPicker 
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => { if (d) { setSelectedDate(d); setShowCalendar(false); } }}
                    locale={es}
                    showOutsideDays
                    className="rdp-barber-custom"
                  />
               </div>
            </div>
         </div>
      )}

      <style>{`
         .rdp-barber-custom {
            --rdp-cell-size: 45px;
            --rdp-accent-color: #f59e0b;
            --rdp-background-color: #f59e0b20;
            color: white;
         }
         .rdp-day_selected { background-color: #f59e0b !important; color: black !important; font-weight: 900; border-radius: 14px; }
         .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; border-radius: 14px; }
      `}</style>
    </div>
  );
}
