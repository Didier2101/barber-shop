'use client';
import { useOwnerBaseData } from '@/hooks/useOwnerData';
import { PromotionForm } from '@/components/forms/PromotionForm';
import { ArrowLeft, Edit3 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function EditPromotionPage() {
  const params = useParams();
  const { data: baseData, isLoading } = useOwnerBaseData();
  
  const promo = baseData?.promotions?.find(p => p.id === params.id);

  if (isLoading) return <div className="p-20 text-center text-gray-400">Cargando datos de la oferta...</div>;
  if (!promo) return <div className="p-20 text-center text-red-500">No se encontró la promoción solicitada.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/owner/promotions"
            className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-[#0061ff] hover:shadow-lg transition-all"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Editar Oferta</h2>
            <p className="text-[11px] text-gray-500 font-medium tracking-widest uppercase">Modifica los parámetros de la promoción</p>
          </div>
        </div>
        <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
          <Edit3 size={24} />
        </div>
      </div>

      <PromotionForm initialData={promo} isEditing={true} />
    </div>
  );
}
