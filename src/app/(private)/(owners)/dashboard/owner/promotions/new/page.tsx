'use client';
import { PromotionForm } from '@/components/forms/PromotionForm';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function NewPromotionPage() {
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
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Crear Nueva Oferta</h2>
            <p className="text-[11px] text-gray-500 font-medium tracking-widest uppercase">Configura los beneficios para tus clientes</p>
          </div>
        </div>
        <div className="p-4 bg-blue-50 text-[#0061ff] rounded-2xl">
          <Sparkles size={24} />
        </div>
      </div>

      <PromotionForm />
    </div>
  );
}
