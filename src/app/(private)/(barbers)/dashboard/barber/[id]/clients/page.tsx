'use client';
import { useBarberClients } from '@/hooks/useBarberData';
import { 
  Users, 
  Search, 
  User, 
  TrendingUp, 
  Star,
  Activity,
  History
} from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {filteredClients.length === 0 ? (
            <div className="col-span-full py-40 text-center border-2 border-dashed border-white/5 rounded-[4rem] opacity-20">
               <Users size={64} className="mx-auto mb-6" />
               <p className="text-xs font-black uppercase tracking-[0.4em]">No se encontraron clientes</p>
            </div>
         ) : (
            filteredClients.map(c => (
               <div key={c.id} className="bg-black/40 border border-white/5 rounded-[3rem] p-10 hover:border-[#f59e0b]/30 transition-all group relative overflow-hidden shadow-2xl">
                  <div className="relative z-10 space-y-10">
                     <div className="flex items-center gap-8">
                        <div className="w-24 h-24 rounded-[2rem] overflow-hidden bg-white/5 border-2 border-white/10 shadow-2xl group-hover:scale-105 transition-transform duration-500">
                           {c.avatar ? <img src={c.avatar} alt={`Avatar de ${c.name}`} className="w-full h-full object-cover" /> : <User size={40} className="w-full h-full p-8 text-white/20" />}
                        </div>
                        <div>
                           <h3 className="text-2xl font-black text-white uppercase tracking-tight italic leading-none mb-4 group-hover:text-[#f59e0b] transition-colors">{c.name}</h3>
                           <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full w-fit border border-white/5">
                              <Star size={10} className="text-[#f59e0b] fill-[#f59e0b]" />
                              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Cliente Fiel</span>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-8 pt-10 border-t border-white/5">
                        <div className="space-y-2">
                           <p className="text-[9px] font-black text-white/20 uppercase tracking-widest flex items-center gap-2">
                              <History size={12} /> Última Visita
                           </p>
                           <p className="text-sm font-black text-white italic uppercase tracking-tighter">{format(new Date(c.lastService), 'dd MMM, yyyy')}</p>
                        </div>
                        <div className="space-y-2 text-right">
                           <p className="text-[9px] font-black text-white/20 uppercase tracking-widest flex items-center gap-2 justify-end">
                              <TrendingUp size={12} className="text-emerald-500" /> Inversión
                           </p>
                           <p className="text-sm font-black text-white italic tracking-tighter">${new Intl.NumberFormat('de-DE').format(c.totalSpent)}</p>
                        </div>
                     </div>
                     
                     <button className="w-full bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-[0.3em] py-4 rounded-2xl hover:bg-[#f59e0b] hover:text-black hover:border-[#f59e0b] transition-all shadow-xl">
                        Ver Perfil Completo
                     </button>
                  </div>
                  <Activity size={240} className="absolute -bottom-24 -right-24 opacity-[0.02] text-[#f59e0b] group-hover:scale-110 transition-transform duration-1000" />
               </div>
            ))
         )}
      </div>
    </div>
  );
}
