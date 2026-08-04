'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useBarberAgenda } from '@/hooks/barber';
import {
   Plus,
   Clock,
   Activity,
   X,
   Check
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Service } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useUpdateAppointmentStatus } from '@/hooks/barber';

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
                                     <p className="text-sm font-black italic text-white">${new Intl.NumberFormat('de-DE').format(apt.price)}</p>
                                  </div>
                                  <div className="flex gap-2">
                                     <button
                                        onClick={() => statusMutation.mutate({ id: apt.id, status: 'confirmed', barberId })}
                                        className="flex-1 bg-emerald-500 text-white py-2 rounded-lg text-[8px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                     >
                                        Aprobar
                                     </button>
                                     <button
                                        onClick={() => statusMutation.mutate({ id: apt.id, status: 'cancelled', barberId, notes: 'Rechazada desde inicio' })}
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
                                    <p className="text-sm font-black text-[#f59e0b] italic">${new Intl.NumberFormat('de-DE').format(s.price)}</p>
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
