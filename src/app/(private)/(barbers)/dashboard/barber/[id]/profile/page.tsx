'use client';
import { FullProfileView } from '@/components/FullProfileView';
import { useParams } from 'next/navigation';

export default function BarberProfilePage() {
  const params = useParams();
  const id = params.id as string;

  if (!id) return null;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
         <p className="text-brand text-[10px] font-black uppercase tracking-[0.4em]">Configuración</p>
         <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none text-zinc-900">Mi Perfil</h1>
      </div>
      <FullProfileView profileId={id} />
    </div>
  );
}
