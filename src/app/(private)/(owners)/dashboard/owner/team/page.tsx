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
  Activity,
  Phone,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatPrice } from '@/lib/format';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { Profile, Appointment } from '@/types';

const barberSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Correo electrónico no válido'),
  phone: z.string().min(10, 'El celular debe tener al menos 10 dígitos'),
  address: z.string().optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  commission: z.string().regex(/^\d+$/, 'Debe ser un número')
});
type BarberFormValues = z.infer<typeof barberSchema>;

export default function TeamPage() {
  const { data: baseData, isLoading: baseLoading, refetch } = useOwnerBaseData();
  const { data: todayApts = [] } = useTodayAppointments();
  const { createBarber, createSettlement, updateBarberServices } = useOwnerMutations();
  
  const [selectedBarber, setSelectedBarber] = useState<(Profile & { todayIncome: number; todayBarberCut: number; todayOwnerCut: number; todayAptsCount: number }) | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [editingServices, setEditingServices] = useState(false);
  const [barberServices, setBarberServices] = useState<string[]>([]);
  const [newBarberServices, setNewBarberServices] = useState<string[]>([]);
  const [serviceError, setServiceError] = useState(false);

  useMemo(() => {
    if (selectedBarber && !editingServices) {
      setBarberServices(selectedBarber.barber_services?.map(s => s.service_id) || []);
    }
  }, [selectedBarber, editingServices]);
  
  const { data: detailData } = useBarberPendingSettlement(selectedBarber?.id || null);
  const pendingServices = detailData?.appointments || [];
  const pendingTotal = pendingServices.reduce((sum: number, a: Appointment) => sum + Number(a.price), 0);
  const pendingBarberCut = selectedBarber ? (pendingTotal * (selectedBarber.commission_percentage || 50)) / 100 : 0;

  const form = useForm<BarberFormValues>({
    resolver: zodResolver(barberSchema),
    defaultValues: { name: '', email: '', phone: '', address: '', password: '', commission: '50' }
  });

  const handleCreateBarber = (data: BarberFormValues) => {
    if (newBarberServices.length === 0) {
      setServiceError(true);
      return;
    }
    setServiceError(false);
    
    createBarber.mutate({
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address || '',
      password: data.password,
      commission_percentage: Number(data.commission)
    }, {
      onSuccess: (res: Profile ) => {
        if (newBarberServices.length > 0 && res?.id) {
          updateBarberServices.mutate({ barber_id: res.id, service_ids: newBarberServices }, {
            onSuccess: () => {
              setIsDrawerOpen(false);
              setIsAdding(false);
              form.reset();
              setNewBarberServices([]);
              refetch();
            }
          });
        } else {
          setIsDrawerOpen(false);
          setIsAdding(false);
          form.reset();
          setNewBarberServices([]);
        }
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

  const toggleBarberStatus = async (id: string, currentStatus: boolean, name: string) => {
    const action = currentStatus ? 'desactivar' : 'activar';
    const result = await Swal.fire({
      title: `¿Confirmas que deseas ${action} a ${name}?`,
      text: currentStatus ? 'El profesional no podrá ingresar al sistema hasta que lo vuelvas a activar.' : 'El profesional recuperará su acceso al sistema.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--color-erp-primary)',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from('profiles').update({ is_active: !currentStatus }).eq('id', id);
      if (error) toast.error('Error al actualizar estado');
      else {
        toast.success(`Profesional ${action}do exitosamente`);
        refetch();
      }
    }
  };

  if (baseLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-erp-primary/20 border-t-erp-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const openAddDrawer = () => {
    setSelectedBarber(null);
    setIsAdding(true);
    form.reset();
    setNewBarberServices([]);
    setServiceError(false);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (barber: Profile & { todayIncome: number; todayBarberCut: number; todayOwnerCut: number; todayAptsCount: number }) => {
    setIsAdding(false);
    setSelectedBarber(barber);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-32 font-sans animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER ERP */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-erp-bg border border-erp-border p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-erp-text tracking-tight flex items-center gap-3">
            <Users size={24} className="text-erp-primary" />
            Gestión de Personal
          </h2>
          <p className="text-sm font-medium text-erp-text-muted mt-1">Directorio de colaboradores y liquidaciones</p>
        </div>
        <button
          onClick={openAddDrawer}
          className="bg-erp-primary text-white hover:bg-erp-primary/90 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 flex items-center gap-2"
        >
          <Plus size={18} />
          Nuevo Profesional
        </button>
      </div>

      {/* DATA GRID (TABLA) */}
      <div className="bg-erp-surface border border-erp-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          {barberPerformance.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center opacity-60">
              <Users size={48} className="text-erp-text-muted mb-4" />
              <p className="text-sm font-bold text-erp-text uppercase tracking-widest">Directorio Vacío</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-erp-bg border-b border-erp-border">
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted whitespace-nowrap">Profesional</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted whitespace-nowrap">Contacto</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted text-center whitespace-nowrap">Comisión</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted text-center whitespace-nowrap">Estado</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted text-right whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-erp-border">
                {barberPerformance.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => openEditDrawer(b)}
                    className="cursor-pointer group bg-erp-bg"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-erp-border bg-erp-surface flex items-center justify-center shrink-0">
                          {b.avatar_url ? (
                            <Image src={b.avatar_url} alt={b.name} width={40} height={40} className="w-full h-full object-cover" />
                          ) : (
                            <User size={18} className="text-erp-text-muted" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-erp-text capitalize">{b.name}</p>
                          <p className="text-xs font-medium text-erp-text-muted">ID: {b.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-erp-text">
                          <Mail size={12} className="text-erp-text-muted" /> {b.email || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-erp-text">
                          <Phone size={12} className="text-erp-text-muted" /> {b.phone || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className="inline-block bg-erp-surface border border-erp-border px-3 py-1 rounded-md text-xs font-bold text-erp-text">
                        {b.commission_percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border
                        ${b.is_active ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : 'text-red-600 bg-red-500/10 border-red-500/20'}
                      `}>
                        {b.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             toggleBarberStatus(b.id, !!b.is_active, b.name);
                           }}
                           className={`p-2 rounded-lg border transition-all ${b.is_active ? 'hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30 border-erp-border text-erp-text-muted' : 'hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30 border-erp-border text-erp-text-muted'}`}
                           title={b.is_active ? 'Desactivar' : 'Activar'}
                         >
                           {b.is_active ? <X size={16} /> : <Check size={16} />}
                         </button>
                         <button className="p-2 rounded-lg border border-erp-border text-erp-text-muted hover:bg-erp-surface-hover hover:text-erp-primary transition-all">
                           <ChevronRight size={16} />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* RIGHT DRAWER (PANEL LATERAL) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-transparent z-[200]"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-erp-bg shadow-2xl z-[210] flex flex-col border-l border-erp-border"
            >
              {/* Drawer Header */}
              <div className="h-20 border-b border-erp-border px-6 flex items-center justify-between bg-erp-surface shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-erp-primary/10 text-erp-primary flex items-center justify-center">
                    {isAdding ? <Plus size={20} /> : <User size={20} />}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-erp-text tracking-tight">
                      {isAdding ? 'Nuevo Profesional' : 'Ficha Técnica'}
                    </h3>
                    <p className="text-xs font-medium text-erp-text-muted">
                      {isAdding ? 'Crear credenciales' : selectedBarber?.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-erp-border text-erp-text-muted hover:text-erp-text transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {isAdding ? (
                  /* AGREGAR BARBERO FORM */
                  <form onSubmit={form.handleSubmit(handleCreateBarber)} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-erp-text uppercase tracking-widest ml-1">Nombre Completo</label>
                      <input
                        type="text"
                        {...form.register('name')}
                        className="w-full bg-erp-surface border border-erp-border rounded-xl px-4 py-3.5 text-sm font-semibold text-erp-text outline-none focus:border-erp-primary transition-all"
                        placeholder="Ej. Juan Pérez"
                      />
                      {form.formState.errors.name && <p className="text-red-500 text-xs ml-1">{form.formState.errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-erp-text uppercase tracking-widest ml-1">Correo Electrónico</label>
                      <input
                        type="email"
                        {...form.register('email')}
                        className="w-full bg-erp-surface border border-erp-border rounded-xl px-4 py-3.5 text-sm font-semibold text-erp-text outline-none focus:border-erp-primary transition-all"
                        placeholder="ejemplo@correo.com"
                      />
                      {form.formState.errors.email && <p className="text-red-500 text-xs ml-1">{form.formState.errors.email.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-erp-text uppercase tracking-widest ml-1">Número de Celular</label>
                      <input
                        type="tel"
                        {...form.register('phone')}
                        className="w-full bg-erp-surface border border-erp-border rounded-xl px-4 py-3.5 text-sm font-semibold text-erp-text outline-none focus:border-erp-primary transition-all"
                        placeholder="Ej. 3001234567"
                      />
                      {form.formState.errors.phone && <p className="text-red-500 text-xs ml-1">{form.formState.errors.phone.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-erp-text uppercase tracking-widest ml-1">Dirección (Opcional)</label>
                      <input
                        type="text"
                        {...form.register('address')}
                        className="w-full bg-erp-surface border border-erp-border rounded-xl px-4 py-3.5 text-sm font-semibold text-erp-text outline-none focus:border-erp-primary transition-all"
                        placeholder="Ej. Calle 123"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-erp-text uppercase tracking-widest ml-1">Contraseña</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            {...form.register('password')}
                            className="w-full bg-erp-surface border border-erp-border rounded-xl pl-4 pr-10 py-3.5 text-sm font-semibold text-erp-text outline-none focus:border-erp-primary transition-all"
                            placeholder="Mínimo 6"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-erp-text-muted hover:text-erp-primary"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {form.formState.errors.password && <p className="text-red-500 text-xs ml-1">{form.formState.errors.password.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-erp-text uppercase tracking-widest ml-1">Comisión (%)</label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            {...form.register('commission')}
                            className="w-full bg-erp-surface border border-erp-border rounded-xl px-4 py-3.5 text-sm font-semibold text-erp-primary outline-none focus:border-erp-primary transition-all text-center"
                            placeholder="50"
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-erp-text-muted">%</div>
                        </div>
                        {form.formState.errors.commission && <p className="text-red-500 text-xs ml-1">{form.formState.errors.commission.message}</p>}
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <label className="text-xs font-bold text-erp-text uppercase tracking-widest ml-1 mb-2 block">Especialidades Iniciales</label>
                      <div className="flex flex-wrap gap-2">
                        {baseData?.services?.map(service => {
                          const isSelected = newBarberServices.includes(service.id);
                          return (
                            <div 
                              key={service.id}
                              onClick={() => {
                                if (isSelected) {
                                  const next = newBarberServices.filter(id => id !== service.id);
                                  setNewBarberServices(next);
                                } else {
                                  const next = [...newBarberServices, service.id];
                                  setNewBarberServices(next);
                                  setServiceError(false);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${isSelected ? 'bg-erp-primary/10 border-erp-primary/30 text-erp-primary' : 'bg-erp-bg border-erp-border text-erp-text-muted hover:border-erp-primary/30'}`}
                            >
                              {service.name}
                            </div>
                          );
                        })}
                      </div>
                      {serviceError && <p className="text-red-500 text-xs mt-2 ml-1">Debes seleccionar al menos una especialidad</p>}
                    </div>

                    <div className="pt-6">
                      <button
                        type="submit"
                        disabled={createBarber.isPending || (createBarber.isSuccess && updateBarberServices.isPending)}
                        className="w-full bg-erp-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-erp-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {(createBarber.isPending || updateBarberServices.isPending) ? 'REGISTRANDO...' : 'GUARDAR PROFESIONAL'}
                      </button>
                    </div>
                  </form>
                ) : selectedBarber ? (
                  /* DETALLE DEL BARBERO */
                  <div className="space-y-8">
                    {/* Header Perfil */}
                    <div className="flex flex-col items-center text-center">
                      <div className="w-24 h-24 rounded-2xl bg-erp-surface border border-erp-border overflow-hidden mb-4 relative shadow-sm">
                        {selectedBarber.avatar_url ? (
                          <Image src={selectedBarber.avatar_url} alt={selectedBarber.name} width={96} height={96} className="w-full h-full object-cover" />
                        ) : (
                          <User size={40} className="w-full h-full p-4 text-erp-text-muted" />
                        )}
                        {!selectedBarber.is_active && (
                          <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center backdrop-blur-sm">
                            <p className="text-[10px] font-bold text-white uppercase tracking-widest">Inactivo</p>
                          </div>
                        )}
                      </div>
                      <h2 className="text-2xl font-black text-erp-text uppercase tracking-tight">{selectedBarber.name}</h2>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-xs font-medium text-erp-text-muted">
                          <Mail size={12} /> {selectedBarber.email || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium text-erp-text-muted">
                          <Phone size={12} /> {selectedBarber.phone || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* KPIs de Rendimiento Hoy */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-erp-surface border border-erp-border p-4 rounded-xl text-center">
                        <p className="text-[9px] font-bold text-erp-text-muted uppercase tracking-widest mb-1">Cortes Hoy</p>
                        <p className="text-xl font-black text-erp-text">{selectedBarber.todayAptsCount}</p>
                      </div>
                      <div className="bg-erp-surface border border-erp-border p-4 rounded-xl text-center">
                        <p className="text-[9px] font-bold text-erp-text-muted uppercase tracking-widest mb-1">Ingreso</p>
                        <p className="text-lg font-black text-erp-text">{formatPrice(selectedBarber.todayIncome)}</p>
                      </div>
                      <div className="bg-erp-primary/5 border border-erp-primary/20 p-4 rounded-xl text-center">
                        <p className="text-[9px] font-bold text-erp-primary uppercase tracking-widest mb-1">Utilidad</p>
                        <p className="text-lg font-black text-erp-primary">{formatPrice(selectedBarber.todayOwnerCut)}</p>
                      </div>
                    </div>

                    {/* Especialidades */}
                    <div className="bg-erp-surface border border-erp-border p-5 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[10px] font-bold text-erp-text-muted uppercase tracking-widest">Especialidades</h4>
                        {editingServices ? (
                          <div className="flex gap-2">
                             <button onClick={() => setEditingServices(false)} className="text-xs font-bold text-erp-text-muted hover:text-erp-text">Cancelar</button>
                             <button onClick={() => setBarberServices([])} className="text-xs font-bold text-red-500 hover:text-red-700">Limpiar</button>
                             <button 
                               disabled={updateBarberServices.isPending}
                               onClick={() => {
                                 updateBarberServices.mutate(
                                   { barber_id: selectedBarber.id, service_ids: barberServices },
                                   { 
                                     onSuccess: () => {
                                       setEditingServices(false);
                                       setSelectedBarber(prev => prev ? { ...prev, barber_services: barberServices.map(id => ({ service_id: id })) } : null);
                                       refetch();
                                     } 
                                   }
                                 );
                               }}
                               className="text-xs font-bold text-erp-primary hover:text-erp-primary/80"
                             >
                               {updateBarberServices.isPending ? 'Guardando...' : 'Guardar'}
                             </button>
                          </div>
                        ) : barberServices.length > 0 && (
                          <button onClick={() => setEditingServices(true)} className="text-xs font-bold text-erp-text-muted hover:text-erp-primary flex items-center gap-1">
                            <Edit size={12} /> Editar
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {baseData?.services?.map(service => {
                          const isSelected = barberServices.includes(service.id);
                          if (!editingServices && !isSelected) return null;
                          return (
                            <div 
                              key={service.id}
                              onClick={() => {
                                if (!editingServices) return;
                                if (isSelected) setBarberServices(prev => prev.filter(id => id !== service.id));
                                else setBarberServices(prev => [...prev, service.id]);
                              }}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${editingServices ? 'cursor-pointer' : ''} ${isSelected ? 'bg-erp-primary/10 border-erp-primary/30 text-erp-primary' : 'bg-erp-bg border-erp-border text-erp-text-muted'}`}
                            >
                              {service.name}
                            </div>
                          );
                        })}
                        {!editingServices && barberServices.length === 0 && (
                          <div className="w-full py-4 text-center">
                            <p className="text-xs text-erp-text-muted mb-2">Sin especialidades</p>
                            <button onClick={() => setEditingServices(true)} className="text-[10px] font-bold uppercase text-erp-primary border border-erp-primary/20 px-3 py-1.5 rounded-lg hover:bg-erp-primary/10">Asignar</button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Liquidaciones Pendientes */}
                    <div className="border-t border-erp-border pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Activity size={16} className="text-erp-primary" />
                        <h4 className="text-sm font-bold text-erp-text uppercase tracking-tight">Liquidaciones Pendientes</h4>
                      </div>
                      
                      {pendingServices.length > 0 ? (
                        <div className="bg-erp-bg border border-erp-border rounded-xl p-5 shadow-sm text-center">
                           <p className="text-[10px] font-bold text-erp-text-muted uppercase tracking-widest mb-1">{pendingServices.length} servicios por liquidar</p>
                           <p className="text-3xl font-black text-erp-text mb-4">{formatPrice(pendingBarberCut)}</p>
                           <button 
                              disabled={createSettlement.isPending}
                              onClick={() => {
                                 Swal.fire({
                                    title: 'Confirmar Liquidación',
                                    text: `Se pagará ${formatPrice(pendingBarberCut)} al profesional.`,
                                    icon: 'info',
                                    showCancelButton: true,
                                    confirmButtonColor: 'var(--color-erp-primary)',
                                    confirmButtonText: 'CONFIRMAR',
                                    cancelButtonText: 'CANCELAR'
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
                              className="w-full bg-erp-primary text-white py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-erp-primary/90 transition-all disabled:opacity-50"
                           >
                              {createSettlement.isPending ? 'PROCESANDO...' : 'LIQUIDAR SERVICIOS'}
                           </button>
                        </div>
                      ) : (
                        <div className="bg-erp-surface rounded-xl p-6 text-center border border-erp-border border-dashed">
                           <p className="text-xs font-medium text-erp-text-muted">No hay pagos pendientes</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
