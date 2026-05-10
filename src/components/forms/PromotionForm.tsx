'use client';
import { useOwnerBaseData, useOwnerMutations } from '@/hooks/useOwnerData';
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
}

export function PromotionForm({ initialData, isEditing = false }: PromotionFormProps) {
  const router = useRouter();
  const { data: baseData, isLoading: baseLoading } = useOwnerBaseData();
  const { createPromotion, updatePromotion } = useOwnerMutations();
  
  const services = baseData?.services || [];

  // Estado del Switch (Día Único vs Rango)
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

  // Detectar si los datos iniciales son un rango al cargar para edición
  useEffect(() => {
    if (initialData?.start_date && initialData?.end_date) {
      const start = initialData.start_date.split('T')[0];
      const end = initialData.end_date.split('T')[0];
      if (start !== end) setIsRange(true);
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
          router.push('/dashboard/owner/promotions');
        }
      });
    } else {
      createPromotion.mutate(payload, {
        onSuccess: () => {
          toast.success('Promoción creada');
          router.push('/dashboard/owner/promotions');
        }
      });
    }
  };

  if (baseLoading) return <div className="p-20 text-center text-gray-400">Cargando...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
      {/* Columna Formulario */}
      <div className="lg:col-span-3 space-y-8">
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm space-y-8">
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Título de la Oferta</label>
              <input 
                type="text" 
                placeholder="Ej: COMBO BARBA + CORTE"
                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-black uppercase outline-none focus:border-[#0061ff] focus:bg-white transition-all shadow-sm"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Detalles de la Promo</label>
              <textarea 
                placeholder="Explica de qué trata la oferta..."
                rows={2}
                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-medium outline-none focus:border-[#0061ff] focus:bg-white transition-all resize-none"
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-8 border-t border-gray-50 grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Descuento</label>
              <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                {(['percentage', 'fixed', 'free'] as const).map(type => (
                  <button 
                    key={type}
                    onClick={() => setForm({...form, discount_type: type})}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${form.discount_type === type ? 'bg-[#0061ff] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {type === 'percentage' ? '%' : type === 'fixed' ? '$' : 'FREE'}
                  </button>
                ))}
              </div>
            </div>

            {form.discount_type !== 'free' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Valor</label>
                <input 
                  type="number" 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-3.5 text-sm font-black outline-none focus:border-[#0061ff] transition-all"
                  value={form.discount_value}
                  onChange={e => setForm({...form, discount_value: Number(e.target.value)})}
                />
              </div>
            )}
          </div>

          <div className="pt-8 border-t border-gray-50 space-y-6">
            <div className="flex items-center justify-between bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl text-[#0061ff] shadow-sm">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Duración</p>
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{isRange ? 'Rango de fechas' : 'Día único'}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsRange(!isRange)}
                className={`w-14 h-8 rounded-full p-1 transition-all duration-300 relative ${isRange ? 'bg-[#0061ff]' : 'bg-gray-200'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${isRange ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{isRange ? 'Fecha Inicio' : 'Fecha del Evento'}</label>
                <input 
                  type="date" 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-black outline-none focus:border-[#0061ff] transition-all"
                  value={form.start_date}
                  onChange={e => setForm({...form, start_date: e.target.value})}
                />
              </div>
              {isRange && (
                <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fecha Fin</label>
                  <input 
                    type="date" 
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-black outline-none focus:border-[#0061ff] transition-all"
                    value={form.end_date}
                    onChange={e => setForm({...form, end_date: e.target.value})}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Columna Servicios */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white space-y-8 relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <h3 className="text-sm font-black uppercase tracking-widest mb-1">Servicios</h3>
            <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest mb-6">¿A qué servicios aplica esta promo?</p>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {services.map(s => {
                const isSelected = form.service_ids.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleService(s.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${isSelected ? 'bg-[#0061ff] border-[#0061ff]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                  >
                    <span className="text-[11px] font-black uppercase tracking-tight">{s.name}</span>
                    {isSelected ? <Check size={16} /> : <div className="w-4 h-4 rounded-full border border-white/10" />}
                  </button>
                );
              })}
            </div>
          </div>
          <Zap size={150} className="absolute -bottom-10 -right-10 text-white/[0.03] rotate-12" />
        </div>

        <button 
          onClick={handleSave}
          disabled={createPromotion.isPending || updatePromotion.isPending}
          className="w-full bg-[#0061ff] text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          {isEditing ? 'Guardar Cambios' : 'Activar Promoción'}
          <Zap size={16} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
