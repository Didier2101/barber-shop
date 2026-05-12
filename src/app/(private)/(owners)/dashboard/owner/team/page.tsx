'use client';
import { useOwnerBaseData, useTodayAppointments, useOwnerMutations } from '@/hooks/useOwnerData';
import { 
  Users, 
  Plus, 
  Edit, 
  Check, 
  X, 
  User, 
  TrendingUp, 
  ArrowLeft,
  Mail,
  ShieldAlert
} from 'lucide-react';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { Profile, Appointment } from '@/types';

export default function TeamPage() {
  const { data: baseData, isLoading: baseLoading, refetch } = useOwnerBaseData();
  const { data: todayApts = [] } = useTodayAppointments();
  const { deleteUserStrict } = useOwnerMutations();
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
        <div className="w-8 h-8 border-4 border-[#f59e0b]/20 border-t-[#f59e0b] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-32">
      <div className="flex items-center gap-5">
        <div className="p-4 bg-black/80 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl text-[#f59e0b]">
          <Users size={28} />
        </div>
        <div>
          <p className="text-[#f59e0b] text-[10px] font-black uppercase tracking-[0.4em] mb-1">Recursos Humanos</p>
          <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">Equipo</h2>
        </div>
      </div>

      {!selectedBarber ? (
        <div className="space-y-8">
           <div className="flex justify-between items-center px-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 italic">Nómina de Artesanos</h3>
              <button 
                onClick={() => toast.info('Invitación a barbero próximamente')}
                className="bg-white text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
              >
                <Plus size={16} /> Nuevo Miembro
              </button>
           </div>

           <div className="flex flex-col -space-y-px">
              {barberPerformance.map((b, idx) => (
                <div 
                  key={b.id} 
                  onClick={() => setSelectedBarber(b)} 
                  className={`
                    group bg-black/80 border border-white/10 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 transition-all cursor-pointer relative overflow-hidden z-10 hover:z-20
                    ${idx === 0 ? 'rounded-t-[3rem]' : ''}
                    ${idx === barberPerformance.length - 1 ? 'rounded-b-[3rem]' : ''}
                  `}
                >
                  <div className="flex items-center gap-8 relative z-10 w-full md:w-auto">
                    <div className="w-20 h-20 rounded-[2rem] overflow-hidden bg-white/5 border border-white/10 relative shadow-2xl shrink-0">
                      {b.avatar_url ? <Image src={b.avatar_url} alt={b.name} width={64} height={64} className="w-full h-full object-cover" /> : <User size={32} className="w-full h-full p-6 text-white/10" />}
                      {!b.is_active && <div className="absolute inset-0 bg-red-500/40 flex items-center justify-center backdrop-blur-[2px]"><p className="text-[7px] font-black text-white uppercase tracking-widest bg-red-600 px-2 py-1 rounded-md">Inactivo</p></div>}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xl font-black uppercase tracking-tighter text-white leading-none mb-3 group-hover:text-[#f59e0b] transition-colors italic">{b.name}</h3>
                      <div className="flex gap-2">
                        <span className="text-[8px] font-black bg-[#f59e0b]/10 text-[#f59e0b] px-4 py-1.5 rounded-lg uppercase tracking-[0.2em] border border-[#f59e0b]/20 italic">{b.commission_percentage}% COMISIÓN</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-12 bg-white/5 px-10 py-6 rounded-[2rem] border border-white/5 relative z-10 w-full md:w-auto justify-center md:justify-start">
                    <div className="text-center min-w-[100px]">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-3 italic">Ventas Hoy</p>
                      <p className="text-2xl font-black text-white leading-none italic tracking-tighter">${new Intl.NumberFormat('de-DE').format(b.todayIncome)}</p>
                    </div>
                    <div className="w-px h-10 bg-white/10 hidden md:block" />
                    <div className="text-center min-w-[100px]">
                      <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-3 italic">Utilidad Local</p>
                      <p className="text-2xl font-black text-emerald-500 leading-none italic tracking-tighter">${new Intl.NumberFormat('de-DE').format(b.todayOwnerCut)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 relative z-10 w-full md:w-auto justify-end">
                    <button onClick={(e) => { e.stopPropagation(); toast.info('Edición próximamente'); }} className="p-4 bg-white/5 border border-white/10 text-white/20 hover:text-[#f59e0b] hover:bg-white/10 rounded-2xl transition-all"><Edit size={18} /></button>
                    <button onClick={(e) => { e.stopPropagation(); toggleBarberStatus(b.id, !!b.is_active); }} className={`p-4 border transition-all rounded-2xl ${!b.is_active ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20' : 'border-red-500/20 text-red-500 bg-red-500/10 hover:bg-red-500/20'}`}>
                      {!b.is_active ? <Check size={18} /> : <X size={18} />}
                    </button>
                  </div>
                  <TrendingUp size={240} className="absolute -bottom-24 -right-24 opacity-[0.02] text-[#f59e0b]" />
                </div>
              ))}
           </div>
        </div>
      ) : (
        <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-500">
           <div className="flex items-center justify-between px-4">
              <button onClick={() => setSelectedBarber(null)} className="flex items-center gap-3 px-8 py-4 bg-black/80 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-[#f59e0b] transition-all shadow-2xl group">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Regresar a Lista
              </button>
              <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Perfil de Artesano</h3>
           </div>
           
           <div className="bg-black/80 border border-white/10 rounded-[4rem] p-12 flex flex-col items-center text-center space-y-10 backdrop-blur-xl">
                <div className="w-40 h-40 rounded-[3rem] bg-white/5 border border-white/10 overflow-hidden shadow-2xl">
                   {selectedBarber.avatar_url ? <Image src={selectedBarber.avatar_url} alt={`Avatar de ${selectedBarber.name}`} width={128} height={128} className="w-full h-full object-cover" /> : <User size={48} className="w-full h-full p-10 text-white/10" />}
                </div>
              <div>
                 <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-3 italic leading-none">{selectedBarber.name}</h2>
                 <div className="flex items-center gap-2 justify-center text-white/40">
                    <Mail size={14} className="text-[#f59e0b]" />
                    <p className="text-[10px] font-black uppercase tracking-widest">{selectedBarber.email || 'Sin correo'}</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-2 gap-12 w-full max-w-2xl pt-12 border-t border-white/5">
                 <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-3 italic">Comisión Pactada</p>
                    <p className="text-4xl font-black text-[#f59e0b] italic tracking-tighter leading-none">{selectedBarber.commission_percentage}%</p>
                 </div>
                 <div className={`p-8 rounded-3xl border ${selectedBarber.is_active ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-3 italic">Estado Operativo</p>
                    <p className={`text-4xl font-black italic tracking-tighter leading-none ${selectedBarber.is_active ? 'text-emerald-500' : 'text-red-500'}`}>{selectedBarber.is_active ? 'ACTIVO' : 'PAUSADO'}</p>
                 </div>
              </div>

              <div className="pt-12 border-t border-white/5 w-full max-w-4xl">
                  <div className="bg-red-500/5 border border-red-500/20 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left space-y-2">
                      <div className="flex items-center gap-2 justify-center md:justify-start text-red-500">
                        <ShieldAlert size={18} />
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] italic">Zona de Seguridad</p>
                      </div>
                      <p className="text-[10px] text-white/20 font-medium max-w-xs leading-relaxed uppercase tracking-widest">Esta acción eliminará el acceso del barbero permanentemente.</p>
                    </div>
                    <button 
                      onClick={() => {
                        Swal.fire({
                          title: '¿ELIMINAR BARBERO?',
                          text: 'Se borrará su cuenta de acceso. Los datos contables históricos se conservarán.',
                          icon: 'warning',
                          showCancelButton: true,
                          confirmButtonColor: '#ef4444',
                          confirmButtonText: 'ELIMINAR MIEMBRO',
                          cancelButtonText: 'CANCELAR',
                          background: '#0a0a0a',
                          color: '#fff'
                        }).then(result => {
                          if (result.isConfirmed) {
                            deleteUserStrict.mutate(selectedBarber.id, {
                              onSuccess: () => {
                                toast.success('Miembro eliminado con éxito');
                                setSelectedBarber(null);
                              }
                            });
                          }
                        });
                      }}
                      className="bg-red-500 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-red-500/20 active:scale-95 transition-all"
                    >
                      Eliminar permanentemente
                    </button>
                  </div>
               </div>
           </div>
        </div>
      )}
    </div>
  );
}
