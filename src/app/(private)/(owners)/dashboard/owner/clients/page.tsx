'use client';
import { useOwnerClientsPaginated, useClientDetails, useOwnerMutations } from '@/hooks/owner';
import {
   User,
   Search,
   Phone,
   CalendarDays,
   History,
   ChevronRight,
   ChevronLeft,
   Check,
   X,
   Clock,
   CheckCircle2,
   XCircle
, Activity } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { Appointment, Profile } from '@/types';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/format';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClientsPage() {
   const [page, setPage] = useState(1);
   const [searchTerm, setSearchTerm] = useState('');
   const limit = 10;

   const { data: paginatedData, isLoading: clientsLoading } = useOwnerClientsPaginated(page, limit, searchTerm);

   const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
   const [isDrawerOpen, setIsDrawerOpen] = useState(false);
   const { data: clientDetails, isLoading: detailsLoading } = useClientDetails(selectedClientId);

   const { toggleClientStatus } = useOwnerMutations();

   const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      setPage(1);
   };

   const openClientDrawer = (id: string) => {
      setSelectedClientId(id);
      setIsDrawerOpen(true);
   };

   const handleToggleStatus = (id: string, currentStatus: boolean, name: string) => {
      const action = currentStatus ? 'desactivar' : 'activar';
      Swal.fire({
         title: `¿Confirmas que deseas ${action} a ${name}?`,
         text: currentStatus ? 'El cliente no podrá agendar citas pero su historial se mantendrá.' : 'El cliente volverá a estar activo en el sistema.',
         icon: 'warning',
         showCancelButton: true,
         confirmButtonColor: 'var(--color-erp-primary)',
         cancelButtonColor: '#ef4444',
         confirmButtonText: 'Sí, confirmar',
         cancelButtonText: 'Cancelar'
      }).then(result => {
         if (result.isConfirmed) {
            toggleClientStatus.mutate(
               { id, is_active: !currentStatus },
               {
                  onSuccess: () => {
                     toast.success(`Cliente ${action}do exitosamente`);
                     if (selectedClientId === id) {
                        setIsDrawerOpen(false); // opcional: cerrar el drawer tras cambiar
                     }
                  }
               }
            );
         }
      });
   };

   return (
      <div className="space-y-6 max-w-7xl mx-auto pb-32 font-sans animate-in fade-in slide-in-from-bottom-4 duration-500">
         
         {/* HEADER ERP */}
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-erp-bg border border-erp-border p-6 rounded-2xl shadow-sm">
            <div>
               <h2 className="text-2xl font-black text-erp-text tracking-tight flex items-center gap-3">
                  <User size={24} className="text-erp-primary" />
                  Base de Datos de Clientes
               </h2>
               <p className="text-sm font-medium text-erp-text-muted mt-1">Directorio de clientes y su historial</p>
            </div>
            
            <div className="relative group shadow-sm w-full sm:w-96">
               <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search size={16} className="text-erp-text-muted group-focus-within:text-erp-primary transition-colors" />
               </div>
               <input
                  type="text"
                  placeholder="Buscar cliente por nombre..."
                  className="w-full bg-erp-surface border border-erp-border rounded-xl py-2.5 pl-11 pr-4 text-sm text-erp-text outline-none focus:border-erp-primary/50 transition-all"
                  value={searchTerm}
                  onChange={handleSearch}
               />
            </div>
         </div>

         {/* DATA GRID (TABLA) */}
         <div className="bg-erp-surface border border-erp-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-[65vh]">
            {clientsLoading ? (
               <div className="flex-1 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-erp-primary/20 border-t-erp-primary rounded-full animate-spin"></div>
               </div>
            ) : paginatedData?.clients.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                  <User size={48} className="text-erp-text-muted mb-4" />
                  <p className="text-sm font-bold text-erp-text uppercase tracking-widest">Sin resultados</p>
               </div>
            ) : (
               <div className="flex-1 overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="bg-erp-bg border-b border-erp-border">
                           <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted whitespace-nowrap">Cliente</th>
                           <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted whitespace-nowrap">Contacto</th>
                           <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted text-center whitespace-nowrap">Estado</th>
                           <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted whitespace-nowrap">Registro</th>
                           <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted text-right whitespace-nowrap">Acciones</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-erp-border">
                        {paginatedData?.clients.map((client: Profile) => (
                           <tr
                              key={client.id}
                              onClick={() => openClientDrawer(client.id)}
                              className="cursor-pointer group bg-erp-bg"
                           >
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg overflow-hidden border border-erp-border bg-erp-surface flex items-center justify-center shrink-0 ${!client.is_active ? 'opacity-50 grayscale' : ''}`}>
                                       {client.avatar_url ? (
                                          <Image src={client.avatar_url} alt={client.name} width={40} height={40} className="w-full h-full object-cover" />
                                       ) : (
                                          <User size={18} className="text-erp-text-muted" />
                                       )}
                                    </div>
                                    <div className={!client.is_active ? 'opacity-50' : ''}>
                                       <p className="text-sm font-bold text-erp-text capitalize">{client.name}</p>
                                       <p className="text-xs font-medium text-erp-text-muted">ID: {client.id.substring(0, 8)}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <div className={`flex items-center gap-2 text-xs font-medium text-erp-text ${!client.is_active ? 'opacity-50' : ''}`}>
                                    <Phone size={12} className="text-erp-text-muted" /> {client.phone || 'N/A'}
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-center whitespace-nowrap">
                                 <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border
                                    ${client.is_active ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : 'text-red-600 bg-red-500/10 border-red-500/20'}
                                 `}>
                                    {client.is_active ? 'Activo' : 'Inactivo'}
                                 </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-erp-text">
                                 {format(new Date(client.created_at || Date.now()), 'dd MMM yyyy')}
                              </td>
                              <td className="px-6 py-4 text-right whitespace-nowrap">
                                 <div className="flex items-center justify-end gap-2">
                                    <button 
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleStatus(client.id, !!client.is_active, client.name);
                                       }}
                                       className={`p-2 rounded-lg border transition-all ${client.is_active ? 'hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30 border-erp-border text-erp-text-muted' : 'hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30 border-erp-border text-erp-text-muted'}`}
                                       title={client.is_active ? 'Desactivar' : 'Activar'}
                                    >
                                       {client.is_active ? <X size={16} /> : <Check size={16} />}
                                    </button>
                                    <button className="p-2 rounded-lg border border-erp-border text-erp-text-muted transition-all">
                                       <ChevronRight size={16} />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}

            {/* Paginación */}
            <div className="p-4 border-t border-erp-border flex items-center justify-between bg-erp-bg mt-auto shrink-0">
               <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 bg-erp-surface border border-erp-border rounded-lg text-erp-text-muted hover:text-erp-text hover:border-erp-primary/30 disabled:opacity-30 transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2"
               >
                  <ChevronLeft size={14} /> Anterior
               </button>
               <span className="text-xs font-bold text-erp-text-muted uppercase tracking-widest">
                  Página {page} de {paginatedData?.totalPages || 1}
               </span>
               <button
                  disabled={page === (paginatedData?.totalPages || 1) || paginatedData?.totalPages === 0}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 bg-erp-surface border border-erp-border rounded-lg text-erp-text-muted hover:text-erp-text hover:border-erp-primary/30 disabled:opacity-30 transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2"
               >
                  Siguiente <ChevronRight size={14} />
               </button>
            </div>
         </div>

         {/* RIGHT DRAWER (PANEL LATERAL) */}
         <AnimatePresence>
            {isDrawerOpen && (
               <>
                  <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     onClick={() => setIsDrawerOpen(false)}
                     className="fixed inset-0 bg-transparent z-[200]"
                  />

                  <motion.div
                     initial={{ x: '100%' }}
                     animate={{ x: 0 }}
                     exit={{ x: '100%' }}
                     transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                     className="fixed top-0 right-0 w-full sm:w-[450px] h-full bg-erp-bg border-l border-erp-border shadow-2xl z-[210] flex flex-col"
                  >
                     <div className="flex items-center justify-between p-6 border-b border-erp-border bg-erp-surface">
                        <h3 className="text-lg font-black uppercase tracking-tight text-erp-text">
                           Ficha del Cliente
                        </h3>
                        <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-erp-text-muted hover:text-erp-text hover:bg-black/5 rounded-full transition-all">
                           <X size={20} />
                        </button>
                     </div>

                     <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                        {detailsLoading ? (
                           <div className="flex justify-center py-20">
                              <div className="w-8 h-8 border-4 border-erp-primary/20 border-t-erp-primary rounded-full animate-spin"></div>
                           </div>
                        ) : clientDetails ? (
                           <>
                              {/* Header Perfil */}
                              <div className="flex flex-col items-center text-center">
                                 <div className="w-24 h-24 rounded-2xl bg-erp-surface border border-erp-border overflow-hidden mb-4 shadow-sm">
                                    {clientDetails.profile.avatar_url ? (
                                       <Image src={clientDetails.profile.avatar_url} alt={clientDetails.profile.name} width={96} height={96} className="w-full h-full object-cover" />
                                    ) : (
                                       <User size={40} className="w-full h-full p-6 text-erp-text-muted" />
                                    )}
                                 </div>
                                 <h4 className="text-xl font-bold text-erp-text uppercase">{clientDetails.profile.name}</h4>
                                 <p className="text-xs font-bold text-erp-primary bg-erp-primary/10 px-2 py-1 rounded mt-2 uppercase tracking-widest">
                                    Cliente Registrado
                                 </p>
                              </div>

                              {/* Info de contacto */}
                              <div className="bg-erp-surface border border-erp-border rounded-xl p-4 space-y-3">
                                 <div className="flex items-center gap-3">
                                    <Phone size={14} className="text-erp-text-muted" />
                                    <span className="text-xs font-bold text-erp-text">{clientDetails.profile.phone || 'Sin teléfono'}</span>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    <CalendarDays size={14} className="text-erp-text-muted" />
                                    <span className="text-xs font-medium text-erp-text">Registrado el {format(new Date(clientDetails.profile.created_at || Date.now()), 'dd MMM yyyy')}</span>
                                 </div>
                              </div>

                              {/* KPIs rápidos */}
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="bg-erp-surface border border-erp-border rounded-xl p-4 text-center">
                                    <p className="text-[10px] font-bold text-erp-text-muted uppercase tracking-widest mb-1">Citas Totales</p>
                                    <p className="text-2xl font-black text-erp-text">{(clientDetails.appointments || []).length}</p>
                                 </div>
                                 <div className="bg-erp-surface border border-erp-border rounded-xl p-4 text-center">
                                    <p className="text-[10px] font-bold text-erp-text-muted uppercase tracking-widest mb-1">Estado</p>
                                    <p className={`text-sm font-black mt-1 ${clientDetails.profile.is_active ? 'text-emerald-600' : 'text-red-500'}`}>
                                       {clientDetails.profile.is_active ? 'ACTIVO' : 'INACTIVO'}
                                    </p>
                                 </div>
                              </div>

                              {/* Últimos servicios */}
                              <div>
                                 <div className="flex items-center gap-2 mb-4">
                                    <History size={16} className="text-erp-primary" />
                                    <h4 className="text-xs font-bold text-erp-text uppercase tracking-widest">Últimos Servicios</h4>
                                 </div>
                                 <div className="space-y-3">
                                    {(clientDetails.appointments || []).length === 0 ? (
                                       <div className="text-center py-6 border border-dashed border-erp-border rounded-xl">
                                          <p className="text-[10px] font-medium text-erp-text-muted uppercase tracking-wider">Sin actividad previa</p>
                                       </div>
                                    ) : (
                                       (clientDetails.appointments || []).map((apt: Appointment) => (
                                          <div key={apt.id} className="flex flex-col p-3 bg-erp-surface border border-erp-border rounded-xl">
                                             <div className="flex justify-between items-start mb-2">
                                                <div>
                                                   <p className="text-xs font-bold text-erp-text uppercase tracking-tight mb-0.5">
                                                      {Array.isArray(apt.services_data) ? apt.services_data.map(s => s.name).join(', ') : 'Servicio'}
                                                   </p>
                                                   <p className="text-[10px] text-erp-text-muted font-medium">{format(new Date(apt.start_time), 'dd MMM yyyy - HH:mm')}</p>
                                                </div>
                                                <p className="text-xs font-black text-erp-text">{formatPrice(apt.price)}</p>
                                             </div>
                                             
                                             <div className="flex justify-start">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border
                                                   ${apt.status === 'completed' ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : 
                                                     apt.status === 'cancelled' ? 'text-red-500 bg-red-500/10 border-red-500/20' : 
                                                     apt.status === 'occupied' ? 'text-blue-600 bg-blue-500/10 border-blue-500/20' : 
                                                     'text-amber-500 bg-amber-500/10 border-amber-500/20'}
                                                `}>
                                                   {apt.status === 'completed' ? <CheckCircle2 size={10} /> : 
                                                    apt.status === 'cancelled' ? <XCircle size={10} /> : 
                                                    apt.status === 'occupied' ? <Activity size={10} className="animate-pulse" /> : 
                                                    <Clock size={10} />}
                                                   
                                                   {apt.status === 'completed' ? 'Finalizada' : 
                                                    apt.status === 'cancelled' ? 'Cancelada' : 
                                                    apt.status === 'occupied' ? 'En Curso' : 'Pendiente / Agendada'}
                                                </span>
                                             </div>
                                          </div>
                                       ))
                                    )}
                                 </div>
                              </div>
                           </>
                        ) : null}
                     </div>
                  </motion.div>
               </>
            )}
         </AnimatePresence>
      </div>
   );
}
