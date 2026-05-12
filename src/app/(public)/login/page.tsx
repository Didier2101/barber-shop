'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Lock, Scissors, LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useGlobalStore } from '@/store/useGlobalStore';

function toFriendlyAuthError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) return 'Credenciales inválidas. Revisa tus datos e inténtalo de nuevo.';
  if (normalized.includes('email not confirmed')) return 'Tu cuenta aún no está confirmada. Revisa tu correo.';
  if (normalized.includes('too many requests')) return 'Demasiados intentos. Espera un minuto y vuelve a intentarlo.';
  if (normalized.includes('network')) return 'Error de conexión. Verifica tu internet.';
  return 'No pudimos iniciar sesión. Intenta nuevamente.';
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
      setError('Ingresa credenciales válidas. La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    
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
        setError('No se pudo verificar tu sesión. Intenta de nuevo.');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        setLoading(false);
        setError('No se encontró el perfil vinculado a esta cuenta.');
        return;
      }

      setUserProfile(profile);
      document.cookie = "barbershop-auth=true; path=/; max-age=2592000; SameSite=Lax";
      
      if (profile.role === 'owner') router.push('/dashboard/owner');
      else if (profile.role === 'barber') router.push(`/dashboard/barber/${profile.id}`);
      else router.push(`/dashboard/client/${profile.id}`);

    } catch {
      setLoading(false);
      setError('Error de conexión inesperado.');
    }
  };

  return (
    <main
      className="relative w-screen min-h-screen overflow-x-hidden bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/nathon-oski-EW_rqoSdDes-unsplash.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/90 fixed" />
      
      <section className="relative z-10 min-h-screen pt-8 pb-12 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-16">
            
            {/* Branding - Hidden on small mobile to prioritize form */}
            <div className="hidden lg:block">
              <div className="max-w-xl">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#f59e0b] rounded-2xl shadow-lg mb-6">
                  <Scissors size={28} className="text-black" />
                </div>
                <p className="text-[10px] uppercase tracking-[0.32em] text-[#f59e0b] ml-1 mb-3 font-black">Acceso Exclusivo</p>
                <h1 className="text-white text-5xl xl:text-7xl font-black leading-[0.95] tracking-tight uppercase italic">
                  Bienvenido <br />
                  <span className="text-[#f59e0b]">De Vuelta</span>
                </h1>
                <p className="text-white/60 text-lg mt-6 max-w-lg leading-relaxed font-medium">
                  Gestiona tus servicios y mantén tu estilo al día con los mejores profesionales.
                </p>
              </div>
            </div>

            {/* Login Card */}
            <div className="w-full max-w-md mx-auto lg:mx-0 lg:justify-self-end">
              <div className="rounded-[2.5rem] border border-white/10 bg-black/20 backdrop-blur-xl p-8 sm:p-10 shadow-2xl">
                <div className="mb-8 text-center lg:text-left">
                   <h2 className="text-3xl font-black text-white uppercase italic">Entrar</h2>
                   <p className="text-[10px] text-white/40 uppercase tracking-widest mt-2">Ingresa tus credenciales</p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-5 py-4 rounded-2xl mb-6 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f59e0b] ml-1">Celular o Email</label>
                    <div className="relative group">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#f59e0b] transition-colors" />
                      <input
                        type="text"
                        className="w-full h-13 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white text-sm focus:outline-none focus:border-[#f59e0b] transition-all font-medium"
                        placeholder="Número o correo"
                        value={identifier}
                        onChange={e => setIdentifier(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f59e0b] ml-1">Contraseña</label>
                    <div className="relative group">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#f59e0b] transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="w-full h-13 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 text-white text-sm focus:outline-none focus:border-[#f59e0b] transition-all font-medium"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
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

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#f59e0b] hover:bg-white text-black h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-amber-500/10"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        INICIAR SESIÓN
                        <LogIn size={16} />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                  <p className="text-white/40 text-xs font-medium">
                    ¿No tienes una cuenta?{' '}
                    <Link href="/register" className="text-[#f59e0b] hover:text-white font-black uppercase tracking-widest ml-1 transition-colors">
                      Regístrate Gratis
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
