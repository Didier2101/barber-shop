'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { OwnerDashboard } from '@/components/dashboards/OwnerDashboard';
import { ClientDashboard } from '@/components/dashboards/ClientDashboard';
import { BarberDashboard } from '@/components/dashboards/BarberDashboard';
import { useGlobalStore } from '@/store/useGlobalStore';
import { Loader2 } from 'lucide-react';
import { Profile } from '@/types';

export default function RoleDashboard() {
  const router = useRouter();
  const params = useParams();
  const setGlobalProfile = useGlobalStore(state => state.setUserProfile);
  const clearStore = useGlobalStore(state => state.clearStore);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Cierra sesión limpiamente y redirige al inicio
  const signOutAndRedirect = useCallback(async () => {
    clearStore();
    await supabase.auth.signOut();
    router.replace('/');
  }, [clearStore, router]);

  useEffect(() => {
    async function loadProfile() {
      // Usar getUser() en vez de getSession() para forzar validación del token
      // con el servidor. Esto evita usar tokens expirados cacheados localmente.
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        await signOutAndRedirect();
        return;
      }

      // Seguridad: Redirigir si intentan ver el dashboard de otro ID
      if (user.id !== params.id) {
        router.push('/dashboard');
        return;
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !data) {
        console.error('Error cargando perfil:', profileError?.message);
        await signOutAndRedirect();
        return;
      }

      // Redirigir si el rol en la URL no coincide
      if (data.role !== params.role) {
        router.push(`/dashboard/${data.role}/${data.id}`);
        return;
      }

      const enrichedProfile = { ...data, email: user.email };
      setProfile(enrichedProfile);
      setGlobalProfile(enrichedProfile);
      setLoading(false);
    }
    loadProfile();
  }, [router, params, setGlobalProfile, signOutAndRedirect]);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 size={40} className="text-[#f59e0b] animate-spin" />
      <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Preparando tu espacio...</p>
    </div>
  );

  // Fallback de seguridad: si el perfil no cargó, cierre de sesión automático
  if (!profile) {
    signOutAndRedirect();
    return null;
  }

  return (
    <div className="container mx-auto px-6 py-12 mt-20">
      {/* Dashboard Content */}
      <div className="relative">
        {profile.role === 'client' && <ClientDashboard profile={profile} />}
        {profile.role === 'barber' && <BarberDashboard profile={profile} />}
        {profile.role === 'owner' && <OwnerDashboard profile={profile} />}
      </div>
    </div>
  );
}
