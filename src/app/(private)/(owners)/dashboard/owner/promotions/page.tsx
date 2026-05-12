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
  Plus,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function PromotionsPage() {
  const { data: baseData, isLoading: baseLoading } = useOwnerBaseData();
  const { updateLoyalty, deletePromotion } = useOwnerMutations();
  
  const promotions = baseData?.promotions || [];
  const services   = baseData?.services   || [];
  const loyaltySettings = baseData?.loyaltySettings || { appointments_threshold: 10, is_enabled: true };

  if (baseLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#f59e0b]/20 border-t-[#f59e0b] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-32">
      {/* Header General */}
      <div className="flex items-center gap-5">
        <div className="p-4 bg-black/80 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl text-[#f59e0b]">
          <Sparkles size={28} />
        </div>
        <div>
          <p className="text-[#f59e0b] text-[10px] font-black uppercase tracking-[0.4em] mb-1">Marketing</p>
          <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">Promociones</h2>
        </div>
      </div>

      {/* ── SECCIÓN 1: FIDELIZACIÓN (Elite Edition) ── */}
      <div className="space-y-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 px-4">Programa de Fidelización</h3>
        <div className="bg-black/80 border border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group backdrop-blur-xl">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center text-[#f59e0b] shadow-xl">
                <Gift size={36} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">Cortes Gratis Automáticos</h3>
                <p className="text-[11px] text-white/40 font-medium max-w-md mt-1">Estimula la recurrencia premiando a tus clientes más fieles.</p>
              </div>
            </div>
            <button
              onClick={() => updateLoyalty.mutate({
                appointments_threshold: loyaltySettings.appointments_threshold,
                is_enabled: !loyaltySettings.is_enabled
              })}
              className={`px-10 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-2xl flex items-center gap-3 ${loyaltySettings.is_enabled ? 'bg-[#f59e0b] text-black' : 'bg-white/5 text-white/20 border border-white/5 shadow-none'}`}
            >
              <Zap size={14} className={loyaltySettings.is_enabled ? 'animate-pulse' : ''} />
              {loyaltySettings.is_enabled ? 'Programa Activo' : 'Pausar Programa'}
            </button>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 pt-12 border-t border-white/5">
            <div className="space-y-5">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-1 italic">Meta de Visitas para Premio</label>
              <div className="flex items-center gap-8">
                <div className="relative group">
                  <input
                    type="number"
                    className="w-28 bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-3xl font-black text-white outline-none focus:border-[#f59e0b] transition-all group-hover:bg-white/10"
                    value={loyaltySettings.appointments_threshold}
                    onChange={(e) => updateLoyalty.mutate({
                      appointments_threshold: parseInt(e.target.value) || 10,
                      is_enabled: loyaltySettings.is_enabled
                    })}
                  />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#f59e0b] rounded-full animate-ping opacity-20" />
                </div>
                <p className="text-xs text-white/40 font-medium leading-relaxed italic max-w-[200px]">
                  Al completar <span className="font-black text-white tracking-tighter italic text-sm">{loyaltySettings.appointments_threshold} servicios</span>, el cliente recibe su premio automáticamente.
                </p>
              </div>
            </div>
          </div>
          <Activity size={300} className="absolute -bottom-32 -right-32 opacity-[0.01] text-[#f59e0b]" />
        </div>
      </div>

      {/* ── SECCIÓN 2: CUPONES Y OFERTAS ── */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between px-4 gap-6">
          <div>
            <h3 className="text-[10px] font-black text-[#f59e0b] uppercase tracking-[0.4em] mb-1 italic">Cupones Vigentes</h3>
            <p className="text-[9px] text-white/20 font-black uppercase tracking-widest italic">Ofertas disponibles en la app de clientes</p>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-[9px] font-black text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-4 py-1.5 rounded-full uppercase tracking-[0.2em] italic">{promotions.length} ACTIVAS</span>
            <Link 
              href="/dashboard/owner/promotions/new"
              className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
              <Plus size={16} />
              Nueva Oferta
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {promotions.length === 0 ? (
            <div className="col-span-full py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-20 flex flex-col items-center justify-center gap-4">
              <Tag size={40} className="text-white/20" />
              <p className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Sin promociones configuradas</p>
            </div>
          ) : (
            promotions.map((promo, idx) => {
              const promoServices = services.filter(s => promo.service_ids?.includes(s.id));
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={promo.id} 
                  className="bg-black/80 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col group relative h-full backdrop-blur-md"
                >
                  <div className="p-8 flex-1 space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="px-3 py-1 bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] rounded-lg text-[8px] font-black uppercase tracking-widest italic">EXCLUSIVO</div>
                      <div className="flex gap-2">
                        <Link 
                          href={`/dashboard/owner/promotions/${promo.id}/edit`}
                          className="p-2.5 text-white/10 hover:text-[#f59e0b] hover:bg-white/5 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Edit size={16} />
                        </Link>
                        <button 
                          onClick={() => {
                            Swal.fire({
                              title: '¿ELIMINAR OFERTA?',
                              text: 'Esta promoción desaparecerá del sistema para siempre.',
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonColor: '#ef4444',
                              confirmButtonText: 'ELIMINAR',
                              cancelButtonText: 'CANCELAR',
                              background: '#0a0a0a',
                              color: '#fff'
                            }).then(result => {
                              if (result.isConfirmed) deletePromotion.mutate(promo.id);
                            });
                          }}
                          className="p-2.5 text-white/10 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-xl font-black text-white leading-tight uppercase mb-2 tracking-tighter italic">{promo.name}</h4>
                      <p className="text-[10px] text-white/40 font-medium line-clamp-2 leading-relaxed">{promo.description || 'Sin descripción adicional'}</p>
                    </div>

                    {promoServices.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {promoServices.map(s => (
                          <span key={s.id} className="text-[7px] font-black uppercase tracking-widest bg-white/5 border border-white/5 text-white/60 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                            <Zap size={8} className="text-[#f59e0b]" /> {s.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-[8px] font-black text-white/20 uppercase tracking-[0.2em] pt-4 italic">
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-[#f59e0b]" />
                        <span>
                          {format(new Date(promo.start_date.split('T')[0] + 'T12:00:00'), 'dd MMM')} → {format(new Date(promo.end_date.split('T')[0] + 'T12:00:00'), 'dd MMM yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#f59e0b] p-7 flex items-center justify-between text-black relative mt-auto shadow-[0_-10px_30px_rgba(245,158,11,0.1)]">
                    <div className="absolute top-0 left-0 right-0 h-px border-t border-dashed border-black/20" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 italic">Beneficio de Cliente</span>
                    <span className="text-3xl font-black uppercase italic tracking-tighter">
                      {promo.discount_type === 'percentage' ? `${promo.discount_value}%`
                        : promo.discount_type === 'free' ? 'FREE'
                        : `$${new Intl.NumberFormat('de-DE').format(promo.discount_value)}`}
                    </span>
                  </div>
                  <div className="absolute top-1/2 -left-4 w-8 h-8 bg-[#050505] rounded-full translate-y-[20px] z-20" />
                  <div className="absolute top-1/2 -right-4 w-8 h-8 bg-[#050505] rounded-full translate-y-[20px] z-20" />
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
