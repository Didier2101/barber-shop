'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Clock3, Mail, MapPin, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type BusinessHour = {
  day_of_week: number;
  opening_time: string;
  closing_time: string;
  is_closed: boolean;
};

export default function ContactoPage() {
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [loadingHours, setLoadingHours] = useState(true);
  const [hoursError, setHoursError] = useState('');

  useEffect(() => {
    async function loadBusinessHours() {
      try {
        setLoadingHours(true);
        setHoursError('');
        const { data, error } = await supabase.from('business_hours').select('*').order('day_of_week', { ascending: true });
        if (error) throw error;
        setBusinessHours((data as BusinessHour[]) || []);
      } catch {
        setHoursError('No pudimos cargar los horarios en este momento.');
      } finally {
        setLoadingHours(false);
      }
    }

    loadBusinessHours();
  }, []);

  const dayName = (day: number) => ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'][day] || 'Dia';

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
        <div className="max-w-4xl mx-auto text-center mb-14">
          <p className="text-[#f59e0b] font-black uppercase tracking-[0.3em] text-[10px] mb-4">Siempre Disponibles</p>
          <h1 className="uppercase font-black text-3xl sm:text-4xl md:text-6xl tracking-tighter text-white mb-6">Contacto</h1>
          <p className="text-white/70 text-base sm:text-lg leading-relaxed">
            Escribenos para resolver dudas, cotizar servicios especiales o agendar tu proxima cita.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <div className="rounded-2xl border border-white/20 bg-black/25 backdrop-blur-sm p-7">
            <h2 className="uppercase font-black text-lg tracking-[0.1em] text-white mb-6">Informacion</h2>
            <ul className="space-y-5 text-sm">
              <li className="flex items-start gap-3 text-white/75">
                <MapPin className="text-[#f59e0b] mt-0.5 shrink-0" size={18} />
                Calle 10A #34-56, El Poblado, Medellin
              </li>
              <li className="flex items-start gap-3 text-white/75">
                <Phone className="text-[#f59e0b] mt-0.5 shrink-0" size={18} />
                +57 300 000 0000
              </li>
              <li className="flex items-start gap-3 text-white/75">
                <Mail className="text-[#f59e0b] mt-0.5 shrink-0" size={18} />
                hola@barbershop.com
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/20 bg-black/25 backdrop-blur-sm p-7">
            <h2 className="uppercase font-black text-lg tracking-[0.1em] text-white mb-6">Horario</h2>
            {loadingHours ? (
              <p className="text-white/70 text-sm">Cargando horarios...</p>
            ) : hoursError ? (
              <p className="text-red-200 text-sm">{hoursError}</p>
            ) : (
              <ul className="space-y-4">
                {[1, 2, 3, 4, 5, 6, 0].map(dayNum => {
                  const slots = businessHours.filter(bh => bh.day_of_week === dayNum && !bh.is_closed);
                  return (
                  <li key={dayNum} className="flex justify-between gap-4 border-b border-white/10 pb-3 text-sm">
                    <span className="text-white/75 flex items-center gap-2">
                      <Clock3 size={15} className="text-[#f59e0b]" />
                      {dayName(dayNum)}
                    </span>
                    {slots.length > 0 ? (
                      <span className="font-black text-white">
                        {slots.map(s => `${s.opening_time.substring(0, 5)} - ${s.closing_time.substring(0, 5)}`).join(' / ')}
                      </span>
                    ) : (
                      <span className="font-black text-red-400">Cerrado</span>
                    )}
                  </li>
                )})}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center bg-[#f59e0b] hover:bg-white text-black h-12 px-8 rounded-xl font-black uppercase tracking-[0.18em] text-[11px] transition-all"
          >
            Reservar ahora
          </Link>
        </div>
      </section>
    </main>
  );
}
