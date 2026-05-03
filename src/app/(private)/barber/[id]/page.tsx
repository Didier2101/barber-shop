/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Star } from 'lucide-react';
import { Profile, Service, BusinessHour, Promotion, ShopSettings } from '@/types';
import { toast } from 'sonner';

export default function BarberProfile() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedPromoId = searchParams.get('promo_id');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE').format(price);
  };

  const [barber, setBarber] = useState<Profile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const rating = { average: 0, count: 0 };

  // Form states
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [loyaltyReward, setLoyaltyReward] = useState(false);
  const [activePromo, setActivePromo] = useState<Promotion | null>(null);
  const [discountedPrice, setDiscountedPrice] = useState(0);

  useEffect(() => {
    if (!id) return;
    async function loadData() {
      setBarber(null);
      setSelectedServices([]);
      // User Profile for background
      const { data: { session } } = await supabase.auth.getSession();

      const { data: bData } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (bData) setBarber(bData);

      const { data: servs } = await supabase.from('services').select('*').eq('is_active', true);
      if (servs) setServices(servs);

      await supabase.from('barber_socials').select('*').eq('barber_id', id);

      const { data: shopData } = await supabase.from('shop_settings').select('*').eq('id', 1).single();
      if (shopData) setShopSettings(shopData);

      const { data: bhData } = await supabase.from('business_hours').select('*');
      if (bhData) setBusinessHours(bhData);

      // Loyalty & Promos Logic
      if (session?.user) {
        const { data: countData } = await supabase.from('appointments').select('id').eq('client_id', session.user.id).eq('status', 'completed');
        const completedCount = countData?.length || 0;
        
        const { data: lSettings } = await supabase.from('loyalty_settings').select('*').eq('id', 1).single();
        if (lSettings?.is_enabled && completedCount > 0 && (completedCount % lSettings.appointments_threshold === 0)) {
          setLoyaltyReward(true);
        }
      }

      const now = new Date().toISOString();
      if (preSelectedPromoId) {
        const { data: promo } = await supabase.from('promotions').select('*').eq('id', preSelectedPromoId).single();
        if (promo && promo.is_active && new Date(promo.end_date) >= new Date(now)) {
          setActivePromo(promo);
        }
      } else {
        const { data: promos } = await supabase.from('promotions').select('*').eq('is_active', true).lte('start_date', now).gte('end_date', now);
        if (promos && promos.length > 0) setActivePromo(promos[0]);
      }

      setLoading(false);
    }
    loadData();
  }, [id, preSelectedPromoId]);

  useEffect(() => {
    if (selectedDate && selectedServices.length > 0 && shopSettings) {
      calculateAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
    setSelectedTime(''); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedServices]);

  const toggleService = (service: Service) => {
    if (selectedServices.find(s => s.id === service.id)) {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const totalDuration = selectedServices.reduce((acc, curr) => acc + curr.duration, 0);
  const totalPrice = selectedServices.reduce((acc, curr) => acc + Number(curr.price), 0);

  useEffect(() => {
    let final = totalPrice;
    if (loyaltyReward) {
      final = 0;
    } else if (activePromo) {
      // Check if any selected service is NOT in the promo (if promo has restrictions)
      const isPromoValid = !activePromo.service_ids || activePromo.service_ids.length === 0 || 
                          selectedServices.every(s => activePromo.service_ids?.includes(s.id));

      if (isPromoValid) {
        if (activePromo.discount_type === 'percentage') final = totalPrice * (1 - activePromo.discount_value / 100);
        else if (activePromo.discount_type === 'fixed') final = Math.max(0, totalPrice - activePromo.discount_value);
        else if (activePromo.discount_type === 'free') final = 0;
      }
    }
    setDiscountedPrice(final);
  }, [totalPrice, loyaltyReward, activePromo, selectedServices]);

  useEffect(() => {
    if (activePromo) {
      const start = activePromo.start_date.split('T')[0];
      const end = activePromo.end_date.split('T')[0];
      if (start === end) {
        setSelectedDate(start);
      }

      // Auto-select services if the promo specifies them
      if (activePromo.service_ids && activePromo.service_ids.length > 0 && services.length > 0) {
        const promoServices = services.filter(s => activePromo.service_ids?.includes(s.id));
        setSelectedServices(promoServices);
      }
    }
  }, [activePromo, services]);

  async function calculateAvailableSlots() {
    setFetchingSlots(true);
    const startOfDay = new Date(`${selectedDate}T00:00:00`);
    const endOfDay = new Date(`${selectedDate}T23:59:59`);
    const now = new Date();

    const { data: appointments } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('barber_id', id)
      .neq('status', 'cancelled')
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString());

    const apts = (appointments || []).map(a => ({
      start: new Date(a.start_time).getTime(),
      end: new Date(a.end_time).getTime()
    }));

    const dayOfWeek = startOfDay.getDay();
    const daySlotsConfig = businessHours.filter(bh => bh.day_of_week === dayOfWeek && !bh.is_closed);

    if (daySlotsConfig.length === 0) {
      setAvailableSlots([]);
      setFetchingSlots(false);
      return;
    }

    const slots: string[] = [];
    const intervalMinutes = 15;

    daySlotsConfig.forEach(config => {
      const openTimeParts = config.opening_time.split(':');
      const closeTimeParts = config.closing_time.split(':');
      const currentSlot = new Date(`${selectedDate}T00:00:00`);
      currentSlot.setHours(parseInt(openTimeParts[0]), parseInt(openTimeParts[1]), 0, 0);
      const closeSlot = new Date(`${selectedDate}T00:00:00`);
      closeSlot.setHours(parseInt(closeTimeParts[0]), parseInt(closeTimeParts[1]), 0, 0);

      while (currentSlot < closeSlot) {
        const slotStartTime = currentSlot.getTime();
        const slotEndTime = slotStartTime + (totalDuration * 60000);
        if (slotEndTime > closeSlot.getTime()) {
          currentSlot.setMinutes(currentSlot.getMinutes() + intervalMinutes);
          continue;
        }

        let overlaps = false;
        for (const apt of apts) {
          if (slotStartTime < apt.end && slotEndTime > apt.start) {
            overlaps = true;
            break;
          }
        }
        if (slotStartTime < now.getTime()) overlaps = true;

        if (!overlaps) {
          const hh = currentSlot.getHours().toString().padStart(2, '0');
          const mm = currentSlot.getMinutes().toString().padStart(2, '0');
          slots.push(`${hh}:${mm}`);
        }
        currentSlot.setMinutes(currentSlot.getMinutes() + intervalMinutes);
      }
    });

    setAvailableSlots([...new Set(slots)].sort());
    setFetchingSlots(false);
  }

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServices.length === 0) return toast.warning('Selecciona servicios');
    if (!selectedTime) return toast.warning('Elige una hora');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    if (!id) return toast.error('Error de identificación del barbero');

    const start_time = new Date(`${selectedDate}T${selectedTime}:00`);
    const end_time = new Date(start_time.getTime() + totalDuration * 60000);

    const { error } = await supabase.from('appointments').insert({
      client_id: session.user.id,
      barber_id: id,
      services_data: selectedServices,
      start_time: start_time.toISOString(),
      end_time: end_time.toISOString(),
      price: discountedPrice,
      status: 'pending',
      is_loyalty_reward: loyaltyReward,
      applied_promo_id: activePromo?.id || null
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('¡Cita agendada!');
      router.push('/dashboard');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  
  return (
    <main className="min-h-screen bg-black text-white relative">
      
      {/* Background Hero Style */}
      <div className="fixed inset-0 z-0">
        {barber?.avatar_url ? (
          <img src={barber.avatar_url} alt="BG" className="w-full h-full object-cover opacity-30" />
        ) : (
          <img src="/nathon-oski-EW_rqoSdDes-unsplash.jpg" alt="Shop" className="w-full h-full object-cover opacity-20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
      </div>

      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-[60] p-4 flex items-center">
        <button onClick={() => router.back()} className="bg-black/60 backdrop-blur-2xl px-5 py-3 rounded-2xl border border-white/10 active:scale-90 transition-all flex items-center gap-3">
          <ArrowLeft size={18} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Volver</span>
        </button>
      </nav>

      {/* Content Area */}
      <div className="relative z-10 max-w-lg mx-auto p-4 pt-24 pb-12 space-y-8">
        
        {/* Barber Brief */}
        <div className="flex items-center gap-4">
           <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-500/30">
              <img src={barber?.avatar_url || ''} className="w-full h-full object-cover" />
           </div>
           <div className="space-y-1">
              <div className="flex items-center gap-2">
                 <div className="flex text-amber-500">
                    {[1,2,3,4,5].map(star => (
                      <Star key={star} size={10} fill={star <= rating.average ? 'currentColor' : 'none'} className={star <= rating.average ? '' : 'text-white/10'} />
                    ))}
                 </div>
                 <span className="text-[8px] font-black uppercase text-white/40">{rating.count} reseñas</span>
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">{barber?.nickname || barber?.name}</h1>
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">Agendando Cita</p>
           </div>
        </div>

        {/* Booking Card */}
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl space-y-10">
          
          <form onSubmit={handleBooking} className="space-y-10">
            
            {/* Step 1: Services */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">1. Selecciona Servicios</h3>
              <div className="grid gap-3">
                {services.map(s => {
                  const isSelected = selectedServices.find(x => x.id === s.id);
                  const isAllowed = !activePromo?.service_ids || activePromo.service_ids.length === 0 || activePromo.service_ids.includes(s.id);
                  
                  return (
                    <div 
                      key={s.id} 
                      onClick={() => isAllowed && toggleService(s)} 
                      className={`p-4 rounded-2xl border transition-all active:scale-[0.98] ${!isAllowed ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'} ${isSelected ? 'bg-amber-500 border-amber-500' : 'bg-white/5 border-white/5'}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className={`font-black uppercase text-xs ${isSelected ? 'text-black' : 'text-white'}`}>{s.name}</p>
                          <p className={`text-[9px] font-bold ${isSelected ? 'text-black/60' : 'text-zinc-500'}`}>{s.duration} min</p>
                        </div>
                        <p className={`font-black italic ${isSelected ? 'text-black' : 'text-amber-500'}`}>${formatPrice(s.price)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Step 2: Date */}
            {selectedServices.length > 0 && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">2. Elige la Fecha</h3>
                <input 
                  type="date" 
                  className={`w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-black uppercase tracking-widest outline-none focus:border-amber-500 ${activePromo && activePromo.start_date.split('T')[0] === activePromo.end_date.split('T')[0] ? 'opacity-50 cursor-not-allowed' : ''}`} 
                  value={selectedDate} 
                  onChange={e => setSelectedDate(e.target.value)} 
                  required 
                  readOnly={activePromo ? activePromo.start_date.split('T')[0] === activePromo.end_date.split('T')[0] : false}
                />
              </div>
            )}

            {/* Step 3: Time */}
            {selectedDate && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">3. Selecciona el Horario</h3>
                {fetchingSlots ? (
                  <p className="text-[10px] font-black uppercase tracking-widest text-center py-4 animate-pulse">Buscando espacios...</p>
                ) : availableSlots.length === 0 ? (
                  <p className="text-[10px] text-red-500 font-black uppercase text-center py-4">No hay turnos disponibles</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map(time => (
                      <button 
                        key={time} 
                        type="button" 
                        onClick={() => setSelectedTime(time)} 
                        className={`py-3 rounded-xl text-[10px] font-black transition-all ${selectedTime === time ? 'bg-white text-black shadow-xl' : 'bg-white/5 text-zinc-500'}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Total & Submit */}
            <div className="pt-6 border-t border-white/10 space-y-6">
               <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                      {loyaltyReward ? "Premio de Fidelidad Aplicado" : activePromo ? `Promo: ${activePromo.name}` : "Total Estimado"}
                    </p>
                    <div className="flex items-baseline gap-3">
                       <p className="text-3xl font-black italic text-amber-500 leading-none">${formatPrice(discountedPrice)}</p>
                       {(loyaltyReward || activePromo) && totalPrice > 0 && (
                         <p className="text-sm font-bold text-white/20 line-through tracking-tighter">${formatPrice(totalPrice)}</p>
                       )}
                    </div>
                  </div>
                  <p className="text-[10px] font-black text-zinc-500">{totalDuration} min</p>
               </div>
               
               {loyaltyReward && (
                 <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-3">
                    <Star className="text-amber-500 animate-pulse" size={20} fill="currentColor" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 leading-relaxed">
                      ¡Felicidades! Has alcanzado el nivel VIP. Tu cita es totalmente gratis hoy.
                    </p>
                 </div>
               )}
               
               <button 
                 type="submit" 
                 disabled={!selectedTime || selectedServices.length === 0}
                 className="w-full bg-white text-black py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all shadow-2xl active:scale-95 disabled:opacity-20"
               >
                 Confirmar Reserva
               </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
