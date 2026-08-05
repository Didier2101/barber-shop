'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useBarberAgenda } from '@/hooks/barber';
import {
   Plus,
   Clock,
   Activity,
   X,
   Check,
   Calendar,
   Users
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Service } from '@/types';
import { formatPrice } from '@/lib/format';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useUpdateAppointmentStatus } from '@/hooks/barber';
import Link from 'next/link';

export default function BarberDashboardPage() {
   const params = useParams();
   const barberId = params.id as string;
   const queryClient = useQueryClient();
   const [showWalkinForm, setShowWalkinForm] = useState(false);
   const [clientName, setClientName] = useState('Cliente Walk-in');
   const [selectedWalkinServices, setSelectedWalkinServices] = useState<Service[]>([]);
   const [services, setServices] = useState<Service[]>([]);

   const statusMutation = useUpdateAppointmentStatus();

   const { data: agenda } = useBarberAgenda(barberId);
   const todayApts = agenda?.today || [];
   const pendingApts = agenda?.pending || [];

   useEffect(() => {
      async function fetchServices() {
         const { data } = await supabase.from('services').select('*').eq('is_active', true);
         if (data) setServices(data);
      }
      fetchServices();
   }, []);

   const handleCreateWalkin = async (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedWalkinServices.length === 0) return toast.error('Selecciona al menos un servicio');

      const duration = selectedWalkinServices.reduce((a, c) => a + c.duration, 0);
      const price = selectedWalkinServices.reduce((a, c) => a + Number(c.price), 0);
      const start_time = new Date();
      const end_time = new Date(start_time.getTime() + duration * 60000);

      const { error } = await supabase.from('appointments').insert({
         barber_id: barberId,
         services_data: selectedWalkinServices,
         client_name: clientName.trim() || 'Cliente Walk-in',
         start_time: start_time.toISOString(),
         end_time: end_time.toISOString(),
         price: price,
         status: 'completed'
      });

      if (error) toast.error(error.message);
      else {
         await supabase.rpc('increment_services_completed', { target_id: barberId });
         setShowWalkinForm(false);
         setClientName('Cliente Walk-in');
         setSelectedWalkinServices([]);
         toast.success('Venta registrada con éxito');
         queryClient.invalidateQueries({ queryKey: ['barber-agenda', barberId] });
         queryClient.invalidateQueries({ queryKey: ['barber-stats', barberId] });
      }
   };

   const toggleWalkinService = (s: Service) => {
      if (selectedWalkinServices.find(x => x.id === s.id)) {
         setSelectedWalkinServices(selectedWalkinServices.filter(x => x.id !== s.id));
      } else {
         setSelectedWalkinServices([...selectedWalkinServices, s]);
      }
   };

   return (
      <div className="space-y-10 max-w-4xl mx-auto pb-20">
         <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1"
         >
            <p className="text-[#f59e0b] text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] mb-1">Mi Actividad</p>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic leading-none text-white">Resumen de Hoy</h1>
         </motion.div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.1 }}
               className="bg-black/80 border border-white/10 backdrop-blur-2xl rounded-[2rem] p-5 md:p-6 shadow-2xl relative overflow-hidden group"
            >
               <div className="relative z-10 space-y-6">
                  <div className="flex justify-between items-center">
                     <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#f59e0b]">Solicitudes Nuevas</span>
                        <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Por Confirmar</p>
                     </div>
                     <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-black font-black text-xl italic shadow-lg shadow-amber-500/10">
                        {pendingApts.length}
                     </div>
                  </div>

                      <div className="flex flex-col -space-y-px mt-5 border-t border-white/5">
                         {pendingApts.length === 0 ? (
                            <div className="py-10 text-center space-y-2">
                               <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <Check size={18} className="text-emerald-500" />
                               </div>
                               <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.3em]">Todo al día</p>
                               <p className="text-[8px] text-white/10 font-bold uppercase">No hay citas pendientes</p>
                            </div>
                         ) : (
                            pendingApts.map((apt, index) => (
                               <div 
                                 key={apt.id} 
                                 className={`
                                   bg-black/60 border border-white/10 p-4 space-y-4 hover:bg-white/[0.02] transition-all relative z-10 hover:z-20
                                   ${index === 0 ? 'rounded-t-2xl' : ''}
                                   ${index === pendingApts.length - 1 ? 'rounded-b-2xl' : ''}
                                 `}
                               >
                                  <div className="flex justify-between items-start">
                                     <div>
                                        <p className="text-[11px] font-black text-white uppercase italic leading-none">{apt.client?.name || apt.client_name}</p>
                                        <p className="text-[8px] font-black text-[#f59e0b] uppercase mt-2 tracking-widest">{format(new Date(apt.start_time), 'dd MMM')} • {format(new Date(apt.start_time), 'HH:mm')}</p>
                                     </div>
                                     <p className="text-sm font-black italic text-white">{formatPrice(apt.price)}</p>
                                  </div>
                                  <div className="flex gap-2">
                                     <button
                                        onClick={() => statusMutation.mutate({ id: apt.id, status: 'confirmed', barberId })}
                                        className="flex-1 bg-emerald-500 text-white py-2 rounded-lg text-[8px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                     >
                                        Aprobar
                                     </button>
                                     <button
                                        onClick={() => statusMutation.mutate({ id: apt.id, status: 'cancelled', barberId, notes: '[Cancelado por Barbero]: Rechazada desde inicio' })}
                                        className="flex-1 bg-white/5 text-white/30 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                                     >
                                        Rechazar
                                     </button>
                                  </div>
                               </div>
                            ))
                         )}
                      </div>
               </div>
               <Activity size={200} className="absolute -bottom-16 -right-16 opacity-5 text-white group-hover:scale-110 transition-transform duration-1000" />
            </motion.div>

            <div className="flex flex-col gap-6 md:gap-8">
               <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => setShowWalkinForm(true)}
                  className="flex-1 bg-[#f59e0b] text-black rounded-[2rem] p-6 md:p-8 flex flex-col items-center justify-center gap-4 group hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-amber-500/10"
               >
                  <div className="p-3 bg-black rounded-2xl group-hover:rotate-12 transition-transform shadow-2xl">
                     <Plus size={24} className="text-[#f59e0b]" />
                  </div>
                  <div className="text-center">
                     <span className="text-[11px] font-black uppercase tracking-[0.3em] block">Venta Rápida</span>
                  </div>
               </motion.button>

               <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-black/80 border border-white/10 backdrop-blur-2xl rounded-[2rem] p-6 md:p-8 flex items-center justify-between group"
               >
                  <div className="space-y-1">
                     <p className="text-[9px] font-black text-[#f59e0b] uppercase tracking-[0.3em]">Próximo</p>
                     {todayApts.find(a => a.status === 'confirmed') ? (
                        <div className="space-y-0.5">
                           <p className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">
                              {todayApts.find(a => a.status === 'confirmed')?.client?.name || todayApts.find(a => a.status === 'confirmed')?.client_name}
                           </p>
                           <p className="text-[10px] font-black text-[#f59e0b] uppercase tracking-[0.3em]">
                              {format(new Date(todayApts.find(a => a.status === 'confirmed')?.start_time || ''), 'HH:mm')}
                           </p>
                        </div>
                     ) : (
                        <p className="text-lg font-black text-white uppercase italic tracking-tighter">Libre</p>
                     )}
                  </div>
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-white/20 group-hover:text-[#f59e0b] group-hover:bg-[#f59e0b]/5 transition-all">
                     <Clock size={24} />
                  </div>
               </motion.div>
            </div>
         </div>

         {/* TARJETAS DE ACCESOS DIRECTOS */}
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
           <Link href={`/dashboard/barber/${barberId}/agenda`} className="group">
             <div className="bg-black/80 border border-white/10 rounded-3xl p-6 hover:bg-[#f59e0b]/10 hover:border-[#f59e0b]/30 transition-all flex flex-col justify-between h-full relative overflow-hidden">
               <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#f59e0b]/10 rounded-full blur-3xl group-hover:bg-[#f59e0b]/20 transition-all"></div>
               <div className="flex items-center justify-between mb-8 relative z-10">
                 <div className="p-3 bg-white/5 rounded-2xl text-white group-hover:text-[#f59e0b] transition-colors">
                   <Calendar size={24} />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-[#f59e0b]">Calendario</span>
               </div>
               <div className="relative z-10">
                 <p className="text-4xl font-black italic tracking-tighter text-white">{todayApts.length}</p>
                 <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">Citas Hoy</p>
               </div>
             </div>
           </Link>

           <Link href={`/dashboard/barber/${barberId}/clients`} className="group">
             <div className="bg-black/80 border border-white/10 rounded-3xl p-6 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between h-full relative overflow-hidden">
               <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
               <div className="flex items-center justify-between mb-8 relative z-10">
                 <div className="p-3 bg-white/5 rounded-2xl text-white group-hover:text-emerald-500 transition-colors">
                   <Users size={24} />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Cartera</span>
               </div>
               <div className="relative z-10">
                 <p className="text-4xl font-black italic tracking-tighter text-white">Mis Clientes</p>
                 <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">Directorio Personal</p>
               </div>
             </div>
           </Link>
         </div>

         {/* AGENDA DEL DÍA (EN VIVO) */}
         <div className="bg-surface/50 border border-white/5 rounded-[3rem] p-4 md:p-8 mt-10">
            <div className="flex items-center justify-between mb-8 px-4">
              <h3 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse"></div>
                En Vivo (Hoy)
              </h3>
              <span className="text-[8px] font-black text-white/20 uppercase tracking-widest italic">{todayApts.length} Servicios registrados hoy</span>
            </div>
            
            <div className="flex flex-col -space-y-px">
              {todayApts.length === 0 ? (
                <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-30 flex flex-col items-center justify-center gap-4">
                  <Activity size={40} className="text-white/20" />
                  <p className="text-[9px] font-black uppercase tracking-[0.3em]">Sin actividad registrada hoy</p>
                </div>
              ) : (
                todayApts.map((apt, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={apt.id} 
                    className={`
                      bg-black/80 border border-white/10 p-5 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4 transition-all group relative z-10 hover:z-20
                      ${idx === 0 ? 'rounded-t-[2rem]' : ''}
                      ${idx === todayApts.length - 1 ? 'rounded-b-[2rem]' : ''}
                      ${apt.status === 'occupied' ? 'border-[#f59e0b]/50 bg-[#f59e0b]/5' : 'hover:bg-white/[0.02]'}
                    `}
                  >
                    <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{format(new Date(apt.start_time), 'MMM')}</span>
                        <span className="text-xl font-black italic tracking-tighter text-white">{format(new Date(apt.start_time), 'dd')}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm md:text-lg font-black text-white uppercase tracking-tight italic truncate leading-none mb-1.5">{apt.client?.name || apt.client_name}</p>
                        <div className="flex items-center gap-2">
                           <span className="text-[8px] text-white/20 font-black uppercase tracking-widest">Hora:</span>
                           <span className="text-[8px] text-[#f59e0b] font-black uppercase tracking-widest italic">{format(new Date(apt.start_time), 'dd MMM • HH:mm')}</span>
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
                           <p className="text-xs text-white/80 italic">
                              {apt.notes.startsWith('[Cancelado por Cliente]:') 
                                 ? `El cliente canceló porque: ${apt.notes.replace('[Cancelado por Cliente]:', '').trim()}`
                                 : apt.notes.startsWith('[Cancelado por Barbero]:') 
                                    ? `Tú cancelaste porque: ${apt.notes.replace('[Cancelado por Barbero]:', '').trim()}`
                                    : apt.notes}
                           </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-6 border-t md:border-t-0 border-white/5 pt-4 md:pt-0 mt-2 md:mt-0">
                       <div className="text-left md:text-right">
                          <p className="text-[8px] text-white/30 font-black uppercase tracking-widest mb-1">Total</p>
                          <p className="text-lg md:text-xl font-black italic tracking-tighter text-white">{formatPrice(apt.price)}</p>
                       </div>
                       
                       <div className={`px-4 py-2 rounded-xl border flex items-center justify-center min-w-[100px] ${
                         apt.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                         apt.status === 'confirmed' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                         apt.status === 'occupied' ? 'bg-[#f59e0b]/10 border-[#f59e0b]/20 text-[#f59e0b] animate-pulse' :
                         'bg-white/5 border-white/10 text-white/40'
                       }`}>
                         <span className="text-[9px] font-black uppercase tracking-widest italic">{
                           apt.status === 'completed' ? 'Finalizado' :
                           apt.status === 'confirmed' ? 'Confirmada' :
                           apt.status === 'occupied' ? 'En Curso' : apt.status
                         }</span>
                       </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
         </div>

         {/* MODAL VENTA RÁPIDA */}
         {showWalkinForm && (
            <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
               <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowWalkinForm(false)} />
               <div className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-10 shadow-2xl animate-in slide-in-from-bottom-full duration-500 overflow-y-auto max-h-[90vh] custom-scrollbar">
                  <div className="flex justify-between items-center mb-10">
                     <div className="space-y-1">
                        <h3 className="text-[#f59e0b] text-[10px] font-black uppercase tracking-[0.4em]">Nueva Venta</h3>
                        <p className="text-2xl font-black text-white italic tracking-tighter">Cobro Directo</p>
                     </div>
                     <button onClick={() => setShowWalkinForm(false)} className="bg-white/5 p-3 rounded-2xl text-white/40 hover:text-white transition-colors">
                        <X size={24} />
                     </button>
                  </div>

                  <form onSubmit={handleCreateWalkin} className="space-y-10">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-1">Nombre del Cliente</label>
                        <input
                           className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-[#f59e0b] transition-all font-black uppercase text-xs"
                           value={clientName}
                           onChange={e => setClientName(e.target.value)}
                        />
                     </div>

                     <div className="space-y-6">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-1">Seleccionar Servicios</label>
                        <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                           {services.map(s => {
                              const isSelected = selectedWalkinServices.find(x => x.id === s.id);
                              return (
                                 <div
                                    key={s.id}
                                    onClick={() => toggleWalkinService(s)}
                                    className={`cursor-pointer p-6 rounded-2xl border-2 transition-all flex justify-between items-center ${isSelected ? 'border-[#f59e0b] bg-[#f59e0b]/5' : 'border-white/5 bg-white/5'}`}
                                 >
                                    <p className="text-[11px] font-black uppercase tracking-widest text-white">{s.name}</p>
                                    <p className="text-sm font-black text-[#f59e0b] italic">{formatPrice(s.price)}</p>
                                 </div>
                              )
                           })}
                        </div>
                     </div>

                     <button
                        type="submit"
                        className="w-full bg-[#f59e0b] text-black py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-amber-500/10 active:scale-95 transition-all"
                     >
                        Finalizar y Cobrar
                     </button>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
}
