'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useBarberAgenda } from '@/hooks/barber';
import {
   Plus,
   Clock,
   Activity,
   Check,
   Calendar,
   Users,
   ChevronLeft
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Service } from '@/types';
import { formatPrice } from '@/lib/format';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
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
            <p className="text-brand text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] mb-1">Mi Actividad</p>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic leading-none text-zinc-900">Resumen de Hoy</h1>
         </motion.div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.1 }}
               className="border-t border-accent-green/20 pt-6 relative group"
            >
               <div className="relative z-10 space-y-6">
                  <div className="flex justify-between items-center px-1">
                     <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand">Solicitudes Nuevas</span>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Por Confirmar</p>
                     </div>
                     <div className="w-10 h-10 border border-brand/30 bg-brand/10 rounded-full flex items-center justify-center text-brand font-black text-lg italic">
                        {pendingApts.length}
                     </div>
                  </div>

                      <div className="flex flex-col mt-5 border-t border-accent-green/20">
                         {pendingApts.length === 0 ? (
                            <div className="py-10 text-center space-y-2">
                               <div className="w-10 h-10 border border-accent-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <Check size={18} className="text-emerald-500" />
                               </div>
                               <p className="text-zinc-400 text-[9px] font-black uppercase tracking-[0.3em]">Todo al día</p>
                               <p className="text-[8px] text-zinc-500 font-bold uppercase">No hay citas pendientes</p>
                            </div>
                         ) : (
                            pendingApts.map((apt) => (
                               <div 
                                 key={apt.id} 
                                 className="border-b border-accent-green/20 py-5 space-y-4 hover:bg-brand/5 transition-all relative z-10"
                               >
                                  <div className="flex justify-between items-start px-1">
                                     <div>
                                        <p className="text-[11px] font-black text-zinc-900 uppercase italic leading-none">{apt.client?.name || apt.client_name}</p>
                                        <p className="text-[8px] font-black text-brand uppercase mt-2 tracking-widest">{format(new Date(apt.start_time), 'dd MMM')} • {format(new Date(apt.start_time), 'HH:mm')}</p>
                                     </div>
                                     <p className="text-sm font-black italic text-zinc-900">{formatPrice(apt.price)}</p>
                                  </div>
                                  <div className="flex gap-2">
                                     <button
                                        onClick={() => statusMutation.mutate({ id: apt.id, status: 'confirmed', barberId })}
                                        className="flex-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
                                     >
                                        Aprobar
                                     </button>
                                     <button
                                        onClick={() => statusMutation.mutate({ id: apt.id, status: 'cancelled', barberId, notes: '[Cancelado por Barbero]: Rechazada desde inicio' })}
                                        className="flex-1 border border-accent-green/20 text-zinc-500 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500 transition-all"
                                     >
                                        Rechazar
                                     </button>
                                  </div>
                               </div>
                            ))
                         )}
                      </div>
               </div>
            </motion.div>

            <div className="flex flex-col gap-6 md:gap-8 pt-6 border-t border-accent-green/20 md:border-t-0 md:pt-0">
               <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => setShowWalkinForm(true)}
                  className="flex-1 border-b border-accent-green/20 hover:bg-brand/5 py-6 px-2 flex items-center justify-between group transition-all"
               >
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 border border-accent-green/20 rounded-full flex items-center justify-center group-hover:border-brand/30 group-hover:text-brand transition-colors">
                        <Plus size={20} className="text-zinc-400 group-hover:text-brand" />
                     </div>
                     <span className="text-sm font-black uppercase tracking-[0.2em] text-zinc-900">Venta Rápida</span>
                  </div>
               </motion.button>

               <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="border-b border-accent-green/20 py-6 px-2 flex items-center justify-between group"
               >
                  <div className="space-y-1">
                     <p className="text-[9px] font-black text-brand uppercase tracking-[0.3em]">Próximo</p>
                     {todayApts.find(a => a.status === 'confirmed') ? (
                        <div className="space-y-0.5">
                           <p className="text-lg font-black text-zinc-900 uppercase italic tracking-tighter leading-none">
                              {todayApts.find(a => a.status === 'confirmed')?.client?.name || todayApts.find(a => a.status === 'confirmed')?.client_name}
                           </p>
                           <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em]">
                              {format(new Date(todayApts.find(a => a.status === 'confirmed')?.start_time || ''), 'HH:mm')}
                           </p>
                        </div>
                     ) : (
                        <p className="text-lg font-black text-zinc-400 uppercase italic tracking-tighter">Libre</p>
                     )}
                  </div>
                  <div className="w-12 h-12 border border-accent-green/20 rounded-full flex items-center justify-center text-zinc-400 transition-all">
                     <Clock size={20} />
                  </div>
               </motion.div>
            </div>
         </div>

         {/* TARJETAS DE ACCESOS DIRECTOS */}
         <div className="flex flex-col border-t border-accent-green/20 pt-6">
           <Link href={`/dashboard/barber/${barberId}/agenda`} className="group">
             <div className="border-b border-accent-green/20 py-6 px-2 hover:bg-brand/5 transition-all flex items-center justify-between relative overflow-hidden">
               <div className="flex items-center gap-4 relative z-10">
                 <div className="w-12 h-12 border border-accent-green/20 rounded-full flex items-center justify-center text-zinc-400 group-hover:text-brand group-hover:border-brand/30 transition-colors">
                   <Calendar size={20} />
                 </div>
                 <div>
                   <p className="text-2xl font-black italic tracking-tighter text-zinc-900 leading-none">{todayApts.length}</p>
                   <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Citas Hoy</p>
                 </div>
               </div>
             </div>
           </Link>

           <Link href={`/dashboard/barber/${barberId}/clients`} className="group">
             <div className="border-b border-accent-green/20 py-6 px-2 hover:bg-brand/5 transition-all flex items-center justify-between relative overflow-hidden">
               <div className="flex items-center gap-4 relative z-10">
                 <div className="w-12 h-12 border border-accent-green/20 rounded-full flex items-center justify-center text-zinc-400 group-hover:text-emerald-500 group-hover:border-emerald-500/30 transition-colors">
                   <Users size={20} />
                 </div>
                 <div>
                   <p className="text-xl font-black italic tracking-tighter text-zinc-900 leading-none">Clientes</p>
                   <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Directorio</p>
                 </div>
               </div>
             </div>
           </Link>
         </div>

         {/* AGENDA DEL DÍA (EN VIVO) */}
         <div className="border-t border-accent-green/20 pt-8 mt-10">
            <div className="flex items-center justify-between mb-8 px-1">
              <h3 className="text-xl md:text-2xl font-black text-zinc-900 uppercase italic tracking-tighter flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-brand animate-pulse"></div>
                En Vivo (Hoy)
              </h3>
              <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest italic">{todayApts.length} turnos</span>
            </div>
            
            <div className="flex flex-col border-t border-accent-green/20">
              {todayApts.length === 0 ? (
                <div className="py-24 text-center border-b border-accent-green/20 flex flex-col items-center justify-center gap-4">
                  <Activity size={40} className="text-zinc-300" />
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400">Sin actividad registrada hoy</p>
                </div>
              ) : (
                todayApts.map((apt, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={apt.id} 
                    className={`
                      border-b border-accent-green/20 py-6 px-2 flex flex-col md:flex-row justify-between items-center gap-4 transition-all relative z-10
                      ${apt.status === 'occupied' ? 'bg-brand/5 px-6 rounded-xl border-transparent my-2' : 'hover:bg-brand/5'}
                    `}
                  >
                    <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
                      <div className="w-14 h-14 rounded-full border border-accent-green/20 flex flex-col items-center justify-center shrink-0">
                        <span className="text-lg font-black italic tracking-tighter text-zinc-900">{format(new Date(apt.start_time), 'dd')}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm md:text-base font-black text-zinc-900 uppercase tracking-tight italic truncate leading-none mb-1.5">{apt.client?.name || apt.client_name}</p>
                        <div className="flex items-center gap-2">
                           <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Hora:</span>
                           <span className="text-[8px] text-brand font-black uppercase tracking-widest italic">{format(new Date(apt.start_time), 'HH:mm')}</span>
                        </div>
                      </div>
                    </div>

                    {apt.status === 'cancelled' && apt.notes && (
                      <div className="w-full mt-4 border-l-2 border-red-500/50 pl-4 py-1">
                           <p className="text-[9px] font-black uppercase tracking-widest text-red-500 mb-0.5">
                              {apt.notes.startsWith('[Cancelado por Cliente]:') 
                                 ? 'Cancelado por el Cliente' 
                                 : apt.notes.startsWith('[Cancelado por Barbero]:') 
                                    ? 'Cancelado por ti'
                                    : 'Motivo de Cancelación'}
                           </p>
                           <p className="text-xs text-zinc-500 italic">
                              {apt.notes.startsWith('[Cancelado por Cliente]:') 
                                 ? `${apt.notes.replace('[Cancelado por Cliente]:', '').trim()}`
                                 : apt.notes.startsWith('[Cancelado por Barbero]:') 
                                    ? `${apt.notes.replace('[Cancelado por Barbero]:', '').trim()}`
                                    : apt.notes}
                           </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-6 pt-4 md:pt-0 mt-2 md:mt-0">
                       <div className="text-left md:text-right">
                          <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mb-1">Total</p>
                          <p className="text-lg font-black italic tracking-tighter text-zinc-900">{formatPrice(apt.price)}</p>
                       </div>
                       
                       <div className={`px-4 py-2 rounded-xl border flex items-center justify-center min-w-[100px] ${
                         apt.status === 'completed' ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' :
                         apt.status === 'confirmed' ? 'border-blue-500/20 text-blue-500 bg-blue-500/5' :
                         apt.status === 'occupied' ? 'border-brand/30 text-brand animate-pulse bg-brand/10' :
                         'border-accent-green/20 text-zinc-500'
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

         {/* MODAL VENTA RÁPIDA FULL SCREEN */}
         <AnimatePresence>
            {showWalkinForm && (
               <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed inset-0 z-[999] flex flex-col bg-bg-base overflow-hidden"
               >
                  {/* Header del Modal */}
                  <div className="shrink-0 h-14 border-b bg-surface/95 border-accent-green/20 backdrop-blur-2xl flex items-center justify-between px-6 z-10">
                     <button
                        onClick={() => setShowWalkinForm(false)}
                        className="w-10 h-10 text-zinc-400 hover:text-zinc-900 flex items-center justify-center transition-all active:scale-90"
                     >
                        <ChevronLeft size={20} />
                     </button>
                     <h2 className="text-base font-black text-zinc-900 uppercase tracking-tight">Venta Rápida</h2>
                     <div className="w-10" />
                  </div>

                  {/* Cuerpo del Modal */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar bg-transparent">
                     <div className="max-w-3xl mx-auto px-6 pt-6 pb-20 space-y-10">
                        <div className="space-y-1">
                           <h3 className="text-brand text-[10px] font-black uppercase tracking-[0.4em]">Nueva Venta</h3>
                           <p className="text-2xl font-black text-zinc-900 italic tracking-tighter">Cobro Directo</p>
                        </div>

                        <form onSubmit={handleCreateWalkin} className="space-y-10">
                           <div className="space-y-4">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Nombre del Cliente</label>
                              <input
                                 className="w-full bg-transparent border border-accent-green/20 rounded-xl py-4 px-6 text-zinc-900 focus:outline-none focus:border-brand transition-all font-black uppercase text-xs"
                                 value={clientName}
                                 onChange={e => setClientName(e.target.value)}
                              />
                           </div>

                           <div className="space-y-6">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Seleccionar Servicios</label>
                              <div className="border-t border-accent-green/20 pt-2 pr-2">
                                 {services.map(s => {
                                    const isSelected = selectedWalkinServices.find(x => x.id === s.id);
                                    return (
                                       <div
                                          key={s.id}
                                          onClick={() => toggleWalkinService(s)}
                                          className={`cursor-pointer py-4 border-b border-accent-green/10 transition-all flex justify-between items-center group`}
                                       >
                                          <p className={`text-[11px] font-black uppercase tracking-widest transition-colors ${isSelected ? 'text-brand' : 'text-zinc-900 group-hover:text-brand'}`}>{s.name}</p>
                                          <div className="flex items-center gap-3">
                                             <p className={`text-sm font-black italic transition-colors ${isSelected ? 'text-brand' : 'text-zinc-500 group-hover:text-brand'}`}>{formatPrice(s.price)}</p>
                                             <div className={`w-4 h-4 rounded-full border-2 transition-all ${isSelected ? 'bg-brand border-brand' : 'border-zinc-300 group-hover:border-brand/50'}`} />
                                          </div>
                                       </div>
                                    )
                                 })}
                              </div>
                           </div>

                           <div className="pt-4 mt-8 border-t border-accent-green/20">
                              <button
                                 type="submit"
                                 className="w-full bg-brand text-white hover:bg-accent-green py-4 rounded-xl font-black uppercase tracking-[0.3em] text-[11px] shadow-xl active:scale-95 transition-all"
                              >
                                 Finalizar y Cobrar
                              </button>
                           </div>
                        </form>
                     </div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   );
}
