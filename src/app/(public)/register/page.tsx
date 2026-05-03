'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Phone, Lock, Scissors, ArrowRight } from 'lucide-react';

function toFriendlyRegisterError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('already registered') || normalized.includes('already exists')) {
    return 'Este usuario ya esta registrado. Inicia sesion o usa otro numero.';
  }
  if (normalized.includes('password')) return 'La contrasena no cumple requisitos de seguridad.';
  if (normalized.includes('too many requests')) return 'Demasiados intentos. Espera un momento y vuelve a intentar.';
  if (normalized.includes('network')) return 'No hay conexion con el servidor. Verifica tu internet.';
  return 'No se pudo completar el registro. Intenta nuevamente.';
}

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  
    const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!acceptedTerms) return setError('Debes aceptar el tratamiento de datos personales para continuar.');
      const cleanName = form.name.trim();
      const cleanPhone = form.phone.replace(/\s+/g, '');
      const phoneValid = /^\d{7,15}$/.test(cleanPhone);
      if (cleanName.length < 3) return setError('El nombre debe tener al menos 3 caracteres.');
      if (!phoneValid) return setError('Ingresa un numero de celular valido (solo digitos).');
      if (form.password.trim().length < 6) return setError('La contrasena debe tener minimo 6 caracteres.');
      setError('');
      setLoading(true);
    
    const fakeEmail = `${cleanPhone}@barbershop.local`;
    
    // 1. SignUp
    const { data, error: authError } = await supabase.auth.signUp({
      email: fakeEmail,
      password: form.password,
    });

    if (authError) {
      setLoading(false);
      return setError(toFriendlyRegisterError(authError.message));
    }

    if (data.user) {
      // 2. Create Profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        role: 'client',
        name: cleanName,
        phone: cleanPhone,
      });

      if (profileError) {
        setLoading(false);
        return setError('Tu cuenta fue creada, pero fallamos al guardar tu perfil. Intenta ingresar nuevamente.');
      }
      
      document.cookie = "barbershop-auth=true; path=/; max-age=86400";
      router.push('/dashboard');
    }
  };

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
      <section className="relative z-10 h-full pt-20">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="h-full grid grid-cols-1 lg:grid-cols-2 items-center gap-8 lg:gap-16">
            <div className="hidden lg:block">
              <div className="max-w-xl">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#f59e0b] rounded-2xl shadow-lg mb-6">
                  <Scissors size={28} className="text-black" />
                </div>
                <p className="text-[10px] uppercase tracking-[0.32em] text-[#f59e0b] ml-1 mb-3">Agenda Tu Espacio</p>
                <h1 className="text-white text-5xl xl:text-6xl font-black leading-[0.95] tracking-tight uppercase">
                  Reserva Tu <span className="text-[#f59e0b]">Cita</span>
                </h1>
                <p className="text-white/70 text-lg mt-6 max-w-lg leading-relaxed italic">
                  Ingresa tus datos a continuacion para poder agendar tu servicio y personalizar tu experiencia con nosotros.
                </p>
              </div>
            </div>

            <div className="w-full max-w-md mx-auto lg:mx-0 lg:justify-self-end">
              <div className="rounded-3xl border border-white/15 bg-transparent p-5 sm:p-7">
                {error && (
                  <div className="bg-red-500/10 border border-red-300/35 text-red-100 px-4 py-3 rounded-2xl mb-5 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f59e0b] ml-1">Nombre Completo</label>
                    <div className="relative group">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-[#f59e0b] transition-colors" />
                      <input
                        className="w-full h-12.5 bg-transparent border border-white/20 rounded-xl pl-12 pr-4 text-white text-sm placeholder:text-white/45 focus:outline-none focus:border-[#f59e0b] focus:ring-2 focus:ring-[#f59e0b]/25 transition-all"
                        placeholder="Tu nombre y apellido"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f59e0b] ml-1">Numero de Celular</label>
                    <div className="relative group">
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-[#f59e0b] transition-colors" />
                      <input
                        type="tel"
                        className="w-full h-12.5 bg-transparent border border-white/20 rounded-xl pl-12 pr-4 text-white text-sm placeholder:text-white/45 focus:outline-none focus:border-[#f59e0b] focus:ring-2 focus:ring-[#f59e0b]/25 transition-all"
                        placeholder="Ej: 300 123 4567"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f59e0b] ml-1">Contrasena</label>
                    <div className="relative group">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-[#f59e0b] transition-colors" />
                      <input
                        type="password"
                        className="w-full h-12.5 bg-transparent border border-white/20 rounded-xl pl-12 pr-4 text-white text-sm placeholder:text-white/45 focus:outline-none focus:border-[#f59e0b] focus:ring-2 focus:ring-[#f59e0b]/25 transition-all"
                        placeholder="Minimo 6 caracteres"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-transparent p-4 rounded-xl border border-white/20">
                    <input
                      type="checkbox"
                      id="terms"
                      className="mt-0.5 w-4.5 h-4.5 rounded border-white/20 text-[#f59e0b] focus:ring-[#f59e0b] bg-transparent"
                      checked={acceptedTerms}
                      onChange={e => setAcceptedTerms(e.target.checked)}
                    />
                    <label htmlFor="terms" className="text-[11px] text-white/65 leading-relaxed">
                      Autorizo el tratamiento de datos segun la{' '}
                      <Link href="/privacy" className="text-[#f59e0b] hover:text-white font-semibold transition-colors">
                        Politica de Privacidad
                      </Link>{' '}
                      y los Terminos y Condiciones.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#f59e0b] hover:bg-white text-black h-12.5 rounded-xl font-black uppercase tracking-[0.18em] text-[11px] transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      'Creando cuenta...'
                    ) : (
                      <>
                        CONFIRMAR MIS DATOS
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-white/10 text-center">
                  <p className="text-white/45 text-xs">
                    Ya tienes una cuenta?{' '}
                    <Link href="/login" className="text-[#f59e0b] hover:text-white font-black uppercase tracking-[0.12em] transition-colors">
                      Iniciar Sesion
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
