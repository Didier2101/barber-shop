'use client';
import { useOwnerBaseData, useOwnerMutations } from '@/hooks/owner';
import { 
  Scissors, 
  Trash, 
  Clock, 
  DollarSign,
  Tag,
  Plus,
  Edit
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { Service } from '@/types';

export default function ServicesPage() {
  const { data: baseData, isLoading: baseLoading } = useOwnerBaseData();
  const { createService, deleteService, updateService } = useOwnerMutations();
  
  const services = baseData?.services || [];
  const [newService, setNewService] = useState({ name: '', price: '', duration: '60' });
  const [editingService, setEditingService] = useState<Service | null>(null);

  if (baseLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-8xl mx-auto pb-32">
      <div className="flex items-center gap-5">
        <div className="p-4 bg-surface border border-white/5 rounded-2xl shadow-xl text-brand">
          <Scissors size={28} />
        </div>
        <div>
          <p className="text-brand text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Catálogo</p>
          <h2 className="text-3xl font-bold tracking-tight text-white uppercase">Servicios</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LADO IZQUIERDO: Listado de Servicios */}
        <div className="lg:col-span-6 space-y-6">
           <div className="flex items-center justify-between px-2">
             <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
               <Scissors size={12} className="text-brand" /> Menú Operativo
             </h3>
             <button 
               onClick={() => {
                 setEditingService(null);
                 setNewService({ name: '', price: '', duration: '60' });
               }}
               className="flex items-center gap-2 bg-brand/10 text-brand px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider hover:bg-brand hover:text-black transition-all"
             >
               <Plus size={12} />
               Nuevo Servicio
             </button>
           </div>
           
           <div className="bg-black border border-white/5 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[65vh]">
              {services.length === 0 ? (
                <div className="flex-1 p-16 flex flex-col items-center justify-center text-center opacity-40">
                  <Scissors size={32} className="text-white/20 mb-4" />
                  <p className="text-xs font-medium text-white uppercase tracking-wider">No hay servicios registrados</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col p-2 space-y-2">
                  {services.map((service) => {
                    const isSelected = editingService?.id === service.id;
                    return (
                      <div 
                        key={service.id} 
                        className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all group ${isSelected ? 'bg-brand/10 border-brand/30' : 'bg-bg-base border-white/5 hover:border-white/10'}`}
                      >
                         <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-brand text-black' : 'bg-brand/10 text-brand'}`}>
                               <Scissors size={18} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                               <h4 className={`text-sm font-bold uppercase tracking-tight mb-1 truncate ${isSelected ? 'text-brand' : 'text-white'}`}>
                                 {service.name}
                               </h4>
                               <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-white/50 uppercase tracking-wider">
                                     <Clock size={12} className="text-brand" />
                                     <span>{service.duration} Min</span>
                                  </div>
                                  <div className="w-1 h-1 bg-white/10 rounded-full" />
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-white uppercase tracking-wider">
                                     <DollarSign size={12} className="text-brand" />
                                     <span>${new Intl.NumberFormat('de-DE').format(service.price)}</span>
                                  </div>
                               </div>
                            </div>
                         </div>
                         
                         <div className="flex gap-1 shrink-0">
                            <button 
                               onClick={() => {
                                 setEditingService(service);
                                 setNewService({ 
                                   name: service.name, 
                                   price: service.price.toString(), 
                                   duration: service.duration.toString() 
                                 });
                               }}
                               className={`p-2 rounded-lg transition-all ${isSelected ? 'bg-brand text-black shadow-md' : 'text-white/20 hover:text-brand hover:bg-brand/10'}`}
                            >
                               <Edit size={14} />
                            </button>
                            <button 
                               onClick={() => {
                                  Swal.fire({
                                    title: '¿ELIMINAR SERVICIO?',
                                    text: 'Esta acción deshabilitará el servicio para nuevas citas.',
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonColor: '#ef4444',
                                    confirmButtonText: 'ELIMINAR',
                                    cancelButtonText: 'CANCELAR',
                                    background: '#111',
                                    color: '#fff',
                                  }).then(result => {
                                    if (result.isConfirmed) {
                                      deleteService.mutate(service.id, {
                                        onSuccess: () => {
                                          toast.success('Servicio eliminado');
                                          if (editingService?.id === service.id) {
                                            setEditingService(null);
                                            setNewService({ name: '', price: '', duration: '60' });
                                          }
                                        },
                                        onError: (err) => toast.error('Error al eliminar: ' + err.message)
                                      });
                                    }
                                  });
                               }}
                               className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                               <Trash size={14} />
                            </button>
                         </div>
                      </div>
                    );
                  })}
                </div>
              )}
           </div>
        </div>

        {/* LADO DERECHO: Formulario de Servicio */}
        <div className="lg:col-span-6 space-y-6">
           <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 px-2 flex items-center gap-2">
             <Edit size={12} className="text-brand" /> {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
           </h3>
           
           <div className="bg-surface border border-white/5 rounded-2xl p-8 shadow-xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                 <div className="flex items-center gap-4">
                   <div className="p-3 bg-brand/10 border border-brand/20 rounded-xl text-brand">
                      {editingService ? <Edit size={20} /> : <Plus size={20} />}
                   </div>
                   <div>
                     <h4 className="text-lg font-bold text-white uppercase tracking-tight">{editingService ? 'Actualizar Servicio' : 'Registrar Servicio'}</h4>
                     <p className="text-[10px] font-medium text-brand uppercase tracking-widest mt-1">Detalles del catálogo</p>
                   </div>
                 </div>
                 {editingService && (
                   <button 
                     onClick={() => {
                       setEditingService(null);
                       setNewService({ name: '', price: '', duration: '60' });
                     }}
                     className="text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-white transition-all bg-white/5 px-3 py-1.5 rounded-lg"
                   >
                     Cancelar
                   </button>
                 )}
              </div>

              <form 
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newService.name || !newService.price || !newService.duration) {
                    return toast.error('Completa todos los campos');
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
                          setEditingService(null);
                          setNewService({ name: '', price: '', duration: '60' });
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
                          setNewService({ name: '', price: '', duration: '60' });
                       },
                       onError: (err) => toast.error('Error al crear: ' + err.message)
                    });
                  }
                }}
              >
                 <div className="space-y-2">
                    <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider ml-1">Nombre del Servicio</label>
                    <input 
                       type="text" 
                       required
                       placeholder="Ej: Corte Degradado"
                       className="w-full bg-bg-base border border-white/5 rounded-xl px-4 py-4 text-sm font-bold text-white outline-none focus:border-brand transition-all placeholder:font-normal uppercase tracking-wide"
                       value={newService.name}
                       onChange={e => setNewService({ ...newService, name: e.target.value })}
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider ml-1">Precio al Público</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand font-bold">$</div>
                        <input 
                           type="number" 
                           required
                           min="0"
                           placeholder="0"
                           className="w-full bg-bg-base border border-white/5 rounded-xl pl-8 pr-4 py-4 text-sm font-bold text-white outline-none focus:border-brand transition-all placeholder:font-normal"
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
                      <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider ml-1">Duración</label>
                      <div className="relative">
                        <select 
                           className="w-full bg-bg-base border border-white/5 rounded-xl px-4 py-4 text-sm font-bold text-white outline-none focus:border-brand transition-all appearance-none cursor-pointer uppercase tracking-wider"
                           value={newService.duration}
                           onChange={e => setNewService({ ...newService, duration: e.target.value })}
                        >
                           <option value="15">15 Min</option>
                           <option value="30">30 Min</option>
                           <option value="45">45 Min</option>
                           <option value="60">1 Hora</option>
                           <option value="90">1.5 Horas</option>
                           <option value="120">2 Horas</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40"><Clock size={16} /></div>
                      </div>
                   </div>
                 </div>

                 <div className="pt-4">
                   <button 
                      type="submit"
                      disabled={createService.isPending || updateService.isPending}
                      className="w-full bg-brand text-black py-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                   >
                      {createService.isPending || updateService.isPending ? 'GUARDANDO...' : (editingService ? 'GUARDAR CAMBIOS' : 'CREAR SERVICIO')}
                   </button>
                 </div>
              </form>
           </div>
        </div>
      </div>
    </div>
  );
}
