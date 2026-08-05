/* eslint-disable @next/next/no-img-element */
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Camera, Mail, Settings, Shield, User, Phone, Star, Scissors, ChevronLeft } from 'lucide-react';
import { useGlobalStore } from '@/store/useGlobalStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Profile } from '@/types';
import { User as SupabaseUser } from '@supabase/supabase-js';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import { z } from 'zod';

interface FullProfileViewProps {
  profileId: string;
}

export function FullProfileView({ profileId }: FullProfileViewProps) {
  const router = useRouter();
  const { userProfile, setUserProfile } = useGlobalStore();
  const [barber, setBarber] = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [rating, setGlobalRating] = useState({ average: 0, count: 0 });
  const [barberServicesList, setBarberServicesList] = useState<{ id: string, name: string }[]>([]);

  // Form states
  const [editForm, setEditForm] = useState({ name: '', nickname: '', phone: '', bio: '', address: '', document_id: '' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!profileId) return;
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user ?? null);

      const [profileRes, appointmentsRes, servicesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', profileId).single(),
        supabase.from('appointments').select('rating').eq('barber_id', profileId).eq('status', 'completed'),
        supabase.from('barber_services').select('services(id, name)').eq('barber_id', profileId)
      ]);

      if (profileRes.data) {
        const bData = profileRes.data;
        const sessionUser = session?.user;
        const email = (sessionUser?.id === bData.id) ? sessionUser?.email : bData.email;

        setBarber({ ...bData, email });
        setEditForm({
          name: bData.name || '',
          nickname: bData.nickname || '',
          phone: bData.phone || '',
          bio: bData.bio || '',
          address: bData.address || '',
          document_id: bData.document_id || ''
        });
      }

      if (appointmentsRes.data && appointmentsRes.data.length > 0) {
        const ratedApts = appointmentsRes.data.filter(a => a.rating !== null);
        if (ratedApts.length > 0) {
          const total = ratedApts.reduce((acc, curr) => acc + Number(curr.rating), 0);
          setGlobalRating({ average: total / ratedApts.length, count: ratedApts.length });
        }
      }

      if (servicesRes?.data) {
        const parsedServices = servicesRes.data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((row: any) => row.services)
          .filter(Boolean);
        // Handle array or object just in case
        const flattened = parsedServices.flat();
        setBarberServicesList(flattened);
      }

      setLoading(false);
    }
    loadData();
  }, [profileId]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      if (barber) setBarber({ ...barber, avatar_url: publicUrl } as Profile);
      if (userProfile && userProfile.id === currentUser.id) {
        setUserProfile({ ...userProfile, avatar_url: publicUrl });
      }
      toast.success('Foto de perfil actualizada');
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Error al subir la foto');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      if (!currentUser) return;

      const phoneSchema = z.string()
        .regex(/^\d+$/, 'El número de WhatsApp solo debe contener números')
        .length(10, 'El número debe tener exactamente 10 dígitos')
        .startsWith('3', 'El número de WhatsApp debe empezar por 3');

      const cleanPhone = editForm.phone.replace(/\D/g, '');
      if (cleanPhone) {
        const validation = phoneSchema.safeParse(cleanPhone);
        if (!validation.success) {
          return toast.error(validation.error.issues[0].message);
        }
      }

      const updatedForm = { ...editForm, phone: cleanPhone || editForm.phone };

      const { error } = await supabase
        .from('profiles')
        .update(updatedForm)
        .eq('id', currentUser.id);

      if (error) throw error;
      if (barber) setBarber({ ...barber, ...updatedForm } as Profile);
      if (userProfile && userProfile.id === currentUser.id) {
        setUserProfile({ ...userProfile, ...updatedForm });
      }
      setIsSettingsOpen(false);
      toast.success('Perfil actualizado correctamente');
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Error al actualizar perfil');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.error('Debes llenar todos los campos de contraseña');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('Las contraseñas nuevas no coinciden');
    }
    if (newPassword.length < 6) {
      return toast.error('La nueva contraseña debe tener al menos 6 caracteres');
    }

    try {
      const emailToUse = currentUser?.email;
      if (!emailToUse) throw new Error('No se pudo verificar el usuario actual');

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: currentPassword
      });

      if (verifyError) {
        throw new Error('La contraseña actual es incorrecta');
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      toast.success('Contraseña actualizada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Error al cambiar contraseña');
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;

    const { value: password, isConfirmed } = await Swal.fire({
      title: 'Desactivar Cuenta',
      html: `
        <p style="margin-bottom: 1rem; color: #71717a; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em;">Para continuar, ingresa tu contraseña.</p>
        <div style="position: relative; display: flex; align-items: center; width: 100%;">
          <input type="password" id="swal-password" class="swal2-input" placeholder="Tu contraseña" style="width: 100%; margin: 0; padding-right: 40px; box-sizing: border-box; background: transparent; border: 1px solid rgba(162,171,115,0.2); border-radius: 12px; color: #f4f4f5; font-size: 0.875rem;" autocapitalize="off" autocorrect="off">
          <button type="button" id="swal-eye" style="position: absolute; right: 10px; background: none; border: none; cursor: pointer; color: #71717a; display: flex; align-items: center; padding: 5px; outline: none;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Desactivar',
      cancelButtonText: 'Cancelar',
      background: '#0a0a0a',
      color: '#f4f4f5',
      customClass: {
        popup: 'rounded-2xl border border-white/10',
        confirmButton: 'rounded-xl text-xs font-black uppercase tracking-widest px-6 py-3',
        cancelButton: 'rounded-xl text-xs font-black uppercase tracking-widest px-6 py-3 bg-transparent border border-white/10 text-zinc-400',
      },
      didOpen: () => {
        const eyeBtn = document.getElementById('swal-eye');
        const input = document.getElementById('swal-password') as HTMLInputElement;
        if (eyeBtn && input) {
          eyeBtn.addEventListener('click', () => {
            if (input.type === 'password') {
              input.type = 'text';
              eyeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>';
              eyeBtn.style.color = '#f4f4f5';
            } else {
              input.type = 'password';
              eyeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
              eyeBtn.style.color = '#71717a';
            }
          });
        }
      },
      preConfirm: () => {
        const pwd = (document.getElementById('swal-password') as HTMLInputElement).value;
        if (!pwd) {
          Swal.showValidationMessage('La contraseña es requerida');
        }
        return pwd;
      }
    });

    if (isConfirmed && password) {
      try {
        setLoading(true);
        const emailToUse = currentUser.email;
        if (!emailToUse) throw new Error('No se encontró tu usuario');

        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password
        });

        if (verifyError) throw new Error('La contraseña es incorrecta');

        const { error: updateError } = await supabase.from('profiles').update({
          phone: null,
          is_active: false
        }).eq('id', currentUser.id);

        if (updateError) throw updateError;

        await supabase.auth.signOut();
        document.cookie = "barbershop-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        router.push('/');
        toast.success('Cuenta desactivada exitosamente');
      } catch (error: unknown) {
        const err = error as Error;
        toast.error(err.message || 'Error al desactivar cuenta');
      } finally {
        setLoading(false);
      }
    }
  };

  const isOwnerOfProfile = currentUser?.id === profileId;
  const canViewContact = isOwnerOfProfile || userProfile?.role === 'owner';

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-8 h-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="font-sans pb-32 relative px-6 md:px-8">
      <div className="mx-auto space-y-6 relative z-10">

        {/* Profile Card Principal */}
        <div className="flex flex-col items-center text-center space-y-4 relative overflow-hidden pt-4 pb-2">

          <div className="relative">
            <div className="w-28 h-28 rounded-full border-4 border-white shadow-sm overflow-hidden bg-bg-base flex items-center justify-center ring-2 ring-brand/20">
              {barber?.avatar_url ? (
                <img src={barber.avatar_url} alt={`Foto de ${barber.name}`} className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-zinc-300" />
              )}
            </div>
            {isOwnerOfProfile && (
              <label className="absolute bottom-0 right-0 bg-brand text-white p-2.5 rounded-full border-2 border-white cursor-pointer active:scale-90 transition-all shadow-lg hover:scale-105">
                <Camera size={16} />
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 uppercase leading-none mb-2">{barber?.nickname || barber?.name}</h2>
            <p className="text-[10px] font-bold text-brand uppercase tracking-widest">
              {barber?.role === 'client' ? 'Cliente VIP' : (barber?.role === 'owner' ? 'Propietario / Master' : 'Artesano Profesional')}
            </p>
          </div>

          <div className="flex gap-12 pt-6 w-full justify-center border-t border-accent-green/10 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-zinc-900 leading-none">{barber?.services_completed || 0}</p>
              <p className="text-[9px] font-medium uppercase tracking-wider text-zinc-500 mt-1">Servicios</p>
            </div>
            {barber?.role !== 'client' && (
              <>
                <div className="w-px h-10 bg-accent-green/10" />
                <div className="text-center">
                  <div className="flex items-center gap-1.5 justify-center">
                    <Star size={14} className="text-brand fill-brand" />
                    <p className="text-2xl font-bold text-zinc-900 leading-none">{rating.average > 0 ? rating.average.toFixed(1) : '5.0'}</p>
                  </div>
                  <p className="text-[9px] font-medium uppercase tracking-wider text-zinc-500 mt-1">Rating</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Biografía */}
        {barber?.bio && (
          <div className="border-t border-accent-green/10 pt-6 space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand">Sobre Mí</h3>
            <p className="text-sm leading-relaxed text-zinc-700 italic">
              &quot;{barber.bio}&quot;
            </p>
          </div>
        )}

        {/* Especialidades / Servicios */}
        {barber?.role !== 'client' && (
          <div className="border-t border-accent-green/10 pt-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Scissors size={18} className="text-brand" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand">Especialidades & Servicios</h3>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-zinc-800 text-sm font-medium lowercase">
              {barberServicesList.length > 0 ? (
                barberServicesList.map((service, idx) => (
                  <span key={idx} className="flex items-center gap-1.5">
                    <span>{service.name}</span>
                    {idx < barberServicesList.length - 1 && <span className="text-zinc-300 font-bold text-xs">•</span>}
                  </span>
                ))
              ) : (
                <span className="text-zinc-500 italic">No hay especialidades registradas.</span>
              )}
            </div>
          </div>
        )}

        {/* Detalles de Contacto */}
        {canViewContact && (
          <div className="border-t border-accent-green/10 pt-6 space-y-4">
            {barber?.role !== 'client' && (
              <div className="flex items-center gap-4 border-b border-accent-green/10 pb-4">
                <Mail size={16} className="text-brand shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] font-medium uppercase tracking-wider text-zinc-500 leading-none mb-1">Email</p>
                  <p className="text-sm font-semibold text-zinc-900 truncate">{barber?.email || '---'}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-4">
              <Phone size={16} className="text-emerald-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] font-medium uppercase tracking-wider text-zinc-500 leading-none mb-1">WhatsApp</p>
                <p className="text-sm font-semibold text-zinc-900">{barber?.phone || '---'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Acciones de Gestión (Solo Propietario) */}
        {isOwnerOfProfile ? (
          <div className="space-y-4 pt-4">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-full bg-brand text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-brand/10 hover:bg-accent-green"
            >
              <Settings size={16} />
              Editar Mi Perfil
            </button>

            <div className="border-t border-accent-green/10 pt-6 space-y-4">
              <p className="text-[9px] font-black text-red-500 uppercase tracking-[0.3em] italic">Zona de Peligro</p>
              <button
                onClick={handleDeleteAccount}
                className="w-full py-3 font-bold uppercase tracking-widest text-[10px] border-b border-red-500/20 text-red-500 hover:text-red-600 transition-all text-left flex items-center gap-2 pb-4"
              >
                <Shield size={14} />
                Desactivar Cuenta Permanentemente
              </button>
            </div>
          </div>
        ) : (
          /* CTA de Agendar para Clientes */
          barber?.role === 'barber' && (
            <div className="pt-6 space-y-3">
              <button
                onClick={() => router.push(`/dashboard/client/${currentUser?.id}/reservas/barber/${profileId}`)}
                className="w-full bg-brand text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-brand/20 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-accent-green"
              >
                <Settings size={16} className="rotate-90" />
                Agendar con {barber?.nickname || barber?.name}
              </button>
            </div>
          )
        )}
      </div>

      {/* Modal de Configuración Full Screen */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[999] flex flex-col bg-bg-base overflow-hidden"
          >
            {/* Header del Modal */}
            <div className="shrink-0 h-14 border-b bg-surface/95 border-accent-green/20 backdrop-blur-2xl flex items-center justify-between px-6 z-10">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-10 h-10 text-zinc-400 hover:text-zinc-900 flex items-center justify-center transition-all active:scale-90"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-base font-black text-zinc-900 uppercase tracking-tight">Configuración</h2>
              <div className="w-10" />
            </div>

            {/* Cuerpo del Modal */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-transparent">
              <div className="max-w-3xl mx-auto px-6 pt-6 pb-20 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="space-y-2">
                    <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Nombre Real</label>
                    <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-transparent border border-accent-green/20 text-zinc-900 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Apodo / Marca</label>
                    <input type="text" value={editForm.nickname} onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })} className="w-full bg-transparent border border-accent-green/20 text-zinc-900 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand transition-all" placeholder="Ej: Barber Master" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">WhatsApp</label>
                    <input type="text" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full bg-transparent border border-accent-green/20 text-zinc-900 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand transition-all" />
                  </div>
                </div>

                {barber?.role !== 'client' && (
                  <div className="space-y-6 border-t border-accent-green/10 pt-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Dirección / Local</label>
                      <input type="text" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="w-full bg-transparent border border-accent-green/20 text-zinc-900 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand transition-all" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Bio / Descripción</label>
                      <textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        className="w-full bg-transparent border border-accent-green/20 text-zinc-900 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand transition-all min-h-[100px] resize-none"
                      />
                    </div>
                  </div>
                )}

                <button onClick={handleUpdateProfile} className="w-full bg-brand text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs mt-8 shadow-xl shadow-brand/20 hover:bg-accent-green transition-all active:scale-95 disabled:opacity-50">
                  GUARDAR CAMBIOS
                </button>



                <div className="space-y-6 border-t border-accent-green/10 pt-6">
                  <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest">Seguridad de la Cuenta</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Contraseña Actual</label>
                      <input type="password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full bg-transparent border border-accent-green/20 text-zinc-900 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand transition-all" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Nueva Contraseña</label>
                      <input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-transparent border border-accent-green/20 text-zinc-900 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand transition-all" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Confirmar Nueva Contraseña</label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="flex-1 bg-transparent border border-accent-green/20 text-zinc-900 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand transition-all" />
                        <button onClick={handleChangePassword} className="px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all bg-brand text-white hover:bg-accent-green">Actualizar</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
