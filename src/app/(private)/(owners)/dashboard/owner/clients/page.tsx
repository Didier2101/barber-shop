'use client';
import { useOwnerClientsPaginated, useClientDetails, useOwnerMutations } from '@/hooks/owner';
import {
   User,
   Search,
   Phone,
   CalendarDays,
   Trash,
   Activity,
   History,
   Scissors,
   ArrowRight,
   Power,
   ChevronLeft,
   ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { Appointment, Profile } from '@/types';
import { toast } from 'sonner';

export default function ClientsPage() {
   const [page, setPage] = useState(1);
   const [searchTerm, setSearchTerm] = useState('');
   const limit = 10;
   
   // Hacemos el debounce del término de búsqueda manualmente o lo pasamos directo.
   // Pasarlo directo causará peticiones en cada tipeo, pero React Query lo manejará bien.
   const { data: paginatedData, isLoading: clientsLoading } = useOwnerClientsPaginated(page, limit, searchTerm);
   
   const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
   const { data: clientDetails, isLoading: detailsLoading } = useClientDetails(selectedClientId);
   
   const { toggleClientStatus } = useOwnerMutations();

   const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      setPage(1); // Reset a pagina 1 cuando se busca
   };

   return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-8xl mx-auto pb-32">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
               <div className="p-4 bg-black border border-white/5 rounded-2xl shadow-xl text-brand">
                  <User size={28} />
               </div>
               <div>
                  <p className="text-brand text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Base de Datos</p>
                  <h2 className="text-3xl font-bold tracking-tight text-white uppercase">Clientes</h2>
               </div>
            </div>
            
            <div className="relative group shadow-xl w-full md:w-96">
               <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                  <Search size={16} className="text-white/40 group-focus-within:text-brand transition-colors" />
               </div>
               <input
                  type="text"
                  placeholder="Buscar cliente..."
                  className="w-full bg-black border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-brand transition-all"
                  value={searchTerm}
                  onChange={handleSearch}
               />
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Client List (Sidebar) */}
            <div className="lg:col-span-6 space-y-6">

               <div className="bg-black border border-white/5 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[65vh]">
                  {clientsLoading ? (
                     <div className="flex-1 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-brand/20 border-t-brand rounded-full animate-spin"></div>
                     </div>
                  ) : (paginatedData?.clients.length === 0) ? (
                     <div className="flex-1 p-16 flex items-center justify-center text-center opacity-40">
                        <p className="text-xs font-medium text-white uppercase tracking-wider">Sin resultados</p>
                     </div>
                  ) : (
                     <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                        {paginatedData?.clients.map((client: Profile) => (
                           <button
                              key={client.id}
                              onClick={() => setSelectedClientId(client.id)}
                              className={`
                                w-full p-4 flex items-center gap-4 transition-all text-left relative z-10 border-b border-white/5 last:border-0
                                ${selectedClientId === client.id ? 'bg-brand/10 text-brand' : 'hover:bg-white/5 text-white/80'}
                                ${!client.is_active ? 'opacity-50 grayscale' : ''}
                              `}
                           >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border ${selectedClientId === client.id ? 'bg-bg-base border-brand/20' : 'bg-bg-base border-white/5'}`}>
                                 {client.avatar_url ? <Image src={client.avatar_url} alt={`Avatar de ${client.name}`} width={40} height={40} className="w-full h-full object-cover" /> : <User size={18} className={selectedClientId === client.id ? 'text-brand' : 'text-white/20'} />}
                              </div>
                              <div className="min-w-0 flex-1">
                                 <p className={`text-sm font-bold uppercase truncate mb-0.5 ${selectedClientId === client.id ? 'text-brand' : 'text-white'}`}>
                                    {client.name}
                                 </p>
                                 <p className={`text-[10px] font-medium tracking-widest uppercase ${selectedClientId === client.id ? 'text-brand/60' : 'text-white/40'}`}>
                                    {!client.is_active ? 'INACTIVO' : 'ACTIVO'}
                                 </p>
                              </div>
                              {selectedClientId === client.id && <ArrowRight size={16} className="text-brand" />}
                           </button>
                        ))}
                     </div>
                  )}

                  {/* Paginación */}
                  <div className="p-4 border-t border-white/5 flex items-center justify-between bg-bg-base">
                     <button 
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="p-2 text-white/40 hover:text-white disabled:opacity-20 transition-all"
                     >
                        <ChevronLeft size={20} />
                     </button>
                     <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest">
                        Página {page} de {paginatedData?.totalPages || 1}
                     </span>
                     <button 
                        disabled={page === (paginatedData?.totalPages || 1) || paginatedData?.totalPages === 0}
                        onClick={() => setPage(p => p + 1)}
                        className="p-2 text-white/40 hover:text-white disabled:opacity-20 transition-all"
                     >
                        <ChevronRight size={20} />
                     </button>
                  </div>
               </div>
            </div>

            {/* Client Details */}
            <div className="lg:col-span-6">
               {selectedClientId ? (
                  detailsLoading ? (
                     <div className="flex items-center justify-center h-full min-h-[40vh]">
                        <div className="w-8 h-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
                     </div>
                  ) : (
                     <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                        {/* Header Perfil */}
                        <div className="bg-black border border-white/5 rounded-2xl p-8 shadow-xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                           <div className="w-32 h-32 rounded-full bg-bg-base border-4 border-surface ring-2 ring-brand/20 overflow-hidden shadow-2xl z-10 shrink-0">
                              {clientDetails?.profile.avatar_url ? <Image src={clientDetails.profile.avatar_url} alt={`Avatar de ${clientDetails?.profile.name}`} width={128} height={128} className="w-full h-full object-cover" /> : <User size={40} className="w-full h-full p-8 text-white/20" />}
                           </div>
                           <div className="text-center md:text-left z-10 flex-1">
                              <div className="mb-4">
                                 <h3 className="text-2xl font-bold text-white uppercase tracking-tight mb-2 flex items-center gap-3">
                                    {clientDetails?.profile.name}
                                    {!clientDetails?.profile.is_active && (
                                       <span className="text-[10px] text-red-500 border border-red-500/20 bg-red-500/10 px-2 py-1 rounded">INACTIVO</span>
                                    )}
                                 </h3>
                                 <span className="text-[9px] font-bold text-brand bg-brand/10 border border-brand/20 px-3 py-1 rounded uppercase tracking-widest">
                                    Cliente Registrado
                                 </span>
                              </div>
                              <div className="flex flex-wrap justify-center md:justify-start gap-6">
                                 <div className="flex items-center gap-2 text-white/60">
                                    <Phone size={14} className="text-brand" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{clientDetails?.profile.phone || 'N/A'}</span>
                                 </div>
                                 <div className="flex items-center gap-2 text-white/60">
                                    <CalendarDays size={14} className="text-brand" />
                                    <span className="text-[10px] font-medium uppercase tracking-wider">Registrado el {format(new Date(clientDetails?.profile.created_at || Date.now()), 'dd MMM yyyy')}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="md:ml-auto z-10">
                              <button
                                 onClick={() => {
                                    const isActivating = !clientDetails?.profile.is_active;
                                    Swal.fire({
                                       title: isActivating ? '¿ACTIVAR CLIENTE?' : '¿DESACTIVAR CLIENTE?',
                                       text: isActivating ? 'El cliente volverá a estar activo en el sistema.' : 'El cliente no podrá agendar citas pero su historial se mantendrá.',
                                       icon: 'warning',
                                       showCancelButton: true,
                                       confirmButtonColor: isActivating ? '#10b981' : '#ef4444',
                                       confirmButtonText: isActivating ? 'SÍ, ACTIVAR' : 'SÍ, DESACTIVAR',
                                       cancelButtonText: 'CANCELAR',
                                       background: '#111111',
                                       color: '#fff'
                                    }).then(result => {
                                       if (result.isConfirmed) {
                                          toggleClientStatus.mutate(
                                             { id: clientDetails!.profile.id, is_active: isActivating },
                                             {
                                                onSuccess: () => {
                                                   toast.success(isActivating ? 'Cliente activado' : 'Cliente desactivado');
                                                }
                                             }
                                          );
                                       }
                                    });
                                 }}
                                 className={`p-4 rounded-xl border transition-all shadow-xl active:scale-90 ${clientDetails?.profile.is_active ? 'bg-bg-base text-red-500 border-white/5 hover:bg-red-500/10 hover:border-red-500/20' : 'bg-bg-base text-emerald-500 border-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/20'}`}
                                 title={clientDetails?.profile.is_active ? 'Desactivar cliente' : 'Activar cliente'}
                              >
                                 <Power size={18} />
                              </button>
                           </div>
                           <Activity size={200} className="absolute -bottom-16 -right-16 opacity-5 text-brand" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {/* Historial */}
                           <div className="bg-black border border-white/5 rounded-2xl p-8 shadow-xl flex flex-col h-full">
                              <div className="flex items-center gap-3 mb-6">
                                 <div className="p-2.5 bg-brand/10 border border-brand/20 text-brand rounded-xl">
                                    <History size={18} />
                                 </div>
                                 <h4 className="text-[11px] font-bold text-white uppercase tracking-widest">Últimos Servicios</h4>
                              </div>
                              <div className="flex flex-col gap-2 flex-1">
                                  {(clientDetails?.appointments || []).length === 0 ? (
                                     <div className="py-12 text-center opacity-40">
                                       <p className="text-[10px] font-medium uppercase tracking-wider">Sin actividad previa</p>
                                     </div>
                                  ) : (
                                     (clientDetails?.appointments || []).slice(0, 5).map((apt: Appointment & { service: { name: string } }) => (
                                        <div 
                                          key={apt.id} 
                                          className="flex justify-between items-center p-4 bg-bg-base border border-white/5 rounded-xl transition-all hover:border-white/10"
                                        >
                                           <div>
                                              <p className="text-sm font-bold text-white uppercase tracking-tight mb-1">{apt.service?.name || 'Servicio'}</p>
                                              <p className="text-[9px] text-white/40 font-medium uppercase tracking-wider">{format(new Date(apt.start_time), 'dd MMM, yyyy')}</p>
                                           </div>
                                           <div className="text-right">
                                              <p className="text-sm font-bold text-white tracking-tight leading-none">$${new Intl.NumberFormat('de-DE').format(apt.price)}</p>
                                           </div>
                                        </div>
                                     ))
                                  )}
                              </div>
                           </div>

                           {/* Estadísticas */}
                           <div className="bg-black border border-white/5 rounded-2xl p-8 shadow-xl flex flex-col justify-center text-center space-y-8 relative overflow-hidden">
                              <div className="p-5 bg-brand/10 border border-brand/20 text-brand rounded-full w-fit mx-auto relative z-10">
                                 <Scissors size={28} />
                              </div>
                              <div className="relative z-10">
                                 <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Total de Visitas</p>
                                 <p className="text-5xl font-bold text-white tracking-tighter leading-none">{(clientDetails?.appointments || []).length}</p>
                              </div>
                              <div className="pt-8 border-t border-white/5 relative z-10">
                                 <p className="text-[10px] font-bold text-brand uppercase tracking-widest mb-2">Volumen de Compra</p>
                                 <p className="text-2xl font-bold text-white tracking-tighter leading-none">$${new Intl.NumberFormat('de-DE').format((clientDetails?.appointments || []).reduce((s: number, a: Appointment) => s + a.price, 0))}</p>
                              </div>
                              <Scissors size={150} className="absolute -bottom-10 -left-10 opacity-5 text-brand -rotate-12" />
                           </div>
                        </div>
                     </div>
                  )
               ) : (
                  <div className="h-full min-h-[60vh] border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-12 opacity-60">
                     <div className="p-6 bg-black border border-white/10 rounded-2xl mb-6">
                        <User size={40} className="text-white/20" />
                     </div>
                     <h4 className="text-lg font-bold text-white uppercase tracking-wider mb-2">Selección de Perfil</h4>
                     <p className="text-xs text-white/40 font-medium uppercase tracking-wider max-w-xs leading-relaxed">Selecciona un cliente del directorio para ver su actividad y estadísticas.</p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}
