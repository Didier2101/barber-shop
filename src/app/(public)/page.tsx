/* eslint-disable @next/next/no-img-element */
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Star, Scissors, Sparkles, ChevronRight, Calendar, Gift, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Promotion, LoyaltySettings, Service } from '@/types';
import { formatPrice } from '@/lib/format';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [, setGlobalStats] = useState({ totalServices: 0, totalBarbers: 0 });
  const [activePromos, setActivePromos] = useState<Promotion[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltySettings | null>(null);
  const [showFullRules, setShowFullRules] = useState(false);

  const { data: services = [] } = useQuery({
    queryKey: ['public-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as Service[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  useEffect(() => {
    async function loadData() {
      // Load stats
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('services_completed')
        .eq('role', 'barber')
        .eq('is_active', true);
        
      const { count: barbersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'barber')
        .eq('is_active', true);
      
      let totalSrv = 0;
      if (profilesData) {
        totalSrv = profilesData.reduce((acc, p) => acc + (p.services_completed || 0), 0);
      }
      setGlobalStats({ totalServices: totalSrv, totalBarbers: barbersCount || 0 });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: promos } = await supabase.from('promotions')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', today.toISOString())
        .limit(3);
      if (promos) setActivePromos(promos);

      const { data: loyaltyData, error: loyaltyError } = await supabase.from('loyalty_settings')
        .select('id, appointments_threshold, is_enabled, start_date, end_date, target_audience, description')
        .eq('id', 1);
      
      console.log('Loyalty Data:', loyaltyData);
      if (loyaltyError) console.error('Loyalty Error:', loyaltyError);

      if (!loyaltyError && loyaltyData && loyaltyData.length > 0) {
        setLoyalty(loyaltyData[0] as LoyaltySettings);
      }
    }
    
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        setUserId(session.user.id);
      }
    }
    
    checkUser();
    loadData();
  }, []);

  return (
    <main className="bg-black min-h-screen transition-colors duration-300">
      
      {/* IMMERSIVE HERO SECTION */}
      <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
        {/* Background Image with Cinematic Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/nathon-oski-EW_rqoSdDes-unsplash.jpg" 
            alt="BarberShop Hero" 
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/80 to-black" aria-hidden="true"></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-6 py-2 rounded-full">
            <Sparkles className="text-[#f59e0b]" size={14} />
            <span className="text-[#f59e0b] font-black uppercase tracking-[0.4em] text-[10px]">
              Tradición & Vanguardia
            </span>
          </div>
          
          <h1 className="text-white text-[clamp(3rem,12vw,8rem)] font-black leading-[0.85] tracking-tighter uppercase italic">
            Barber<span className="text-[#f59e0b]">Shop</span>
          </h1>
          
          <p className="text-white/60 text-lg md:text-2xl max-w-2xl mx-auto font-medium leading-relaxed italic">
            &quot;No solo cortamos cabello, definimos estilos de vida.&quot;
          </p>

          <div className="flex justify-center pt-4">
            <Link 
              href={isLoggedIn && userId ? `/dashboard/client/${userId}/reservas/select-barber` : "/register"} 
              className="bg-[#f59e0b] text-black px-16 py-6 rounded-[2.5rem] font-black tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(245,158,11,0.5)] uppercase text-[11px]"
            >
              {isLoggedIn ? "AGENDAR NUEVA CITA" : "RESERVAR MI CITA AHORA"}
            </Link>
          </div>
        </div>

        {/* Floating Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
           <div className="w-px h-12 bg-gradient-to-b from-[#f59e0b] to-transparent" />
        </div>
      </section>

      {/* PROMOTIONS SECTION - DYNAMIC */}
      {activePromos.length > 0 && (
        <section className="py-24 bg-black relative">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="space-y-3">
                <p className="text-[#f59e0b] text-[10px] font-black uppercase tracking-[0.4em]">Oportunidades Flash</p>
                <h2 className="text-5xl font-black uppercase tracking-tighter italic text-white">Ofertas <span className="text-[#f59e0b]">Limitadas</span></h2>
              </div>
              <Link href="/login" className="text-white/40 hover:text-[#f59e0b] transition-colors text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                Ver más <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {activePromos.map(promo => (
                <div key={promo.id} className="bg-white/[0.03] border border-white/5 rounded-[3rem] p-10 flex flex-col justify-between hover:border-[#f59e0b]/30 transition-all group relative overflow-hidden">
                   <div className="space-y-6 relative z-10">
                      <div className="w-12 h-12 bg-[#f59e0b]/10 rounded-2xl flex items-center justify-center text-[#f59e0b]">
                         <Gift size={24} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black uppercase tracking-tight italic text-white mb-2">{promo.name}</h3>
                        <p className="text-sm text-white/40 font-medium italic">&quot;{promo.description}&quot;</p>
                      </div>
                      <div className="text-5xl font-black text-[#f59e0b] italic tracking-tighter">
                         {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : 
                          promo.discount_type === 'fixed' ? `{formatPrice(promo.discount_value)}` : 'FREE'}
                         <span className="text-xs uppercase not-italic ml-2 opacity-50 tracking-widest">Off</span>
                      </div>
                   </div>
                   <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                         <Calendar size={12} />
                         Válido hasta {format(new Date(promo.end_date), 'dd MMM')}
                      </div>
                   </div>
                   <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#f59e0b]/5 blur-3xl rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}


      {/* DYNAMIC LOYALTY SECTION */}
      {loyalty && loyalty.is_enabled && (
        <section className="py-24 bg-[#0a0a0a]">
          <div className="container mx-auto px-6">
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/5 rounded-[3rem] p-8 md:p-12 relative overflow-hidden group">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center relative z-10">
                  <div className="space-y-6">
                      <div className="inline-flex items-center gap-3 bg-amber-500/10 px-5 py-2 rounded-full text-amber-500 border border-amber-500/20">
                        <Gift size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Programa Elite Rewards</span>
                      </div>
                      <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic text-white leading-none">
                        Tu Lealtad <br />
                        Tiene <span className="text-[#f59e0b]">Premio</span>
                      </h2>
                      <div className="space-y-3">
                        <p className={`text-white/40 text-base font-medium max-w-md italic leading-relaxed ${!showFullRules ? 'line-clamp-3' : ''}`}>
                          {loyalty.description || 'Únete a nuestro club exclusivo. Cada visita te acerca más a tu próximo servicio de lujo totalmente gratis.'}
                        </p>
                        {loyalty.description && (
                          <button 
                            onClick={() => setShowFullRules(!showFullRules)}
                            className="text-[#f59e0b] text-[10px] font-bold uppercase tracking-[0.2em] hover:opacity-80 transition-opacity flex items-center gap-2"
                          >
                            {showFullRules ? 'Ver menos reglas' : 'Leer todas las reglas'}
                            <ChevronRight size={12} className={showFullRules ? '-rotate-90 transition-transform' : 'rotate-90 transition-transform'} />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                         <Calendar size={12} className="text-amber-500" />
                         Válido hasta {loyalty.end_date ? format(new Date(loyalty.end_date), 'dd MMM yyyy') : 'Aviso previo'}
                      </div>
                  </div>
                  <div className="relative aspect-square max-w-[250px] mx-auto flex items-center justify-center">
                      <div className="absolute inset-0 bg-[#f59e0b]/10 blur-[80px] rounded-full animate-pulse" />
                      <Scissors size={100} className="text-white/5 rotate-12" />
                      <div className="absolute bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-6 rounded-[2rem] shadow-2xl rotate-[-5deg] text-center w-full">
                        <div className="flex justify-center mb-3">
                           <Star size={40} className="text-[#f59e0b]" fill="currentColor" />
                        </div>
                        <p className="text-white text-3xl font-black uppercase italic tracking-tighter mb-1">
                           {loyalty.appointments_threshold} <span className="text-sm">Citas</span>
                        </p>
                        <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em]">Para tu servicio GRATIS</p>
                      </div>
                  </div>
                </div>
                <div className="absolute -right-10 -bottom-10 opacity-[0.02] pointer-events-none">
                   <Star size={200} className="text-white" />
                </div>
            </div>
          </div>
        </section>
      )}

      {/* SUBTLE SERVICES SECTION */}
      {services.length > 0 && (
        <section className="py-24 bg-[#030303] relative border-t border-white/5">
          <div className="container mx-auto px-6">
            <div className="flex flex-col items-center text-center mb-16">
              <p className="text-[#f59e0b] text-[10px] uppercase tracking-[0.4em] font-black mb-4">Nuestro Arte</p>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-white">Servicios <span className="text-white/40">Exclusivos</span></h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
              {services.map(service => (
                <div key={service.id} className="p-6 rounded-3xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all flex flex-col gap-4">
                   <div className="flex justify-between items-start">
                     <h3 className="text-white font-bold uppercase tracking-wide text-sm">{service.name}</h3>
                     <span className="text-[#f59e0b] font-black italic">{formatPrice(service.price)}</span>
                   </div>
                   <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest font-bold">
                     <Clock size={12} />
                     {service.duration} Minutos
                   </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

    </main>
  );
}
