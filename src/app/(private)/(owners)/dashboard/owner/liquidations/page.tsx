'use client';
import { useOwnerMutations, useBarbersWithPendingServices, useBarberPendingSettlement } from '@/hooks/useOwnerData';
import { 
  Check, 
  ChevronRight,
  TrendingUp,
  Activity,
  User,
  Clock
} from 'lucide-react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { Appointment } from '@/types';

export default function LiquidationsPage() {
  const { data: barbersPending = [], isLoading: listLoading } = useBarbersWithPendingServices();
  const { createSettlement } = useOwnerMutations();
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);

  // Fetch detail for selected barber
  const { data: detailData } = useBarberPendingSettlement(selectedBarberId);
  
  const selectedBarber = barbersPending.find(b => b.id === selectedBarberId);
  const pendingServices = detailData?.appointments || [];

  if (listLoading && !selectedBarberId) {
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
          <Check size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 uppercase">Cierre de Liquidaciones</h2>
          <p className="text-[11px] text-gray-500 font-medium tracking-wider">Gestión contable y pagos a barberos</p>
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
                className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm hover:border-[#0061ff]/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all group cursor-pointer relative overflow-hidden"
              >
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                      {barber.avatar_url ? <img src={barber.avatar_url} alt={`Avatar de ${barber.name}`} className="w-full h-full object-cover" /> : <User size={24} className="text-gray-300" />}
                    </div>
                    <div>
                      <h4 className="text-base font-black text-gray-900 uppercase tracking-tight">{barber.name}</h4>
                      <span className="text-[9px] font-black text-[#0061ff] bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest">{commission}% Comisión</span>
                    </div>
                  </div>

                  <div className="space-y-4 flex-1">
                    <div className="flex justify-between items-end">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pendiente</p>
                      <p className="text-2xl font-black text-gray-900 leading-none">${new Intl.NumberFormat('de-DE').format(barberCut)}</p>
                    </div>
                    <div className="w-full bg-gray-50 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#0061ff] h-full transition-all" style={{ width: `${Math.min(100, (barber.pendingCount / 10) * 100)}%` }} />
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase text-right">{barber.pendingCount} servicios sin cobrar</p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between group-hover:text-[#0061ff] transition-colors">
                    <span className="text-[10px] font-black uppercase tracking-widest">Liquidar Ahora</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
                <Activity size={180} className="absolute -bottom-16 -right-16 opacity-[0.02] text-blue-500 group-hover:scale-110 transition-transform duration-1000" />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
           {/* Barber Detail View in Liquidations */}
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <button 
                onClick={() => setSelectedBarberId(null)}
                className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-900 hover:bg-gray-50 transition-all shadow-sm group"
              >
                <ChevronRight size={16} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                Volver a la lista
              </button>
              {selectedBarber && (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden">
                    {selectedBarber.avatar_url ? <img src={selectedBarber.avatar_url} alt={`Avatar de ${selectedBarber.name}`} className="w-full h-full object-cover" /> : <User size={20} className="w-full h-full p-2 text-gray-300" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 uppercase">{selectedBarber.name}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Detalle de servicios pendientes</p>
                  </div>
                </div>
              )}
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-6">
                 {pendingServices.length === 0 ? (
                   <div className="py-32 text-center border border-dashed border-gray-200 rounded-[3rem] bg-gray-50/50">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">No hay servicios pendientes para liquidar</p>
                   </div>
                 ) : (
                    <div className="grid gap-4">
                       {pendingServices.map((apt: Appointment) => (
                        <div key={apt.id} className="bg-white border border-gray-100 rounded-3xl p-6 flex items-center justify-between shadow-sm hover:border-blue-100 transition-all">
                           <div className="flex items-center gap-6">
                              <div className="w-12 h-12 bg-blue-50/50 rounded-2xl flex items-center justify-center text-[#0061ff]">
                                 <Clock size={20} />
                              </div>
                              <div>
                                 <p className="text-sm font-black text-gray-900 uppercase mb-1">{apt.client?.name || apt.client_name}</p>
                                 <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400">
                                    <span className="uppercase">{format(new Date(apt.start_time), 'dd MMM')}</span>
                                    <span>•</span>
                                    <span>{format(new Date(apt.start_time), 'HH:mm')}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-lg font-black text-gray-900">${new Intl.NumberFormat('de-DE').format(apt.price)}</p>
                              <span className="text-[9px] font-black text-[#0061ff] uppercase">Completado</span>
                           </div>
                        </div>
                      ))}
                   </div>
                 )}
              </div>

              <div className="space-y-8">
                 <div className="bg-[#0061ff] rounded-[3rem] p-10 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden">
                    <div className="relative z-10 space-y-8">
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Total en servicios</p>
                          <p className="text-4xl font-black italic tracking-tighter leading-none">${new Intl.NumberFormat('de-DE').format(pendingServices.reduce((sum: number, a: Appointment) => sum + Number(a.price), 0))}</p>
                       </div>
                       <div className="pt-8 border-t border-white/10">
                          <div className="flex justify-between items-end mb-8">
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Pago Barbero</p>
                                <p className="text-3xl font-black italic tracking-tighter text-white">${new Intl.NumberFormat('de-DE').format(pendingServices.reduce((sum: number, a: Appointment) => sum + Number(a.price), 0) * (selectedBarber?.commission_percentage || 50) / 100)}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Local</p>
                                <p className="text-xl font-black italic tracking-tighter text-white opacity-80">${new Intl.NumberFormat('de-DE').format(pendingServices.reduce((sum: number, a: Appointment) => sum + Number(a.price), 0) * (100 - (selectedBarber?.commission_percentage || 50)) / 100)}</p>
                             </div>
                          </div>
                          
                          <button 
                             disabled={pendingServices.length === 0}
                             onClick={() => {
                                if (!selectedBarber) return;
                                const totalGross = pendingServices.reduce((sum: number, a: Appointment) => sum + Number(a.price), 0);
                                const commission = selectedBarber.commission_percentage || 50;
                                const barberPayment = (totalGross * commission) / 100;

                                Swal.fire({
                                  title: 'Procesar Liquidación',
                                  html: `
                                    <div className="text-left space-y-4 py-4">
                                      <p className="text-xs text-gray-500 uppercase font-black tracking-widest">Resumen del Cierre</p>
                                      <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-400 font-bold uppercase text-[10px]">Total Bruto:</span>
                                          <span className="font-black text-gray-900">$${new Intl.NumberFormat('de-DE').format(totalGross)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-400 font-bold uppercase text-[10px]">Pago al Barbero (${commission}%):</span>
                                          <span className="font-black text-emerald-600">$${new Intl.NumberFormat('de-DE').format(barberPayment)}</span>
                                        </div>
                                        <div className="h-px bg-gray-200" />
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-400 font-bold uppercase text-[10px]">Ingreso Local:</span>
                                          <span className="font-black text-[#0061ff]">$${new Intl.NumberFormat('de-DE').format(totalGross - barberPayment)}</span>
                                        </div>
                                      </div>
                                      <textarea id="notes" placeholder="Notas opcionales (ej: anticipos, descuentos...)" class="w-full bg-white border border-gray-100 rounded-xl p-4 text-xs mt-4 outline-none focus:border-[#0061ff] transition-all min-h-[100px]"></textarea>
                                    </div>
                                  `,
                                  icon: 'info',
                                  showCancelButton: true,
                                  confirmButtonColor: '#0061ff',
                                  confirmButtonText: 'Confirmar Pago',
                                  cancelButtonText: 'Cancelar'
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
                                        Swal.fire('¡Éxito!', 'La liquidación ha sido procesada.', 'success');
                                        setSelectedBarberId(null);
                                      }
                                    });
                                  }
                                });
                             }}
                             className="w-full bg-white text-[#0061ff] py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                          >
                             Cerrar y Pagar
                          </button>
                       </div>
                    </div>
                    <TrendingUp size={240} className="absolute -bottom-20 -right-20 opacity-10 text-white group-hover:scale-110 transition-transform duration-1000" />
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
