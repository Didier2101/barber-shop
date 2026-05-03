import { Award, Scissors, ShieldCheck, Sparkles } from 'lucide-react';

const values = [
  {
    title: 'Precision',
    text: 'Cada servicio se hace con tecnica profesional para garantizar un acabado impecable.',
    icon: Scissors,
  },
  {
    title: 'Calidad',
    text: 'Usamos productos premium y protocolos de higiene estrictos en cada cita.',
    icon: ShieldCheck,
  },
  {
    title: 'Experiencia',
    text: 'Convertimos cada visita en un momento de estilo, confianza y bienestar.',
    icon: Sparkles,
  },
];

export default function NosotrosPage() {
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
        <div className="max-w-4xl mx-auto text-center mb-16">
          <p className="text-[#f59e0b] font-black uppercase tracking-[0.3em] text-[10px] mb-4">Nuestra Historia</p>
          <h1 className="uppercase font-black text-3xl sm:text-4xl md:text-6xl tracking-tighter text-white mb-6">
            Sobre Barber<span className="text-[#f59e0b]">Shop</span>
          </h1>
          <p className="text-white/70 text-base sm:text-lg leading-relaxed">
            Somos una barberia enfocada en elevar el cuidado masculino con servicio de alto nivel, puntualidad y detalles que marcan diferencia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {values.map(value => {
            const Icon = value.icon;
            return (
              <article key={value.title} className="rounded-2xl border border-white/20 bg-black/25 p-6 backdrop-blur-sm">
                <span className="inline-flex items-center justify-center rounded-lg bg-[#f59e0b] p-2.5 shadow-lg mb-5">
                  <Icon className="h-5 w-5 text-black" />
                </span>
                <h2 className="uppercase font-black tracking-[0.1em] text-white mb-3">{value.title}</h2>
                <p className="text-white/75 text-sm leading-relaxed">{value.text}</p>
              </article>
            );
          })}
        </div>

        <div className="rounded-3xl border border-white/20 bg-black/25 p-8 sm:p-10 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <Award className="text-[#f59e0b]" />
            <p className="text-[#f59e0b] font-black uppercase tracking-[0.2em] text-[10px]">Compromiso</p>
          </div>
          <p className="text-white/75 leading-relaxed">
            Nuestra meta es que cada cliente salga con una imagen impecable y con ganas de volver. Por eso medimos calidad, tiempo de atencion
            y satisfaccion en cada servicio.
          </p>
        </div>
      </section>
    </main>
  );
}
