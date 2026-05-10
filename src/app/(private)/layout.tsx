'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useGlobalStore } from '@/store/useGlobalStore';

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const clearStore = useGlobalStore(state => state.clearStore);
  const setUserProfile = useGlobalStore(state => state.setUserProfile);
  const router = useRouter();

  useEffect(() => {
    async function validateSession() {
      // 1. Check if there's an active Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      // If no session or error, wipe everything and redirect to home
      if (sessionError || !session?.user) {
        clearStore();
        document.cookie = "barbershop-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        router.replace('/');
        return;
      }

      // 2. Verify the profile still exists in the database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle(); // maybeSingle returns null (not error) if no row found

      // If profile was deleted or doesn't exist, wipe and redirect
      if (profileError || !profile) {
        clearStore();
        document.cookie = "barbershop-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        await supabase.auth.signOut();
        router.replace('/');
        return;
      }

      // 3. Profile is valid — keep store in sync with latest DB data
      setUserProfile(profile);
    }

    validateSession();
  }, [clearStore, setUserProfile, router]);

  return (
    <main className="min-h-screen bg-white">
      {children}
    </main>
  );
}
