'use client';
import { useOwnerBaseData } from '@/hooks/useOwnerData';
import { 
  Clock, 
  Trash, 
  Settings,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function SchedulesPage() {
  const { data: baseData, isLoading: baseLoading, refetch } = useOwnerBaseData();
  const [formShopSettings, setFormShopSettings] = useState({ accounting_period: 'monthly' });

  const businessHours = baseData?.businessHours || [];
  const daysMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const updateHour = async (id: string, field: string, value: string) => {
    const { error } = await supabase.from('business_hours').update({ [field]: value }).eq('id', id);
    if (error) toast.error('Error al actualizar');
    else {
      toast.success('Horario actualizado');
      refetch();
    }
  };

  const deleteBusinessHour = async (id: string) => {
    const { error } = await supabase.from('business_hours').delete().eq('id', id);
    if (error) toast.error('Error al eliminar');
    else {
      toast.success('Horario eliminado');
      refetch();
    }
  };

  const updateShopSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('shop_settings').update(formShopSettings).eq('id', 1);
    if (error) toast.error('Error al actualizar configuración');
    else toast.success('Configuración actualizada');
  };

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
          <Clock size={28} />
        </div>
        <div>
          <p className="text-[#f59e0b] text-[10px] font-black uppercase tracking-[0.4em] mb-1">Operatividad</p>
          <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">Horarios</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 px-4">Días de Operación</h3>
           <div className="flex flex-col -space-y-px">
              {businessHours.map((slot: { id: string; day_of_week: number; opening_time: string; closing_time: string; is_closed: boolean }, idx: number) => (
                 <div 
                   key={slot.id} 
                   className={`
                     bg-black/80 border border-white/10 p-5 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-all group relative z-10 hover:z-20
                     ${idx === 0 ? 'rounded-t-[2.5rem]' : ''}
                     ${idx === businessHours.length - 1 ? 'rounded-b-[2.5rem]' : ''}
                   `}
                 >
                    <div className="flex items-center gap-6">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xs uppercase tracking-widest ${!slot.is_closed ? 'bg-[#f59e0b] text-black shadow-lg shadow-amber-500/10' : 'bg-white/5 text-white/20 border border-white/5'}`}>
                          {daysMap[slot.day_of_week]?.substring(0, 3)}
                       </div>
                       <div>
                          <h4 className="text-lg font-black text-white uppercase tracking-tight italic">{daysMap[slot.day_of_week]}</h4>
                          <p className={`text-[8px] font-black uppercase tracking-widest mt-1 ${!slot.is_closed ? 'text-emerald-500' : 'text-white/20'}`}>
                            {!slot.is_closed ? 'Abierto para reservas' : 'Local Cerrado'}
                          </p>
                       </div>
                    </div>

                    <div className="flex items-center gap-6">
                       <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-6 py-3 group-hover:border-[#f59e0b]/40 transition-all">
                          <input 
                             type="time" 
                             className="bg-transparent text-sm font-black text-white outline-none [color-scheme:dark]"
                             value={slot.opening_time} 
                             onChange={e => updateHour(slot.id, 'opening_time', e.target.value)}
                          />
                          <ArrowRight size={14} className="text-white/20" />
                          <input 
                             type="time" 
                             className="bg-transparent text-sm font-black text-white outline-none [color-scheme:dark]"
                             value={slot.closing_time} 
                             onChange={e => updateHour(slot.id, 'closing_time', e.target.value)}
                          />
                       </div>
                       <button 
                          onClick={() => deleteBusinessHour(slot.id)}
                          className="p-3 text-white/10 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                       >
                          <Trash size={16} />
                       </button>
                    </div>
                 </div>
              ))}
           </div>
        </div>

        <div className="space-y-6">
           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 px-4">Configuración General</h3>
           <form onSubmit={updateShopSettings} className="bg-black/80 border border-white/10 rounded-[3rem] p-10 shadow-2xl space-y-10 backdrop-blur-xl relative overflow-hidden">
              <div className="space-y-4 relative z-10">
                 <div className="p-4 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-2xl w-fit text-[#f59e0b]">
                    <Settings size={24} />
                 </div>
                 <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">Preferencias</h4>
              </div>

              <div className="space-y-8 relative z-10">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Ciclo de Liquidación</label>
                    <div className="relative">
                      <select 
                         className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-[#f59e0b] transition-all appearance-none cursor-pointer"
                         value={formShopSettings.accounting_period}
                         onChange={e => setFormShopSettings({ ...formShopSettings, accounting_period: e.target.value })}
                      >
                         <option value="monthly">Mensual</option>
                         <option value="weekly">Semanal</option>
                         <option value="biweekly">Quincenal</option>
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20"><ChevronRight size={16} className="rotate-90" /></div>
                    </div>
                    <p className="text-[8px] font-black text-white/10 uppercase tracking-widest px-1">Define cada cuánto se cierran las cuentas automáticamente</p>
                 </div>
              </div>

              <button 
                 type="submit"
                 className="w-full bg-[#f59e0b] text-black py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-amber-500/20 active:scale-95 transition-all relative z-10"
              >
                 Guardar Configuración
              </button>
              <Settings size={200} className="absolute -bottom-20 -right-20 opacity-[0.02] text-[#f59e0b]" />
           </form>
        </div>
      </div>
    </div>
  );
}
