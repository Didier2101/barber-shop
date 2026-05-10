'use client';
import { useOwnerBaseData, useOwnerMutations } from '@/hooks/useOwnerData';
import { 
  Sparkles, 
  Gift, 
  Activity, 
  Trash, 
  Clock,
  Edit,
  Tag,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import Swal from 'sweetalert2';
import Link from 'next/link';

export default function PromotionsPage() {
  const { data: baseData, isLoading: baseLoading } = useOwnerBaseData();
  const { updateLoyalty, deletePromotion } = useOwnerMutations();
  
  const promotions = baseData?.promotions || [];
  const services   = baseData?.services   || [];
  const loyaltySettings = baseData?.loyaltySettings || { appointments_threshold: 10, is_enabled: true };

  if (baseLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#0061ff] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl">
      {/* Header General */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm text-[#0061ff]">
          <Sparkles size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 uppercase">Marketing & Lealtad</h2>
          <p className="text-[11px] text-gray-500 font-medium tracking-wider">Configura cupones y el programa de fidelización</p>
        </div>
      </div>

      {/* ── SECCIÓN 1: FIDELIZACIÓN (Lógica integrada aquí) ── */}
      <div className="space-y-6">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Programa de Fidelización</h3>
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0061ff]">
                <Gift size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Cortes Gratis Automáticos</h3>
                <p className="text-[11px] text-gray-400 font-medium max-w-md">Premia a tus clientes recurrentes después de un número determinado de visitas.</p>
              </div>
            </div>
            <button
              onClick={() => updateLoyalty.mutate({
                appointments_threshold: loyaltySettings.appointments_threshold,
                is_enabled: !loyaltySettings.is_enabled
              })}
              className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg ${loyaltySettings.is_enabled ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-gray-100 text-gray-400 shadow-none'}`}
            >
              {loyaltySettings.is_enabled ? 'Programa Activo' : 'Programa Pausado'}
            </button>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 pt-10 border-t border-gray-50">
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Meta de Visitas para Premio</label>
              <div className="flex items-center gap-6">
                <input
                  type="number"
                  className="w-24 bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 text-2xl font-black text-gray-900 outline-none focus:border-[#0061ff] focus:bg-white transition-all"
                  value={loyaltySettings.appointments_threshold}
                  onChange={(e) => updateLoyalty.mutate({
                    appointments_threshold: parseInt(e.target.value) || 10,
                    is_enabled: loyaltySettings.is_enabled
                  })}
                />
                <p className="text-xs text-gray-500 font-medium leading-relaxed italic">
                  Al completar <span className="font-bold text-gray-900">{loyaltySettings.appointments_threshold} servicios</span>, el cliente recibe su premio.
                </p>
              </div>
            </div>
          </div>
          <Activity size={300} className="absolute -bottom-32 -right-32 opacity-[0.02] text-blue-500 group-hover:scale-110 transition-transform duration-1000" />
        </div>
      </div>

      {/* ── SECCIÓN 2: CUPONES Y OFERTAS ── */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Cupones Vigentes</h3>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Ofertas visibles para tus clientes</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-[#0061ff] bg-blue-50 px-3 py-1 rounded-full uppercase">{promotions.length} Activas</span>
            <Link 
              href="/dashboard/owner/promotions/new"
              className="flex items-center gap-2 bg-[#0061ff] text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Plus size={14} />
              Nueva Oferta
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.length === 0 ? (
            <div className="col-span-full py-24 text-center border border-dashed border-gray-200 rounded-[2.5rem] bg-gray-50/50">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">No hay promociones configuradas</p>
            </div>
          ) : (
            promotions.map(promo => {
              const promoServices = services.filter(s => promo.service_ids?.includes(s.id));
              return (
                <div key={promo.id} className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm flex flex-col group relative h-full">
                  <div className="p-8 flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="px-3 py-1 bg-[#0061ff]/10 text-[#0061ff] rounded-lg text-[9px] font-black uppercase tracking-widest">PROMO</div>
                      <div className="flex gap-1">
                        <Link 
                          href={`/dashboard/owner/promotions/${promo.id}/edit`}
                          className="p-2 text-gray-300 hover:text-[#0061ff] transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Edit size={16} />
                        </Link>
                        <button 
                          onClick={() => {
                            Swal.fire({
                              title: '¿Eliminar oferta?',
                              text: 'Esta promoción desaparecerá del sistema.',
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonColor: '#ef4444',
                              confirmButtonText: 'Eliminar'
                            }).then(result => {
                              if (result.isConfirmed) deletePromotion.mutate(promo.id);
                            });
                          }}
                          className="p-2 text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-black text-gray-900 leading-tight uppercase mb-1 tracking-tight">{promo.name}</h4>
                      <p className="text-[10px] text-gray-500 font-medium line-clamp-2">{promo.description || 'Sin descripción adicional'}</p>
                    </div>

                    {/* Servicios asignados */}
                    {promoServices.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {promoServices.map(s => (
                          <span key={s.id} className="text-[8px] font-black uppercase tracking-widest bg-blue-50 text-[#0061ff] px-2 py-1 rounded-lg flex items-center gap-1">
                            <Tag size={9} /> {s.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <div className="flex items-center gap-1">
                        <Clock size={11} />
                        <span>
                          {format(new Date(promo.start_date.split('T')[0] + 'T12:00:00'), 'dd MMM')} → {format(new Date(promo.end_date.split('T')[0] + 'T12:00:00'), 'dd MMM yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0061ff] p-5 flex items-center justify-between text-white relative mt-auto">
                    <div className="absolute top-0 left-0 right-0 h-px border-t border-dashed border-white/30" />
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Beneficio</span>
                    <span className="text-2xl font-black uppercase italic">
                      {promo.discount_type === 'percentage' ? `${promo.discount_value}%`
                        : promo.discount_type === 'free' ? 'FREE'
                        : `$${new Intl.NumberFormat('de-DE').format(promo.discount_value)}`}
                    </span>
                  </div>
                  <div className="absolute top-1/2 -left-3 w-6 h-6 bg-gray-50 rounded-full border border-gray-100 translate-y-[15px]" />
                  <div className="absolute top-1/2 -right-3 w-6 h-6 bg-gray-50 rounded-full border border-gray-100 translate-y-[15px]" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
