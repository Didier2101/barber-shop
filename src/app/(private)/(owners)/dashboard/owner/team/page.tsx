'use client';
import { useOwnerBaseData, useTodayAppointments, useOwnerMutations, useBarberPendingSettlement } from '@/hooks/owner';
import {
  Users,
  Plus,
  Edit,
  Check,
  X,
  User,
  Mail,
  Eye,
  EyeOff,
  Activity,
  ArrowRight
} from 'lucide-react';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { Profile, Appointment } from '@/types';

export default function TeamPage() {
  const { data: baseData, isLoading: baseLoading, refetch } = useOwnerBaseData();
  const { data: todayApts = [] } = useTodayAppointments();
  const { createBarber, createSettlement } = useOwnerMutations();
  const [selectedBarber, setSelectedBarber] = useState<(Profile & { todayIncome: number; todayBarberCut: number; todayOwnerCut: number; todayAptsCount: number }) | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newBarber, setNewBarber] = useState({ name: '', email: '', password: '', commission: '50' });
  const [showPassword, setShowPassword] = useState(false);
  
  const { data: detailData, isLoading: detailsLoading } = useBarberPendingSettlement(selectedBarber?.id || null);
  const pendingServices = detailData?.appointments || [];
  const pendingTotal = pendingServices.reduce((sum: number, a: Appointment) => sum + Number(a.price), 0);
  const pendingBarberCut = selectedBarber ? (pendingTotal * (selectedBarber.commission_percentage || 50)) / 100 : 0;


  const handleCreateBarber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBarber.name || !newBarber.email || !newBarber.password) {
      return toast.error('Rellena todos los campos (nombre, correo y contraseña)');
    }
    createBarber.mutate({
      name: newBarber.name,
      email: newBarber.email,
      password: newBarber.password,
      commission_percentage: Number(newBarber.commission || 0)
    }, {
      onSuccess: () => {
        setIsAdding(false);
        setNewBarber({ name: '', email: '', password: '', commission: '50' });
      }
    });
  };

  const barberPerformance = useMemo(() => {
    const barbers = baseData?.barbers || [];
    return barbers.map((b: Profile) => {
      const bApts = todayApts.filter((a: Appointment) => a.barber_id === b.id && a.status === 'completed');

      const todayIncome = bApts.reduce((sum: number, a: Appointment) => sum + Number(a.price), 0);
      const commission = b.commission_percentage || 50;
      const todayBarberCut = (todayIncome * commission) / 100;
      const todayOwnerCut = todayIncome - todayBarberCut;

      const todayAptsCount = bApts.length;

      return {
        ...b,
        todayIncome,
        todayBarberCut,
        todayOwnerCut,
        todayAptsCount
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
        <div className="w-8 h-8 border-4 border-brand/20 border-t-[#f59e0b] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-8xl mx-auto pb-32">


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LADO IZQUIERDO: Lista de Barberos */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
              <Users size={12} className="text-brand" /> Nómina de Artesanos
            </h3>
            <button
              onClick={() => {
                setSelectedBarber(null);
                setIsAdding(true);
                setNewBarber({ name: '', email: '', password: '', commission: '50' });
              }}
              className="flex items-center gap-2 bg-brand/10 text-brand px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider hover:bg-brand hover:text-black transition-all"
            >
              <Plus size={12} />
              Nuevo Miembro
            </button>
          </div>

          <div className="bg-black border border-white/5 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[70vh]">
            {barberPerformance.length === 0 ? (
              <div className="flex-1 p-16 flex flex-col items-center justify-center text-center opacity-40">
                <Users size={32} className="text-white/20 mb-4" />
                <p className="text-xs font-medium text-white uppercase tracking-wider">No hay miembros registrados</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col p-2 space-y-2">
                {barberPerformance.map((b) => {
                  const isSelected = selectedBarber?.id === b.id && !isAdding;
                  return (
                    <div
                      key={b.id}
                      onClick={() => {
                        setIsAdding(false);
                        setSelectedBarber(b);
                      }}
                      className={`w-full p-4 rounded-xl border flex flex-col transition-all cursor-pointer group ${isSelected ? 'bg-brand/10 border-brand/30' : 'bg-bg-base border-white/5 hover:border-white/10'}`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl overflow-hidden border shrink-0 flex items-center justify-center relative ${isSelected ? 'border-brand/30' : 'border-white/10'}`}>
                            {b.avatar_url ? (
                              <Image src={b.avatar_url} alt={b.name} width={48} height={48} className="w-full h-full object-cover" />
                            ) : (
                              <User size={20} className={isSelected ? 'text-brand' : 'text-white/20'} />
                            )}
                            {!b.is_active && <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center backdrop-blur-[1px]"><p className="text-[8px] font-bold text-white uppercase tracking-widest">Off</p></div>}
                          </div>
                          <div>
                            <h4 className={`text-sm font-bold uppercase tracking-tight mb-0.5 ${isSelected ? 'text-brand' : 'text-white'}`}>
                              {b.name}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[9px] font-medium text-white/50 uppercase tracking-wider">
                              <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">{b.commission_percentage}% COMISIÓN</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBarberStatus(b.id, !!b.is_active);
                            }}
                            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider transition-all border ${b.is_active
                                ? 'text-red-500 border-red-500/20 bg-red-500/5 hover:bg-red-500/10'
                                : 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10'
                              }`}
                          >
                            {b.is_active ? <><X size={12} /> Desactivar</> : <><Check size={12} /> Activar</>}
                          </button>
                        </div>
                      </div>

                      </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* LADO DERECHO: Detalle o Formulario */}
        <div className="lg:col-span-8 space-y-6">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 px-2 flex items-center gap-2">
            <Edit size={12} className="text-brand" /> {isAdding ? 'Nuevo Barbero' : selectedBarber ? 'Perfil de Artesano' : 'Gestión'}
          </h3>

          <div className="bg-surface border border-white/5 rounded-2xl p-8 shadow-xl relative min-h-[65vh]">

            {isAdding ? (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand/10 border border-brand/20 rounded-xl text-brand">
                      <Plus size={20} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white uppercase tracking-tight">Crear Perfil</h4>
                      <p className="text-[10px] font-medium text-brand uppercase tracking-widest mt-1">Añadir miembro al equipo</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAdding(false)}
                    className="text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-white transition-all bg-white/5 px-3 py-1.5 rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>

                <form onSubmit={handleCreateBarber} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider ml-1">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      value={newBarber.name}
                      onChange={e => setNewBarber({ ...newBarber, name: e.target.value })}
                      className="w-full bg-bg-base border border-white/5 rounded-xl px-4 py-4 text-sm font-bold text-white outline-none focus:border-brand transition-all placeholder:font-normal uppercase tracking-wide"
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider ml-1">Correo Electrónico</label>
                    <input
                      type="email"
                      required
                      value={newBarber.email}
                      onChange={e => setNewBarber({ ...newBarber, email: e.target.value })}
                      className="w-full bg-bg-base border border-white/5 rounded-xl px-4 py-4 text-sm font-bold text-white outline-none focus:border-brand transition-all placeholder:font-normal"
                      placeholder="barbero@tumarca.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider ml-1">Contraseña Provisional</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={newBarber.password}
                          onChange={e => setNewBarber({ ...newBarber, password: e.target.value })}
                          className="w-full bg-bg-base border border-white/5 rounded-xl pl-4 pr-12 py-4 text-sm font-bold text-white outline-none focus:border-brand transition-all placeholder:font-normal"
                          placeholder="Mínimo 6 caracteres"
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-brand transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider ml-1">Comisión (%)</label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={2}
                          value={newBarber.commission}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val === '' || (Number(val) >= 0 && Number(val) <= 99)) {
                              setNewBarber({ ...newBarber, commission: val });
                            }
                          }}
                          className="w-full bg-bg-base border border-white/5 rounded-xl px-4 py-4 text-sm font-bold text-brand outline-none focus:border-brand transition-all text-center"
                          placeholder="50"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-white/40">%</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={createBarber.isPending}
                      className="w-full bg-brand text-black py-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {createBarber.isPending ? 'CREANDO PERFIL...' : 'REGISTRAR BARBERO'}
                      {!createBarber.isPending && <Plus size={14} />}
                    </button>
                  </div>
                </form>
              </div>
            ) : selectedBarber ? (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 h-full flex flex-col">
                <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand/10 border border-brand/20 rounded-xl text-brand">
                      <User size={20} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white uppercase tracking-tight">{selectedBarber.name}</h4>
                      <p className="text-[10px] font-medium text-brand uppercase tracking-widest mt-1">Ficha Técnica</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedBarber(null)}
                    className="text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-white transition-all bg-white/5 px-3 py-1.5 rounded-lg"
                  >
                    Cerrar
                  </button>
                </div>

                <div className="flex flex-col items-center justify-center flex-1 space-y-8">
                  <div className="w-32 h-32 rounded-[2rem] bg-bg-base border-2 border-white/10 overflow-hidden shadow-2xl relative">
                    {selectedBarber.avatar_url ? (
                      <Image src={selectedBarber.avatar_url} alt={`Avatar de ${selectedBarber.name}`} width={128} height={128} className="w-full h-full object-cover" />
                    ) : (
                      <User size={48} className="w-full h-full p-8 text-white/10" />
                    )}
                    {!selectedBarber.is_active && (
                      <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center backdrop-blur-[2px]">
                        <p className="text-xs font-bold text-white uppercase tracking-widest">Desactivado</p>
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white uppercase tracking-tight mb-2">{selectedBarber.name}</h2>
                    <div className="flex items-center gap-2 justify-center text-white/40">
                      <Mail size={14} className="text-brand" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">{selectedBarber.email || 'Sin correo'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full pt-4">
                    <div className="bg-bg-base p-6 rounded-2xl border border-white/5 text-center flex flex-col justify-center">
                      <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-2">Comisión Pactada</p>
                      <p className="text-3xl font-bold text-brand tracking-tighter leading-none">{selectedBarber.commission_percentage}%</p>
                    </div>
                    <div className={`p-6 rounded-2xl border text-center flex flex-col justify-center ${selectedBarber.is_active ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                      <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-2">Estado Operativo</p>
                      <p className={`text-2xl font-bold tracking-tight uppercase ${selectedBarber.is_active ? 'text-emerald-500' : 'text-red-500'}`}>
                        {selectedBarber.is_active ? 'Activo' : 'Desactivado'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Nuevas Métricas Detalladas */}
                  <div className="grid grid-cols-3 gap-4 w-full">
                     <div className="bg-bg-base p-6 rounded-2xl border border-white/5 text-center flex flex-col justify-center">
                        <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-2">Servicios Hoy</p>
                        <p className="text-2xl font-bold text-white tracking-tighter leading-none">{selectedBarber.todayAptsCount}</p>
                     </div>
                     <div className="bg-bg-base p-6 rounded-2xl border border-white/5 text-center flex flex-col justify-center">
                        <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-2">Ventas Generadas</p>
                        <p className="text-2xl font-bold text-white tracking-tighter leading-none">${new Intl.NumberFormat('de-DE').format(selectedBarber.todayIncome)}</p>
                     </div>
                     <div className="bg-brand/5 p-6 rounded-2xl border border-brand/20 text-center flex flex-col justify-center">
                        <p className="text-[9px] font-bold text-brand/60 uppercase tracking-widest mb-2">Ganancia Local</p>
                        <p className="text-2xl font-bold text-brand tracking-tighter leading-none">${new Intl.NumberFormat('de-DE').format(selectedBarber.todayOwnerCut)}</p>
                     </div>
                  </div>
                  
                  {/* LIQUIDACIONES */}
                  <div className="mt-8 pt-8 border-t border-white/5">
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-brand/10 border border-brand/20 rounded-lg text-brand">
                              <Activity size={16} />
                           </div>
                           <div>
                              <h4 className="text-sm font-bold text-white uppercase tracking-tight">Liquidaciones Pendientes</h4>
                              <p className="text-[10px] text-white/40 uppercase tracking-widest">{pendingServices.length} servicios por liquidar</p>
                           </div>
                        </div>
                     </div>
                     
                     {pendingServices.length > 0 ? (
                        <div className="bg-black border border-brand/20 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
                           <div className="relative z-10 space-y-1 w-full sm:w-auto text-center sm:text-left">
                              <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">Total a Pagar ({selectedBarber.commission_percentage || 50}%)</p>
                              <p className="text-3xl font-bold tracking-tight text-white">$${new Intl.NumberFormat('de-DE').format(pendingBarberCut)}</p>
                           </div>
                           <button 
                              disabled={createSettlement.isPending}
                              onClick={() => {
                                 Swal.fire({
                                    title: '¿LIQUIDAR BARBERO?',
                                    text: `Se marcarán ${pendingServices.length} servicios como liquidados por un total de $${new Intl.NumberFormat('de-DE').format(pendingBarberCut)}.`,
                                    icon: 'question',
                                    showCancelButton: true,
                                    confirmButtonColor: '#10b981',
                                    confirmButtonText: 'CONFIRMAR PAGO',
                                    cancelButtonText: 'CANCELAR',
                                    background: '#111',
                                    color: '#fff'
                                 }).then(result => {
                                    if (result.isConfirmed) {
                                       createSettlement.mutate({
                                          barber_id: selectedBarber.id,
                                          appointment_ids: pendingServices.map((s: Appointment) => s.id),
                                          total_gross: pendingTotal,
                                          barber_payment: pendingBarberCut,
                                          owner_payment: pendingTotal - pendingBarberCut,
                                          start_date: pendingServices.length > 0 ? pendingServices[0].start_time : new Date().toISOString(),
                                          end_date: pendingServices.length > 0 ? pendingServices[pendingServices.length - 1].start_time : new Date().toISOString()
                                       }, {
                                          onSuccess: () => {
                                             toast.success('Liquidación registrada exitosamente');
                                             refetch();
                                          }
                                       });
                                    }
                                 });
                              }}
                              className="w-full sm:w-auto bg-brand text-black px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 relative z-10 flex items-center justify-center gap-2"
                           >
                              {createSettlement.isPending ? 'PROCESANDO...' : 'LIQUIDAR SERVICIOS'}
                              {!createSettlement.isPending && <Check size={16} />}
                           </button>
                           <Activity size={120} className="absolute -bottom-10 -right-4 opacity-5 text-brand" />
                        </div>
                     ) : (
                        <div className="border border-dashed border-white/10 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
                           <Activity size={24} className="text-white/20 mb-3" />
                           <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">No hay pagos pendientes para este artesano</p>
                        </div>
                     )}
                  </div>
                </div>


              </div>
            ) : (
              <div className="h-full min-h-[50vh] border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-12 opacity-60">
                <div className="p-6 bg-black border border-white/10 rounded-2xl mb-6">
                  <Users size={40} className="text-white/20" />
                </div>
                <h4 className="text-lg font-bold text-white uppercase tracking-wider mb-2">Perfil de Barbero</h4>
                <p className="text-xs text-white/40 font-medium uppercase tracking-wider max-w-xs leading-relaxed">
                  Selecciona un miembro de la lista para ver su perfil detallado o haz clic en "Nuevo Miembro" para registrar uno nuevo.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
