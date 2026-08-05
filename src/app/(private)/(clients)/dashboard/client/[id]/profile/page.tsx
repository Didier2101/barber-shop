'use client';
import { FullProfileView } from '@/components/FullProfileView';
import { useGlobalStore } from '@/store/useGlobalStore';

export default function ClientProfilePage() {
  const userProfile = useGlobalStore(state => state.userProfile);

  if (!userProfile) return null;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2 text-center">
         <p className="text-accent-green text-[10px] font-black uppercase tracking-[0.4em]">Configuración</p>
         <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none text-zinc-900">Mi Perfil</h1>
      </div>
      <FullProfileView profileId={userProfile.id} />
    </div>
  );
}
