'use client';
import { useOwnerBaseData } from '@/hooks/useOwnerData';
import { 
  Clock, 
  Trash, 
  Settings
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
        <div className="w-8 h-8 border-4 border-[#0061ff] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm text-[#0061ff]">
          <Clock size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 uppercase">Horarios de Atención</h2>
          <p className="text-[11px] text-gray-500 font-medium tracking-wider">Configuración de disponibilidad del local</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
           <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest px-2">Días de Operación</h3>
           <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="divide-y divide-gray-50">
                 {businessHours.map((slot: { id: string; day_of_week: number; opening_time: string; closing_time: string; is_closed: boolean }) => (
                    <div key={slot.id} className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-gray-50/50 transition-all group">
                       <div className="flex items-center gap-6">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs uppercase tracking-widest ${!slot.is_closed ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-400 border border-red-100'}`}>
                             {daysMap[slot.day_of_week]?.substring(0, 3)}
                          </div>
                          <div>
                             <h4 className="text-base font-black text-gray-900 uppercase tracking-tight">{daysMap[slot.day_of_week]}</h4>
                             <p className={`text-[10px] font-bold uppercase tracking-widest ${!slot.is_closed ? 'text-emerald-500' : 'text-red-400'}`}>{!slot.is_closed ? 'Abierto' : 'Cerrado'}</p>
                          </div>
                       </div>

                       <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2">
                             <input 
                                type="time" 
                                className="bg-transparent text-xs font-black text-gray-900 outline-none"
                                value={slot.opening_time} 
                                onChange={e => updateHour(slot.id, 'opening_time', e.target.value)}
                             />
                             <span className="text-[10px] font-bold text-gray-300">A</span>
                             <input 
                                type="time" 
                                className="bg-transparent text-xs font-black text-gray-900 outline-none"
                                value={slot.closing_time} 
                                onChange={e => updateHour(slot.id, 'closing_time', e.target.value)}
                             />
                          </div>
                          <button 
                             onClick={() => deleteBusinessHour(slot.id)}
                             className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                             <Trash size={16} />
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="space-y-8">
           <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest px-2">Configuración General</h3>
           <form onSubmit={updateShopSettings} className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm space-y-8">
              <div className="space-y-4">
                 <div className="p-3 bg-blue-50/50 rounded-2xl w-fit text-[#0061ff]">
                    <Settings size={24} />
                 </div>
                 <h4 className="text-lg font-black text-gray-900 uppercase">Preferencias</h4>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Ciclo de Liquidación</label>
                    <select 
                       className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest outline-none focus:border-[#0061ff] focus:bg-white transition-all appearance-none cursor-pointer"
                       value={formShopSettings.accounting_period}
                       onChange={e => setFormShopSettings({ ...formShopSettings, accounting_period: e.target.value })}
                    >
                       <option value="monthly">Mensual</option>
                       <option value="weekly">Semanal</option>
                       <option value="biweekly">Quincenal</option>
                    </select>
                 </div>
              </div>

              <button 
                 type="submit"
                 className="w-full bg-[#0061ff] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/20 active:scale-95 transition-all mt-4"
              >
                 Guardar Cambios
              </button>
           </form>
        </div>
      </div>
    </div>
  );
}
