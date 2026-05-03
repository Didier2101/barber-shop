import Link from 'next/link';
import { Scissors } from 'lucide-react';

export default function NotFound() {
  return (
    <main
      className="relative w-screen h-[100dvh] overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/nathon-oski-EW_rqoSdDes-unsplash.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-black/90" aria-hidden="true" />

      <section className="relative z-10 h-full flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-white/15 bg-transparent p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#f59e0b] rounded-2xl shadow-lg mb-6">
            <Scissors size={28} className="text-black" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#f59e0b] mb-3">Error 404</p>
          <h1 className="text-white text-3xl font-black leading-tight uppercase">Pagina no encontrada</h1>
          <p className="text-white/70 text-sm mt-4 mb-8">
            La ruta que buscas no existe o fue movida.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-[#f59e0b] hover:bg-white text-black h-12 px-8 rounded-xl font-black uppercase tracking-[0.18em] text-[11px] transition-all"
          >
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
