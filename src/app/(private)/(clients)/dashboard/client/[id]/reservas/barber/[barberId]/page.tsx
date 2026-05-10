/* eslint-disable @next/next/no-img-element */
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Star, Zap } from 'lucide-react';
import { Profile, Service, BusinessHour, Promotion, ShopSettings } from '@/types';
import { toast } from 'sonner';
import { useGlobalStore } from '@/store/useGlobalStore';
import { format } from 'date-fns';

export default function BarberBookingPage() {
  const params = useParams();
  const id = params?.barberId as string; // barberId segment
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedPromoId = searchParams.get('promo_id');
  const currentUser = useGlobalStore(state => state.userProfile);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE').format(price);
  };

  const [barber, setBarber] = useState<Profile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [rating, setRating] = useState({ average: 0, count: 0 });

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
      setLoading(true); // Asegurar que empezamos cargando
      setBarber(null);
      setSelectedServices([]);
      setActivePromo(null); // Limpiar promo anterior
      setSelectedDate('');
      setSelectedTime('');
      const { data: { session } } = await supabase.auth.getSession();

      const { data: bData } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (bData) setBarber(bData);

      const { data: servs } = await supabase.from('services').select('*').eq('is_active', true);
      if (servs) setServices(servs);

      const { data: shopData } = await supabase.from('shop_settings').select('*').eq('id', 1).single();
      if (shopData) setShopSettings(shopData);

      const { data: bhData } = await supabase.from('business_hours').select('*');
      if (bhData) setBusinessHours(bhData);

      // Fetch rating
      const { data: aptsRating } = await supabase.from('appointments').select('rating').eq('barber_id', id).eq('status', 'completed');
      if (aptsRating && aptsRating.length > 0) {
        const rated = aptsRating.filter(a => a.rating !== null);
        if (rated.length > 0) {
          const avg = rated.reduce((acc, curr) => acc + Number(curr.rating), 0) / rated.length;
          setRating({ average: avg, count: rated.length });
        }
      }

      // Loyalty & Promos Logic
      if (session?.user) {
        const { data: countData } = await supabase.from('appointments').select('id').eq('client_id', session.user.id).eq('status', 'completed');
        const completedCount = countData?.length || 0;

        const { data: lSettings } = await supabase.from('loyalty_settings').select('*').eq('id', 1).single();
        if (lSettings?.is_enabled && completedCount > 0 && (completedCount % lSettings.appointments_threshold === 0)) {
          setLoyaltyReward(true);
        }
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (preSelectedPromoId) {
        const { data: promo } = await supabase.from('promotions').select('*').eq('id', preSelectedPromoId).single();
        if (promo && promo.is_active) {
          // Extraer solo la parte YYYY-MM-DD para evitar errores de formato
          const endDateStr = promo.end_date.split('T')[0];
          if (new Date(endDateStr + 'T23:59:59') >= new Date()) {
            setActivePromo(promo);
          }
        }
      }

      setLoading(false);
    }
    loadData();
  }, [id, preSelectedPromoId]);

  // --- GUARDIÁN DE PROMOCIONES ---
  useEffect(() => {
    if (activePromo && services.length > 0) {
      const promoServices = services.filter(s => activePromo.service_ids?.includes(s.id));
      if (promoServices.length > 0) {
        setSelectedServices(prev => {
          const isSame = prev.length === promoServices.length && prev.every(s => promoServices.some(ps => ps.id === s.id));
          return isSame ? prev : promoServices;
        });
      }

      const start = activePromo.start_date.split('T')[0];
      const end = activePromo.end_date.split('T')[0];
      setSelectedDate(prev => {
        if (start === end) return start;
        if (!prev || prev < start || prev > end) return start;
        return prev;
      });
    }
  }, [activePromo, services]);

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
      toast.success('¡Reserva enviada! Esperando aprobación del barbero');
      router.push(`/dashboard/client/${currentUser?.id}/reservas`);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="w-10 h-10 border-4 border-[#f59e0b] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto">

      {/* Barber Brief */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#f59e0b]/30 bg-white/5">
          {barber?.avatar_url && <img src={barber.avatar_url} alt={`Avatar de ${barber.nickname || barber.name}`} className="w-full h-full object-cover" />}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex text-[#f59e0b]">
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} size={10} fill={star <= rating.average ? 'currentColor' : 'none'} className={star <= rating.average ? '' : 'text-white/10'} />
              ))}
            </div>
            <span className="text-[8px] font-black uppercase text-white/40">{rating.count} reseñas</span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter leading-none text-white">{barber?.nickname || barber?.name}</h1>
          <p className="text-[9px] font-black uppercase tracking-widest text-[#f59e0b]">Agendando Cita</p>
        </div>
      </div>

      {/* Booking Card */}
      <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl space-y-10">
        <form onSubmit={handleBooking} className="space-y-10">

          {/* Active Promo Badge */}
          {activePromo && (
            <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-2xl p-4 flex items-center justify-between animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#f59e0b] flex items-center justify-center text-black">
                  <Zap size={14} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#f59e0b]">Oferta Aplicada</p>
                  <p className="text-[11px] font-black uppercase text-white">{activePromo.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Vence</p>
                <p className="text-[10px] font-black text-white/60">{format(new Date(activePromo.end_date.split('T')[0] + 'T12:00:00'), 'dd MMM')}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">1. Selecciona Servicios</h3>
            <div className="grid gap-3">
              {services.map(s => {
                const isSelected = selectedServices.find(x => x.id === s.id);
                const isAllowedByPromo = !activePromo?.service_ids || activePromo.service_ids.length === 0 || activePromo.service_ids.includes(s.id);

                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      if (activePromo) return; // Bloqueo total si hay promo
                      toggleService(s);
                    }}
                    className={`p-4 rounded-2xl border transition-all active:scale-[0.98] 
                      ${!isAllowedByPromo ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'} 
                      ${isSelected ? 'bg-[#f59e0b] border-[#f59e0b]' : 'bg-white/5 border-white/5'} 
                      ${activePromo ? 'pointer-events-none' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className={`font-black uppercase text-xs ${isSelected ? 'text-black' : 'text-white'}`}>{s.name}</p>
                        <p className={`text-[9px] font-bold ${isSelected ? 'text-black/60' : 'text-zinc-500'}`}>{s.duration} min</p>
                      </div>
                      <p className={`font-black italic ${isSelected ? 'text-black' : 'text-[#f59e0b]'}`}>${formatPrice(s.price)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>


          {selectedServices.length > 0 && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">2. Elige la Fecha</h3>
              <input
                type="date"
                className={`w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-black uppercase tracking-widest outline-none focus:border-[#f59e0b] text-white ${activePromo && activePromo.start_date.split('T')[0] === activePromo.end_date.split('T')[0] ? 'opacity-50' : ''}`}
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                min={activePromo ? activePromo.start_date.split('T')[0] : new Date().toISOString().split('T')[0]}
                max={activePromo ? activePromo.end_date.split('T')[0] : undefined}
                disabled={!!(activePromo && activePromo.start_date.split('T')[0] === activePromo.end_date.split('T')[0])}
                required
              />
              {activePromo && activePromo.start_date.split('T')[0] === activePromo.end_date.split('T')[0] && (
                <p className="text-[8px] font-bold text-[#f59e0b] uppercase tracking-widest ml-1">Fecha fija por promoción</p>
              )}
            </div>
          )}

          {selectedDate && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">3. Selecciona el Horario</h3>
              {fetchingSlots ? (
                <p className="text-[10px] font-black uppercase tracking-widest text-center py-4 animate-pulse text-white/40">Buscando espacios...</p>
              ) : selectedServices.length === 0 ? (
                <p className="text-[10px] text-amber-500 font-black uppercase text-center py-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">No hay servicios seleccionados para esta oferta</p>
              ) : availableSlots.length === 0 ? (
                <div className="py-8 px-6 bg-red-500/5 rounded-[2rem] border border-red-500/10 text-center space-y-2">
                  <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">No hay turnos disponibles</p>
                  <p className="text-[8px] text-red-500/50 font-bold uppercase tracking-widest">El barbero podría estar cerrado o sin agenda este día ({format(new Date(selectedDate + 'T12:00:00'), 'EEEE')})</p>
                </div>
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

          <div className="pt-6 border-t border-white/10 space-y-6">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Total Estimado</p>
                <div className="flex items-baseline gap-3">
                  <p className="text-3xl font-black italic text-[#f59e0b] leading-none">${formatPrice(discountedPrice)}</p>
                </div>
              </div>
              <p className="text-[10px] font-black text-zinc-500">{totalDuration} min</p>
            </div>

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
  );
}
