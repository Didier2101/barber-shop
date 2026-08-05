'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Sparkles, ChevronRight, Calendar, Heart, Flower2 } from 'lucide-react';
import { format } from 'date-fns';
import { Promotion, LoyaltySettings, Service } from '@/types';
import { formatPrice } from '@/lib/format';
import { motion, Variants } from 'framer-motion';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activePromos, setActivePromos] = useState<Promotion[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltySettings | null>(null);
  const [isLoyaltyExpanded, setIsLoyaltyExpanded] = useState(false);

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
    staleTime: 1000 * 60 * 60,
  });

  useEffect(() => {
    async function loadData() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: promos } = await supabase.from('promotions')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', today.toISOString())
        .limit(3);
      if (promos) setActivePromos(promos);

      const { data: loyaltyData } = await supabase.from('loyalty_settings')
        .select('*')
        .eq('id', 1);
      
      if (loyaltyData && loyaltyData.length > 0) {
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

  const fadeIn: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  return (
    <main className="min-h-screen text-zinc-900 overflow-hidden font-sans selection:bg-brand selection:text-white">
      
      <section 
        className="relative h-screen w-full pt-8 flex items-end bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1000')" }}
      >
        <div className="absolute inset-0 bg-bg-base/90" />

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-full flex relative z-10">
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-16 h-full">
            
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-start self-center"
            >
              <motion.div variants={fadeIn} className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-brand rounded-2xl shadow-lg mb-6">
                    <Flower2 size={28} className="text-white" />
                  </div>
                <p className="text-[10px] uppercase tracking-[0.32em] text-brand ml-1 mb-3 font-black">Alta Estética</p>
              </motion.div>
              
              <motion.h1 variants={fadeIn} className="text-zinc-900 text-6xl xl:text-8xl font-black leading-[0.95] tracking-tight uppercase italic">
                Alma<br/>
                <span className="text-brand">Spa</span>
              </motion.h1>
              
              <motion.p variants={fadeIn} className="text-zinc-900/60 text-lg mt-6 max-w-xl leading-relaxed font-medium">
                Descubre el arte del cuidado personal. Diseños exclusivos, tratamientos premium y una experiencia diseñada para elevar tu belleza natural.
              </motion.p>
              
              <motion.div variants={fadeIn} className="pt-8">
                <Link 
                  href={isLoggedIn && userId ? `/dashboard/client/${userId}/reservas/select-barber` : "/register"} 
                  className="inline-flex bg-brand hover:bg-accent-green hover:text-white text-white h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all items-center justify-center gap-3 active:scale-[0.98] shadow-xl shadow-brand/20 px-8"
                >
                  RESERVA TU CITA
                  <ChevronRight size={16} />
                </Link>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="w-full max-w-md mx-auto lg:mx-0 lg:justify-self-end self-end"
            >
              <div className="rounded-t-[2.5rem] rounded-b-none border-x border-t border-accent-green/30 border-b-0 bg-bg-base/80 backdrop-blur-xl p-8 sm:p-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] relative aspect-[4/5] overflow-hidden">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img 
                   src="https://images.unsplash.com/photo-1610992015732-2449b76344bc?q=80&w=1031&auto=format&fit=crop" 
                   alt="Mano de las personas sobre tela blanca"
                   className="absolute inset-0 w-full h-full object-cover"
                   onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" }}
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent pointer-events-none"></div>
                 <div className="absolute bottom-8 left-8 right-8 z-10 text-center">
                   <p className="text-[10px] font-black tracking-widest text-brand uppercase bg-bg-base/90 backdrop-blur-md inline-block px-6 py-3 rounded-full shadow-lg border border-accent-green/20">
                     Experiencia Alma
                   </p>
                 </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {activePromos.length > 0 && (
        <section className="h-screen bg-surface relative overflow-hidden flex flex-col justify-end">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[150vw] h-96 bg-bg-base rounded-[100%] blur-[80px] -z-10"></div>
          
          <div className="max-w-7xl mx-auto px-6 w-full flex flex-col h-full justify-end">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8 relative z-10"
            >
              <div className="space-y-4">
                <motion.div variants={fadeIn} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-accent-green/20 flex items-center justify-center text-accent-green">
                    <Sparkles size={16} />
                  </span>
                  <span className="text-accent-green font-bold tracking-[0.2em] uppercase text-xs">Exclusivo para ti</span>
                </motion.div>
                <motion.h2 variants={fadeIn} className="text-5xl md:text-7xl font-black tracking-tighter text-zinc-900">
                  Ofertas <span className="font-serif italic text-brand font-light">Especiales</span>
                </motion.h2>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 items-end">
              {activePromos.map((promo, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.2 }}
                  key={promo.id} 
                  className="rounded-t-[2.5rem] rounded-b-none border-x border-t border-accent-green/30 border-b-0 bg-bg-base p-8 sm:p-10 relative group overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-all duration-500 hover:border-brand/30 hover:shadow-brand/20 h-full flex flex-col"
                >
                   <div className="space-y-6 relative z-10 flex-grow">
                      <div className="text-brand bg-brand/10 w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
                        <Heart size={24} strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold tracking-tight text-zinc-900 mb-3">{promo.name}</h3>
                        <p className="text-zinc-500 font-light">{promo.description}</p>
                      </div>
                      <div className="text-5xl lg:text-6xl font-serif italic text-brand pt-4">
                         {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : 
                          promo.discount_type === 'fixed' ? `${formatPrice(promo.discount_value)}` : 'FREE'}
                      </div>
                   </div>
                   
                   <div className="mt-12 pt-6 border-t border-accent-green/20 relative z-10">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent-green">
                         <Calendar size={14} />
                         Válido hasta {format(new Date(promo.end_date), 'dd MMM')}
                      </div>
                   </div>
                   
                   <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-700 ease-out"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {loyalty && loyalty.is_enabled && (
        <section className="py-32 bg-bg-base relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-accent-green rounded-[40px] p-10 md:p-16 relative overflow-hidden text-white shadow-2xl shadow-accent-green/20"
            >
                <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, #ffffff 0%, transparent 50%)' }}></div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                  <div className="space-y-8">
                      <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-md px-6 py-2 rounded-full border border-white/30">
                        <Sparkles size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Rewards Club</span>
                      </div>
                      
                      <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-tight">
                        Tu Belleza <br />
                        <span className="font-serif italic font-light">Te Premia</span>
                      </h2>
                      
                      <div className="max-w-md">
                        <p className={`text-white/90 text-lg font-light leading-relaxed transition-all duration-300 ${isLoyaltyExpanded ? '' : 'line-clamp-3'}`}>
                          {loyalty.description || 'Únete a nuestro club exclusivo. Cada visita te acerca más a tu próximo tratamiento de lujo totalmente gratis.'}
                        </p>
                        {((loyalty.description?.length || 100) > 100) && (
                          <button 
                            onClick={() => setIsLoyaltyExpanded(!isLoyaltyExpanded)}
                            className="text-brand font-bold text-sm mt-2 hover:text-white transition-colors underline"
                          >
                            {isLoyaltyExpanded ? 'Leer menos' : 'Leer más'}
                          </button>
                        )}
                      </div>

                      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 inline-block">
                        <div className="text-4xl font-black mb-2">{loyalty.appointments_threshold} <span className="text-lg font-normal font-serif italic">Visitas</span></div>
                        <div className="text-sm font-bold uppercase tracking-widest opacity-80">= 1 Servicio Gratis</div>
                      </div>
                  </div>
                  
                  <div className="flex justify-center lg:justify-end">
                     <div className="w-full max-w-sm aspect-square bg-surface rounded-[30px] rotate-3 flex items-center justify-center p-8 shadow-2xl relative transition-transform hover:rotate-0 duration-500">
                        <div className="absolute -top-6 -right-6 bg-brand text-white w-24 h-24 rounded-full flex flex-col items-center justify-center -rotate-12 shadow-xl border-4 border-bg-base z-20">
                           <span className="text-xs font-bold uppercase tracking-widest">VIP</span>
                           <span className="text-2xl font-serif italic">Only</span>
                        </div>
                        <h3 className="text-5xl text-accent-green font-black text-center uppercase tracking-tighter leading-none">
                           Join<br/><span className="text-zinc-900 font-serif italic font-light">The<br/>Club</span>
                        </h3>
                     </div>
                  </div>
                </div>
            </motion.div>
          </div>
        </section>
      )}

      <section className="py-32 bg-surface">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-zinc-900 mb-6">
              Nuestros <span className="font-serif italic font-light text-brand">Servicios</span>
            </h2>
            <p className="text-zinc-500 font-light text-lg max-w-2xl mx-auto mb-20">Diseñados para ofrecerte relajación absoluta y resultados impecables.</p>
          </motion.div>
          
          <div className="relative flex overflow-hidden w-full group py-4">
            <div className="flex animate-marquee gap-6 whitespace-nowrap min-w-max">
              {[...services, ...services].map((service, i) => (
                <div 
                  key={`${service.id}-${i}`} 
                  className="w-80 md:w-96 flex-shrink-0 bg-bg-base p-8 rounded-3xl text-left border border-accent-green/20 hover:-translate-y-2 hover:shadow-xl hover:shadow-accent-green/10 transition-all duration-300 flex flex-col whitespace-normal"
                >
                  <h3 className="text-xl font-bold text-zinc-900 mb-2">{service.name}</h3>
                  <p className="text-sm text-zinc-500 font-light mb-8 line-clamp-2 flex-grow">{service.description || ''}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-lg font-serif italic font-bold text-brand">{formatPrice(service.price)}</span>
                    <span className="text-xs font-bold text-accent-green uppercase tracking-widest">{service.duration} MIN</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Gradient overlays for smooth fading edges */}
            <div className="absolute inset-y-0 left-0 w-12 md:w-24 bg-gradient-to-r from-bg-base to-transparent z-10 pointer-events-none"></div>
            <div className="absolute inset-y-0 right-0 w-12 md:w-24 bg-gradient-to-l from-bg-base to-transparent z-10 pointer-events-none"></div>
          </div>
        </div>
      </section>

      <footer className="bg-bg-base py-20 border-t border-accent-green/20">
         <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center space-y-8">
            <h2 className="text-4xl font-black tracking-tighter text-zinc-900">
              Alma<span className="text-brand italic font-serif font-light">Spa</span>
            </h2>
            <p className="text-zinc-500 font-light text-sm max-w-sm">Elevando los estándares de belleza con cada detalle.</p>
            <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-accent-green">
               <Link href="/login" className="hover:text-brand transition-colors">Ingresar</Link>
               <Link href="/register" className="hover:text-brand transition-colors">Registrarse</Link>
            </div>
            <div className="pt-10 w-full text-xs text-zinc-400 font-light border-t border-accent-green/10">
               © {new Date().getFullYear()} Alma Spa. Todos los derechos reservados.
            </div>
         </div>
      </footer>

    </main>
  );
}


