'use client';
import { useOwnerBaseData, useOwnerMutations } from '@/hooks/owner';
import { 
  Calendar, 
  Check, 
  Zap
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Promotion } from '@/types';

interface PromotionFormProps {
  initialData?: Partial<Promotion>;
  isEditing?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PromotionForm({ initialData, isEditing = false, onSuccess, onCancel }: PromotionFormProps) {
  const { data: baseData, isLoading: baseLoading } = useOwnerBaseData();
  const { createPromotion, updatePromotion } = useOwnerMutations();
  
  const services = baseData?.services || [];

  const [isRange, setIsRange] = useState(false);
  
  const [form, setForm] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    discount_type: (initialData?.discount_type as Promotion['discount_type']) || 'percentage',
    discount_value: initialData?.discount_value || 0,
    start_date: initialData?.start_date?.split('T')[0] || new Date().toISOString().split('T')[0],
    end_date: initialData?.end_date?.split('T')[0] || new Date().toISOString().split('T')[0],
    service_ids: initialData?.service_ids || [] as string[],
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        description: initialData.description || '',
        discount_type: (initialData.discount_type as Promotion['discount_type']) || 'percentage',
        discount_value: initialData.discount_value || 0,
        start_date: initialData.start_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        end_date: initialData.end_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        service_ids: initialData.service_ids || [] as string[],
      });
      if (initialData.start_date && initialData.end_date) {
        const start = initialData.start_date.split('T')[0];
        const end = initialData.end_date.split('T')[0];
        setIsRange(start !== end);
      }
    } else {
      setForm({
        name: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        service_ids: []
      });
      setIsRange(false);
    }
  }, [initialData]);

  const toggleService = (id: string) => {
    setForm(prev => ({
      ...prev,
      service_ids: prev.service_ids.includes(id)
        ? prev.service_ids.filter(s => s !== id)
        : [...prev.service_ids, id]
    }));
  };

  const handleSave = () => {
    if (!form.name.trim()) return toast.error('El nombre es obligatorio');
    
    const payload = {
      ...form,
      start_date: new Date(form.start_date + 'T12:00:00').toISOString(),
      end_date: isRange 
        ? new Date(form.end_date + 'T12:00:00').toISOString() 
        : new Date(form.start_date + 'T12:00:00').toISOString(),
    };

    if (isEditing && initialData?.id) {
      updatePromotion.mutate({ ...payload, id: initialData.id }, {
        onSuccess: () => {
          toast.success('Promoción actualizada');
          if (onSuccess) onSuccess();
        },
        onError: (e) => toast.error('Error al actualizar: ' + e.message)
      });
    } else {
      createPromotion.mutate(payload, {
        onSuccess: () => {
          toast.success('Promoción creada');
          if (onSuccess) onSuccess();
        },
        onError: (e) => toast.error('Error al crear: ' + e.message)
      });
    }
  };

  if (baseLoading) return (
    <div className="flex items-center justify-center min-h-[30vh]">
      <div className="w-8 h-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-white/5 rounded-2xl p-6 shadow-xl space-y-6">
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider ml-1">Título de la Oferta</label>
            <input 
              type="text" 
              placeholder="Ej: COMBO BARBA + CORTE"
              className="w-full bg-bg-base border border-white/5 rounded-xl px-4 py-3 text-sm font-semibold text-white uppercase outline-none focus:border-brand transition-all shadow-sm"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider ml-1">Detalles de la Promo</label>
            <textarea 
              placeholder="Explica de qué trata la oferta..."
              rows={3}
              className="w-full bg-bg-base border border-white/5 rounded-xl px-4 py-3 text-sm text-white/80 outline-none focus:border-brand transition-all resize-none shadow-sm"
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider ml-1">Tipo de Descuento</label>
            <div className="flex bg-bg-base p-1.5 rounded-xl border border-white/5">
              {(['percentage', 'fixed', 'free'] as const).map(type => (
                <button 
                  key={type}
                  onClick={() => setForm({...form, discount_type: type})}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${form.discount_type === type ? 'bg-brand text-black shadow-md' : 'text-white/40 hover:text-white'}`}
                >
                  {type === 'percentage' ? '%' : type === 'fixed' ? '$' : 'FREE'}
                </button>
              ))}
            </div>
          </div>

          {form.discount_type !== 'free' && (
            <div className="space-y-2">
              <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider ml-1">Valor</label>
              <input 
                type="number" 
                className="w-full bg-bg-base border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-brand transition-all shadow-sm"
                value={form.discount_value}
                onChange={e => {
                  const val = e.target.value;
                  if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
                    setForm({ ...form, discount_value: Number(val.replace(/^0+/, '')) });
                  } else {
                    setForm({ ...form, discount_value: Number(val) });
                  }
                }}
              />
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-white/5 space-y-4">
          <div className="flex items-center justify-between bg-brand/5 p-4 rounded-xl border border-brand/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand/10 rounded-lg text-brand">
                <Calendar size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-tight">Duración</p>
                <p className="text-[10px] text-brand font-medium uppercase tracking-wider">{isRange ? 'Rango de fechas' : 'Día único'}</p>
              </div>
            </div>
            <button 
              onClick={() => setIsRange(!isRange)}
              className={`w-10 h-5 rounded-full p-1 transition-all duration-300 relative ${isRange ? 'bg-brand' : 'bg-white/10'}`}
            >
              <div className={`w-3 h-3 bg-white rounded-full shadow-md transition-all duration-300 ${isRange ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider ml-1">{isRange ? 'Fecha Inicio' : 'Fecha del Evento'}</label>
              <input 
                type="date" 
                className="w-full bg-bg-base border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-medium outline-none focus:border-brand transition-all shadow-sm"
                value={form.start_date}
                onChange={e => setForm({...form, start_date: e.target.value})}
              />
            </div>
            {isRange && (
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider ml-1">Fecha Fin</label>
                <input 
                  type="date" 
                  className="w-full bg-bg-base border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-medium outline-none focus:border-brand transition-all shadow-sm"
                  value={form.end_date}
                  onChange={e => setForm({...form, end_date: e.target.value})}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-surface border border-white/5 rounded-2xl p-6 text-white space-y-4 relative overflow-hidden shadow-xl">
        <div className="relative z-10">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-1">Servicios</h3>
          <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider mb-4">¿A qué servicios aplica esta promo?</p>
          
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
            {services.length === 0 ? (
              <p className="text-white/30 text-xs italic">No tienes servicios configurados.</p>
            ) : (
              services.map(s => {
                const isSelected = form.service_ids.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleService(s.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${isSelected ? 'bg-brand/10 border-brand/20 text-brand' : 'bg-bg-base border-white/5 hover:border-white/10 text-white/60'}`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-tight">{s.name}</span>
                    {isSelected ? <Check size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-white/10" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
        <Zap size={80} className="absolute -bottom-6 -right-6 text-brand/5 rotate-12" />
      </div>

      <div className="flex gap-4">
        {onCancel && (
          <button 
            onClick={onCancel}
            className="flex-1 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all"
          >
            Cancelar
          </button>
        )}
        <button 
          onClick={handleSave}
          disabled={createPromotion.isPending || updatePromotion.isPending}
          className="flex-1 bg-brand text-black py-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isEditing ? 'Guardar Cambios' : 'Guardar Promoción'}
          <Zap size={14} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
