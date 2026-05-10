'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Lock, Scissors, LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';

import { useGlobalStore } from '@/store/useGlobalStore';

function toFriendlyAuthError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) return 'Credenciales invalidas. Revisa tus datos e intentalo de nuevo.';
  if (normalized.includes('email not confirmed')) return 'Tu cuenta aun no esta confirmada. Revisa tu correo.';
  if (normalized.includes('too many requests')) return 'Demasiados intentos. Espera un minuto y vuelve a intentarlo.';
  if (normalized.includes('network')) return 'No hay conexion con el servidor. Verifica tu internet.';
  return 'No pudimos iniciar sesion en este momento. Intenta nuevamente.';
}

export default function Login() {
  const router = useRouter();
  const setUserProfile = useGlobalStore(state => state.setUserProfile);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const normalizedIdentifier = identifier.trim();
    if (!normalizedIdentifier || password.trim().length < 6) {
      setLoading(false);
      setError('Ingresa credenciales validas. La contrasena debe tener minimo 6 caracteres.');
      return;
    }
    
    // Si no tiene @, asumimos que es un celular
    const loginEmail = normalizedIdentifier.includes('@')
      ? normalizedIdentifier
      : `${normalizedIdentifier.replace(/\s+/g, '')}@barbershop.local`;

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (authError) {
        setLoading(false);
        setError(toFriendlyAuthError(authError.message));
        return;
      }

      if (!authData?.user) {
        setLoading(false);
        setError('No se pudo verificar tu sesion. Intenta de nuevo.');
        return;
      }

      // Fetch profile to set in store
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        setLoading(false);
        setError('Tu cuenta existe pero no tiene un perfil activo. Contacta al administrador.');
        return;
      }

      setUserProfile(profile);

      // Usamos una cookie con SameSite=Lax para que el middleware la reciba
      // en el siguiente request (hard redirect). router.push no garantiza esto.
      document.cookie = "barbershop-auth=true; path=/; max-age=86400; SameSite=Lax";
      
      if (profile.role === 'owner') {
        router.push('/dashboard/owner');
      } else if (profile.role === 'barber') {
        router.push(`/dashboard/barber/${profile.id}`);
      } else {
        router.push(`/dashboard/client/${profile.id}`);
      }

    } catch {
      setLoading(false);
      setError('Error de conexion. Verifica tu internet e intenta de nuevo.');
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
                <p className="text-[10px] uppercase tracking-[0.32em] text-[#f59e0b] mb-3">Acceso Privado</p>
                <h1 className="text-white text-5xl xl:text-6xl font-black leading-[0.95] tracking-tight uppercase">
                  Bienvenido De Vuelta
                </h1>
                <p className="text-white/70 text-lg mt-6 max-w-lg leading-relaxed">
                  Ingresa para gestionar tus citas, revisar disponibilidad y mantener tu estilo siempre al dia.
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

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f59e0b] ml-1">Celular o Correo</label>
                    <div className="relative group">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-[#f59e0b] transition-colors" />
                      <input
                        type="text"
                        className="w-full h-12.5 bg-transparent border border-white/20 rounded-xl pl-12 pr-4 text-white text-sm placeholder:text-white/45 focus:outline-none focus:border-[#f59e0b] focus:ring-2 focus:ring-[#f59e0b]/25 transition-all"
                        value={identifier}
                        onChange={e => setIdentifier(e.target.value)}
                        placeholder="Tu numero o email"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f59e0b] ml-1">Contrasena</label>
                    <div className="relative group">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-[#f59e0b] transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="w-full h-12.5 bg-transparent border border-white/20 rounded-xl pl-12 pr-12 text-white text-sm placeholder:text-white/45 focus:outline-none focus:border-[#f59e0b] focus:ring-2 focus:ring-[#f59e0b]/25 transition-all"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-[#f59e0b] transition-colors focus:outline-none"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#f59e0b] hover:bg-white text-black h-12.5 rounded-xl font-black uppercase tracking-[0.18em] text-[11px] transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                  {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={15} className="animate-spin" />
                        Entrando a tu cuenta...
                      </span>
                    ) : (
                      <>
                        Entrar a Mi Cuenta
                        <LogIn size={15} />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-white/10 text-center">
                  <p className="text-white/45 text-xs">
                    No tienes una cuenta?{' '}
                    <Link href="/register" className="text-[#f59e0b] hover:text-white font-black uppercase tracking-[0.12em] transition-colors">
                      Registrate Gratis
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
