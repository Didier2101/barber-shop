'use client';
import { useOwnerBaseData, useOwnerMutations } from '@/hooks/owner';
import { 
  Gift, 
  Trash, 
  Clock,
  Edit,
  Tag,
  Plus,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import Swal from 'sweetalert2';
import { PromotionForm } from '@/components/forms/PromotionForm';
import { useState } from 'react';
import { Promotion } from '@/types';

export default function PromotionsPage() {
  const { data: baseData, isLoading: baseLoading } = useOwnerBaseData();
  const { updateLoyalty, deletePromotion } = useOwnerMutations();
  
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const promotions = baseData?.promotions || [];
  const loyaltySettings = baseData?.loyaltySettings || { appointments_threshold: 10, is_enabled: true };

  if (baseLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleEdit = (promo: Promotion) => {
    setIsCreating(false);
    setSelectedPromo(promo);
  };

  const handleNew = () => {
    setSelectedPromo(null);
    setIsCreating(true);
  };

  const closeForm = () => {
    setSelectedPromo(null);
    setIsCreating(false);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-8xl mx-auto pb-32">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LADO IZQUIERDO: Fidelización y Lista de Promociones */}
        <div className="lg:col-span-6 space-y-8">
          
          {/* FIDELIZACIÓN */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 px-2 flex items-center gap-2">
              <Gift size={12} className="text-brand" /> Programa de Fidelización
            </h3>
            <div className="bg-black border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
              <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Cortes Gratis Automáticos</h3>
                  <p className="text-xs text-white/40 mt-1 max-w-xs">Premiarás al cliente tras cumplir la meta.</p>
                </div>
                <button
                  onClick={() => updateLoyalty.mutate({
                    appointments_threshold: loyaltySettings.appointments_threshold,
                    is_enabled: !loyaltySettings.is_enabled
                  })}
                  className={`px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 ${loyaltySettings.is_enabled ? 'bg-brand text-black shadow-lg shadow-brand/20' : 'bg-bg-base text-white/40 border border-white/10'}`}
                >
                  <Zap size={12} className={loyaltySettings.is_enabled ? 'animate-pulse' : ''} />
                  {loyaltySettings.is_enabled ? 'Activo' : 'Pausado'}
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-white/5 relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="space-y-1 flex-1">
                  <label className="text-[9px] font-medium uppercase tracking-wider text-white/40">Visitas para Premio</label>
                  <input
                    type="number"
                    className="w-full bg-bg-base border border-white/10 rounded-xl py-3 px-4 text-xl font-bold text-white outline-none focus:border-brand transition-all max-w-[120px]"
                    value={loyaltySettings.appointments_threshold}
                    onChange={(e) => updateLoyalty.mutate({
                      appointments_threshold: parseInt(e.target.value) || 10,
                      is_enabled: loyaltySettings.is_enabled
                    })}
                  />
                </div>
                <p className="text-[10px] text-white/50 leading-relaxed sm:max-w-[200px]">
                  Al completar esta cantidad, el sistema le asignará una recompensa automáticamente.
                </p>
              </div>
            </div>
          </div>

          {/* LISTA DE OFERTAS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                <Tag size={12} className="text-brand" /> Ofertas Activas
              </h3>
              <button 
                onClick={handleNew}
                className="flex items-center gap-2 bg-brand/10 text-brand px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider hover:bg-brand hover:text-black transition-all"
              >
                <Plus size={12} />
                Nueva Oferta
              </button>
            </div>
            
            <div className="bg-black border border-white/5 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[50vh]">
              {promotions.length === 0 ? (
                <div className="flex-1 p-16 flex flex-col items-center justify-center text-center opacity-40">
                  <Tag size={32} className="text-white/20 mb-4" />
                  <p className="text-xs font-medium text-white uppercase tracking-wider">No hay promociones</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col p-2 space-y-2">
                  {promotions.map((promo) => {
                    const isSelected = selectedPromo?.id === promo.id;
                    const discountText = promo.discount_type === 'percentage' ? `${promo.discount_value}%` : promo.discount_type === 'free' ? 'GRATIS' : `{formatPrice(promo.discount_value)}`;
                    return (
                      <div 
                        key={promo.id} 
                        className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all group ${isSelected ? 'bg-brand/10 border-brand/30' : 'bg-bg-base border-white/5 hover:border-white/10'}`}
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-brand bg-brand/10 px-2 py-0.5 rounded">
                              {discountText}
                            </span>
                          </div>
                          <p className={`text-sm font-bold uppercase truncate mb-0.5 ${isSelected ? 'text-brand' : 'text-white'}`}>
                            {promo.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-[9px] font-medium text-white/40 uppercase tracking-wider">
                            <Clock size={10} />
                            <span>
                              {format(new Date(promo.start_date.split('T')[0] + 'T12:00:00'), 'dd MMM')} → {format(new Date(promo.end_date.split('T')[0] + 'T12:00:00'), 'dd MMM')}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-1 shrink-0">
                          <button 
                            onClick={() => handleEdit(promo)}
                            className={`p-2 rounded-lg transition-all ${isSelected ? 'bg-brand text-black shadow-md' : 'text-white/20 hover:text-brand hover:bg-brand/10'}`}
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => {
                              Swal.fire({
                                title: '¿ELIMINAR OFERTA?',
                                text: 'Esta promoción desaparecerá del sistema.',
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#ef4444',
                                confirmButtonText: 'ELIMINAR',
                                cancelButtonText: 'CANCELAR',
                                background: '#111',
                                color: '#fff'
                              }).then(result => {
                                if (result.isConfirmed) {
                                  deletePromotion.mutate(promo.id);
                                  if (selectedPromo?.id === promo.id) closeForm();
                                }
                              });
                            }}
                            className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LADO DERECHO: Formulario de Promoción */}
        <div className="lg:col-span-6">
          {isCreating || selectedPromo ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-6 flex items-center justify-between px-2">
                <div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-tight">
                    {isCreating ? 'Nueva Oferta' : 'Editar Oferta'}
                  </h3>
                  <p className="text-[10px] text-brand font-medium tracking-widest uppercase mt-1">Configuración del beneficio</p>
                </div>
              </div>
              <PromotionForm 
                initialData={selectedPromo || undefined} 
                isEditing={!!selectedPromo}
                onSuccess={closeForm}
                onCancel={closeForm}
              />
            </div>
          ) : (
            <div className="h-full min-h-[60vh] border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-12 opacity-60">
              <div className="p-6 bg-black border border-white/10 rounded-2xl mb-6">
                <Tag size={40} className="text-white/20" />
              </div>
              <h4 className="text-lg font-bold text-white uppercase tracking-wider mb-2">Editor de Ofertas</h4>
              <p className="text-xs text-white/40 font-medium uppercase tracking-wider max-w-xs leading-relaxed">
                Selecciona una promoción de la lista para editarla o haz clic en &quot;Nueva Oferta&quot; para crear un descuento.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
