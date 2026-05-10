/* eslint-disable @next/next/no-img-element */
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { Star, User, Calendar } from 'lucide-react';
import { Profile } from '@/types';

export default function SelectBarberPage() {
  const [barbers, setBarbers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const clientId = params.id as string;
  const promoId = searchParams.get('promo_id');

  useEffect(() => {
    async function loadData() {
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
    <div className="flex items-center justify-center p-20">
      <div className="w-12 h-12 border-4 border-[#f59e0b] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
         <p className="text-[#f59e0b] text-[10px] font-black uppercase tracking-[0.4em]">Reserva tu Experiencia</p>
         <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none text-white">Elige tu <span className="text-[#f59e0b]">Maestro</span></h1>
         <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em]">Selecciona al barbero de tu preferencia</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {barbers.map(barber => (
           <div key={barber.id} className="bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-6 space-y-6 relative hover:bg-white/[0.06] transition-all group">
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
                      <h3 className="text-xl font-black uppercase tracking-tighter truncate leading-none mb-1 text-white">{barber.nickname || barber.name}</h3>
                      <div className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest shrink-0 ${barber.is_active ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                         {barber.is_active ? 'ON' : 'OFF'}
                      </div>
                    </div>
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest truncate">{barber.name}</p>
                    <div className="flex items-center gap-1.5 text-[#f59e0b] mt-2">
                       <Star size={12} fill="currentColor" />
                       <span className="text-[9px] font-black tracking-[0.2em] uppercase">Master Barber</span>
                    </div>
                 </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex gap-3">
                 <button 
                   disabled={!barber.is_active}
                   onClick={() => router.push(`/dashboard/client/${clientId}/reservas/barber/${barber.id}${promoId ? `?promo_id=${promoId}` : ''}`)}
                   className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${barber.is_active ? 'bg-[#f59e0b] text-black' : 'bg-zinc-800 text-white/20'}`}
                 >
                    <Calendar size={16} /> Reservar
                 </button>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}
