'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Phone, Lock, Scissors, ArrowRight, Eye, EyeOff } from 'lucide-react';

function toFriendlyRegisterError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('already registered') || normalized.includes('already exists')) {
    return 'Este número de celular ya está registrado. Intenta iniciar sesión.';
  }
  if (normalized.includes('password')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (normalized.includes('too many requests')) return 'Demasiados intentos. Por favor, espera un momento.';
  return 'No se pudo completar el registro. Verifica los datos e intenta de nuevo.';
}

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedTerms) return setError('Debes aceptar el tratamiento de datos personales para continuar.');
    
    const cleanName = form.name.trim();
    const cleanPhone = form.phone.replace(/\D/g, ''); // Solo dígitos
    
    if (cleanName.length < 3) return setError('Ingresa tu nombre completo.');
    if (cleanPhone.length < 10) return setError('Ingresa un número de celular válido (mínimo 10 dígitos).');
    if (form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');

    setError('');
    setLoading(true);
    
    // Generamos el correo interno para Supabase (Invisible para el cliente)
    const internalEmail = `${cleanPhone}@barbershop.local`;
    
    // 1. Registro en Auth
    const { data, error: authError } = await supabase.auth.signUp({
      email: internalEmail,
      password: form.password,
    });

    if (authError) {
      setLoading(false);
      return setError(toFriendlyRegisterError(authError.message));
    }

    if (data.user) {
      // 2. Crear Perfil con políticas aceptadas (CRÍTICO)
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        role: 'client',
        name: cleanName,
        phone: cleanPhone,
        data_policy_accepted: true,
        data_policy_accepted_at: new Date().toISOString(),
        is_active: true
      });

      if (profileError) {
        console.error('Error al crear perfil:', profileError);
        setLoading(false);
        return setError('Cuenta creada, pero hubo un error en el perfil. Intenta entrar con tu contraseña.');
      }
      
      // 3. Sesión y Redirección
      document.cookie = "barbershop-auth=true; path=/; max-age=2592000; SameSite=Lax";
      router.push(`/dashboard/client/${data.user.id}`);
    }
  };

  return (
    <main
      className="relative w-screen min-h-screen overflow-x-hidden bg-cover bg-center bg-no-repeat bg-fixed"
      style={{
        backgroundImage: "url('/nathon-oski-EW_rqoSdDes-unsplash.jpg')",
      }}
    >
      <div className="absolute inset-0 bg-black/90 fixed" />
      <section className="relative z-10 min-h-screen pt-8 pb-12 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex items-center">
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 items-center gap-16">
            
            <div className="hidden lg:block">
              <div className="max-w-xl">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#f59e0b] rounded-2xl shadow-lg mb-6">
                  <Scissors size={28} className="text-black" />
                </div>
                <p className="text-[10px] uppercase tracking-[0.32em] text-[#f59e0b] ml-1 mb-3 font-bold">Reserva en segundos</p>
                <h1 className="text-white text-6xl xl:text-7xl font-black leading-[0.95] tracking-tight uppercase italic">
                  Tu Estilo, <br />
                  <span className="text-[#f59e0b]">Tu Cuenta</span>
                </h1>
                <p className="text-white/60 text-lg mt-6 max-w-lg leading-relaxed font-medium">
                  Regístrate solo con tu número de celular y comienza a agendar tus citas con los mejores barberos.
                </p>
              </div>
            </div>

            <div className="w-full max-w-md mx-auto lg:mx-0 lg:justify-self-end">
              <div className="rounded-[2.5rem] border border-white/10 bg-black/20 backdrop-blur-xl p-8 sm:p-10 shadow-2xl">
                <div className="mb-8 text-center lg:text-left">
                   <h2 className="text-3xl font-black text-white uppercase italic">Registrarse</h2>
                   <p className="text-[10px] text-white/40 uppercase tracking-widest mt-2">Solo necesitas tu celular</p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-5 py-4 rounded-2xl mb-6 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                    {error}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f59e0b] ml-1">Nombre Completo</label>
                    <div className="relative group">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#f59e0b] transition-colors" />
                      <input
                        className="w-full h-13 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white text-sm focus:outline-none focus:border-[#f59e0b] transition-all font-medium"
                        placeholder="Juan Pérez"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f59e0b] ml-1">Número de Celular</label>
                    <div className="relative group">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#f59e0b] transition-colors" />
                      <input
                        type="tel"
                        className="w-full h-13 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white text-sm focus:outline-none focus:border-[#f59e0b] transition-all font-medium"
                        placeholder="300 123 4567"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f59e0b] ml-1">Crea una Contraseña</label>
                    <div className="relative group">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#f59e0b] transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="w-full h-13 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 text-white text-sm focus:outline-none focus:border-[#f59e0b] transition-all font-medium"
                        placeholder="Mínimo 6 caracteres"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-[#f59e0b] transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <input
                      type="checkbox"
                      id="terms"
                      className="mt-1 w-4 h-4 rounded border-white/20 text-[#f59e0b] focus:ring-[#f59e0b] bg-transparent cursor-pointer"
                      checked={acceptedTerms}
                      onChange={e => setAcceptedTerms(e.target.checked)}
                    />
                    <label htmlFor="terms" className="text-[10px] text-white/50 leading-relaxed cursor-pointer select-none">
                      Autorizo el tratamiento de mis datos personales según la{' '}
                      <Link href="/privacy" className="text-[#f59e0b] hover:underline font-bold">
                        Política de Privacidad
                      </Link>{' '}
                      y acepto los Términos de Servicio.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#f59e0b] hover:bg-white text-black h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-amber-500/10"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        CREAR MI CUENTA
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                  <p className="text-white/40 text-xs font-medium">
                    ¿Ya tienes una cuenta?{' '}
                    <Link href="/login" className="text-[#f59e0b] hover:text-white font-black uppercase tracking-widest ml-1 transition-colors">
                      Entrar
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
