'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useGlobalStore } from '@/store/useGlobalStore';

export default function DashboardRedirect() {
  const router = useRouter();
  const setUserProfile = useGlobalStore(state => state.setUserProfile);
  const clearStore = useGlobalStore(state => state.clearStore);

  useEffect(() => {
    async function redirectUser() {
      // getUser() valida el token con el servidor (evita tokens expirados cacheados)
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        clearStore();
        await supabase.auth.signOut();
        document.cookie = "barbershop-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        router.replace('/');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        // Si no se puede cargar el perfil, cerrar sesión y volver al inicio
        clearStore();
        await supabase.auth.signOut();
        document.cookie = "barbershop-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        router.replace('/');
        return;
      }

      setUserProfile(profile);
      router.push(`/dashboard/${profile.role}/${profile.id}`);
    }
    redirectUser();
  }, [router, setUserProfile, clearStore]);

  return null;
}

