'use client';

import { useEffect, useState } from 'react';
import { Clock, Scissors } from 'lucide-react';

type Service = {
  id: string;
  name: string;
  price: number;
  duration: number;
  is_active: boolean;
};

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function loadServices() {
      try {
        setLoading(true);
        setError('');
        const response = await fetch(`/api/services?page=${page}&limit=10`, { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Error desconocido');
        setServices((payload.data as Service[]) || []);
        setTotalPages(payload.pagination?.totalPages || 1);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error inesperado';
        setError(message.includes('Too many requests') ? 'Demasiadas solicitudes. Espera un minuto y reintenta.' : 'No pudimos cargar los servicios.');
      } finally {
        setLoading(false);
      }
    }

    loadServices();
  }, [page, reloadKey]);

  const formatPrice = (price: number) => new Intl.NumberFormat('de-DE').format(price);

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
        <div className="flex flex-col items-center text-center mb-14">
          <span className="text-[#f59e0b] font-black uppercase tracking-[0.35em] text-[10px] mb-4">Catalogo Completo</span>
          <h1 className="uppercase font-black text-3xl sm:text-4xl md:text-6xl tracking-tighter text-white">
            Servicios Barber<span className="text-[#f59e0b]">Shop</span>
          </h1>
        </div>

        {loading ? (
          <div className="p-14 border-2 border-dashed border-white/20 rounded-3xl text-center bg-black/20 backdrop-blur-sm">
            <Scissors size={42} className="mx-auto text-[#f59e0b] mb-4" />
            <p className="text-white/70 font-black uppercase tracking-[0.2em] text-xs">Cargando servicios...</p>
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
        ) : services.length === 0 ? (
          <div className="p-14 border-2 border-dashed border-white/20 rounded-3xl text-center bg-black/20 backdrop-blur-sm">
            <Scissors size={42} className="mx-auto text-[#f59e0b] mb-4" />
            <p className="text-white/70 font-black uppercase tracking-[0.2em] text-xs">No hay servicios disponibles por ahora.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
            {services.map(service => (
              <article
                key={service.id}
                className="p-6 sm:p-8 bg-black/25 border border-white/20 rounded-2xl hover:border-[#f59e0b] transition-all duration-300 group backdrop-blur-sm"
              >
                <div className="flex justify-between items-start mb-8">
                  <h2 className="uppercase font-black text-xl sm:text-2xl tracking-tighter leading-none text-white group-hover:text-[#f59e0b] transition-colors">
                    {service.name}
                  </h2>
                  <div className="text-2xl sm:text-3xl font-black text-[#f59e0b] italic">${formatPrice(service.price)}</div>
                </div>
                <div className="flex items-center gap-3 text-white/70 text-[10px] font-black uppercase tracking-widest">
                  <Clock size={16} className="text-[#f59e0b]" />
                  <span>{service.duration} Minutos</span>
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
