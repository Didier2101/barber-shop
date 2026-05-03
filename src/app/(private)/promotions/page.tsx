'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Plus, Trash2, Edit3, Clock, Save, X, Star
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Promotion, LoyaltySettings, Service } from '@/types';

export default function PromotionsPage() {
  const router = useRouter();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltySettings | null>(null);
  const [tempLoyalty, setTempLoyalty] = useState<Partial<LoyaltySettings> | null>(null);
  const [isEditingLoyalty, setIsEditingLoyalty] = useState(false);
  const [, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [isSingleDay, setIsSingleDay] = useState(false);
  const [currentPromo, setCurrentPromo] = useState<Partial<Promotion>>({
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 10,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    is_active: true,
    service_ids: []
  });
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data: promos } = await supabase.from('promotions').select('*').order('created_at', { ascending: false });
    if (promos) setPromotions(promos);

    const { data: srvs } = await supabase.from('services').select('*').eq('is_active', true);
    if (srvs) setServices(srvs);

    const { data: loyaltyData } = await supabase.from('loyalty_settings').select('*').eq('id', 1).single();
    if (loyaltyData) {
      setLoyalty(loyaltyData);
      setTempLoyalty(loyaltyData);
    }
    setLoading(false);
  }

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const endDate = isSingleDay ? currentPromo.start_date : currentPromo.end_date;
    
    const promoData = {
      ...currentPromo,
      discount_value: Number(currentPromo.discount_value),
      start_date: `${currentPromo.start_date}T00:00:00Z`,
      end_date: `${endDate}T23:59:59Z`,
      service_ids: currentPromo.service_ids || []
    };

    if (currentPromo.id) {
      const { error } = await supabase.from('promotions').update(promoData).eq('id', currentPromo.id);
      if (!error) toast.success('Promoción actualizada');
      else toast.error(error.message);
    } else {
      const { error } = await supabase.from('promotions').insert(promoData);
      if (!error) toast.success('Promoción creada');
      else toast.error(error.message);
    }

    setIsEditing(false);
    setIsSingleDay(false);
    setCurrentPromo({
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      is_active: true,
      service_ids: []
    });
    loadData();
  };

  const toggleServiceInPromo = (serviceId: string) => {
    const current = currentPromo.service_ids || [];
    if (current.includes(serviceId)) {
      setCurrentPromo({ ...currentPromo, service_ids: current.filter(id => id !== serviceId) });
    } else {
      setCurrentPromo({ ...currentPromo, service_ids: [...current, serviceId] });
    }
  };

  const togglePromoStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('promotions').update({ is_active: !currentStatus }).eq('id', id);
    if (!error) {
      toast.success(!currentStatus ? 'Promoción activada' : 'Promoción pausada');
      loadData();
    }
  };

  const deletePromo = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta promoción?')) {
      const { error } = await supabase.from('promotions').delete().eq('id', id);
      if (!error) {
        toast.success('Promoción eliminada');
        loadData();
      }
    }
  };

  const handleSaveLoyalty = async () => {
    if (!tempLoyalty) return;
    const { error } = await supabase.from('loyalty_settings').update(tempLoyalty).eq('id', 1);
    if (!error) {
      setLoyalty(tempLoyalty as LoyaltySettings);
      setIsEditingLoyalty(false);
      toast.success('Programa de lealtad actualizado correctamente');
    } else {
      toast.error(error.message);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-10 relative">
      {/* Background Hero */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#f59e0b]/10 blur-[150px] rounded-full" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button onClick={() => router.back()} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
              <ArrowLeft size={24} />
            </button>
            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic leading-none">Gestión de <span className="text-[#f59e0b]">Marketing</span></h1>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] ml-1">Fidelización y ofertas dinámicas</p>
            </div>
          </div>

          <button 
            onClick={() => { setIsEditing(true); setCurrentPromo({ name: '', description: '', discount_type: 'percentage', discount_value: 10, start_date: new Date().toISOString().split('T')[0], end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_active: true }); }} 
            className="bg-[#f59e0b] text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_15px_30px_-10px_rgba(245,158,11,0.4)]"
          >
            <Plus size={18} /> Nueva Promoción
          </button>
        </div>

        {/* Loyalty Advanced Settings */}
        {loyalty && tempLoyalty && (
          <section className={`bg-white/[0.03] backdrop-blur-3xl border rounded-[4rem] p-8 md:p-16 relative overflow-hidden group transition-all duration-500 ${isEditingLoyalty ? 'border-amber-500/40 ring-1 ring-amber-500/20' : 'border-white/5'}`}>
             {/* Decorative Background Icon */}
             <div className="absolute -right-10 -top-10 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000">
                <Star size={300} fill="currentColor" />
             </div>

             <div className="relative z-10 space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/5 pb-10">
                   <div className="space-y-4">
                      <div className="flex items-center gap-4">
                         <div className="w-16 h-16 bg-[#f59e0b]/10 text-[#f59e0b] rounded-[2rem] flex items-center justify-center shadow-inner">
                            <Star size={35} fill="currentColor" />
                         </div>
                         <div>
                            <h2 className="text-4xl font-black uppercase italic tracking-tighter">Programa de <span className="text-[#f59e0b]">Lealtad</span></h2>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mt-1">Configuración del motor de recompensas</p>
                         </div>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-4">
                      {!isEditingLoyalty ? (
                        <button 
                          onClick={() => setIsEditingLoyalty(true)}
                          className="bg-white/5 hover:bg-white/10 text-white px-8 py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] border border-white/10 transition-all flex items-center gap-3"
                        >
                          <Edit3 size={18} /> Editar Configuración
                        </button>
                      ) : (
                        <div className="flex items-center gap-3">
                           <button 
                            onClick={handleSaveLoyalty}
                            className="bg-emerald-500 text-black px-8 py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl flex items-center gap-3"
                           >
                            <Save size={18} /> Guardar Cambios
                           </button>
                           <button 
                            onClick={() => { setIsEditingLoyalty(false); setTempLoyalty(loyalty); }}
                            className="bg-white/5 text-white px-8 py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all"
                           >
                            Cancelar
                           </button>
                        </div>
                      )}

                      <div className="h-10 w-px bg-white/10 mx-2" />

                      <button 
                        onClick={async () => {
                            const newStatus = !loyalty.is_enabled;
                            const { error } = await supabase.from('loyalty_settings').update({ is_enabled: newStatus }).eq('id', 1);
                            if (!error) {
                              setLoyalty({ ...loyalty, is_enabled: newStatus });
                              setTempLoyalty({ ...tempLoyalty, is_enabled: newStatus });
                              toast.success(newStatus ? 'Programa de Lealtad Activado' : 'Programa de Lealtad en Pausa');
                            }
                        }}
                        className={`px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${loyalty.is_enabled ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-red-500/10 border-red-500 text-red-500'}`}
                      >
                        {loyalty.is_enabled ? 'ACTIVO' : 'PAUSADO'}
                      </button>
                   </div>
                </div>

                <div className={`grid grid-cols-1 lg:grid-cols-3 gap-12 transition-all duration-500 ${!isEditingLoyalty ? 'opacity-60 pointer-events-none grayscale-[0.5]' : ''}`}>
                   {/* Column 1: Core Rules */}
                   <div className="space-y-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest text-[#f59e0b]">Meta de Visitas</label>
                         <div className="flex items-center gap-4 bg-black/40 p-4 rounded-3xl border border-white/5">
                            <input 
                              type="number" 
                              className="w-full bg-transparent text-5xl font-black text-white italic outline-none text-center" 
                              value={tempLoyalty.appointments_threshold}
                              onChange={(e) => setTempLoyalty({ ...tempLoyalty, appointments_threshold: parseInt(e.target.value) || 1 })}
                            />
                            <div className="h-10 w-px bg-white/10" />
                            <span className="text-lg font-black uppercase tracking-tighter italic text-gray-500">Citas</span>
                         </div>
                         <p className="text-[9px] text-zinc-500 font-bold uppercase italic ml-2">Citas necesarias para ganar el premio.</p>
                      </div>

                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Público Objetivo</label>
                         <select 
                           className="w-full bg-black/40 p-5 rounded-2xl border border-white/5 text-xs font-black uppercase tracking-widest outline-none focus:border-[#f59e0b] transition-all"
                           value={tempLoyalty.target_audience || 'everyone'}
                           onChange={(e) => setTempLoyalty({ ...tempLoyalty, target_audience: e.target.value })}
                         >
                            <option value="everyone">TODOS LOS CLIENTES</option>
                            <option value="new_clients">SOLO CLIENTES NUEVOS</option>
                         </select>
                      </div>
                   </div>

                   {/* Column 2: Dates & Content */}
                   <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Fecha Inicio</label>
                            <input 
                              type="date" 
                              className="w-full bg-black/40 p-5 rounded-2xl border border-white/5 text-xs font-black uppercase outline-none focus:border-[#f59e0b]"
                              value={tempLoyalty.start_date ? tempLoyalty.start_date.split('T')[0] : ''}
                              onChange={(e) => setTempLoyalty({ ...tempLoyalty, start_date: e.target.value })}
                            />
                         </div>
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Fecha Fin</label>
                            <input 
                              type="date" 
                              className="w-full bg-black/40 p-5 rounded-2xl border border-white/5 text-xs font-black uppercase outline-none focus:border-[#f59e0b]"
                              value={tempLoyalty.end_date ? tempLoyalty.end_date.split('T')[0] : ''}
                              onChange={(e) => setTempLoyalty({ ...tempLoyalty, end_date: e.target.value })}
                            />
                         </div>
                      </div>

                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Descripción / Reglas</label>
                         <textarea 
                           className="w-full bg-black/40 p-5 rounded-2xl border border-white/5 text-[11px] font-medium italic h-24 outline-none focus:border-[#f59e0b] resize-none"
                           value={tempLoyalty.description || ''}
                           onChange={(e) => setTempLoyalty({ ...tempLoyalty, description: e.target.value })}
                           placeholder="Explica las condiciones del premio..."
                         />
                      </div>
                   </div>

                   {/* Column 3: Service Restrictions */}
                   <div className="space-y-6">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#f59e0b]">Servicios Participantes</label>
                      <div className="bg-black/40 p-6 rounded-[2.5rem] border border-white/5 h-[200px] overflow-y-auto custom-scrollbar space-y-2">
                         {services.map(srv => {
                            const isSelected = tempLoyalty.service_ids?.includes(srv.id);
                            return (
                               <button
                                 key={srv.id}
                                 onClick={() => {
                                    const current = tempLoyalty.service_ids || [];
                                    const next = current.includes(srv.id) ? current.filter(id => id !== srv.id) : [...current, srv.id];
                                    setTempLoyalty({ ...tempLoyalty, service_ids: next });
                                 }}
                                 className={`w-full p-4 rounded-2xl text-left text-[10px] font-black uppercase tracking-widest border transition-all flex justify-between items-center ${isSelected ? 'bg-amber-500 border-amber-500 text-black' : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'}`}
                               >
                                  {srv.name}
                                  {isSelected && <Star size={12} fill="currentColor" />}
                               </button>
                            );
                         })}
                      </div>
                      <p className="text-[8px] text-zinc-500 uppercase font-black tracking-widest text-center px-4 leading-relaxed">
                         Solo las citas completadas con estos servicios sumarán para el premio.
                      </p>
                   </div>
                </div>
             </div>
          </section>
        )}

        {/* List of Promotions */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {promotions.map(promo => {
            const isExpired = new Date(promo.end_date) < new Date();
            return (
              <div key={promo.id} className={`group bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between transition-all hover:border-[#f59e0b]/40 ${!promo.is_active || isExpired ? 'opacity-50' : ''}`}>
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                       <h3 className="text-2xl font-black uppercase tracking-tighter italic leading-none">{promo.name}</h3>
                       <p className="text-[10px] font-black text-[#f59e0b] uppercase tracking-[0.3em]">
                         {promo.discount_type === 'percentage' ? `${promo.discount_value}% Descuento` : 
                          promo.discount_type === 'fixed' ? `$${new Intl.NumberFormat('de-DE').format(promo.discount_value)} OFF` : '100% GRATIS'}
                       </p>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => { setIsEditing(true); setCurrentPromo({ ...promo, start_date: promo.start_date.split('T')[0], end_date: promo.end_date.split('T')[0] }); }} className="p-3 bg-white/5 rounded-xl hover:text-[#f59e0b] transition-all"><Edit3 size={16} /></button>
                       <button onClick={() => deletePromo(promo.id)} className="p-3 bg-white/5 rounded-xl hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs font-medium italic leading-relaxed">&quot;{promo.description}&quot;</p>
                </div>

                <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Clock size={14} className="text-amber-500" />
                      <div className="space-y-0.5">
                         <p className="text-[8px] font-black text-zinc-500 uppercase">Validez</p>
                         <p className="text-[9px] font-black text-white uppercase tracking-widest">
                           {format(new Date(promo.start_date), 'dd MMM')} - {format(new Date(promo.end_date), 'dd MMM')}
                         </p>
                      </div>
                   </div>
                   <button 
                     onClick={() => togglePromoStatus(promo.id, promo.is_active)}
                     className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${isExpired ? 'border-red-500/20 text-red-500/40 cursor-not-allowed' : promo.is_active ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5' : 'border-amber-500 text-amber-500 bg-amber-500/5'}`}
                     disabled={isExpired}
                   >
                     {isExpired ? 'EXPIRADA' : promo.is_active ? 'FINALIZAR' : 'ACTIVAR'}
                   </button>
                </div>
              </div>
            );
          })}
        </section>

        {/* Create/Edit Overlay */}
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
             <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] w-full max-w-4xl shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
                {/* Decorative glow */}
                <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-[#f59e0b]/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative z-10 flex justify-between items-start p-8 pb-0">
                   <div className="space-y-1">
                      <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">
                        {currentPromo.id ? 'Editar' : 'Diseñar'} <span className="text-[#f59e0b]">Promoción</span>
                      </h2>
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Personaliza tu oferta de alto impacto</p>
                   </div>
                   <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-500"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 pt-6 custom-scrollbar">
                  <form onSubmit={handleSavePromo} className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500 ml-1">Nombre de la Campaña</label>
                        <input 
                          className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-5 text-sm font-bold focus:border-[#f59e0b] focus:ring-0 outline-none transition-all" 
                          value={currentPromo.name} 
                          onChange={e => setCurrentPromo({...currentPromo, name: e.target.value})}
                          placeholder="Ej: Promo Barbero Pro"
                          required 
                        />
                    </div>

                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500 ml-1">Descripción</label>
                        <textarea 
                          className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-5 text-sm font-medium h-20 focus:border-[#f59e0b] focus:ring-0 outline-none transition-all resize-none" 
                          value={currentPromo.description} 
                          onChange={e => setCurrentPromo({...currentPromo, description: e.target.value})}
                          placeholder="Ej: Recibe un 15% de descuento en tu próximo corte..."
                          required 
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500 ml-1">Tipo de Beneficio</label>
                        <select 
                          className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-5 text-sm font-bold focus:border-[#f59e0b] outline-none"
                          value={currentPromo.discount_type}
                          onChange={e => setCurrentPromo({...currentPromo, discount_type: e.target.value as Promotion['discount_type']})}
                        >
                          <option value="percentage">PORCENTAJE (%)</option>
                          <option value="fixed">MONTO FIJO ($)</option>
                          <option value="free">TOTALMENTE GRATIS</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500 ml-1">Valor</label>
                        <input 
                          type="number"
                          className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-5 text-sm font-black text-[#f59e0b] focus:border-[#f59e0b] outline-none" 
                          value={currentPromo.discount_value} 
                          onChange={e => setCurrentPromo({...currentPromo, discount_value: parseInt(e.target.value)})}
                          required 
                          disabled={currentPromo.discount_type === 'free'}
                        />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500 ml-1">Servicios que participan</label>
                        <div className="flex flex-wrap gap-1.5">
                          {services.map(srv => {
                            const isSelected = currentPromo.service_ids?.includes(srv.id);
                            return (
                              <button
                                key={srv.id}
                                type="button"
                                onClick={() => toggleServiceInPromo(srv.id)}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${isSelected ? 'bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/10' : 'bg-white/5 border-white/10 text-zinc-500 hover:border-white/20'}`}
                              >
                                {srv.name}
                              </button>
                            );
                          })}
                        </div>
                    </div>

                    <div className="md:col-span-2 flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white">¿Es una promoción de un solo día?</p>
                          <p className="text-[8px] font-medium text-zinc-500 uppercase tracking-widest">Activa esto para eventos como el Día del Padre</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setIsSingleDay(!isSingleDay)}
                          className={`w-12 h-6 rounded-full transition-all relative ${isSingleDay ? 'bg-amber-500' : 'bg-zinc-800'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isSingleDay ? 'right-1' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className={isSingleDay ? 'md:col-span-2 space-y-1.5' : 'space-y-1.5'}>
                        <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                          {isSingleDay ? 'Fecha del Evento' : 'Fecha de Lanzamiento'}
                        </label>
                        <input 
                          type="date"
                          className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-5 text-xs font-bold focus:border-[#f59e0b] outline-none" 
                          value={currentPromo.start_date} 
                          onChange={e => setCurrentPromo({...currentPromo, start_date: e.target.value})}
                          required 
                        />
                    </div>

                    {!isSingleDay && (
                      <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500 ml-1">Fecha de Finalización</label>
                          <input 
                            type="date"
                            className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-5 text-xs font-bold focus:border-[#f59e0b] outline-none" 
                            value={currentPromo.end_date} 
                            onChange={e => setCurrentPromo({...currentPromo, end_date: e.target.value})}
                            required 
                          />
                      </div>
                    )}

                    <div className="md:col-span-2 pt-4 flex gap-3 sticky bottom-0 bg-[#0a0a0a] py-4 border-t border-white/5 mt-4">
                        <button type="submit" className="flex-1 bg-[#f59e0b] text-black py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-2xl hover:scale-[1.02] transition-all">
                          <Save size={16} /> {currentPromo.id ? 'Guardar Cambios' : 'Lanzar Promoción'}
                        </button>
                        <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-white/5 text-zinc-500 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all">
                          Cancelar
                        </button>
                    </div>
                  </form>
                </div>
             </div>
          </div>
        )}
      </div>
    </main>
  );
}
