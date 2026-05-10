'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useBarberAgenda } from '@/hooks/useBarberData';
import { 
  Plus, 
  Clock, 
  Activity,
  X
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Service } from '@/types';
import { useQueryClient } from '@tanstack/react-query';

export default function BarberDashboardPage() {
  const params = useParams();
  const barberId = params.id as string;
  const queryClient = useQueryClient();
  const [showWalkinForm, setShowWalkinForm] = useState(false);
  const [clientName, setClientName] = useState('Cliente Walk-in');
  const [selectedWalkinServices, setSelectedWalkinServices] = useState<Service[]>([]);
  const [services, setServices] = useState<Service[]>([]);

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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="space-y-1">
         <p className="text-[#f59e0b] text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em]">Mi Actividad</p>
         <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter italic leading-none text-white">Resumen de Hoy</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-black/40 border border-white/5 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 space-y-6">
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#f59e0b]">Citas Agendadas</span>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-[#f59e0b] rounded-2xl flex items-center justify-center text-black font-black text-lg md:text-xl italic">
                    {todayApts.length}
                  </div>
               </div>

               {pendingApts.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4 animate-pulse">
                     <Clock size={18} className="text-amber-500" />
                     <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Tienes {pendingApts.length} citas por aprobar</p>
                  </div>
               )}

               <div className="space-y-3 pt-4 border-t border-white/5">
                  {todayApts.slice(0, 3).map(apt => (
                    <div key={apt.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                       <span className="text-xs font-black uppercase text-white truncate max-w-[150px]">{apt.client?.name || apt.client_name}</span>
                       <span className="text-[#f59e0b] text-[11px] font-black italic">{format(new Date(apt.start_time), 'HH:mm')}</span>
                    </div>
                  ))}
                  {todayApts.length === 0 && (
                    <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest text-center py-6">Sin citas hoy</p>
                  )}
               </div>
            </div>
            <Activity size={200} className="absolute -bottom-16 -right-16 opacity-5 text-white group-hover:scale-110 transition-transform duration-1000" />
         </div>

         <div className="flex flex-col gap-6">
            <button 
              onClick={() => setShowWalkinForm(true)}
              className="flex-1 bg-[#f59e0b] text-black rounded-[2.5rem] p-6 md:p-10 flex flex-col items-center justify-center gap-4 group hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-amber-500/10"
            >
               <div className="p-3 md:p-4 bg-black rounded-3xl group-hover:rotate-12 transition-transform">
                  <Plus size={24} className="text-[#f59e0b]" />
               </div>
               <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.3em]">Registrar Venta Rápida</span>
            </button>
            
            <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Próximo Turno</p>
                  <p className="text-lg font-black text-white uppercase italic">
                    {todayApts.find(a => new Date(a.start_time) > new Date())?.client?.name || 'Libre'}
                  </p>
               </div>
               <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white/20">
                  <Clock size={24} />
               </div>
            </div>
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
