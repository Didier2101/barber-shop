import Link from 'next/link';
import { Mail, MapPin, Phone, Scissors } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="bg-stone-100 dark:bg-[#050505] border-t border-stone-200 dark:border-white/5 py-14 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 text-2xl font-black tracking-tighter text-stone-900 dark:text-white mb-5">
              <Scissors className="text-[#f59e0b] w-7 h-7" />
              <span>BARBER<span className="text-[#f59e0b]">SHOP</span></span>
            </Link>
            <p className="text-sm text-stone-700 dark:text-white/65 leading-relaxed">
              Estilo, precision y experiencia premium para cada cliente.
            </p>
          </div>

          <div>
            <h3 className="text-[#f59e0b] uppercase tracking-[0.24em] text-[10px] font-black mb-4">Navegacion</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/servicios" className="text-stone-700 dark:text-white/75 hover:text-[#f59e0b] transition-colors">Servicios</Link></li>
              <li><Link href="/barberos" className="text-stone-700 dark:text-white/75 hover:text-[#f59e0b] transition-colors">Barberos</Link></li>
              <li><Link href="/nosotros" className="text-stone-700 dark:text-white/75 hover:text-[#f59e0b] transition-colors">Nosotros</Link></li>
              <li><Link href="/contacto" className="text-stone-700 dark:text-white/75 hover:text-[#f59e0b] transition-colors">Contacto</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[#f59e0b] uppercase tracking-[0.24em] text-[10px] font-black mb-4">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/privacy" className="text-stone-700 dark:text-white/75 hover:text-[#f59e0b] transition-colors">Privacidad</Link></li>
              <li><Link href="/privacy" className="text-stone-700 dark:text-white/75 hover:text-[#f59e0b] transition-colors">Terminos</Link></li>
              <li><Link href="/login" className="text-stone-700 dark:text-white/75 hover:text-[#f59e0b] transition-colors">Iniciar sesion</Link></li>
              <li><Link href="/register" className="text-stone-700 dark:text-white/75 hover:text-[#f59e0b] transition-colors">Reservar Cita</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[#f59e0b] uppercase tracking-[0.24em] text-[10px] font-black mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm text-stone-700 dark:text-white/75">
              <li className="flex items-start gap-2"><MapPin size={16} className="text-[#f59e0b] shrink-0 mt-0.5" />Medellin, Colombia</li>
              <li className="flex items-start gap-2"><Phone size={16} className="text-[#f59e0b] shrink-0 mt-0.5" />+57 300 000 0000</li>
              <li className="flex items-start gap-2"><Mail size={16} className="text-[#f59e0b] shrink-0 mt-0.5" />hola@barbershop.com</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-stone-300 dark:border-white/10 text-[10px] uppercase tracking-[0.2em] font-black text-stone-500 dark:text-white/30 text-center">
          © {new Date().getFullYear()} BarberShop. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
