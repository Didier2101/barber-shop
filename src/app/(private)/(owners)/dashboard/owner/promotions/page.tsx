'use client';
import { useOwnerBaseData, useOwnerMutations } from '@/hooks/owner';
import { 
  Gift, 
  Trash, 
  Clock,
  Edit,
  Tag,
  Plus,
  Zap,
  X,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import Swal from 'sweetalert2';
import { PromotionForm } from '@/components/forms/PromotionForm';
import { useState, useMemo } from 'react';
import { Promotion } from '@/types';
import { formatPrice } from '@/lib/format';
import { motion, AnimatePresence } from 'framer-motion';

const EMPTY_PROMOTIONS: Promotion[] = [];

export default function PromotionsPage() {
  const { data: baseData, isLoading: baseLoading } = useOwnerBaseData();
  const { updateLoyalty, deletePromotion } = useOwnerMutations();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const promotions = useMemo(() => baseData?.promotions || EMPTY_PROMOTIONS, [baseData?.promotions]);
  const loyaltySettings = baseData?.loyaltySettings || { appointments_threshold: 10, is_enabled: true };

  const filteredPromotions = useMemo(() => {
     if (!searchTerm) return promotions;
     return promotions.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [promotions, searchTerm]);

  const openDrawer = (promo?: Promotion) => {
    setSelectedPromo(promo || null);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setSelectedPromo(null);
    setIsDrawerOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    Swal.fire({
      title: `¿Eliminar ${name}?`,
      text: 'Esta promoción desaparecerá del sistema.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: 'var(--color-erp-primary)',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        deletePromotion.mutate(id, {
           onSuccess: () => {
              if (selectedPromo?.id === id) closeDrawer();
           }
        });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-32 font-sans animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER ERP */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-erp-bg border border-erp-border p-6 rounded-2xl shadow-sm">
         <div>
            <h2 className="text-2xl font-black text-erp-text tracking-tight flex items-center gap-3">
               <Gift size={24} className="text-erp-primary" />
               Promociones y Fidelización
            </h2>
            <p className="text-sm font-medium text-erp-text-muted mt-1">Atrae clientes y premia su lealtad</p>
         </div>
      </div>

      {/* PROGRAMA DE FIDELIZACIÓN (TARJETA HORIZONTAL) */}
      <div className="bg-erp-surface border border-erp-border rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="flex items-center gap-4 w-full md:w-auto">
            <div className={`p-4 rounded-xl shrink-0 ${loyaltySettings.is_enabled ? 'bg-erp-primary text-white shadow-md' : 'bg-erp-bg text-erp-text-muted border border-erp-border'}`}>
               <Zap size={24} className={loyaltySettings.is_enabled ? 'animate-pulse' : ''} />
            </div>
            <div>
               <h3 className="text-lg font-black text-erp-text tracking-tight">Programa de Cortes Gratis</h3>
               <p className="text-sm text-erp-text-muted font-medium mt-0.5">Premia automáticamente a tus clientes recurrentes.</p>
            </div>
         </div>

         <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-erp-bg border border-erp-border px-4 py-2 rounded-xl">
               <span className="text-xs font-bold text-erp-text-muted uppercase tracking-wider">Visitas Meta:</span>
               <input
                  type="number"
                  min="1"
                  className="w-16 bg-transparent text-lg font-black text-erp-text outline-none text-center"
                  value={loyaltySettings.appointments_threshold}
                  onChange={(e) => updateLoyalty.mutate({
                     appointments_threshold: parseInt(e.target.value) || 10,
                     is_enabled: loyaltySettings.is_enabled
                  })}
               />
            </div>

            <button
               onClick={() => updateLoyalty.mutate({
                  appointments_threshold: loyaltySettings.appointments_threshold,
                  is_enabled: !loyaltySettings.is_enabled
               })}
               className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${loyaltySettings.is_enabled ? 'bg-erp-primary text-white hover:opacity-90 shadow-sm' : 'bg-erp-bg border border-erp-border text-erp-text hover:bg-erp-surface'}`}
            >
               {loyaltySettings.is_enabled ? 'Programa Activo' : 'Programa Pausado'}
            </button>
         </div>
      </div>

      {/* HEADER DE LA TABLA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-8 mb-4">
         <h3 className="text-lg font-black uppercase tracking-tight text-erp-text flex items-center gap-2">
            <Tag size={18} className="text-erp-primary" /> Ofertas Activas
         </h3>
         
         <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative group shadow-sm w-full sm:w-72">
               <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search size={16} className="text-erp-text-muted group-focus-within:text-erp-primary transition-colors" />
               </div>
               <input
                  type="text"
                  placeholder="Buscar oferta..."
                  className="w-full bg-erp-bg border border-erp-border rounded-xl py-2.5 pl-11 pr-4 text-sm text-erp-text outline-none focus:border-erp-primary/50 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            
            <button 
               onClick={() => openDrawer()}
               className="w-full sm:w-auto flex items-center justify-center gap-2 bg-erp-primary text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all shadow-sm"
            >
               <Plus size={16} />
               Nueva Oferta
            </button>
         </div>
      </div>

      {/* DATA GRID (TABLA) */}
      <div className="bg-erp-surface border border-erp-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[40vh]">
         {baseLoading ? (
            <div className="flex-1 flex items-center justify-center">
               <div className="w-8 h-8 border-4 border-erp-primary/20 border-t-erp-primary rounded-full animate-spin"></div>
            </div>
         ) : filteredPromotions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 p-12">
               <Tag size={48} className="text-erp-text-muted mb-4" />
               <p className="text-sm font-bold text-erp-text uppercase tracking-widest">No hay ofertas activas</p>
               {searchTerm && <p className="text-xs text-erp-text-muted mt-2">Intenta con otra búsqueda</p>}
            </div>
         ) : (
            <div className="flex-1 overflow-x-auto custom-scrollbar">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-erp-bg border-b border-erp-border">
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted whitespace-nowrap">Nombre de la Oferta</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted whitespace-nowrap text-center">Beneficio</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted whitespace-nowrap">Vigencia</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted text-right whitespace-nowrap">Acciones</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-erp-border">
                     {filteredPromotions.map((promo) => {
                        const discountText = promo.discount_type === 'percentage' ? `${promo.discount_value}%` : promo.discount_type === 'free' ? 'GRATIS' : `${formatPrice(promo.discount_value)}`;
                        return (
                           <tr
                              key={promo.id}
                              onClick={() => openDrawer(promo)}
                              className="cursor-pointer group bg-erp-bg hover:bg-erp-surface transition-colors"
                           >
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-erp-border bg-erp-surface flex items-center justify-center shrink-0 text-erp-primary">
                                       <Gift size={18} />
                                    </div>
                                    <p className="text-sm font-bold text-erp-text uppercase tracking-tight">{promo.name}</p>
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-center whitespace-nowrap">
                                 <span className="inline-flex items-center justify-center px-3 py-1 rounded-md bg-erp-primary/10 border border-erp-primary/20 text-erp-primary text-[10px] font-black uppercase tracking-widest">
                                    {discountText}
                                 </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <div className="flex items-center gap-2 text-xs font-bold text-erp-text-muted">
                                    <Clock size={14} className="text-erp-primary" /> 
                                    {format(new Date(promo.start_date.split('T')[0] + 'T12:00:00'), 'dd MMM')} → {format(new Date(promo.end_date.split('T')[0] + 'T12:00:00'), 'dd MMM')}
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-right whitespace-nowrap">
                                 <div className="flex items-center justify-end gap-2">
                                    <button 
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          openDrawer(promo);
                                       }}
                                       className="p-2 rounded-lg border border-erp-border text-erp-text-muted hover:bg-erp-primary/10 hover:text-erp-primary hover:border-erp-primary/30 transition-all"
                                       title="Editar"
                                    >
                                       <Edit size={16} />
                                    </button>
                                    <button 
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          handleDelete(promo.id, promo.name);
                                       }}
                                       className="p-2 rounded-lg border border-erp-border text-erp-text-muted hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30 transition-all"
                                       title="Eliminar"
                                    >
                                       <Trash size={16} />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
         )}
      </div>

      {/* DRAWER (PANEL LATERAL) - CREAR / EDITAR */}
      <AnimatePresence>
         {isDrawerOpen && (
            <>
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={closeDrawer}
                  className="fixed inset-0 bg-transparent z-[200]"
               />

               <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed top-0 right-0 w-full sm:w-[450px] md:w-[500px] h-full bg-erp-bg border-l border-erp-border shadow-2xl z-[210] flex flex-col"
               >
                  <div className="flex items-center justify-between p-6 border-b border-erp-border bg-erp-surface">
                     <h3 className="text-lg font-black uppercase tracking-tight text-erp-text flex items-center gap-3">
                        {selectedPromo ? <Edit size={20} className="text-erp-primary" /> : <Plus size={20} className="text-erp-primary" />}
                        {selectedPromo ? 'Editar Oferta' : 'Nueva Oferta'}
                     </h3>
                     <button onClick={closeDrawer} className="p-2 text-erp-text-muted hover:text-erp-text hover:bg-erp-text/5 rounded-full transition-all">
                        <X size={20} />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                     <PromotionForm 
                        initialData={selectedPromo || undefined} 
                        isEditing={!!selectedPromo}
                        onSuccess={closeDrawer}
                     />
                  </div>

               </motion.div>
            </>
         )}
      </AnimatePresence>
    </div>
  );
}
