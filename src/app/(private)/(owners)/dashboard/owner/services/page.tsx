'use client';
import { useOwnerBaseData, useOwnerMutations } from '@/hooks/useOwnerData';
import { 
  Scissors, 
  Trash, 
  Clock, 
  DollarSign,
  Tag
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

export default function ServicesPage() {
  const { data: baseData, isLoading: baseLoading } = useOwnerBaseData();
  const { createService, deleteService } = useOwnerMutations();
  
  const services = baseData?.services || [];
  const [newService, setNewService] = useState({ name: '', price: '', duration: '60' });

  if (baseLoading) {
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
          <Scissors size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 uppercase">Menú de Servicios</h2>
          <p className="text-[11px] text-gray-500 font-medium tracking-wider">Catálogo operativo y lista de precios</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Listado de Servicios */}
        <div className="lg:col-span-2 space-y-8">
           <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest px-2">Servicios Activos</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map(service => (
                <div key={service.id} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:border-[#0061ff]/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all group relative overflow-hidden">
                   <div className="relative z-10 space-y-6">
                      <div className="flex justify-between items-start">
                         <div className="p-3 bg-blue-50 text-[#0061ff] rounded-2xl group-hover:bg-[#0061ff] group-hover:text-white transition-all">
                            <Tag size={20} />
                         </div>
                         <button 
                            onClick={() => {
                               Swal.fire({
                                 title: '¿Eliminar servicio?',
                                 text: 'Esta acción no se puede deshacer.',
                                 icon: 'warning',
                                 showCancelButton: true,
                                 confirmButtonColor: '#ef4444',
                                 confirmButtonText: 'Eliminar'
                               }).then(result => {
                                 if (result.isConfirmed) deleteService.mutate(service.id);
                               });
                            }}
                            className="p-3 text-gray-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                         >
                            <Trash size={18} />
                         </button>
                      </div>
                      
                      <div>
                         <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-1">{service.name}</h4>
                         <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                               <Clock size={12} />
                               <span>{service.duration} min</span>
                            </div>
                            <div className="w-1 h-1 bg-gray-200 rounded-full" />
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-[#0061ff] uppercase tracking-widest">
                               <DollarSign size={12} />
                               <span>Venta Directa</span>
                            </div>
                         </div>
                      </div>

                      <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                         <p className="text-3xl font-black text-gray-900 tracking-tighter italic">${new Intl.NumberFormat('de-DE').format(service.price)}</p>
                         <button className="text-[10px] font-black text-[#0061ff] uppercase tracking-widest hover:underline">Editar</button>
                      </div>
                   </div>
                   <Scissors size={200} className="absolute -bottom-16 -right-16 opacity-[0.02] text-blue-500 group-hover:scale-110 transition-transform duration-1000" />
                </div>
              ))}
           </div>
        </div>

        {/* Formulario Nuevo Servicio */}
        <div className="space-y-8">
           <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest px-2">Nuevo Servicio</h3>
           <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nombre del Servicio</label>
                 <input 
                    type="text" 
                    placeholder="Ej: Corte Degradado"
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-black uppercase outline-none focus:border-[#0061ff] focus:bg-white transition-all"
                    value={newService.name}
                    onChange={e => setNewService({ ...newService, name: e.target.value })}
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Precio al Público ($)</label>
                 <input 
                    type="number" 
                    placeholder="0"
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-black outline-none focus:border-[#0061ff] focus:bg-white transition-all"
                    value={newService.price}
                    onChange={e => setNewService({ ...newService, price: e.target.value })}
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Duración (Minutos)</label>
                 <select 
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-black outline-none focus:border-[#0061ff] focus:bg-white transition-all appearance-none cursor-pointer"
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
                          toast.success('Servicio creado');
                          setNewService({ name: '', price: '', duration: '60' });
                       }
                    });
                 }}
                 className="w-full bg-[#0061ff] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/20 active:scale-95 transition-all mt-4"
              >
                 Crear Servicio
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
