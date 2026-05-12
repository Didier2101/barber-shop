'use client';
import { useOwnerClients, useClientDetails, useOwnerMutations } from '@/hooks/useOwnerData';
import {
   User,
   Search,
   Phone,
   CalendarDays,
   Trash,
   Activity,
   History,
   Scissors,
   ArrowRight
} from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { Appointment, Profile } from '@/types';
import { toast } from 'sonner';

export default function ClientsPage() {
   const { data: clients = [], isLoading: clientsLoading } = useOwnerClients();
   const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
   const { data: clientDetails, isLoading: detailsLoading } = useClientDetails(selectedClientId);
   const { deleteClient } = useOwnerMutations();
   const [searchTerm, setSearchTerm] = useState('');

   const filteredClients = clients.filter((c: Profile) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm)
   );

   if (clientsLoading) {
      return (
         <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-4 border-[#f59e0b]/20 border-t-[#f59e0b] rounded-full animate-spin"></div>
         </div>
      );
   }

   return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-32">
         <div className="flex items-center gap-5">
            <div className="p-4 bg-black/80 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl text-[#f59e0b]">
               <User size={28} />
            </div>
            <div>
               <p className="text-[#f59e0b] text-[10px] font-black uppercase tracking-[0.4em] mb-1">Base de Datos</p>
               <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">Clientes</h2>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Client List (Sidebar) */}
            <div className="lg:col-span-4 space-y-6">
               <div className="relative group">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                     <Search size={16} className="text-white/20 group-focus-within:text-[#f59e0b] transition-colors" />
                  </div>
                  <input
                     type="text"
                     placeholder="Buscar cliente..."
                     className="w-full bg-black/80 border border-white/10 rounded-[2rem] py-5 pl-14 pr-6 text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-[#f59e0b]/40 backdrop-blur-xl transition-all"
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                  />
               </div>

               <div className="bg-black/80 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl max-h-[60vh] overflow-y-auto custom-scrollbar flex flex-col -space-y-px">
                  {filteredClients.length === 0 ? (
                     <div className="p-16 text-center opacity-20">
                        <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Sin resultados</p>
                     </div>
                  ) : (
                     filteredClients.map((client: Profile) => (
                        <button
                           key={client.id}
                           onClick={() => setSelectedClientId(client.id)}
                           className={`
                             w-full p-6 flex items-center gap-5 transition-all text-left group relative z-10 border border-transparent
                             ${selectedClientId === client.id ? 'bg-[#f59e0b] text-black z-20' : 'hover:bg-white/5 text-white/60'}
                           `}
                        >
                           <div className={`w-12 h-12 rounded-xl border flex items-center justify-center overflow-hidden shrink-0 ${selectedClientId === client.id ? 'bg-black/10 border-black/10' : 'bg-white/5 border-white/10'}`}>
                              {client.avatar_url ? <Image src={client.avatar_url} alt={`Avatar de ${client.name}`} width={32} height={32} className="w-full h-full object-cover" /> : <User size={20} className={selectedClientId === client.id ? 'text-black/40' : 'text-white/10'} />}
                           </div>
                           <div className="min-w-0 flex-1">
                              <p className={`text-sm font-black uppercase truncate leading-none mb-1.5 italic ${selectedClientId === client.id ? 'text-black' : 'text-white'}`}>{client.name}</p>
                              <p className={`text-[8px] font-black tracking-widest uppercase ${selectedClientId === client.id ? 'text-black/60' : 'text-white/20'}`}>{client.phone}</p>
                           </div>
                           {selectedClientId === client.id && <ArrowRight size={16} className="text-black" />}
                        </button>
                     ))
                  )}
               </div>
            </div>

            {/* Client Details */}
            <div className="lg:col-span-8">
               {selectedClientId ? (
                  detailsLoading ? (
                     <div className="flex items-center justify-center h-full min-h-[40vh]">
                        <div className="w-8 h-8 border-4 border-[#f59e0b]/20 border-t-[#f59e0b] rounded-full animate-spin"></div>
                     </div>
                  ) : (
                     <div className="animate-in fade-in slide-in-from-right-6 duration-500 space-y-10">
                        {/* Header Perfil */}
                        <div className="bg-black/80 border border-white/10 rounded-[4rem] p-10 shadow-2xl flex flex-col md:flex-row items-center gap-10 relative overflow-hidden backdrop-blur-xl">
                           <div className="w-36 h-36 rounded-[3rem] bg-white/5 border border-white/10 overflow-hidden shadow-2xl z-10 shrink-0">
                              {clientDetails?.profile.avatar_url ? <Image src={clientDetails.profile.avatar_url} alt={`Avatar de ${clientDetails?.profile.name}`} width={128} height={128} className="w-full h-full object-cover" /> : <User size={54} className="w-full h-full p-10 text-white/10" />}
                           </div>
                           <div className="text-center md:text-left z-10 flex-1">
                              <div className="mb-6">
                                 <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-2 italic leading-none">{clientDetails?.profile.name}</h3>
                                 <span className="text-[8px] font-black text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-4 py-1.5 rounded-lg uppercase tracking-[0.3em] italic">Cliente Distinguido</span>
                              </div>
                              <div className="flex flex-wrap justify-center md:justify-start gap-8">
                                 <div className="flex items-center gap-3 text-white/40 group">
                                    <Phone size={14} className="text-[#f59e0b]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{clientDetails?.profile.phone}</span>
                                 </div>
                                 <div className="flex items-center gap-3 text-white/40">
                                    <CalendarDays size={14} className="text-[#f59e0b]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest italic">Miembro desde {format(new Date(clientDetails?.profile.created_at || Date.now()), 'dd MMM yyyy')}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="md:ml-auto z-10">
                              <button
                                 onClick={() => {
                                    Swal.fire({
                                       title: '¿ANONIMIZAR CLIENTE?',
                                       text: 'Se borrarán los datos personales. El historial de ventas permanecerá para contabilidad.',
                                       icon: 'warning',
                                       showCancelButton: true,
                                       confirmButtonColor: '#ef4444',
                                       confirmButtonText: 'CONFIRMAR ELIMINACIÓN',
                                       cancelButtonText: 'CANCELAR',
                                       background: '#0a0a0a',
                                       color: '#fff'
                                    }).then(result => {
                                       if (result.isConfirmed) {
                                          deleteClient.mutate(clientDetails!.profile.id, {
                                             onSuccess: () => {
                                                toast.success('Cliente eliminado con éxito');
                                                setSelectedClientId(null);
                                             }
                                          });
                                       }
                                    });
                                 }}
                                 className="p-5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-[2rem] hover:bg-red-500/20 transition-all shadow-xl active:scale-90"
                              >
                                 <Trash size={22} />
                              </button>
                           </div>
                           <Activity size={300} className="absolute -bottom-32 -right-32 opacity-[0.02] text-[#f59e0b]" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                           {/* Historial */}
                           <div className="bg-black/80 border border-white/10 rounded-[3rem] p-10 shadow-2xl backdrop-blur-xl space-y-8 flex flex-col">
                              <div className="flex items-center gap-4 px-2">
                                 <div className="p-3 bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] rounded-2xl">
                                    <History size={20} />
                                 </div>
                                 <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] italic">Últimos Servicios</h4>
                              </div>
                              <div className="flex flex-col -space-y-px flex-1">
                                  {(clientDetails?.appointments || []).length === 0 ? (
                                     <div className="py-20 text-center opacity-10">
                                       <p className="text-[9px] font-black uppercase tracking-widest italic">Sin actividad previa</p>
                                     </div>
                                  ) : (
                                     (clientDetails?.appointments || []).slice(0, 5).map((apt: Appointment & { service: { name: string } }, idx: number, arr: Appointment[]) => (
                                        <div 
                                          key={apt.id} 
                                          className={`
                                            flex justify-between items-center p-6 bg-white/5 border border-white/5 transition-all group
                                            ${idx === 0 ? 'rounded-t-2xl' : ''}
                                            ${idx === arr.length - 1 ? 'rounded-b-2xl' : ''}
                                          `}
                                        >
                                           <div>
                                              <p className="text-xs md:text-sm font-black text-white uppercase italic tracking-tight mb-1">{apt.service?.name || 'Servicio'}</p>
                                              <p className="text-[8px] text-white/20 font-black uppercase tracking-widest italic">{format(new Date(apt.start_time), 'dd MMM, yyyy')}</p>
                                           </div>
                                           <div className="text-right">
                                              <p className="text-base font-black text-white italic tracking-tighter leading-none">${new Intl.NumberFormat('de-DE').format(apt.price)}</p>
                                           </div>
                                        </div>
                                     ))
                                  )}
                              </div>
                           </div>

                           {/* Estadísticas */}
                           <div className="bg-black/80 border border-white/10 rounded-[3rem] p-12 shadow-2xl backdrop-blur-xl flex flex-col justify-center text-center space-y-12 relative overflow-hidden">
                              <div className="p-6 bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] rounded-full w-fit mx-auto relative z-10">
                                 <Scissors size={36} />
                              </div>
                              <div className="relative z-10">
                                 <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-4 italic">Total de Visitas</p>
                                 <p className="text-6xl font-black text-white italic tracking-tighter leading-none">{(clientDetails?.appointments || []).length}</p>
                              </div>
                              <div className="pt-10 border-t border-white/5 relative z-10">
                                 <p className="text-[10px] font-black text-[#f59e0b] uppercase tracking-[0.4em] mb-3 italic">Volumen de Compra</p>
                                 <p className="text-3xl font-black text-white italic tracking-tighter leading-none">${new Intl.NumberFormat('de-DE').format((clientDetails?.appointments || []).reduce((s: number, a: Appointment) => s + a.price, 0))}</p>
                              </div>
                              <Scissors size={200} className="absolute -bottom-20 -left-20 opacity-[0.02] text-[#f59e0b] -rotate-12" />
                           </div>
                        </div>
                     </div>
                  )
               ) : (
                  <div className="h-full min-h-[60vh] border-2 border-dashed border-white/5 rounded-[4rem] bg-white/5 flex flex-col items-center justify-center text-center p-16 opacity-30">
                     <div className="p-8 bg-black border border-white/10 rounded-3xl mb-8">
                        <User size={64} className="text-white/20" />
                     </div>
                     <h4 className="text-xl font-black text-white uppercase tracking-[0.4em] mb-4 italic leading-none">Selección de Perfil</h4>
                     <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest max-w-xs leading-relaxed">Selecciona un cliente del directorio para auditar su actividad y valor histórico.</p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}
