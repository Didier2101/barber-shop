'use client';
import { useOwnerBaseData, useOwnerMutations } from '@/hooks/useOwnerData';
import { 
  Scissors, 
  Trash, 
  Clock, 
  DollarSign,
  Tag,
  Plus,
  Edit3
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';

export default function ServicesPage() {
  const { data: baseData, isLoading: baseLoading } = useOwnerBaseData();
  const { createService, deleteService } = useOwnerMutations();
  
  const services = baseData?.services || [];
  const [newService, setNewService] = useState({ name: '', price: '', duration: '60' });

  if (baseLoading) {
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
          <Scissors size={28} />
        </div>
        <div>
          <p className="text-[#f59e0b] text-[10px] font-black uppercase tracking-[0.4em] mb-1">Catálogo</p>
          <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">Servicios</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Listado de Servicios */}
        <div className="lg:col-span-8 space-y-6">
           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 px-4 italic">Menú Operativo</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((service, idx) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  key={service.id} 
                  className="bg-black/80 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl hover:border-[#f59e0b]/30 transition-all group relative overflow-hidden backdrop-blur-xl"
                >
                   <div className="relative z-10 space-y-8">
                      <div className="flex justify-between items-start">
                         <div className="p-4 bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] rounded-2xl group-hover:bg-[#f59e0b] group-hover:text-black transition-all">
                            <Tag size={20} />
                         </div>
                         <div className="flex gap-2">
                           <button className="p-3 text-white/10 hover:text-[#f59e0b] hover:bg-white/5 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                             <Edit3 size={16} />
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
                                   background: '#0a0a0a',
                                   color: '#fff',
                                 }).then(result => {
                                   if (result.isConfirmed) deleteService.mutate(service.id);
                                 });
                              }}
                              className="p-3 text-white/10 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                           >
                              <Trash size={16} />
                           </button>
                         </div>
                      </div>
                      
                      <div>
                         <h4 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none mb-4">{service.name}</h4>
                         <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-[9px] font-black text-white/40 uppercase tracking-widest">
                               <Clock size={14} className="text-[#f59e0b]" />
                               <span>{service.duration} Minutos</span>
                            </div>
                            <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                            <div className="flex items-center gap-2 text-[9px] font-black text-[#f59e0b] uppercase tracking-widest italic">
                               <DollarSign size={14} />
                               <span>Venta Directa</span>
                            </div>
                         </div>
                      </div>

                      <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                         <p className="text-4xl font-black text-white tracking-tighter italic leading-none">${new Intl.NumberFormat('de-DE').format(service.price)}</p>
                         <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/20 group-hover:border-[#f59e0b]/40 group-hover:text-[#f59e0b] transition-all">
                           <ArrowRight size={14} />
                         </div>
                      </div>
                   </div>
                   <Scissors size={200} className="absolute -bottom-16 -right-16 opacity-[0.02] text-[#f59e0b] -rotate-12 group-hover:scale-110 transition-transform duration-1000" />
                </motion.div>
              ))}
           </div>
        </div>

        {/* Formulario Nuevo Servicio */}
        <div className="lg:col-span-4 space-y-6">
           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 px-4 italic">Gestión de Inventario</h3>
           <div className="bg-black/80 border border-white/10 rounded-[3rem] p-10 shadow-2xl space-y-8 backdrop-blur-xl relative overflow-hidden">
              <div className="space-y-4 relative z-10">
                 <div className="p-4 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-2xl w-fit text-[#f59e0b]">
                    <Plus size={24} />
                 </div>
                 <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Nuevo Servicio</h4>
              </div>

              <div className="space-y-6 relative z-10">
                 <div className="space-y-3">
                    <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-1 italic">Nombre del Servicio</label>
                    <input 
                       type="text" 
                       placeholder="Ej: Corte Degradado"
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-[#f59e0b] transition-all"
                       value={newService.name}
                       onChange={e => setNewService({ ...newService, name: e.target.value })}
                    />
                 </div>

                 <div className="space-y-3">
                    <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-1 italic">Precio al Público ($)</label>
                    <input 
                       type="number" 
                       placeholder="0"
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-xl font-black text-white outline-none focus:border-[#f59e0b] transition-all"
                       value={newService.price}
                       onChange={e => setNewService({ ...newService, price: e.target.value })}
                    />
                 </div>

                 <div className="space-y-3">
                    <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-1 italic">Duración Estimada</label>
                    <div className="relative">
                      <select 
                         className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-[#f59e0b] transition-all appearance-none cursor-pointer"
                         value={newService.duration}
                         onChange={e => setNewService({ ...newService, duration: e.target.value })}
                      >
                         <option value="15">15 Minutos</option>
                         <option value="30">30 Minutos</option>
                         <option value="45">45 Minutos</option>
                         <option value="60">1 Hora</option>
                         <option value="90">1.5 Horas</option>
                         <option value="120">2 Horas</option>
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20"><Clock size={16} /></div>
                    </div>
                 </div>
              </div>

              <button 
                 onClick={() => {
                    if (!newService.name || !newService.price) return toast.error('Completa los campos');
                    createService.mutate({
                       name: newService.name,
                       price: Number(newService.price),
                       duration: Number(newService.duration)
                    }, {
                       onSuccess: () => {
                          toast.success('Servicio creado con éxito');
                          setNewService({ name: '', price: '', duration: '60' });
                       }
                    });
                 }}
                 className="w-full bg-[#f59e0b] text-black py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-amber-500/20 active:scale-95 transition-all relative z-10"
              >
                 Registrar Servicio
              </button>
              <Tag size={200} className="absolute -bottom-20 -right-20 opacity-[0.02] text-[#f59e0b]" />
           </div>
        </div>
      </div>
    </div>
  );
}

function ArrowRight({ size, className }: { size: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M5 12h14m-7-7 7 7-7 7" />
    </svg>
  );
}
