'use client';
import { useBarberClients } from '@/hooks/useBarberData';
import { 
  Users, 
  Search, 
  User, 
  Star
} from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function BarberClientsPage() {
  const params = useParams();
  const barberId = params.id as string;
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: clients = [], isLoading } = useBarberClients(barberId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#f59e0b] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredClients = clients.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
         <div className="space-y-2">
            <p className="text-[#f59e0b] text-[10px] font-black uppercase tracking-[0.4em]">Mi Comunidad</p>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none text-white">Mis Clientes</h1>
         </div>
         <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
               <Search size={18} className="text-white/20" />
            </div>
            <input 
               type="text" 
               placeholder="Buscar por nombre..."
               className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 pl-16 pr-8 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-[#f59e0b] focus:bg-white/10 transition-all shadow-2xl"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      <div className="flex flex-col -space-y-px max-w-4xl mx-auto">
         {filteredClients.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-20">
               <Users size={48} className="mx-auto mb-4" />
               <p className="text-[10px] font-black uppercase tracking-[0.4em]">Sin clientes registrados</p>
            </div>
         ) : (
            filteredClients.map((c, index) => (
               <motion.div 
                 key={c.id}
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: index * 0.02 }}
                 className={`
                    bg-black/80 backdrop-blur-2xl border border-white/10 p-4 transition-all group relative overflow-hidden
                    ${index === 0 ? 'rounded-t-[2rem]' : ''}
                    ${index === filteredClients.length - 1 ? 'rounded-b-[2rem]' : ''}
                    hover:bg-white/[0.02] z-10 hover:z-20
                 `}
               >
                  <div className="flex items-center gap-4">
                     {/* Foto Mini */}
                     <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                        {c.avatar ? <Image src={c.avatar} alt={c.name} width={40} height={40} className="w-full h-full object-cover" /> : <User size={18} className="w-full h-full p-2.5 text-white/20" />}
                     </div>

                     {/* Info Principal */}
                     <div className="min-w-0 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-8">
                        <div className="min-w-0">
                           <h3 className="text-[11px] font-black text-white uppercase tracking-tight truncate leading-none mb-1.5">{c.name}</h3>
                           <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                 <Star size={8} className="text-[#f59e0b] fill-[#f59e0b]" />
                                 <span className="text-[7px] font-black text-white/40 uppercase tracking-widest">{c.servicesCount} Visitas</span>
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center gap-6 md:gap-12">
                           <div className="flex flex-col items-end">
                              <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-0.5">Total Invertido</p>
                              <p className="text-[10px] font-black text-emerald-500 italic tracking-tighter">${new Intl.NumberFormat('de-DE').format(c.totalSpent)}</p>
                           </div>
                           <div className="flex flex-col items-end shrink-0 min-w-[70px]">
                              <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-0.5">Última Visita</p>
                              <p className="text-[9px] font-black text-white italic tracking-tighter">{format(new Date(c.lastService), 'dd/MM/yy')}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </motion.div>
            ))
         )}
      </div>
    </div>
  );
}
