/* eslint-disable @next/next/no-img-element */
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { Star, User, Calendar, Scissors, ArrowLeft } from 'lucide-react';
import { Profile } from '@/types';
import { motion } from 'framer-motion';

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
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[120] bg-bg-base flex flex-col overflow-hidden"
    >
      {/* Header Fijo */}
      <div className="shrink-0 h-14 border-b border-accent-green/20 bg-surface/95 backdrop-blur-xl flex items-center justify-between px-6 z-50 relative">
        <div className="flex items-center gap-3">
          <Scissors size={16} className="text-brand" />
          <div>
            <h2 className="text-base font-black text-zinc-900 uppercase tracking-tighter italic leading-none">Reservar</h2>
          </div>
        </div>
        <button
          onClick={() => router.back()}
          className="w-10 h-10 text-zinc-400 flex items-center justify-center active:scale-90 transition-all hover:text-zinc-900"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-20">
        <div className="max-w-lg mx-auto pt-6 space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none text-zinc-900 mb-6">Elige tu <span className="text-brand font-light">Especialista</span></h1>

          <div className="border-t border-accent-green/10">
            {barbers.map(barber => (
              <div key={barber.id} className="border-b border-accent-green/10 py-5 flex items-center gap-4">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-100 shrink-0">
                  {barber.avatar_url ? (
                    <img src={barber.avatar_url} alt={barber.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                      <User size={24} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black uppercase tracking-tighter text-zinc-900 truncate">{barber.nickname || barber.name}</h3>
                    <span className={`text-[6px] font-black uppercase tracking-widest shrink-0 ${barber.is_active ? 'text-emerald-500' : 'text-red-400'}`}>
                      {barber.is_active ? '● Activo' : '● Inactivo'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-brand mt-0.5">
                    <Star size={9} fill="currentColor" />
                    <span className="text-[8px] font-black tracking-widest uppercase">Profesional</span>
                  </div>
                </div>

                {/* Acción */}
                <button
                  disabled={!barber.is_active}
                  onClick={() => router.push(`/dashboard/client/${clientId}/reservas/barber/${barber.id}${promoId ? `?promo_id=${promoId}` : ''}`)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${barber.is_active ? 'bg-brand text-white hover:bg-accent-green active:scale-95' : 'bg-zinc-100 text-zinc-400'}`}
                >
                  <Calendar size={13} /> Reservar
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
