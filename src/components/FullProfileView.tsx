/* eslint-disable @next/next/no-img-element */
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Camera, Mail, Settings, X, Shield, User, Phone, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Profile } from '@/types';
import { User as SupabaseUser } from '@supabase/supabase-js';
import Swal from 'sweetalert2';
import { toast } from 'sonner';

interface FullProfileViewProps {
  profileId: string;
}

export function FullProfileView({ profileId }: FullProfileViewProps) {
  const router = useRouter();
  const [barber, setBarber] = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [rating, setGlobalRating] = useState({ average: 0, count: 0 });

  // Form states
  const [editForm, setEditForm] = useState({ name: '', nickname: '', phone: '', bio: '', address: '', document_id: '' });
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (!profileId) return;
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user ?? null);

      const [profileRes, appointmentsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', profileId).single(),
        supabase.from('appointments').select('rating').eq('barber_id', profileId).eq('status', 'completed')
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
      const { error } = await supabase
        .from('profiles')
        .update(editForm)
        .eq('id', currentUser.id);

      if (error) throw error;
      if (barber) setBarber({ ...barber, ...editForm } as Profile);
      setIsSettingsOpen(false);
      toast.success('Perfil actualizado correctamente');
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Error al actualizar perfil');
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      return toast.error('Ingresa un correo electrónico válido');
    }
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;

      Swal.fire({
        title: 'Verificación enviada',
        text: 'Hemos enviado un enlace de confirmación a tu nuevo correo. Debes hacer clic en él para que el cambio se refleje en tu cuenta.',
        icon: 'info',
        confirmButtonColor: '#f59e0b',
        background: '#111111',
        color: '#fff'
      });

      setNewEmail('');
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Error al cambiar email');
    }
  };

  const handleChangePassword = async () => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Contraseña actualizada');
      setNewPassword('');
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Error al cambiar contraseña');
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    const result = await Swal.fire({
      title: '¿ELIMINAR MI CUENTA?',
      text: 'Esta acción borrará tu perfil permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'SÍ, ELIMINAR TODO',
      cancelButtonText: 'CANCELAR',
      background: '#111111',
      color: '#fff'
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) throw new Error('No se encontró una sesión activa');

        const response = await fetch('/api/admin/delete-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            requesterToken: token
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error en el servidor al eliminar');
        }

        await supabase.auth.signOut();
        document.cookie = "barbershop-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        router.push('/');
        toast.success('Cuenta eliminada permanentemente');
      } catch (error: unknown) {
        const err = error as Error;
        toast.error(err.message || 'Error al eliminar cuenta');
      } finally {
        setLoading(false);
      }
    }
  };

  const isOwnerOfProfile = currentUser?.id === profileId;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-8 h-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="font-sans pb-32 relative">
      {/* ── FONDO DINÁMICO DEL PERFIL (WALLPAPER) ─────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden rounded-t-[2.5rem]">
        {barber?.avatar_url ? (
          <img
            src={barber.avatar_url}
            alt="Wallpaper Perfil"
            className="w-full h-full object-cover opacity-20 transition-all duration-700 blur-sm"
          />
        ) : (
          <div className="w-full h-full bg-bg-base" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/90 to-transparent" />
      </div>

      <div className="mx-auto space-y-6 relative z-10">

        {/* Profile Card Principal */}
        <div className="bg-surface/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center space-y-4 relative overflow-hidden shadow-2xl">
          
          <div className="relative">
            <div className="w-28 h-28 rounded-full border-4 border-surface shadow-2xl overflow-hidden bg-bg-base flex items-center justify-center ring-2 ring-brand/20">
              {barber?.avatar_url ? (
                <img src={barber.avatar_url} alt={`Foto de ${barber.name}`} className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-white/20" />
              )}
            </div>
            {isOwnerOfProfile && (
              <label className="absolute bottom-0 right-0 bg-brand text-black p-2.5 rounded-full border-2 border-surface cursor-pointer active:scale-90 transition-all shadow-lg hover:scale-105">
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
            <h2 className="text-2xl font-bold tracking-tight text-white uppercase leading-none mb-2">{barber?.nickname || barber?.name}</h2>
            <p className="text-[10px] font-bold text-brand uppercase tracking-widest">
              {barber?.role === 'client' ? 'Cliente VIP' : (barber?.role === 'owner' ? 'Propietario / Master' : 'Artesano Profesional')}
            </p>
          </div>

          <div className="flex gap-12 pt-6 w-full justify-center border-t border-white/5 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white leading-none">{barber?.services_completed || 0}</p>
              <p className="text-[9px] font-medium uppercase tracking-wider text-white/40 mt-1">Servicios</p>
            </div>
            <div className="w-px h-10 bg-white/5" />
            <div className="text-center">
              <div className="flex items-center gap-1.5 justify-center">
                <Star size={14} className="text-brand fill-brand" />
                <p className="text-2xl font-bold text-white leading-none">{rating.average > 0 ? rating.average.toFixed(1) : '5.0'}</p>
              </div>
              <p className="text-[9px] font-medium uppercase tracking-wider text-white/40 mt-1">Rating</p>
            </div>
          </div>
        </div>

        {/* Biografía */}
        {barber?.bio && (
          <div className="bg-surface/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 space-y-3 shadow-xl">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand">Sobre Mí</h3>
            <p className="text-sm leading-relaxed text-white/80 italic">
              &quot;{barber.bio}&quot;
            </p>
          </div>
        )}

        {/* Detalles de Contacto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex items-center gap-4 shadow-xl">
            <div className="w-12 h-12 bg-brand/10 text-brand rounded-xl flex items-center justify-center shrink-0">
              <Mail size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-medium uppercase tracking-wider text-white/40 leading-none mb-1">Email</p>
              <p className="text-sm font-semibold text-white/90 truncate">{barber?.email || '---'}</p>
            </div>
          </div>
          <div className="bg-surface/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex items-center gap-4 shadow-xl">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
              <Phone size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-medium uppercase tracking-wider text-white/40 leading-none mb-1">WhatsApp</p>
              <p className="text-sm font-semibold text-white/90">{barber?.phone || '---'}</p>
            </div>
          </div>
        </div>

        {/* Acciones de Gestión (Solo Propietario) */}
        {isOwnerOfProfile ? (
          <div className="space-y-4 pt-4">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-full bg-brand text-black py-4 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-brand/10 hover:bg-brand/90"
            >
              <Settings size={16} />
              Editar Mi Perfil
            </button>

            {/* Solo clientes y dueños pueden auto-eliminarse. Los barberos deben ser eliminados por el Owner */}
            {barber?.role !== 'barber' && (
              <div className="bg-surface/50 border border-red-500/10 rounded-2xl p-6 space-y-4 text-center mt-8">
                <div className="flex items-center gap-2 text-red-500/60 justify-center">
                  <Shield size={16} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Zona de Peligro</p>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  className="w-full py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] border transition-all bg-bg-base border-red-500/20 text-red-500/80 hover:bg-red-500/10 hover:text-red-400"
                >
                  Eliminar Cuenta Permanentemente
                </button>
              </div>
            )}
          </div>
        ) : (
          /* CTA de Agendar para Clientes */
          barber?.role === 'barber' && (
            <div className="pt-6">
              <button
                onClick={() => router.push(`/dashboard/client/${currentUser?.id}/reservas/barber/${profileId}`)}
                className="w-full bg-brand text-black py-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-brand/20 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-brand/90"
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-[999] flex flex-col bg-bg-base overflow-hidden"
          >
            {/* Header del Modal */}
            <div className="shrink-0 h-20 border-b bg-surface/90 border-white/5 backdrop-blur-2xl flex items-center justify-between px-6 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                  <Settings size={20} />
                </div>
                <h2 className="text-lg font-bold text-white uppercase tracking-tight">Configuración</h2>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-10 h-10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 rounded-full flex items-center justify-center transition-all active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-transparent pb-32">
              <div className="max-w-3xl mx-auto p-6 sm:p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider ml-1">Nombre Real</label>
                    <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-surface border border-white/5 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-brand transition-all shadow-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider ml-1">Apodo / Marca</label>
                    <input type="text" value={editForm.nickname} onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })} className="w-full bg-surface border border-white/5 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-brand transition-all shadow-sm" placeholder="Ej: Barber Master" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider ml-1">WhatsApp</label>
                    <input type="text" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full bg-surface border border-white/5 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-brand transition-all shadow-sm" />
                  </div>
                </div>

                {barber?.role !== 'client' && (
                  <div className="space-y-6 pt-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider ml-1">Dirección / Local</label>
                      <input type="text" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="w-full bg-surface border border-white/5 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-brand transition-all shadow-sm" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider ml-1">Bio / Descripción</label>
                      <textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        className="w-full bg-surface border border-white/5 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-brand transition-all min-h-[100px] resize-none shadow-sm"
                      />
                    </div>
                  </div>
                )}

                <button onClick={handleUpdateProfile} className="w-full bg-brand text-black py-4 rounded-xl font-bold uppercase tracking-widest text-xs mt-8 shadow-xl hover:bg-brand/90 transition-all active:scale-95 disabled:opacity-50">
                  GUARDAR CAMBIOS
                </button>

                <div className="h-px bg-white/5 my-10" />

                <div className="space-y-6">
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest">Seguridad de la Cuenta</h3>
                  <div className="space-y-6 bg-surface p-6 rounded-2xl border border-white/5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider ml-1">Nuevo Email</label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input type="email" placeholder="ejemplo@correo.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="flex-1 bg-bg-base border border-white/5 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-brand transition-all shadow-sm" />
                        <button onClick={handleChangeEmail} className="px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all bg-white text-black hover:bg-gray-200">Cambiar Email</button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider ml-1">Nueva Contraseña</label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="flex-1 bg-bg-base border border-white/5 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-brand transition-all shadow-sm" />
                        <button onClick={handleChangePassword} className="px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all bg-white text-black hover:bg-gray-200">Actualizar</button>
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
