'use client';
import { useOwnerBaseData } from '@/hooks/owner';
import {
  Check,
  X,
  Clock
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function SchedulesPage() {
  const { data: baseData, isLoading: baseLoading, refetch } = useOwnerBaseData();

  const businessHours = baseData?.businessHours || [];
  const daysMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const updateHour = async (id: string, field: string, value: string | boolean) => {
    const { error } = await supabase.from('business_hours').update({ [field]: value }).eq('id', id);
    if (error) toast.error('Error al actualizar');
    else {
      toast.success('Horario actualizado');
      refetch();
    }
  };


  if (baseLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-erp-primary/20 border-t-erp-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-32 font-sans">

      {/* HEADER ERP */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-erp-bg border border-erp-border p-6 rounded-2xl shadow-sm">
         <div className="flex items-center gap-5">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 shadow-sm shrink-0">
               <Clock size={24} />
            </div>
            <div>
               <h2 className="text-2xl font-black text-erp-text tracking-tight uppercase">Horarios de Operación</h2>
               <p className="text-sm font-medium text-erp-text-muted mt-0.5">Configura los días y horas que el local está abierto</p>
            </div>
         </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-erp-text-muted px-2">Calendario Semanal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {businessHours.map((slot: { id: string; day_of_week: number; opening_time: string; closing_time: string; is_closed: boolean }) => (
            <div
              key={slot.id}
              className="bg-erp-surface border border-erp-border p-6 rounded-2xl flex flex-col gap-6 transition-all group relative hover:border-erp-primary/30 hover:shadow-xl"
            >
              <div className="flex justify-between items-start">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm tracking-wider uppercase shadow-sm ${!slot.is_closed ? 'bg-erp-primary/10 text-erp-primary border border-erp-primary/20' : 'bg-erp-bg text-erp-text-muted border border-erp-border'}`}>
                  {daysMap[slot.day_of_week]?.substring(0, 3)}
                </div>

                <button
                  onClick={() => updateHour(slot.id, 'is_closed', !slot.is_closed)}
                  className={`px-3 py-1.5 text-xs font-black border transition-all rounded-lg flex items-center gap-1.5 uppercase tracking-wider shadow-sm ${slot.is_closed ? 'border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100'}`}
                >
                  {slot.is_closed ? <><Check size={14} /> Abrir</> : <><X size={14} /> Cerrar</>}
                </button>
              </div>

              <div>
                <h4 className="text-xl font-black text-erp-text tracking-tight uppercase">{daysMap[slot.day_of_week]}</h4>
                <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${!slot.is_closed ? 'text-emerald-600' : 'text-erp-text-muted'}`}>
                  {!slot.is_closed ? 'Abierto para reservas' : 'Local Cerrado'}
                </p>
              </div>

              <div className="pt-4 border-t border-erp-border mt-auto">
                {!slot.is_closed ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 bg-erp-bg border border-erp-border rounded-xl px-4 py-2.5 justify-between focus-within:border-erp-primary/50 transition-all shadow-sm">
                      <span className="text-[10px] uppercase font-black tracking-widest text-erp-text-muted">Abre</span>
                      <input
                        type="time"
                        className="bg-transparent text-sm font-bold text-erp-text outline-none"
                        value={slot.opening_time}
                        onChange={e => updateHour(slot.id, 'opening_time', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-3 bg-erp-bg border border-erp-border rounded-xl px-4 py-2.5 justify-between focus-within:border-erp-primary/50 transition-all shadow-sm">
                      <span className="text-[10px] uppercase font-black tracking-widest text-erp-text-muted">Cierra</span>
                      <input
                        type="time"
                        className="bg-transparent text-sm font-bold text-erp-text outline-none"
                        value={slot.closing_time}
                        onChange={e => updateHour(slot.id, 'closing_time', e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-full text-center py-5 border border-dashed border-erp-border bg-erp-bg rounded-xl">
                    <p className="text-erp-text-muted text-xs font-bold uppercase tracking-widest">Día Libre</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
