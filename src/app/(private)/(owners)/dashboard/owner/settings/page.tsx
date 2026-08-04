'use client';
import { useOwnerBaseData } from '@/hooks/owner';
import { 
  Settings,
  ChevronRight,
  Check
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { data: baseData, isLoading: baseLoading } = useOwnerBaseData();
  const [formShopSettings, setFormShopSettings] = useState({ accounting_period: 'monthly' });

  useEffect(() => {
    if (baseData?.shopSettings) {
      setFormShopSettings({ accounting_period: baseData.shopSettings.accounting_period || 'monthly' });
    }
  }, [baseData]);

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
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-32">
      <div className="flex items-center gap-5">
        <div className="p-4 bg-surface border border-white/5 rounded-2xl shadow-xl text-brand">
          <Settings size={28} />
        </div>
        <div>
          <p className="text-brand text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Administración</p>
          <h2 className="text-3xl font-bold tracking-tight text-white uppercase">Configuraciones</h2>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 px-2 flex items-center gap-2">
          <Settings size={12} className="text-brand" /> Configuración General
        </h3>
        
        <form onSubmit={updateShopSettings} className="bg-surface border border-white/5 rounded-2xl p-8 shadow-xl space-y-8 max-w-2xl">
          <div className="flex items-center gap-4 border-b border-white/5 pb-6">
              <div className="p-3 bg-brand/10 border border-brand/20 rounded-xl text-brand">
                <Settings size={20} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white uppercase tracking-tight">Preferencias</h4>
                <p className="text-[10px] font-medium text-brand uppercase tracking-widest mt-1">Ajustes del local</p>
              </div>
          </div>

          <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider ml-1">Ciclo de Liquidación</label>
                <div className="relative">
                  <select 
                      className="w-full bg-bg-base border border-white/5 rounded-xl px-4 py-4 text-sm text-white outline-none focus:border-brand transition-all appearance-none cursor-pointer font-medium uppercase tracking-wider"
                      value={formShopSettings.accounting_period}
                      onChange={e => setFormShopSettings({ ...formShopSettings, accounting_period: e.target.value })}
                  >
                      <option value="monthly">Mensual</option>
                      <option value="weekly">Semanal</option>
                      <option value="biweekly">Quincenal</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40"><ChevronRight size={16} className="rotate-90" /></div>
                </div>
                <p className="text-[10px] font-medium text-white/40 mt-2 px-1 leading-relaxed">
                  Define cada cuánto tiempo se cierran las cuentas automáticamente para el cálculo de los pagos a barberos.
                </p>
              </div>
          </div>

          <div className="pt-4">
              <button 
                type="submit"
                className="w-full sm:w-auto bg-brand text-black px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                GUARDAR CAMBIOS
                <Check size={14} />
              </button>
          </div>
        </form>
      </div>
    </div>
  );
}
