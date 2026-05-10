/* eslint-disable @next/next/no-img-element */
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Camera, Mail, Settings, X, Shield, User, Phone } from 'lucide-react';
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

      const { data: bData } = await supabase.from('profiles').select('*').eq('id', profileId).single();
      if (bData) {
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

      const { data: apts } = await supabase
        .from('appointments')
        .select('rating')
        .eq('barber_id', profileId)
        .eq('status', 'completed');

      if (apts && apts.length > 0) {
        const ratedApts = apts.filter(a => a.rating !== null);
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
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.info('Verifica tu nuevo correo para confirmar el cambio');
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
        await supabase.from('appointments').update({ client_id: null }).eq('client_id', currentUser.id);
        await supabase.from('profiles').delete().eq('id', currentUser.id);
        await supabase.auth.signOut();
        router.push('/');
        toast.success('Cuenta eliminada');
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
    <div className={`font-sans pb-20`}>
      <div className="mx-auto px-4 max-w-2xl space-y-8 relative z-10">

        {/* Profile Card Principal */}
        <div className={`${isDark ? 'bg-black/40 border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-sm'} border rounded-3xl p-8 flex flex-col items-center text-center space-y-4`}>
          <div className="relative">
            <div className={`w-24 h-24 rounded-full border-4 ${isDark ? 'border-white/10' : 'border-white'} shadow-xl overflow-hidden bg-gray-50 flex items-center justify-center`}>
              {barber?.avatar_url ? (
                <img src={barber.avatar_url} alt={`Foto de perfil de ${barber.name}`} className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-gray-300" />
              )}
            </div>
            {isOwnerOfProfile && (
              <label className={`absolute bottom-0 right-0 ${isDark ? 'bg-[#f59e0b] text-black' : 'bg-[#0061ff] text-white'} p-2 rounded-full border-2 ${isDark ? 'border-black' : 'border-white'} cursor-pointer active:scale-90 transition-all shadow-lg`}>
                <Camera size={14} />
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
            )}
          </div>

          <div>
            <h2 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'} uppercase leading-none mb-1 italic`}>{barber?.name}</h2>
            <p className={`text-[10px] font-bold ${isDark ? 'text-[#f59e0b]' : 'text-[#0061ff]'} uppercase tracking-widest`}>
              {barber?.role === 'client' ? 'Cliente Registrado' : (barber?.role === 'owner' ? 'Propietario' : 'Barbero Profesional')}
            </p>
          </div>

          <div className={`flex gap-8 pt-4 w-full justify-center border-t ${isDark ? 'border-white/5' : 'border-gray-50'} mt-4`}>
            <div>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} leading-none`}>{barber?.services_completed || 0}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-1">Servicios</p>
            </div>
            <div className={`w-px h-8 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />
            <div>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} leading-none`}>{rating.average > 0 ? rating.average.toFixed(1) : '5.0'}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-1">Rating</p>
            </div>
          </div>
        </div>

        {/* Detalles de Contacto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'} border rounded-2xl p-6 flex items-center gap-4 shadow-sm`}>
            <div className={`w-10 h-10 ${isDark ? 'bg-[#f59e0b]/10 text-[#f59e0b]' : 'bg-blue-50 text-[#0061ff]'} rounded-xl flex items-center justify-center`}>
              <Mail size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 leading-none mb-1">Email</p>
              <p className={`text-xs font-semibold ${isDark ? 'text-white/80' : 'text-gray-700'} truncate`}>{barber?.email || '---'}</p>
            </div>
          </div>
          <div className={`${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'} border rounded-2xl p-6 flex items-center gap-4 shadow-sm`}>
            <div className={`w-10 h-10 ${isDark ? 'bg-emerald-500/10 text-emerald-500' : 'bg-emerald-50 text-emerald-600'} rounded-xl flex items-center justify-center`}>
              <Phone size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 leading-none mb-1">WhatsApp</p>
              <p className={`text-xs font-semibold ${isDark ? 'text-white/80' : 'text-gray-700'}`}>{barber?.phone || '---'}</p>
            </div>
          </div>
        </div>

        {/* Acciones de Gestión */}
        {isOwnerOfProfile && (
          <div className="space-y-4">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`w-full ${isDark ? 'bg-[#f59e0b] text-black shadow-amber-500/10' : 'bg-[#0061ff] text-white shadow-blue-500/20'} py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg`}
            >
              <Settings size={16} />
              Editar Información
            </button>

            <div className={`${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'} rounded-2xl p-6 border space-y-4 shadow-sm`}>
              <div className="flex items-center gap-2 text-red-600">
                <Shield size={16} />
                <p className="text-[10px] font-bold uppercase tracking-widest">Zona de Peligro</p>
              </div>
              <button
                onClick={handleDeleteAccount}
                className={`w-full ${isDark ? 'bg-white/5 border-red-500/20 text-red-500/80 hover:bg-red-500 hover:text-white' : 'bg-white border-red-100 text-red-500 hover:bg-red-50'} py-3 rounded-xl font-bold uppercase tracking-widest text-[9px] border transition-all`}
              >
                Eliminar Mi Cuenta permanentemente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Configuración */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsSettingsOpen(false)} />
          <div className={`relative ${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200'} border rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-8 animate-in zoom-in-95 duration-200`}>
            <div className="flex justify-between items-center mb-8">
              <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'} uppercase tracking-tight italic`}>Editar Perfil</h2>
              <button onClick={() => setIsSettingsOpen(false)} className={`p-2 ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} rounded-full transition-all text-gray-400`}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nombre</label>
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={`w-full ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'} border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#f59e0b] transition-all font-bold`} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">WhatsApp</label>
                  <input type="text" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className={`w-full ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'} border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#f59e0b] transition-all font-bold`} />
                </div>
              </div>

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

              <button onClick={handleUpdateProfile} className={`w-full ${isDark ? 'bg-[#f59e0b] text-black shadow-amber-500/10' : 'bg-[#0061ff] text-white shadow-blue-500/20'} py-4 rounded-xl font-black uppercase tracking-widest text-[11px] mt-4 shadow-lg transition-all active:scale-95`}>
                Guardar Cambios
              </button>

              <div className={`h-px ${isDark ? 'bg-white/5' : 'bg-gray-100'} my-8`} />

              <div className="space-y-6">
                <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-gray-900'} uppercase tracking-widest italic`}>Seguridad de la Cuenta</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nuevo Email</label>
                    <div className="flex gap-2">
                      <input type="email" placeholder="ejemplo@correo.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={`flex-1 ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'} border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#f59e0b] transition-all font-bold`} />
                      <button onClick={handleChangeEmail} className={`px-6 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'}`}>Cambiar</button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nueva Contraseña</label>
                    <div className="flex gap-2">
                      <input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={`flex-1 ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'} border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#f59e0b] transition-all font-bold`} />
                      <button onClick={handleChangePassword} className={`px-6 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'}`}>Cambiar</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
