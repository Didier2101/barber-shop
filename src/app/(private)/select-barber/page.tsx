/* eslint-disable @next/next/no-img-element */
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Scissors, Star, User, ArrowLeft, Eye, Calendar } from 'lucide-react';
import Link from 'next/link';

import { useSearchParams } from 'next/navigation';
import { Profile } from '@/types';

export default function SelectBarberPage() {
  const [barbers, setBarbers] = useState<Profile[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const promoId = searchParams.get('promo_id');

  useEffect(() => {
    async function loadData() {
      // Load user profile for background
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: pData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (pData) setUserProfile(pData);
      }

      // Load barbers
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'barber')
        .eq('is_active', true);
      
      if (data) setBarbers(data);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#f59e0b] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-black text-white relative">
      
      {/* Background Hero Style */}
      <div className="fixed inset-0 z-0">
        {userProfile?.avatar_url ? (
          <img src={userProfile.avatar_url} alt="BG" className="w-full h-full object-cover opacity-20" />
        ) : (
          <img src="/nathon-oski-EW_rqoSdDes-unsplash.jpg" alt="Barber Shop" className="w-full h-full object-cover opacity-20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
      </div>

      {/* Mobile Restriction Overlay */}
      <div className="fixed inset-0 z-[1000] bg-black flex-col items-center justify-center p-10 text-center hidden md:flex">
        <Scissors size={64} className="text-amber-500 mb-6 animate-bounce" />
        <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-4">Experiencia Móvil</h2>
        <p className="text-zinc-500 max-w-md uppercase text-[10px] font-bold tracking-widest leading-relaxed">
          Accede desde tu smartphone para reservar.
        </p>
      </div>

      <div className="relative z-10 max-w-lg mx-auto p-4 pt-24 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-4">
           <button onClick={() => router.push('/dashboard')} className="w-fit flex items-center gap-3 bg-black/60 backdrop-blur-2xl px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 active:scale-90 transition-all">
              <ArrowLeft size={16} /> Volver
           </button>
           <div className="space-y-1">
              <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Elige tu <span className="text-[#f59e0b]">Maestro</span></h1>
              <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em]">Selecciona al barbero de tu preferencia</p>
           </div>
        </div>

        {/* Barber List */}
        <div className="grid grid-cols-1 gap-5">
           {barbers.map(barber => (
             <div key={barber.id} className="bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-[2rem] p-5 space-y-5 relative active:scale-[0.98] transition-all">
                
                <div className="flex items-center gap-5">
                   <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                      {barber.avatar_url ? (
                        <img src={barber.avatar_url} alt={barber.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/10">
                           <User size={30} />
                        </div>
                      )}
                   </div>
                   
                   <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-black uppercase tracking-tighter truncate leading-none mb-1">{barber.nickname || barber.name}</h3>
                        <div className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest shrink-0 ${barber.is_online ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                           {barber.is_online ? 'ON' : 'OFF'}
                        </div>
                      </div>
                      <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest truncate">{barber.name}</p>
                      <div className="flex items-center gap-1.5 text-amber-500 mt-2">
                         <Star size={12} fill="currentColor" />
                         <span className="text-[9px] font-black tracking-[0.2em] uppercase">Master Barber</span>
                      </div>
                   </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex gap-3">
                   <Link 
                     href={`/profile/${barber.id}`}
                     className="flex-1 bg-white/5 text-white py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                   >
                      <Eye size={16} /> Perfil
                   </Link>
                   <button 
                     disabled={!barber.is_online}
                     onClick={() => router.push(`/barber/${barber.id}${promoId ? `?promo_id=${promoId}` : ''}`)}
                     className={`flex-[1.5] py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${barber.is_online ? 'bg-[#f59e0b] text-black' : 'bg-zinc-800 text-white/20'}`}
                   >
                      <Calendar size={16} /> Reservar
                   </button>
                </div>
             </div>
           ))}
        </div>
      </div>
    </main>
  );
}
