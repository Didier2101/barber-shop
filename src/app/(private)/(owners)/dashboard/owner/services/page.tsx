'use client';
import { useOwnerBaseData, useOwnerMutations } from '@/hooks/owner';
import { 
  Scissors, 
  Clock, 
  DollarSign,
  Plus,
  Edit,
  Search,
  X,
  Check
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { Service } from '@/types';
import { formatPrice } from '@/lib/format';
import { motion, AnimatePresence } from 'framer-motion';

const EMPTY_SERVICES: Service[] = [];

export default function ServicesPage() {
  const { data: baseData, isLoading: baseLoading } = useOwnerBaseData();
  const { createService, toggleServiceStatus, updateService } = useOwnerMutations();
  
  const services = useMemo(() => baseData?.services || EMPTY_SERVICES, [baseData?.services]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState({ name: '', price: '', duration: '60' });

  // Filter logic
  const filteredServices = useMemo(() => {
     if (!searchTerm) return services;
     return services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [services, searchTerm]);

  // Open drawer for edit or create
  const openDrawer = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setNewService({ 
        name: service.name, 
        price: service.price.toString(), 
        duration: service.duration.toString() 
      });
    } else {
      setEditingService(null);
      setNewService({ name: '', price: '', duration: '60' });
    }
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingService(null);
    setNewService({ name: '', price: '', duration: '60' });
  };

  const handleToggleStatus = (id: string, currentStatus: boolean, name: string) => {
    const action = currentStatus ? 'desactivar' : 'activar';
    Swal.fire({
      title: `¿Confirmas que deseas ${action} el servicio ${name}?`,
      text: currentStatus ? 'Este servicio ya no estará disponible para nuevas citas.' : 'Este servicio volverá a estar disponible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--color-erp-primary)',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        toggleServiceStatus.mutate(
          { id, is_active: !currentStatus },
          {
            onSuccess: () => {
              toast.success(`Servicio ${action}do exitosamente`);
              if (editingService?.id === id) closeDrawer();
            },
            onError: (err) => toast.error(`Error al ${action}: ` + err.message)
          }
        );
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name || !newService.price || !newService.duration) {
      return toast.error('Completa todos los campos obligatorios');
    }
    
    if (editingService) {
      updateService.mutate({
         id: editingService.id,
         name: newService.name,
         price: Number(newService.price),
         duration: Number(newService.duration)
      }, {
         onSuccess: () => {
            toast.success('Servicio actualizado con éxito');
            closeDrawer();
         },
         onError: (err) => toast.error('Error al actualizar: ' + err.message)
      });
    } else {
      createService.mutate({
         name: newService.name,
         price: Number(newService.price),
         duration: Number(newService.duration)
      }, {
         onSuccess: () => {
            toast.success('Servicio creado con éxito');
            closeDrawer();
         },
         onError: (err) => toast.error('Error al crear: ' + err.message)
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-32 font-sans animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER ERP */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-erp-bg border border-erp-border p-6 rounded-2xl shadow-sm">
         <div>
            <h2 className="text-2xl font-black text-erp-text tracking-tight flex items-center gap-3">
               <Scissors size={24} className="text-erp-primary" />
               Catálogo de Servicios
            </h2>
            <p className="text-sm font-medium text-erp-text-muted mt-1">Gestiona los servicios ofrecidos en tu local</p>
         </div>
         
         <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative group shadow-sm w-full sm:w-72">
               <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search size={16} className="text-erp-text-muted group-focus-within:text-erp-primary transition-colors" />
               </div>
               <input
                  type="text"
                  placeholder="Buscar servicio..."
                  className="w-full bg-erp-surface border border-erp-border rounded-xl py-2.5 pl-11 pr-4 text-sm text-erp-text outline-none focus:border-erp-primary/50 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            
            <button 
               onClick={() => openDrawer()}
               className="w-full sm:w-auto flex items-center justify-center gap-2 bg-erp-primary text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all shadow-sm"
            >
               <Plus size={16} />
               Nuevo Servicio
            </button>
         </div>
      </div>

      {/* DATA GRID (TABLA) */}
      <div className="bg-erp-surface border border-erp-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[65vh]">
         {baseLoading ? (
            <div className="flex-1 flex items-center justify-center">
               <div className="w-8 h-8 border-4 border-erp-primary/20 border-t-erp-primary rounded-full animate-spin"></div>
            </div>
         ) : filteredServices.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 p-12">
               <Scissors size={48} className="text-erp-text-muted mb-4" />
               <p className="text-sm font-bold text-erp-text uppercase tracking-widest">No hay servicios registrados</p>
               {searchTerm && <p className="text-xs text-erp-text-muted mt-2">Intenta con otra búsqueda</p>}
            </div>
         ) : (
            <div className="flex-1 overflow-x-auto custom-scrollbar">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-erp-bg border-b border-erp-border">
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted whitespace-nowrap">Nombre del Servicio</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted whitespace-nowrap">Duración</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted whitespace-nowrap">Precio</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted text-center whitespace-nowrap">Estado</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted text-right whitespace-nowrap">Acciones</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-erp-border">
                     {filteredServices.map((service) => (
                        <tr
                           key={service.id}
                           onClick={() => openDrawer(service)}
                           className="cursor-pointer group bg-erp-bg hover:bg-erp-surface transition-colors"
                        >
                           <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-lg overflow-hidden border border-erp-border bg-erp-surface flex items-center justify-center shrink-0">
                                    <Scissors size={18} className="text-erp-primary" />
                                 </div>
                                 <p className="text-sm font-bold text-erp-text uppercase tracking-tight">{service.name}</p>
                              </div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-xs font-bold text-erp-text-muted">
                                 <Clock size={14} className="text-erp-primary" /> {service.duration} Minutos
                              </div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-sm font-black text-erp-text">
                                 <DollarSign size={14} className="text-erp-primary" /> {formatPrice(service.price)}
                              </div>
                           </td>
                           <td className="px-6 py-4 text-center whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border
                                 ${service.is_active ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : 'text-red-600 bg-red-500/10 border-red-500/20'}
                              `}>
                                 {service.is_active ? 'Activo' : 'Inactivo'}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                 <button 
                                    onClick={(e) => {
                                       e.stopPropagation();
                                       handleToggleStatus(service.id, !!service.is_active, service.name);
                                    }}
                                    className={`p-2 rounded-lg border transition-all ${service.is_active ? 'hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30 border-erp-border text-erp-text-muted' : 'hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30 border-erp-border text-erp-text-muted'}`}
                                    title={service.is_active ? 'Desactivar' : 'Activar'}
                                 >
                                    {service.is_active ? <X size={16} /> : <Check size={16} />}
                                 </button>
                                 <button 
                                    onClick={(e) => {
                                       e.stopPropagation();
                                       openDrawer(service);
                                    }}
                                    className="p-2 rounded-lg border border-erp-border text-erp-text-muted hover:bg-erp-primary/10 hover:text-erp-primary hover:border-erp-primary/30 transition-all"
                                    title="Editar"
                                 >
                                    <Edit size={16} />
                                 </button>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>

      {/* DRAWER (PANEL LATERAL) - CREAR / EDITAR */}
      <AnimatePresence>
         {isDrawerOpen && (
            <>
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={closeDrawer}
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
                     <h3 className="text-lg font-black uppercase tracking-tight text-erp-text flex items-center gap-3">
                        {editingService ? <Edit size={20} className="text-erp-primary" /> : <Plus size={20} className="text-erp-primary" />}
                        {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
                     </h3>
                     <button onClick={closeDrawer} className="p-2 text-erp-text-muted hover:text-erp-text hover:bg-erp-text/5 rounded-full transition-all">
                        <X size={20} />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                     <form id="service-form" onSubmit={handleSubmit} className="space-y-6">
                        
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-erp-text-muted uppercase tracking-widest ml-1">Nombre del Servicio <span className="text-red-500">*</span></label>
                           <input 
                              type="text" 
                              required
                              placeholder="Ej: Corte Degradado"
                              className="w-full bg-erp-surface border border-erp-border rounded-xl px-4 py-3 text-sm font-bold text-erp-text outline-none focus:border-erp-primary/50 transition-all uppercase tracking-wide"
                              value={newService.name}
                              onChange={e => setNewService({ ...newService, name: e.target.value })}
                           />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label className="text-[10px] font-bold text-erp-text-muted uppercase tracking-widest ml-1">Precio al Público <span className="text-red-500">*</span></label>
                              <div className="relative">
                                 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-erp-primary font-black">$</div>
                                 <input 
                                    type="number" 
                                    required
                                    min="0"
                                    placeholder="0"
                                    className="w-full bg-erp-surface border border-erp-border rounded-xl pl-8 pr-4 py-3 text-sm font-bold text-erp-text outline-none focus:border-erp-primary/50 transition-all"
                                    value={newService.price}
                                    onChange={e => {
                                       const val = e.target.value;
                                       if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
                                          setNewService({ ...newService, price: val.replace(/^0+/, '') });
                                       } else {
                                          setNewService({ ...newService, price: val });
                                       }
                                    }}
                                 />
                              </div>
                           </div>

                           <div className="space-y-2">
                              <label className="text-[10px] font-bold text-erp-text-muted uppercase tracking-widest ml-1">Duración <span className="text-red-500">*</span></label>
                              <div className="relative">
                                 <select 
                                    className="w-full bg-erp-surface border border-erp-border rounded-xl px-4 py-3 text-sm font-bold text-erp-text outline-none focus:border-erp-primary/50 transition-all appearance-none"
                                    value={newService.duration}
                                    onChange={e => setNewService({ ...newService, duration: e.target.value })}
                                 >
                                    <option value="15">15 Minutos</option>
                                    <option value="30">30 Minutos</option>
                                    <option value="45">45 Minutos</option>
                                    <option value="60">1 Hora</option>
                                    <option value="75">1 Hr 15 Min</option>
                                    <option value="90">1 Hr 30 Min</option>
                                    <option value="120">2 Horas</option>
                                    <option value="150">2 Hr 30 Min</option>
                                    <option value="180">3 Horas</option>
                                 </select>
                                 <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Clock size={14} className="text-erp-primary" />
                                 </div>
                              </div>
                           </div>
                        </div>

                     </form>
                  </div>

                  <div className="p-6 border-t border-erp-border bg-erp-bg flex gap-3">
                     <button
                        type="button"
                        onClick={closeDrawer}
                        className="flex-1 py-4 bg-erp-surface border border-erp-border text-erp-text rounded-xl text-xs font-black uppercase tracking-widest hover:border-erp-primary/30 transition-all"
                     >
                        Cancelar
                     </button>
                     <button
                        type="submit"
                        form="service-form"
                        className="flex-1 py-4 bg-erp-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
                     >
                        {editingService ? <Edit size={16} /> : <Plus size={16} />}
                        {editingService ? 'Guardar' : 'Crear'}
                     </button>
                  </div>

               </motion.div>
            </>
         )}
      </AnimatePresence>
    </div>
  );
}
