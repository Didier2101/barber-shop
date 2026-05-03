/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { Scissors, Star } from 'lucide-react';

type Barber = {
  id: string;
  name: string;
  nickname?: string;
  avatar_url?: string;
  rating?: number;
  is_active: boolean;
};

export default function BarberosPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function loadBarbers() {
      try {
        setLoading(true);
        setError('');
        const response = await fetch(`/api/barbers?page=${page}&limit=10`, { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Error desconocido');
        setBarbers((payload.data as Barber[]) || []);
        setTotalPages(payload.pagination?.totalPages || 1);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error inesperado';
        setError(message.includes('Too many requests') ? 'Demasiadas solicitudes. Espera un minuto y reintenta.' : 'No pudimos cargar los barberos.');
      } finally {
        setLoading(false);
      }
    }

    loadBarbers();
  }, [page, reloadKey]);

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/nathon-oski-EW_rqoSdDes-unsplash.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-black/90" aria-hidden="true" />
      <section className="relative z-10 container mx-auto px-4 sm:px-6 pt-28 pb-20">
        <div className="flex flex-col items-center text-center mb-14 sm:mb-20">
          <span className="text-[#f59e0b] font-black uppercase tracking-[0.4em] text-xs mb-4">Equipo Completo</span>
          <h1 className="uppercase font-black text-3xl sm:text-4xl md:text-6xl text-white leading-[0.9]">
            Nuestros <span className="text-[#f59e0b] italic font-light">Barberos</span>
          </h1>
        </div>

        {loading ? (
          <div className="p-14 border-2 border-dashed border-white/20 rounded-3xl text-center bg-black/20 backdrop-blur-sm">
            <Scissors size={42} className="mx-auto text-[#f59e0b] mb-4" />
            <p className="text-white/70 font-black uppercase tracking-[0.2em] text-xs">Cargando barberos...</p>
          </div>
        ) : error ? (
          <div className="p-10 border border-red-300/35 rounded-3xl text-center bg-red-500/10 backdrop-blur-sm">
            <p className="text-red-100 font-semibold">{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey(prev => prev + 1)}
              className="mt-4 px-4 py-2 rounded-lg border border-red-200/30 text-red-100"
            >
              Reintentar
            </button>
          </div>
        ) : barbers.length === 0 ? (
          <div className="p-14 border-2 border-dashed border-white/20 rounded-3xl text-center bg-black/20 backdrop-blur-sm">
            <Scissors size={42} className="mx-auto text-[#f59e0b] mb-4" />
            <p className="text-white/70 font-black uppercase tracking-[0.2em] text-xs">No hay barberos activos por ahora.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10">
            {barbers.map(barber => (
              <article key={barber.id} className="flex flex-col group">
                <div className="relative w-full pb-[130%] overflow-hidden rounded-[2.5rem] mb-7 shadow-2xl">
                  {barber.avatar_url ? (
                    <img src={barber.avatar_url} alt={barber.name} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 w-full h-full bg-black/40 flex items-center justify-center">
                      <Scissors size={64} className="text-gray-200 dark:text-white/5" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-70" />
                </div>
                <div className="flex flex-col items-center text-center">
                  <h2 className="mb-1 uppercase text-2xl font-black tracking-tighter text-white leading-none">
                    {barber.nickname || barber.name}
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Master Barber</p>
                  {barber.rating ? (
                    <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full border border-[#f59e0b]/40 bg-[#f59e0b]/10">
                      <Star size={11} fill="#f59e0b" className="text-[#f59e0b]" />
                      <span className="text-[10px] font-black text-[#f59e0b]">{barber.rating.toFixed(1)}</span>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-white/20 text-white/80 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <p className="text-white/75 text-sm font-bold">Pagina {page} de {totalPages}</p>
          <button
            type="button"
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-lg border border-white/20 text-white/80 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      </section>
    </main>
  );
}
