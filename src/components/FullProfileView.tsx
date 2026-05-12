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

      // Carga paralela de datos para mejorar rendimiento
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
        background: '#0a0a0a',
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
      background: '#fff',
      color: '#111'
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        // Obtener el token de sesión actual para autorizar la eliminación
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
        // Limpiar cookie de sesión para evitar bucles en middleware
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
  const isDark = barber?.role === 'barber' || barber?.role === 'client';

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className={`w-8 h-8 border-2 ${isDark ? 'border-[#f59e0b]' : 'border-[#0061ff]'} border-t-transparent rounded-full animate-spin`} />
      </div>
    );
  }

  return (
    <div className={`font-sans pb-32 relative min-h-screen`}>
      {/* ── FONDO DINÁMICO DEL PERFIL (WALLPAPER) ─────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {barber?.avatar_url ? (
          <img
            src={barber.avatar_url}
            alt="Wallpaper Perfil"
            className="w-full h-full object-cover opacity-50 transition-all duration-700"
          />
        ) : (
          <div className={`w-full h-full ${isDark ? 'bg-[#050505]' : 'bg-gray-50'}`} />
        )}
        <div className={`absolute inset-0 ${isDark ? 'bg-black/40 backdrop-brightness-[0.6]' : 'bg-white/20'}`} />
        <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-t from-black via-transparent to-black/20' : ''}`} />
      </div>

      <div className="mx-auto px-4 max-w-2xl space-y-8 relative z-10 pt-8">

        {/* Profile Card Principal */}
        <div className={`${isDark ? 'bg-black/80 backdrop-blur-xl border-white/10 shadow-2xl' : 'bg-white border-gray-100 shadow-sm'} border rounded-[2rem] p-6 flex flex-col items-center text-center space-y-4 relative overflow-hidden`}>
          
          {/* Si es cliente y es su propio perfil, quitamos el círculo y solo dejamos la cámara */}
          {barber?.role === 'client' && isOwnerOfProfile ? (
            <div className="py-6">
              <label className={`group relative w-20 h-20 rounded-[2rem] border-2 border-dashed ${isDark ? 'border-white/10 hover:border-[#f59e0b]/50 hover:bg-[#f59e0b]/5' : 'border-gray-200 hover:border-[#0061ff]/50 hover:bg-[#0061ff]/5'} flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95`}>
                <Camera size={24} className={`${isDark ? 'text-white/20 group-hover:text-[#f59e0b]' : 'text-gray-300 group-hover:text-[#0061ff]'} transition-colors`} />
                <span className={`text-[8px] font-black uppercase tracking-widest mt-2 ${isDark ? 'text-white/20 group-hover:text-[#f59e0b]' : 'text-gray-300 group-hover:text-[#0061ff]'}`}>Fondo</span>
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
                {uploading && (
                  <div className="absolute inset-0 bg-black/60 rounded-[2rem] flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </label>
            </div>
          ) : (
            /* Para Barberos o cuando un cliente ve a un barbero, mantenemos el avatar circular/cuadrado premium */
            <div className="relative">
              <div className={`w-32 h-32 rounded-[2.5rem] border-4 ${isDark ? 'border-white/10' : 'border-white'} shadow-2xl overflow-hidden bg-gray-50 flex items-center justify-center`}>
                {barber?.avatar_url ? (
                  <img src={barber.avatar_url} alt={`Foto de perfil de ${barber.name}`} className="w-full h-full object-cover" />
                ) : (
                  <User size={50} className="text-gray-300" />
                )}
              </div>
              {isOwnerOfProfile && (
                <label className={`absolute bottom-0 right-0 ${isDark ? 'bg-[#f59e0b] text-black' : 'bg-[#0061ff] text-white'} p-2.5 rounded-2xl border-2 ${isDark ? 'border-black' : 'border-white'} cursor-pointer active:scale-90 transition-all shadow-lg`}>
                  <Camera size={16} />
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
                </label>
              )}
            </div>
          )}

          <div>
            <h2 className={`text-3xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-gray-900'} uppercase leading-none mb-1 italic`}>{barber?.nickname || barber?.name}</h2>
            <p className={`text-[11px] font-black ${isDark ? 'text-[#f59e0b]' : 'text-[#0061ff]'} uppercase tracking-[0.3em]`}>
              {barber?.role === 'client' ? 'Cliente VIP' : (barber?.role === 'owner' ? 'Propietario / Master' : 'Artesano Profesional')}
            </p>
          </div>

          <div className={`flex gap-10 pt-6 w-full justify-center border-t ${isDark ? 'border-white/5' : 'border-gray-50'} mt-4`}>
            <div className="text-center">
              <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'} leading-none tracking-tighter`}>{barber?.services_completed || 0}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mt-2">Servicios</p>
            </div>
            <div className={`w-px h-10 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />
            <div className="text-center">
              <div className="flex items-center gap-1.5 justify-center">
                <Star size={14} className="text-[#f59e0b] fill-[#f59e0b]" />
                <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'} leading-none tracking-tighter`}>{rating.average > 0 ? rating.average.toFixed(1) : '5.0'}</p>
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mt-2">Rating</p>
            </div>
          </div>
        </div>

        {/* Biografía (Solo si existe) */}
        {barber?.bio && (
          <div className={`${isDark ? 'bg-black/80 backdrop-blur-xl border-white/10 shadow-2xl' : 'bg-white border-gray-100 shadow-sm'} border rounded-[2rem] p-6 space-y-3`}>
            <h3 className={`text-[9px] font-black uppercase tracking-[0.4em] ${isDark ? 'text-[#f59e0b]' : 'text-[#0061ff]'}`}>Sobre Mí</h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-white/80' : 'text-gray-600'} italic font-medium`}>
              &quot;{barber.bio}&quot;
            </p>
          </div>
        )}

        {/* Detalles de Contacto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`${isDark ? 'bg-black/80 backdrop-blur-xl border-white/10 shadow-2xl' : 'bg-white border-gray-100 shadow-sm'} border rounded-2xl p-6 flex items-center gap-4`}>
            <div className={`w-10 h-10 ${isDark ? 'bg-[#f59e0b]/10 text-[#f59e0b]' : 'bg-blue-50 text-[#0061ff]'} rounded-xl flex items-center justify-center`}>
              <Mail size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/60 leading-none mb-1">Email</p>
              <p className={`text-xs font-semibold ${isDark ? 'text-white/80' : 'text-gray-700'} truncate`}>{barber?.email || '---'}</p>
            </div>
          </div>
          <div className={`${isDark ? 'bg-black/80 backdrop-blur-xl border-white/10 shadow-2xl' : 'bg-white border-gray-100 shadow-sm'} border rounded-2xl p-6 flex items-center gap-4`}>
            <div className={`w-10 h-10 ${isDark ? 'bg-emerald-500/10 text-emerald-500' : 'bg-emerald-50 text-emerald-600'} rounded-xl flex items-center justify-center`}>
              <Phone size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/60 leading-none mb-1">WhatsApp</p>
              <p className={`text-xs font-semibold ${isDark ? 'text-white/80' : 'text-gray-700'}`}>{barber?.phone || '---'}</p>
            </div>
          </div>
        </div>

        {/* Acciones de Gestión (Solo Propietario) */}
        {isOwnerOfProfile ? (
          <div className="space-y-4">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`w-full ${isDark ? 'bg-[#f59e0b] text-black' : 'bg-[#0061ff] text-white'} py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-amber-500/10`}
            >
              <Settings size={18} />
              Editar Mi Perfil
            </button>

            {/* Solo clientes y dueños pueden auto-eliminarse. Los barberos deben ser eliminados por el Owner */}
            {barber?.role !== 'barber' && (
              <div className={`${isDark ? 'bg-black/80 backdrop-blur-xl border-white/10 shadow-2xl' : 'bg-gray-50 border-gray-100 shadow-sm'} rounded-[2rem] p-8 border space-y-4 text-center`}>
                <div className="flex items-center gap-2 text-red-500 justify-center">
                  <Shield size={16} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Seguridad de Cuenta</p>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-[9px] border transition-all ${isDark ? 'bg-white/5 border-red-500/20 text-red-500/60 hover:bg-red-500 hover:text-white' : 'bg-white border-red-100 text-red-500 hover:bg-red-50'}`}
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
                className={`w-full bg-[#f59e0b] text-black py-6 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[12px] shadow-2xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-3`}
              >
                <Settings size={18} className="rotate-90" />
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
            className="fixed inset-0 z-[999] flex flex-col bg-black overflow-hidden"
          >
            {/* Header del Modal */}
            <div className={`shrink-0 h-20 border-b ${isDark ? 'bg-black/90 border-white/10' : 'bg-white border-gray-100'} backdrop-blur-2xl flex items-center justify-between px-6 z-10`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-[#f59e0b]/10 text-[#f59e0b]' : 'bg-[#0061ff]/10 text-[#0061ff]'} flex items-center justify-center`}>
                  <Settings size={20} />
                </div>
                <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'} uppercase tracking-tighter italic`}>Configuración</h2>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className={`w-10 h-10 ${isDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-gray-100 text-gray-900'} rounded-full flex items-center justify-center transition-all active:scale-90`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Cuerpo del Modal (Scrollable) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-transparent pb-32">
              <div className="max-w-2xl mx-auto p-6 sm:p-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className={`text-[10px] font-bold ${isDark ? 'text-white/70' : 'text-gray-500'} uppercase tracking-widest ml-1`}>Nombre Real</label>
                    <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={`w-full ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'} border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#f59e0b] transition-all font-bold`} />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-[10px] font-bold ${isDark ? 'text-white/70' : 'text-gray-500'} uppercase tracking-widest ml-1`}>Apodo / Marca</label>
                    <input type="text" value={editForm.nickname} onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })} className={`w-full ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'} border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#f59e0b] transition-all font-bold`} placeholder="Ej: Barber Master" />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-[10px] font-bold ${isDark ? 'text-white/70' : 'text-gray-500'} uppercase tracking-widest ml-1`}>WhatsApp</label>
                    <input type="text" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className={`w-full ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'} border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#f59e0b] transition-all font-bold`} />
                  </div>
                </div>

                {barber?.role !== 'client' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Dirección / Local</label>
                      <input type="text" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className={`w-full ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'} border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#f59e0b] transition-all font-bold`} />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Bio / Descripción</label>
                      <textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        className={`w-full ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'} border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#f59e0b] transition-all min-h-[100px] resize-none font-medium`}
                      />
                    </div>
                  </>
                )}

                <button onClick={handleUpdateProfile} className={`w-full ${isDark ? 'bg-[#f59e0b] text-black shadow-amber-500/10' : 'bg-[#0061ff] text-white shadow-blue-500/20'} py-4 rounded-xl font-black uppercase tracking-widest text-[11px] mt-4 shadow-lg transition-all active:scale-95`}>
                  Guardar Cambios
                </button>

                <div className={`h-px ${isDark ? 'bg-white/5' : 'bg-gray-100'} my-8`} />

                <div className="space-y-6">
                  <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-gray-900'} uppercase tracking-widest italic`}>Seguridad de la Cuenta</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className={`text-[10px] font-bold ${isDark ? 'text-white/70' : 'text-gray-500'} uppercase tracking-widest ml-1`}>Nuevo Email</label>
                      <div className="flex gap-2">
                        <input type="email" placeholder="ejemplo@correo.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={`flex-1 ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'} border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#f59e0b] transition-all font-bold`} />
                        <button onClick={handleChangeEmail} className={`px-6 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'}`}>Cambiar</button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className={`text-[10px] font-bold ${isDark ? 'text-white/70' : 'text-gray-500'} uppercase tracking-widest ml-1`}>Nueva Contraseña</label>
                      <div className="flex gap-2">
                        <input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={`flex-1 ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'} border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#f59e0b] transition-all font-bold`} />
                        <button onClick={handleChangePassword} className={`px-6 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'}`}>Cambiar</button>
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
