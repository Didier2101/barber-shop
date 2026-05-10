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
   Scissors
} from 'lucide-react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { Appointment } from '@/types';

export default function ClientsPage() {
   const { data: clients = [], isLoading: clientsLoading } = useOwnerClients();
   const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
   const { data: clientDetails, isLoading: detailsLoading } = useClientDetails(selectedClientId);
   const { deleteClient } = useOwnerMutations();
   const [searchTerm, setSearchTerm] = useState('');

   const filteredClients = clients.filter(c =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm)
   );

   if (clientsLoading) {
      return (
         <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-4 border-[#0061ff] border-t-transparent rounded-full animate-spin"></div>
         </div>
      );
   }

   return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl">
         <div className="flex items-center gap-4">
            <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm text-[#0061ff]">
               <User size={24} />
            </div>
            <div>
               <h2 className="text-2xl font-bold tracking-tight text-gray-900 uppercase">Cartera de Clientes</h2>
               <p className="text-[11px] text-gray-500 font-medium tracking-wider">Gestión de perfiles y fidelización</p>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Client List */}
            <div className="lg:col-span-1 space-y-6">
               <div className="relative">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                     <Search size={16} className="text-gray-300" />
                  </div>
                  <input
                     type="text"
                     placeholder="Buscar por nombre o teléfono..."
                     className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-14 pr-6 text-xs font-bold outline-none focus:border-[#0061ff] focus:shadow-xl focus:shadow-blue-500/5 transition-all shadow-sm"
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                  />
               </div>

               <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm max-h-[65vh] overflow-y-auto custom-scrollbar">
                  <div className="divide-y divide-gray-50">
                     {filteredClients.length === 0 ? (
                        <div className="p-12 text-center">
                           <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No se encontraron clientes</p>
                        </div>
                     ) : (
                        filteredClients.map(client => (
                           <button
                              key={client.id}
                              onClick={() => setSelectedClientId(client.id)}
                              className={`w-full p-6 flex items-center gap-5 hover:bg-gray-50 transition-all text-left ${selectedClientId === client.id ? 'bg-blue-50/50' : ''}`}
                           >
                              <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                 {client.avatar_url ? <img src={client.avatar_url} alt={`Avatar de ${client.name}`} className="w-full h-full object-cover" /> : <User size={20} className="text-gray-300" />}
                              </div>
                              <div className="min-w-0">
                                 <p className="text-sm font-black text-gray-900 uppercase truncate mb-0.5">{client.name}</p>
                                 <p className="text-[10px] text-gray-400 font-bold tracking-widest">{client.phone}</p>
                              </div>
                           </button>
                        ))
                     )}
                  </div>
               </div>
            </div>

            {/* Client Details */}
            <div className="lg:col-span-2 space-y-8">
               {selectedClientId ? (
                  detailsLoading ? (
                     <div className="flex items-center justify-center h-full min-h-[40vh]">
                        <div className="w-8 h-8 border-4 border-[#0061ff] border-t-transparent rounded-full animate-spin"></div>
                     </div>
                  ) : (
                     <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-10">
                        <div className="bg-white border border-gray-100 rounded-[3rem] p-12 shadow-sm flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
                           <div className="w-32 h-32 rounded-[2.5rem] bg-gray-50 border border-gray-100 overflow-hidden shadow-xl z-10">
                              {clientDetails?.profile.avatar_url ? <img src={clientDetails.profile.avatar_url} alt={`Avatar de ${clientDetails?.profile.name}`} className="w-full h-full object-cover" /> : <User size={48} className="w-full h-full p-8 text-gray-300" />}
                           </div>
                           <div className="text-center md:text-left z-10 space-y-4">
                              <div>
                                 <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-1">{clientDetails?.profile.name}</h3>
                                 <p className="text-xs font-black text-[#0061ff] uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-lg w-fit mx-auto md:mx-0">Cliente Registrado</p>
                              </div>
                              <div className="flex flex-wrap justify-center md:justify-start gap-6">
                                 <div className="flex items-center gap-2 text-gray-500">
                                    <Phone size={14} className="text-gray-300" />
                                    <span className="text-[11px] font-bold tracking-widest">{clientDetails?.profile.phone}</span>
                                 </div>
                                 <div className="flex items-center gap-2 text-gray-500">
                                    <CalendarDays size={14} className="text-gray-300" />
                                    <span className="text-[11px] font-bold tracking-widest">Desde {format(new Date(clientDetails?.profile.created_at || Date.now()), 'dd MMM yyyy')}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="md:ml-auto flex flex-col gap-3 z-10">
                              <button
                                 onClick={() => {
                                    Swal.fire({
                                       title: '¿Anonimizar cliente?',
                                       text: 'Los datos personales serán borrados pero el historial contable se mantendrá.',
                                       icon: 'warning',
                                       showCancelButton: true,
                                       confirmButtonColor: '#ef4444',
                                       confirmButtonText: 'Eliminar y Anonimizar'
                                    }).then(result => {
                                       if (result.isConfirmed) {
                                          deleteClient.mutate(clientDetails!.profile.id, {
                                             onSuccess: () => setSelectedClientId(null)
                                          });
                                       }
                                    });
                                 }}
                                 className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all border border-red-100 shadow-sm"
                              >
                                 <Trash size={20} />
                              </button>
                           </div>
                           <Activity size={300} className="absolute -bottom-32 -right-32 opacity-[0.02] text-blue-500" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm space-y-6">
                              <div className="flex items-center gap-4 mb-2">
                                 <div className="p-3 bg-blue-50 text-[#0061ff] rounded-2xl">
                                    <History size={20} />
                                 </div>
                                 <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Historial de Visitas</h4>
                              </div>
                              <div className="space-y-4">
                                  {(clientDetails?.appointments || []).length === 0 ? (
                                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic py-4">Sin servicios previos</p>
                                  ) : (
                                     (clientDetails?.appointments || []).slice(0, 5).map((apt: Appointment & { service: { name: string } }) => (
                                        <div key={apt.id} className="flex justify-between items-center p-5 bg-gray-50/50 border border-gray-100 rounded-2xl">
                                           <div>
                                              <p className="text-[11px] font-black text-gray-900 uppercase">{apt.service?.name || 'Servicio'}</p>
                                              <p className="text-[9px] text-gray-400 font-bold uppercase">{format(new Date(apt.start_time), 'dd MMM, yyyy')}</p>
                                           </div>
                                           <p className="text-sm font-black text-gray-900">${new Intl.NumberFormat('de-DE').format(apt.price)}</p>
                                        </div>
                                     ))
                                  )}
                              </div>
                           </div>

                           <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm space-y-8 flex flex-col justify-center text-center">
                              <div className="p-5 bg-blue-50 text-[#0061ff] rounded-full w-fit mx-auto">
                                 <Scissors size={32} />
                              </div>
                              <div>
                                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Servicios</p>
                                 <p className="text-5xl font-black text-gray-900 italic tracking-tighter leading-none">{(clientDetails?.appointments || []).length}</p>
                              </div>
                              <div className="pt-8 border-t border-gray-50">
                                 <p className="text-[10px] font-black text-[#0061ff] uppercase tracking-widest mb-1">Gasto Total</p>
                                 <p className="text-2xl font-black text-gray-900">${new Intl.NumberFormat('de-DE').format((clientDetails?.appointments || []).reduce((s: number, a: { price: number }) => s + a.price, 0))}</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  )
               ) : (
                  <div className="h-full min-h-[50vh] border border-dashed border-gray-200 rounded-[3rem] bg-gray-50/30 flex flex-col items-center justify-center text-center p-10">
                     <div className="p-6 bg-white rounded-3xl shadow-sm mb-6 text-gray-300">
                        <User size={48} />
                     </div>
                     <h4 className="text-lg font-black text-gray-400 uppercase tracking-widest mb-2">Selecciona un cliente</h4>
                     <p className="text-xs text-gray-400 font-medium max-w-xs">Haz clic en un cliente de la lista para ver su perfil detallado e historial de servicios.</p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}
