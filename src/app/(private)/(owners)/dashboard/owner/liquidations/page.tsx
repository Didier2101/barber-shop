'use client';
import { useOwnerMutations, useBarbersWithPendingServices, useBarberPendingSettlement } from '@/hooks/useOwnerData';
import { 
  Check, 
  ChevronRight,
  TrendingUp,
  Activity,
  User,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { Appointment } from '@/types';
import { toast } from 'sonner';

export default function LiquidationsPage() {
  const { data: barbersPending = [], isLoading: listLoading } = useBarbersWithPendingServices();
  const { createSettlement } = useOwnerMutations();
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);

  const { data: detailData } = useBarberPendingSettlement(selectedBarberId);
  
  const selectedBarber = barbersPending.find(b => b.id === selectedBarberId);
  const pendingServices = detailData?.appointments || [];

  if (listLoading && !selectedBarberId) {
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
          <Check size={28} />
        </div>
        <div>
          <p className="text-[#f59e0b] text-[10px] font-black uppercase tracking-[0.4em] mb-1">Gestión Contable</p>
          <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">Liquidaciones</h2>
        </div>
      </div>

      {!selectedBarberId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {barbersPending.map(barber => {
            const pendingTotal = barber.pendingTotal || 0;
            const commission = barber.commission_percentage || 50;
            const barberCut = (pendingTotal * commission) / 100;

            return (
              <div 
                key={barber.id} 
                onClick={() => setSelectedBarberId(barber.id)}
                className="bg-black/80 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl hover:border-[#f59e0b]/30 transition-all group cursor-pointer relative overflow-hidden"
              >
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                      {barber.avatar_url ? <Image src={barber.avatar_url} alt={`Avatar de ${barber.name}`} width={40} height={40} className="w-full h-full object-cover" /> : <User size={24} className="text-white/20" />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-lg font-black text-white uppercase tracking-tight truncate italic">{barber.name}</h4>
                      <span className="text-[8px] font-black text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2 py-1 rounded uppercase tracking-[0.2em]">{commission}% COMISIÓN</span>
                    </div>
                  </div>

                  <div className="space-y-5 flex-1">
                    <div className="flex justify-between items-end">
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Pendiente de Pago</p>
                      <p className="text-3xl font-black text-white leading-none tracking-tighter italic">${new Intl.NumberFormat('de-DE').format(barberCut)}</p>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden p-0.5 border border-white/5">
                      <div className="bg-[#f59e0b] h-full transition-all shadow-[0_0_10px_rgba(245,158,11,0.3)]" style={{ width: `${Math.min(100, (barber.pendingCount / 10) * 100)}%` }} />
                    </div>
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] text-right italic">{barber.pendingCount} servicios sin cobrar</p>
                  </div>

                  <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between group-hover:text-[#f59e0b] transition-colors">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em]">Procesar Cierre</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
                <Activity size={180} className="absolute -bottom-16 -right-16 opacity-[0.02] text-[#f59e0b] group-hover:scale-110 transition-transform duration-1000" />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <button 
                onClick={() => setSelectedBarberId(null)}
                className="flex items-center gap-3 px-8 py-4 bg-black/80 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-[#f59e0b] hover:bg-black transition-all shadow-xl group"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Volver a la lista
              </button>
              {selectedBarber && (
                <div className="flex items-center gap-5 bg-black/40 px-6 py-3 rounded-3xl border border-white/5">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                    {selectedBarber.avatar_url ? <Image src={selectedBarber.avatar_url} alt={`Avatar de ${selectedBarber.name}`} width={80} height={80} className="w-full h-full object-cover" /> : <User size={20} className="w-full h-full p-2 text-white/20" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">{selectedBarber.name}</h3>
                    <p className="text-[8px] text-[#f59e0b] font-black uppercase tracking-[0.3em]">Cierre de Caja Detallado</p>
                  </div>
                </div>
              )}
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-6">
                 {pendingServices.length === 0 ? (
                   <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-30">
                      <p className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Sin servicios por liquidar</p>
                   </div>
                 ) : (
                    <div className="flex flex-col -space-y-px">
                       {pendingServices.map((apt: Appointment, idx: number) => (
                         <div 
                           key={apt.id} 
                           className={`
                             bg-black/80 border border-white/10 p-5 md:p-6 flex items-center justify-between transition-all group relative z-10 hover:z-20
                             ${idx === 0 ? 'rounded-t-[2.5rem]' : ''}
                             ${idx === pendingServices.length - 1 ? 'rounded-b-[2.5rem]' : ''}
                           `}
                         >
                            <div className="flex items-center gap-6">
                               <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-[#f59e0b] border border-white/5">
                                  <Clock size={20} />
                               </div>
                               <div>
                                  <p className="text-sm md:text-lg font-black text-white uppercase italic tracking-tight mb-1">{apt.client?.name || apt.client_name}</p>
                                  <div className="flex items-center gap-3 text-[8px] font-black text-white/20 uppercase tracking-widest">
                                     <span>{format(new Date(apt.start_time), 'dd MMM')}</span>
                                     <span>•</span>
                                     <span>{format(new Date(apt.start_time), 'HH:mm')}</span>
                                  </div>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-xl font-black text-white italic tracking-tighter leading-none">${new Intl.NumberFormat('de-DE').format(apt.price)}</p>
                               <span className="text-[7px] font-black text-[#f59e0b] uppercase tracking-[0.2em] mt-1 block">Finalizado</span>
                            </div>
                         </div>
                       ))}
                    </div>
                 )}
              </div>

              <div className="space-y-8">
                 <div className="bg-black/80 border border-[#f59e0b]/20 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                    <div className="relative z-10 space-y-10">
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-3">Total Bruto</p>
                          <p className="text-5xl font-black italic tracking-tighter leading-none text-white">${new Intl.NumberFormat('de-DE').format(pendingServices.reduce((sum: number, a: Appointment) => sum + Number(a.price), 0))}</p>
                       </div>
                       <div className="pt-10 border-t border-white/10 space-y-8">
                          <div className="flex justify-between items-end">
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#f59e0b] mb-2 italic">Pago Barbero ({selectedBarber?.commission_percentage || 50}%)</p>
                                <p className="text-4xl font-black italic tracking-tighter text-white leading-none">${new Intl.NumberFormat('de-DE').format(pendingServices.reduce((sum: number, a: Appointment) => sum + Number(a.price), 0) * (selectedBarber?.commission_percentage || 50) / 100)}</p>
                             </div>
                          </div>

                          <div className="flex justify-between items-center bg-white/5 p-5 rounded-2xl border border-white/5">
                             <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Utilidad Local</p>
                             <p className="text-xl font-black italic tracking-tighter text-emerald-500">${new Intl.NumberFormat('de-DE').format(pendingServices.reduce((sum: number, a: Appointment) => sum + Number(a.price), 0) * (100 - (selectedBarber?.commission_percentage || 50)) / 100)}</p>
                          </div>
                          
                          <button 
                             disabled={pendingServices.length === 0}
                             onClick={() => {
                                if (!selectedBarber) return;
                                const totalGross = pendingServices.reduce((sum: number, a: Appointment) => sum + Number(a.price), 0);
                                const commission = selectedBarber.commission_percentage || 50;
                                const barberPayment = (totalGross * commission) / 100;

                                Swal.fire({
                                  title: 'PROCESAR LIQUIDACIÓN',
                                  html: `
                                    <div className="text-left space-y-6 py-6">
                                      <p className="text-[10px] text-white/20 uppercase font-black tracking-[0.3em] mb-4 text-center italic">Resumen del Cierre de Caja</p>
                                      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-5 shadow-inner">
                                        <div className="flex justify-between items-center">
                                          <span className="text-white/40 font-black uppercase text-[10px] tracking-widest">Facturación:</span>
                                          <span className="font-black text-2xl italic tracking-tighter text-white">$${new Intl.NumberFormat('de-DE').format(totalGross)}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-5 border-t border-white/5">
                                          <span className="text-[#f59e0b] font-black uppercase text-[10px] tracking-widest">Al Barbero:</span>
                                          <span className="font-black text-2xl italic tracking-tighter text-white">$${new Intl.NumberFormat('de-DE').format(barberPayment)}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-5 border-t border-white/5">
                                          <span className="text-emerald-500 font-black uppercase text-[10px] tracking-widest">Local:</span>
                                          <span className="font-black text-2xl italic tracking-tighter text-emerald-500">$${new Intl.NumberFormat('de-DE').format(totalGross - barberPayment)}</span>
                                        </div>
                                      </div>
                                      <div className="space-y-2 pt-4">
                                         <p className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1 italic">Anotaciones de Cierre</p>
                                         <textarea id="notes" placeholder="Ej: Pago en efectivo, adelantos..." class="w-full bg-black border border-white/10 rounded-2xl p-5 text-xs text-white placeholder:text-white/10 outline-none focus:border-[#f59e0b]/40 transition-all min-h-[100px]"></textarea>
                                      </div>
                                    </div>
                                  `,
                                  icon: 'info',
                                  showCancelButton: true,
                                  confirmButtonColor: '#f59e0b',
                                  confirmButtonText: 'CONFIRMAR PAGO',
                                  cancelButtonText: 'VOLVER',
                                  background: '#0a0a0a',
                                  color: '#fff',
                                }).then((result) => {
                                  if (result.isConfirmed) {
                                    const notes = (document.getElementById('notes') as HTMLTextAreaElement).value;
                                    createSettlement.mutate({
                                      barber_id: selectedBarber!.id,
                                      total_gross: totalGross,
                                      barber_payment: barberPayment,
                                      owner_payment: totalGross - barberPayment,
                                      notes: notes,
                                      appointment_ids: pendingServices.map((a: Appointment) => a.id)
                                    }, {
                                      onSuccess: () => {
                                        toast.success('La liquidación ha sido procesada con éxito');
                                        setSelectedBarberId(null);
                                      }
                                    });
                                  }
                                });
                             }}
                             className="w-full bg-[#f59e0b] text-black py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center gap-3"
                          >
                             <Check size={18} />
                             Confirmar Liquidación
                          </button>
                       </div>
                    </div>
                    <TrendingUp size={240} className="absolute -bottom-24 -right-24 opacity-[0.03] text-[#f59e0b] group-hover:scale-110 transition-transform duration-1000" />
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
