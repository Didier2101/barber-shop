'use client';
import { FullProfileView } from '@/components/FullProfileView';
import { useGlobalStore } from '@/store/useGlobalStore';

export default function OwnerProfilePage() {
  const userProfile = useGlobalStore(state => state.userProfile);

  if (!userProfile) return null;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="space-y-2 text-center md:text-left">
         <p className="text-brand text-[10px] font-bold uppercase tracking-[0.4em]">Configuración</p>
         <h1 className="text-3xl font-bold uppercase tracking-tight text-white">Mi Perfil</h1>
      </div>
      <FullProfileView profileId={userProfile.id} />
    </div>
  );
}
