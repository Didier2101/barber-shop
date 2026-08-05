'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Lock, Flower2, LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useGlobalStore } from '@/store/useGlobalStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

function toFriendlyAuthError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) return 'Credenciales inválidas. Revisa tus datos e inténtalo de nuevo.';
  if (normalized.includes('email not confirmed')) return 'Tu cuenta aún no está confirmada. Revisa tu correo.';
  if (normalized.includes('too many requests')) return 'Demasiados intentos. Espera un minuto y vuelve a intentarlo.';
  if (normalized.includes('network')) return 'Error de conexión. Verifica tu internet.';
  return 'No pudimos iniciar sesión. Intenta nuevamente.';
}

const loginSchema = z.object({
  identifier: z.string().min(1, 'Ingresa tu número o correo.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const router = useRouter();
  const setUserProfile = useGlobalStore(state => state.setUserProfile);
  const [showPassword, setShowPassword] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: ''
    }
  });

  const onSubmit = async (data: LoginForm) => {
    setGlobalError('');

    const normalizedIdentifier = data.identifier.trim();
    const loginEmail = normalizedIdentifier.includes('@')
      ? normalizedIdentifier
      : `${normalizedIdentifier.replace(/\s+/g, '')}@barbershop.local`;

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: data.password,
      });

      if (authError) {
        return setGlobalError(toFriendlyAuthError(authError.message));
      }

      if (!authData?.user) {
        return setGlobalError('No se pudo verificar tu sesión. Intenta de nuevo.');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        return setGlobalError('No se encontró el perfil vinculado a esta cuenta.');
      }

      if (profile.is_active === false) {
        await supabase.auth.signOut();
        return setGlobalError('Tu cuenta ha sido desactivada. Contacta al administrador.');
      }

      setUserProfile(profile);
      document.cookie = "barbershop-auth=true; path=/; max-age=2592000; SameSite=Lax";

      if (profile.role === 'owner') router.push('/dashboard/owner');
      else if (profile.role === 'barber') router.push(`/dashboard/barber/${profile.id}`);
      else router.push(`/dashboard/client/${profile.id}`);

    } catch {
      setGlobalError('Error de conexión inesperado.');
    }
  };

  return (
    <main
      className="relative w-screen h-screen overflow-hidden bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1000')" }}
    >
      <div className="absolute inset-0 bg-bg-base/90 fixed" />

      {/* Back button moved to form bottom */}

      <section className="relative z-10 h-screen pt-8 flex items-end">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-full flex">
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-16 h-full">

            {/* Branding - Hidden on small mobile to prioritize form */}
            <div className="hidden lg:block self-center">
              <div className="max-w-xl">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-brand rounded-2xl shadow-lg mb-6">
                  <Flower2 size={28} className="text-white" />
                </div>
                <p className="text-[10px] uppercase tracking-[0.32em] text-brand ml-1 mb-3 font-black">Acceso Exclusivo</p>
                <h1 className="text-zinc-900 text-5xl xl:text-7xl font-black leading-[0.95] tracking-tight uppercase italic">
                  Bienvenido <br />
                  <span className="text-brand">De Vuelta</span>
                </h1>
                <p className="text-zinc-900/60 text-lg mt-6 max-w-lg leading-relaxed font-medium">
                  Gestiona tus servicios y mantén tu estilo al día con los mejores profesionales.
                </p>
              </div>
            </div>

            {/* Login Card */}
            <div className="w-full max-w-md mx-auto lg:mx-0 lg:justify-self-end self-end">
              <div className="rounded-t-[2.5rem] rounded-b-none border-x border-t border-accent-green/30 border-b-0 bg-bg-base/80 backdrop-blur-xl p-8 sm:p-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                <div className="mb-8 text-center lg:text-left">
                  <h2 className="text-3xl font-black text-zinc-900 uppercase italic">Entrar</h2>
                  <p className="text-[10px] text-zinc-900/40 uppercase tracking-widest mt-2">Ingresa tus credenciales</p>
                </div>

                {globalError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-600 px-5 py-4 rounded-2xl mb-6 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                    {globalError}
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand ml-1">Celular o Email</label>
                    <div className="relative group">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-900/30 group-focus-within:text-brand transition-colors" />
                      <input
                        type="text"
                        {...register('identifier')}
                        className={`w-full h-13 bg-surface border ${errors.identifier ? 'border-red-500/50' : 'border-accent-green/30'} rounded-2xl pl-12 pr-4 text-zinc-900 text-sm focus:outline-none focus:border-brand transition-all font-medium`}
                        placeholder="Número o correo"
                      />
                    </div>
                    {errors.identifier && <p className="text-red-400 text-xs mt-1 ml-1 font-medium">{errors.identifier.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand ml-1">Contraseña</label>
                    <div className="relative group">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-900/30 group-focus-within:text-brand transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...register('password')}
                        className={`w-full h-13 bg-surface border ${errors.password ? 'border-red-500/50' : 'border-accent-green/30'} rounded-2xl pl-12 pr-12 text-zinc-900 text-sm focus:outline-none focus:border-brand transition-all font-medium`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-900/30 hover:text-brand transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-400 text-xs mt-1 ml-1 font-medium">{errors.password.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-brand hover:bg-accent-green hover:text-white text-white h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-brand/20"
                  >
                    {isSubmitting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        INICIAR SESIÓN
                        <LogIn size={16} />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-accent-green/20 text-center flex flex-col gap-3">
                  <p className="text-zinc-900/40 text-xs font-medium">
                    ¿No tienes una cuenta?{' '}
                    <Link href="/register" className="text-brand hover:text-zinc-900 font-black uppercase tracking-widest ml-1 transition-colors">
                      Regístrate Gratis
                    </Link>
                  </p>
                  <p className="text-zinc-900/40 text-xs font-medium">
                    ¿Quieres ir al inicio?{' '}
                    <Link href="/" className="text-brand hover:text-zinc-900 font-black uppercase tracking-widest ml-1 transition-colors">
                      Home
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


