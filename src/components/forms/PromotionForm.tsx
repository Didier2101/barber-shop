'use client';
import { useOwnerBaseData, useOwnerMutations } from '@/hooks/owner';
import {
  Calendar,
  Check,
  } from 'lucide-react';
import { useState, useEffect } from 'react';
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
      <div className="w-8 h-8 border-4 border-erp-primary/20 border-t-erp-primary rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6 h-full flex flex-col justify-between">
      <div className="space-y-8">
        {/* INFO BÁSICA */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-erp-text-muted uppercase tracking-widest ml-1">Título de la Oferta</label>
            <input
              type="text"
              placeholder="Ej: COMBO BARBA + CORTE"
              className="w-full bg-erp-surface border border-erp-border rounded-xl px-4 py-3 text-sm font-bold text-erp-text uppercase outline-none focus:border-erp-primary/50 transition-all shadow-sm"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-erp-text-muted uppercase tracking-widest ml-1">Detalles de la Promo</label>
            <textarea
              placeholder="Explica de qué trata la oferta..."
              rows={3}
              className="w-full bg-erp-surface border border-erp-border rounded-xl px-4 py-3 text-sm text-erp-text outline-none focus:border-erp-primary/50 transition-all resize-none shadow-sm"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>

        {/* TIPO Y VALOR */}
        <div className="pt-6 border-t border-erp-border grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-erp-text-muted uppercase tracking-widest ml-1">Tipo de Descuento</label>
            <div className="flex bg-erp-surface p-1.5 rounded-xl border border-erp-border">
              {(['percentage', 'fixed', 'free'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setForm({ ...form, discount_type: type })}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${form.discount_type === type ? 'bg-erp-primary text-white shadow-sm' : 'text-erp-text-muted hover:text-erp-text'}`}
                >
                  {type === 'percentage' ? '%' : type === 'fixed' ? '$' : 'GRATIS'}
                </button>
              ))}
            </div>
          </div>

          {form.discount_type !== 'free' && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-erp-text-muted uppercase tracking-widest ml-1">Valor</label>
              <input
                type="number"
                min="0"
                className="w-full bg-erp-surface border border-erp-border rounded-xl px-4 py-3 text-sm font-bold text-erp-text outline-none focus:border-erp-primary/50 transition-all shadow-sm"
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

        {/* FECHAS */}
        <div className="pt-6 border-t border-erp-border space-y-4">
          <div className="flex items-center justify-between bg-erp-surface p-4 rounded-xl border border-erp-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-erp-bg border border-erp-border rounded-lg text-erp-primary">
                <Calendar size={16} />
              </div>
              <div>
                <p className="text-xs font-black text-erp-text uppercase tracking-tight">Duración</p>
                <p className="text-[10px] text-erp-text-muted font-bold uppercase tracking-wider">{isRange ? 'Rango de fechas' : 'Día único'}</p>
              </div>
            </div>
            <button
              onClick={() => setIsRange(!isRange)}
              className={`w-10 h-5 rounded-full p-1 transition-all duration-300 relative shadow-sm ${isRange ? 'bg-erp-primary' : 'bg-erp-border'}`}
            >
              <div className={`w-3 h-3 bg-white rounded-full shadow-md transition-all duration-300 ${isRange ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-erp-text-muted uppercase tracking-widest ml-1">{isRange ? 'Fecha Inicio' : 'Fecha del Evento'}</label>
              <input
                type="date"
                className="w-full bg-erp-surface border border-erp-border rounded-xl px-4 py-3 text-sm text-erp-text font-bold outline-none focus:border-erp-primary/50 transition-all shadow-sm"
                value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            {isRange && (
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                <label className="text-[10px] font-bold text-erp-text-muted uppercase tracking-widest ml-1">Fecha Fin</label>
                <input
                  type="date"
                  className="w-full bg-erp-surface border border-erp-border rounded-xl px-4 py-3 text-sm text-erp-text font-bold outline-none focus:border-erp-primary/50 transition-all shadow-sm"
                  value={form.end_date}
                  onChange={e => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
            )}
          </div>
        </div>

        {/* SERVICIOS ASOCIADOS */}
        <div className="pt-6 border-t border-erp-border space-y-4">
          <div className="relative z-10">
            <h3 className="text-xs font-black uppercase tracking-widest mb-1 text-erp-text">Servicios Involucrados</h3>
            <p className="text-[10px] text-erp-text-muted font-bold uppercase tracking-wider mb-4">¿A qué servicios aplica esta promo?</p>

            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {services.length === 0 ? (
                <p className="text-erp-text-muted text-xs italic font-medium">No tienes servicios configurados.</p>
              ) : (
                services.map(s => {
                  const isSelected = form.service_ids.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleService(s.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all shadow-sm ${isSelected ? 'bg-erp-primary/10 border-erp-primary/30 text-erp-primary' : 'bg-erp-surface border-erp-border hover:border-erp-primary/30 text-erp-text-muted'}`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-tight">{s.name}</span>
                      {isSelected ? <Check size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-erp-border bg-erp-bg" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="pt-6 mt-6 border-t border-erp-border flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 py-4 bg-erp-surface border border-erp-border text-erp-text rounded-xl text-xs font-black uppercase tracking-widest hover:border-erp-primary/30 transition-all shadow-sm"
          >
            Cancelar
          </button>
        )}
        <button
          onClick={handleSave}
          className="flex-1 py-4 bg-erp-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-sm hover:opacity-90 transition-all"
        >
          {isEditing ? 'Guardar' : 'Crear Promo'}
        </button>
      </div>
    </div>
  );
}
