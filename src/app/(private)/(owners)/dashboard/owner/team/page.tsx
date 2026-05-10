'use client';
import { useOwnerBaseData, useTodayAppointments } from '@/hooks/useOwnerData';
import { 
  Users, 
  Plus, 
  Edit, 
  Check, 
  X, 
  User, 
  TrendingUp, 
  ChevronLeft
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Profile, Appointment } from '@/types';

export default function TeamPage() {
  const { data: baseData, isLoading: baseLoading, refetch } = useOwnerBaseData();
  const { data: todayApts = [] } = useTodayAppointments();
  const [selectedBarber, setSelectedBarber] = useState<(Profile & { todayIncome: number; todayBarberCut: number; todayOwnerCut: number }) | null>(null);

  const barberPerformance = useMemo(() => {
    const barbers = baseData?.barbers || [];
    return barbers.map((b: Profile) => {
      const bApts = todayApts.filter((a: Appointment) => a.barber_id === b.id && a.status === 'completed');
      
      const todayIncome = bApts.reduce((sum: number, a: Appointment) => sum + Number(a.price), 0);
      const commission = b.commission_percentage || 50;
      const todayBarberCut = (todayIncome * commission) / 100;
      const todayOwnerCut = todayIncome - todayBarberCut;

      return {
        ...b,
        todayIncome,
        todayBarberCut,
        todayOwnerCut
      };
    });
  }, [baseData?.barbers, todayApts]);

  const toggleBarberStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_active: !currentStatus }).eq('id', id);
    if (error) toast.error('Error al actualizar estado');
    else {
      toast.success('Estado actualizado');
      refetch();
    }
  };

  if (baseLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#0061ff] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm text-[#0061ff]">
          <Users size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 uppercase">Gestión de Equipo</h2>
          <p className="text-[11px] text-gray-500 font-medium tracking-wider">Supervisión de barberos y rendimiento operativo</p>
        </div>
      </div>

      {!selectedBarber ? (
        <div className="space-y-8">
           <div className="flex justify-between items-center px-2">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Nómina de Barberos</h3>
              <button 
                onClick={() => toast.info('Funcionalidad de invitación próximamente')}
                className="bg-[#0061ff] text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <Plus size={14} /> Nuevo Miembro
              </button>
           </div>

           <div className="grid gap-6">
              {barberPerformance.map(b => (
                <div key={b.id} onClick={() => setSelectedBarber(b)} className="group bg-white border border-gray-100 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-10 hover:border-[#0061ff]/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer relative overflow-hidden">
                  <div className="flex items-center gap-8 relative z-10">
                    <div className="w-20 h-20 rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 relative shadow-inner">
                      {b.avatar_url ? <img src={b.avatar_url} alt={b.name} className="w-full h-full object-cover" /> : <User size={32} className="w-full h-full p-6 text-gray-300" />}
                      {!b.is_active && <div className="absolute inset-0 bg-red-500/40 flex items-center justify-center backdrop-blur-[2px]"><p className="text-[8px] font-black text-white uppercase tracking-widest bg-red-600 px-2 py-1 rounded-lg">Inactivo</p></div>}
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight text-gray-900 leading-none mb-3 group-hover:text-[#0061ff] transition-colors">{b.name}</h3>
                      <div className="flex gap-2">
                        <span className="text-[9px] font-black bg-blue-50/50 text-[#0061ff] px-4 py-1.5 rounded-full uppercase tracking-widest border border-blue-100/50">{b.commission_percentage}% Comisión</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-12 bg-gray-50/50 px-10 py-8 rounded-[2rem] border border-gray-100 relative z-10">
                    <div className="text-center min-w-[100px]">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">Ventas Hoy</p>
                      <p className="text-2xl font-black text-gray-900 leading-none">${new Intl.NumberFormat('de-DE').format(b.todayIncome)}</p>
                    </div>
                    <div className="w-px h-10 bg-gray-200 hidden md:block" />
                    <div className="text-center min-w-[100px]">
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-3">Ganancia Local</p>
                      <p className="text-2xl font-black text-gray-900 leading-none">${new Intl.NumberFormat('de-DE').format(b.todayOwnerCut)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 relative z-10">
                    <button onClick={(e) => { e.stopPropagation(); toast.info('Edición próximamente'); }} className="p-4 bg-white border border-gray-100 text-gray-400 hover:text-[#0061ff] hover:bg-blue-50 rounded-2xl transition-all shadow-sm"><Edit size={18} /></button>
                    <button onClick={(e) => { e.stopPropagation(); toggleBarberStatus(b.id, !!b.is_active); }} className={`p-4 bg-white border border-gray-100 transition-all rounded-2xl shadow-sm ${!b.is_active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-red-400 hover:bg-red-50'}`}>
                      {!b.is_active ? <Check size={20} /> : <X size={20} />}
                    </button>
                  </div>
                  <TrendingUp size={240} className="absolute -bottom-24 -right-24 opacity-[0.02] text-blue-500 group-hover:scale-110 transition-transform duration-1000" />
                </div>
              ))}
           </div>
        </div>
      ) : (
        <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-500">
           {/* Detailed Barber Performance View could go here, or just basic info */}
           <div className="flex items-center justify-between">
              <button onClick={() => setSelectedBarber(null)} className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-900 hover:bg-gray-50 transition-all shadow-sm group">
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Regresar
              </button>
              <h3 className="text-lg font-black text-gray-900 uppercase">Detalle de {selectedBarber.name}</h3>
           </div>
           
           <div className="bg-white border border-gray-100 rounded-[3rem] p-12 flex flex-col items-center text-center space-y-8">
               <div className="w-32 h-32 rounded-[2.5rem] bg-gray-50 border border-gray-100 overflow-hidden shadow-xl">
                  {selectedBarber.avatar_url ? <img src={selectedBarber.avatar_url} alt={`Avatar de ${selectedBarber.name}`} className="w-full h-full object-cover" /> : <User size={48} className="w-full h-full p-8 text-gray-300" />}
               </div>
              <div>
                 <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">{selectedBarber.name}</h2>
                 <p className="text-sm font-bold text-[#0061ff] uppercase tracking-[0.2em]">{selectedBarber.email || 'Sin correo registrado'}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-4xl pt-10 border-t border-gray-50">
                 <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Comisión</p>
                    <p className="text-2xl font-black text-gray-900">{selectedBarber.commission_percentage}%</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Estado</p>
                    <p className={`text-2xl font-black ${selectedBarber.is_active ? 'text-emerald-500' : 'text-red-400'}`}>{selectedBarber.is_active ? 'ACTIVO' : 'PAUSADO'}</p>
                 </div>
                 {/* Add more stats if needed */}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
