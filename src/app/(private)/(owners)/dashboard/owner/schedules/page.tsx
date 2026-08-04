'use client';
import { useOwnerBaseData } from '@/hooks/owner';
import {
  Clock,
  Trash,
  Settings,
  ArrowRight,
  ChevronRight,
  Check,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

export default function SchedulesPage() {
  const { data: baseData, isLoading: baseLoading, refetch } = useOwnerBaseData();
  const [formShopSettings, setFormShopSettings] = useState({ accounting_period: 'monthly' });

  useEffect(() => {
    if (baseData?.shopSettings) {
      setFormShopSettings({ accounting_period: baseData.shopSettings.accounting_period || 'monthly' });
    }
  }, [baseData]);

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

  const updateShopSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('shop_settings').update(formShopSettings).eq('id', 1);
    if (error) toast.error('Error al actualizar configuración');
    else toast.success('Configuración actualizada');
  };

  if (baseLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-32">


      <div className="space-y-6">
        <h3 className="text-xs font-medium uppercase tracking-[0.1em] text-white/40 px-2">Días de Operación</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {businessHours.map((slot: { id: string; day_of_week: number; opening_time: string; closing_time: string; is_closed: boolean }) => (
            <div
              key={slot.id}
              className="bg-surface border border-white/5 p-6 rounded-2xl flex flex-col gap-6 transition-all group relative hover:border-white/10 hover:shadow-xl hover:shadow-brand/5"
            >
              <div className="flex justify-between items-start">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm tracking-wider uppercase ${!slot.is_closed ? 'bg-brand/10 text-brand border border-brand/20' : 'bg-bg-base text-white/20 border border-white/5'}`}>
                  {daysMap[slot.day_of_week]?.substring(0, 3)}
                </div>

                <button
                  onClick={() => updateHour(slot.id, 'is_closed', !slot.is_closed)}
                  className={`px-3 py-1.5 text-xs font-medium border transition-all rounded-lg flex items-center gap-1.5 ${slot.is_closed ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20' : 'border-red-500/20 text-red-500 bg-red-500/10 hover:bg-red-500/20'}`}
                >
                  {slot.is_closed ? <><Check size={14} /> Abrir</> : <><X size={14} /> Cerrar</>}
                </button>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-white tracking-tight">{daysMap[slot.day_of_week]}</h4>
                <p className={`text-xs font-medium uppercase tracking-wider mt-1 ${!slot.is_closed ? 'text-emerald-500/60' : 'text-white/20'}`}>
                  {!slot.is_closed ? 'Abierto para reservas' : 'Local Cerrado'}
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 mt-auto">
                {!slot.is_closed ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 bg-bg-base border border-white/5 rounded-xl px-4 py-2 justify-between group-hover:border-white/10 transition-all">
                      <span className="text-[9px] uppercase font-bold text-white/40">Abre</span>
                      <input
                        type="time"
                        className="bg-transparent text-sm font-semibold text-white outline-none [color-scheme:dark]"
                        value={slot.opening_time}
                        onChange={e => updateHour(slot.id, 'opening_time', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-3 bg-bg-base border border-white/5 rounded-xl px-4 py-2 justify-between group-hover:border-white/10 transition-all">
                      <span className="text-[9px] uppercase font-bold text-white/40">Cierra</span>
                      <input
                        type="time"
                        className="bg-transparent text-sm font-semibold text-white outline-none [color-scheme:dark]"
                        value={slot.closing_time}
                        onChange={e => updateHour(slot.id, 'closing_time', e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-full text-center py-4 border border-dashed border-white/10 rounded-xl">
                    <p className="text-white/30 text-xs font-medium uppercase">Día Libre</p>
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
