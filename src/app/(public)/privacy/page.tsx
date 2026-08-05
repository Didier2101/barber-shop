'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Scale, UserCheck, Trash2, Mail } from 'lucide-react';

export default function PrivacyPolicy() {


  return (
    <main className="min-h-screen relative overflow-hidden text-white p-4 sm:p-8 pt-28 sm:pt-32 pb-16 sm:pb-20">
      <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1599351431247-f57949f42edc?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center bg-fixed" />
      <div className="absolute inset-0 z-0 bg-black/85" />
      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        
        {/* Header */}
        <div className="space-y-6">
           <Link href="/" className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all w-fit">
              <ArrowLeft size={16} /> Volver
           </Link>
           <h1 className="text-5xl font-black uppercase tracking-tighter italic">Política de <span className="text-[#f59e0b]">Privacidad</span></h1>
           <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Tratamiento de Datos Personales • Ley 1581 de 2012</p>
        </div>

        {/* Content */}
        <div className="grid gap-12 bg-white/5 border border-white/5 p-10 md:p-16 rounded-[3rem]">
           
           <div className="space-y-4">
              <div className="flex items-center gap-4 text-[#f59e0b]">
                 <ShieldCheck size={24} />
                 <h2 className="text-xl font-black uppercase tracking-tight">1. Objeto</h2>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                 La presente Política de Tratamiento de Datos Personales tiene como objeto informar a nuestros clientes y usuarios sobre la manera en que <strong>BarberShop</strong> recolecta, almacena, usa y protege su información personal, cumpliendo con la Ley 1581 de 2012 y el Decreto 1377 de 2013 en Colombia.
              </p>
           </div>

           <div className="space-y-4">
              <div className="flex items-center gap-4 text-[#f59e0b]">
                 <Scale size={24} />
                 <h2 className="text-xl font-black uppercase tracking-tight">2. Finalidad del Tratamiento</h2>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                 Los datos personales recolectados (Nombre, Teléfono, Identificación y Correo Electrónico) serán utilizados exclusivamente para las siguientes finalidades:
              </p>
              <ul className="list-disc list-inside text-white/40 text-xs space-y-2 ml-4">
                 <li>Gestionar y confirmar sus citas de barbería.</li>
                 <li>Enviar recordatorios de servicios y notificaciones de cambios.</li>
                 <li>Fines estadísticos para mejorar la experiencia del cliente.</li>
                 <li>Contactar al cliente en caso de cancelaciones o emergencias operativas.</li>
              </ul>
           </div>

           <div className="space-y-4">
              <div className="flex items-center gap-4 text-[#f59e0b]">
                 <UserCheck size={24} />
                 <h2 className="text-xl font-black uppercase tracking-tight">3. Derechos del Titular</h2>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                 Como titular de sus datos personales, usted tiene derecho a:
              </p>
              <ul className="list-disc list-inside text-white/40 text-xs space-y-2 ml-4">
                 <li>Conocer, actualizar y rectificar sus datos personales.</li>
                 <li>Solicitar prueba de la autorización otorgada.</li>
                 <li>Ser informado sobre el uso que se le ha dado a sus datos.</li>
                 <li>Revocar la autorización o solicitar la supresión de sus datos cuando no se respeten los principios legales.</li>
              </ul>
           </div>

           <div className="space-y-4">
              <div className="flex items-center gap-4 text-[#f59e0b]">
                 <Trash2 size={24} />
                 <h2 className="text-xl font-black uppercase tracking-tight">4. Procedimiento de Supresión</h2>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                 Si desea que sus datos sean eliminados de nuestra base de datos, puede solicitarlo en cualquier momento a través de su panel de configuración o enviando un correo electrónico a nuestro soporte técnico.
              </p>
           </div>

           <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-[#f59e0b]/10 rounded-2xl text-[#f59e0b]">
                    <Mail size={24} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Contacto DPO</p>
                    <p className="text-sm font-bold">privacidad@barbershop.com</p>
                 </div>
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/10">Última actualización: Mayo 2026</p>
           </div>

        </div>

        <div className="text-center">
           <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.5em]">BarberShop • Seguridad y Confianza</p>
        </div>

      </div>
    </main>
  );
}
