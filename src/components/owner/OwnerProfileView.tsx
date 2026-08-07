'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Camera, Mail, Settings, User, Phone, X, Edit3, KeyRound, Check } from 'lucide-react';
import { useGlobalStore } from '@/store/useGlobalStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Profile } from '@/types';
import { User as SupabaseUser } from '@supabase/supabase-js';
// import Swal from 'sweetalert2';
import { toast } from 'sonner';
import Image from 'next/image';

interface OwnerProfileViewProps {
  profileId: string;
}

export function OwnerProfileView({ profileId }: OwnerProfileViewProps) {
  const { userProfile, setUserProfile } = useGlobalStore();
  const [ownerData, setOwnerData] = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState({ name: '', nickname: '', phone: '', bio: '', address: '' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!profileId) return;
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user ?? null);

      const { data: profileRes } = await supabase.from('profiles').select('*').eq('id', profileId).single();

      if (profileRes) {
        const bData = profileRes;
        const sessionUser = session?.user;
        const email = (sessionUser?.id === bData.id) ? sessionUser?.email : bData.email;

        setOwnerData({ ...bData, email });
        setEditForm({
          name: bData.name || '',
          nickname: bData.nickname || '',
          phone: bData.phone || '',
          bio: bData.bio || '',
          address: bData.address || ''
        });
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

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', currentUser.id);
      if (updateError) throw updateError;

      if (ownerData) setOwnerData({ ...ownerData, avatar_url: publicUrl });
      if (userProfile && userProfile.id === currentUser.id) {
        setUserProfile({ ...userProfile, avatar_url: publicUrl });
      }

      toast.success('Foto actualizada con éxito');
    } catch (error) {
      console.error(error);
      toast.error('Error al subir la foto');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const updatedForm = {
        name: editForm.name.trim(),
        nickname: editForm.nickname.trim(),
        phone: editForm.phone.trim(),
        bio: editForm.bio.trim(),
        address: editForm.address.trim(),
      };

      if (!updatedForm.name) return toast.error('El nombre no puede estar vacío');

      const { error } = await supabase.from('profiles').update(updatedForm).eq('id', profileId);
      if (error) throw error;

      if (ownerData) setOwnerData({ ...ownerData, ...updatedForm } as Profile);
      if (userProfile && userProfile.id === currentUser?.id) {
        setUserProfile({ ...userProfile, ...updatedForm });
      }

      setIsSettingsOpen(false);
      toast.success('Perfil actualizado correctamente');
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Error en la operación');
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
      toast.error((error as Error).message || 'Error al actualizar horarios');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-erp-primary/20 border-t-erp-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      {/* TARJETA PRINCIPAL DEL PERFIL */}
      <div className="bg-erp-surface border border-erp-border rounded-2xl shadow-sm overflow-hidden">

        {/* Cabecera / Banner */}
        <div className="h-32 bg-erp-bg border-b border-erp-border flex justify-end p-4">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="h-fit bg-erp-surface text-erp-text border border-erp-border px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-erp-primary/5 hover:text-erp-primary transition-all shadow-sm"
          >
            <Edit3 size={14} /> Editar Perfil
          </button>
        </div>

        {/* Info del Usuario */}
        <div className="px-8 pb-8 relative">
          <div className="flex flex-col md:flex-row gap-6 md:items-end -mt-12 mb-6">

            {/* Avatar */}
            <div className="relative group w-24 h-24 shrink-0 rounded-2xl bg-erp-bg border-4 border-erp-surface shadow-md overflow-hidden flex items-center justify-center">
              {ownerData?.avatar_url ? (
                <Image src={ownerData.avatar_url} alt="Profile" fill className="object-cover" />
              ) : (
                <User size={40} className="text-erp-text-muted" />
              )}

              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex flex-col items-center justify-center gap-1 z-10 backdrop-blur-sm">
                <Camera size={20} className="text-white" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white">Editar Foto</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
              </label>
              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-sm">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Nombres y Rol */}
            <div className="flex-1 pb-2">
              <h2 className="text-2xl font-black text-erp-text tracking-tight uppercase leading-none">
                {ownerData?.name} {ownerData?.nickname && <span className="text-erp-primary">({ownerData.nickname})</span>}
              </h2>
              <p className="text-[10px] font-black text-erp-text-muted uppercase tracking-widest mt-1">Dueño de Barbería (Admin)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            {/* Contacto */}
            <div className="space-y-4 border-t border-erp-border pt-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-erp-text-muted mb-4 flex items-center gap-2">
                <Mail size={14} className="text-erp-primary" /> Información de Contacto
              </h3>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-erp-bg border border-erp-border flex items-center justify-center text-erp-text-muted shrink-0"><Mail size={14} /></div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-erp-text-muted uppercase tracking-widest">Email Principal</p>
                    <p className="text-sm font-bold text-erp-text truncate">{ownerData?.email || 'No registrado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0"><Phone size={14} /></div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-erp-text-muted uppercase tracking-widest">WhatsApp</p>
                    <p className="text-sm font-bold text-erp-text">{ownerData?.phone || 'No registrado'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detalles de la cuenta */}
            <div className="space-y-4 border-t border-erp-border pt-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-erp-text-muted mb-4 flex items-center gap-2">
                <User size={14} className="text-erp-primary" /> Detalles Adicionales
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-bold text-erp-text-muted uppercase tracking-widest">Sede / Dirección</p>
                  <p className="text-sm font-bold text-erp-text mt-0.5">{ownerData?.address || 'No especificada'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-erp-text-muted uppercase tracking-widest">Biografía</p>
                  <p className="text-sm font-medium text-erp-text-muted mt-0.5 italic">{ownerData?.bio ? `"${ownerData.bio}"` : 'Sin descripción'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL / DRAWER DE EDICIÓN */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[998]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-[999] w-full md:w-[450px] flex flex-col bg-erp-surface border-l border-erp-border shadow-2xl font-sans"
            >
              {/* Header del Drawer */}
              <div className="shrink-0 h-20 border-b bg-erp-bg border-erp-border flex items-center justify-between px-6 z-10">
                <h2 className="text-lg font-black text-erp-text uppercase tracking-tight flex items-center gap-2">
                  <Settings size={20} className="text-erp-primary" /> Configuración
                </h2>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-10 h-10 bg-erp-surface border border-erp-border rounded-xl text-erp-text-muted hover:text-erp-primary hover:border-erp-primary/30 flex items-center justify-center transition-all shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Cuerpo del Drawer */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-erp-surface p-6">
                <div className="space-y-6">

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-erp-primary uppercase tracking-widest border-b border-erp-border pb-2">Datos Generales</h3>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-erp-text-muted uppercase tracking-wider">Nombre Real</label>
                      <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-erp-bg border border-erp-border text-erp-text rounded-xl px-4 py-3 text-sm outline-none focus:border-erp-primary/50 transition-all shadow-sm" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-erp-text-muted uppercase tracking-wider">Apodo / Marca</label>
                      <input type="text" value={editForm.nickname} onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })} className="w-full bg-erp-bg border border-erp-border text-erp-text rounded-xl px-4 py-3 text-sm outline-none focus:border-erp-primary/50 transition-all shadow-sm" placeholder="Ej: Grizzly" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-erp-text-muted uppercase tracking-wider">WhatsApp</label>
                      <input type="text" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full bg-erp-bg border border-erp-border text-erp-text rounded-xl px-4 py-3 text-sm outline-none focus:border-erp-primary/50 transition-all shadow-sm" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-erp-text-muted uppercase tracking-wider">Dirección / Sede</label>
                      <input type="text" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="w-full bg-erp-bg border border-erp-border text-erp-text rounded-xl px-4 py-3 text-sm outline-none focus:border-erp-primary/50 transition-all shadow-sm" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-erp-text-muted uppercase tracking-wider">Biografía Breve</label>
                      <textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        className="w-full bg-erp-bg border border-erp-border text-erp-text rounded-xl px-4 py-3 text-sm outline-none focus:border-erp-primary/50 transition-all shadow-sm min-h-[100px] resize-none"
                      />
                    </div>
                  </div>

                  <button onClick={handleUpdateProfile} className="w-full bg-erp-primary text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-md hover:bg-erp-primary/90 transition-all active:scale-95 mt-6 flex items-center justify-center gap-2">
                    <Check size={16} /> Guardar Perfil
                  </button>

                  {/* Seguridad */}
                  <div className="space-y-4 pt-8 border-t border-erp-border mt-8">
                    <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest border-b border-red-100 pb-2 flex items-center gap-2">
                      <KeyRound size={14} /> Contraseña de Acceso
                    </h3>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-erp-text-muted uppercase tracking-wider">Contraseña Actual</label>
                      <input type="password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full bg-erp-bg border border-erp-border text-erp-text rounded-xl px-4 py-3 text-sm outline-none focus:border-erp-primary/50 transition-all shadow-sm" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-erp-text-muted uppercase tracking-wider">Nueva Contraseña</label>
                      <input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-erp-bg border border-erp-border text-erp-text rounded-xl px-4 py-3 text-sm outline-none focus:border-erp-primary/50 transition-all shadow-sm" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-erp-text-muted uppercase tracking-wider">Confirmar Nueva Contraseña</label>
                      <input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-erp-bg border border-erp-border text-erp-text rounded-xl px-4 py-3 text-sm outline-none focus:border-erp-primary/50 transition-all shadow-sm" />
                    </div>

                    <button onClick={handleChangePassword} className="w-full bg-zinc-800 text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-black shadow-md mt-2">
                      Actualizar Contraseña
                    </button>
                  </div>

                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
