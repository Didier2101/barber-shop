'use client';
import { OwnerProfileView } from '@/components/owner/OwnerProfileView';
import { useGlobalStore } from '@/store/useGlobalStore';

export default function OwnerProfilePage() {
  const userProfile = useGlobalStore(state => state.userProfile);

  if (!userProfile) return null;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto font-sans">
      <div className="space-y-2">
         <h1 className="text-3xl font-black uppercase tracking-tight text-erp-text flex items-center gap-3">
            Configuración de Perfil
         </h1>
      </div>
      <OwnerProfileView profileId={userProfile.id} />
    </div>
  );
}

