/* eslint-disable @next/next/no-img-element */
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Star, Scissors, Sparkles, ChevronRight, Calendar, Gift } from 'lucide-react';
import { format } from 'date-fns';
import { Promotion, LoyaltySettings } from '@/types';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [, setGlobalStats] = useState({ totalServices: 0, totalBarbers: 0 });
  const [activePromos, setActivePromos] = useState<Promotion[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltySettings | null>(null);

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

      const { data: promos } = await supabase.from('promotions')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString())
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
      if (session) setIsLoggedIn(true);
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
              href={isLoggedIn ? "/dashboard" : "/register"} 
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
              <Link href="/dashboard" className="text-white/40 hover:text-[#f59e0b] transition-colors text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
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
                          promo.discount_type === 'fixed' ? `$${new Intl.NumberFormat('de-DE').format(promo.discount_value)}` : 'FREE'}
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
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/5 rounded-[4rem] p-12 md:p-20 relative overflow-hidden group">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                  <div className="space-y-8">
                      <div className="inline-flex items-center gap-4 bg-amber-500/10 px-6 py-2 rounded-full text-amber-500 border border-amber-500/20">
                        <Gift size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Programa Elite Rewards</span>
                      </div>
                      <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic text-white leading-none">
                        Tu Lealtad <br />
                        Tiene <span className="text-[#f59e0b]">Premio</span>
                      </h2>
                      <p className="text-white/40 text-lg md:text-xl font-medium max-w-md italic leading-relaxed">
                        {loyalty.description || 'Únete a nuestro club exclusivo. Cada visita te acerca más a tu próximo servicio de lujo totalmente gratis.'}
                      </p>
                      <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-zinc-500">
                         <Calendar size={14} className="text-amber-500" />
                         Válido hasta {loyalty.end_date ? format(new Date(loyalty.end_date), 'dd MMM yyyy') : 'Aviso previo'}
                      </div>
                  </div>
                  <div className="relative aspect-square flex items-center justify-center">
                      <div className="absolute inset-0 bg-[#f59e0b]/10 blur-[120px] rounded-full animate-pulse" />
                      <Scissors size={200} className="text-white/5 rotate-12" />
                      <div className="absolute bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] shadow-2xl rotate-[-5deg] text-center">
                        <div className="flex justify-center mb-4">
                           <Star size={60} className="text-[#f59e0b]" fill="currentColor" />
                        </div>
                        <p className="text-white text-5xl font-black uppercase italic tracking-tighter mb-2">
                           {loyalty.appointments_threshold} <span className="text-lg">Citas</span>
                        </p>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Para tu servicio GRATIS</p>
                      </div>
                  </div>
                </div>
                <div className="absolute -right-20 -bottom-20 opacity-[0.02] pointer-events-none">
                   <Star size={400} className="text-white" />
                </div>
            </div>
          </div>
        </section>
      )}

      {/* EXPLORE SECTION */}
      <section className="py-32 bg-[#050505]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center text-center mb-20">
            <h2 className="uppercase font-black text-4xl md:text-7xl tracking-tighter mb-6 text-white italic">
              Vive La <span className="text-[#f59e0b]">Experiencia</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/servicios" className="group p-12 rounded-[3rem] border border-white/5 bg-white/[0.02] hover:border-[#f59e0b]/50 transition-all relative overflow-hidden">
              <p className="text-[#f59e0b] text-[10px] uppercase tracking-[0.4em] font-black mb-6">El Arte</p>
              <h3 className="text-white text-3xl font-black uppercase tracking-tight italic">Servicios</h3>
              <ChevronRight className="absolute bottom-10 right-10 text-white/10 group-hover:text-[#f59e0b] transition-colors" size={40} />
            </Link>
            <Link href="/barberos" className="group p-12 rounded-[3rem] border border-white/5 bg-white/[0.02] hover:border-[#f59e0b]/50 transition-all relative overflow-hidden">
              <p className="text-[#f59e0b] text-[10px] uppercase tracking-[0.4em] font-black mb-6">Los Maestros</p>
              <h3 className="text-white text-3xl font-black uppercase tracking-tight italic">Barberos</h3>
              <ChevronRight className="absolute bottom-10 right-10 text-white/10 group-hover:text-[#f59e0b] transition-colors" size={40} />
            </Link>
            <Link href="/nosotros" className="group p-12 rounded-[3rem] border border-white/5 bg-white/[0.02] hover:border-[#f59e0b]/50 transition-all relative overflow-hidden">
              <p className="text-[#f59e0b] text-[10px] uppercase tracking-[0.4em] font-black mb-6">Nuestra Alma</p>
              <h3 className="text-white text-3xl font-black uppercase tracking-tight italic">Nosotros</h3>
              <ChevronRight className="absolute bottom-10 right-10 text-white/10 group-hover:text-[#f59e0b] transition-colors" size={40} />
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
