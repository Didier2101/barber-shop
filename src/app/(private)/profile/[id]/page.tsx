/* eslint-disable @next/next/no-img-element */
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { Camera, ArrowLeft, Mail, MessageSquare, Settings, X } from 'lucide-react';
import { Profile } from '@/types';
import { User } from '@supabase/supabase-js';
import Swal from 'sweetalert2';

export default function BarberFullProfile() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [barber, setBarber] = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [rating, setGlobalRating] = useState({ average: 0, count: 0 });

  // Form states
  const [editForm, setEditForm] = useState({ name: '', nickname: '', phone: '', bio: '' });
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (!id) return;
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user ?? null);

      const { data: bData } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (bData) {
        // Enriquecer con el email de la sesión si es el propio perfil de forma segura
        const sessionUser = session?.user;
        const email = (sessionUser?.id === bData.id) ? sessionUser?.email : bData.email;
        
        setBarber({ ...bData, email });
        setEditForm({
          name: bData.name || '',
          nickname: bData.nickname || '',
          phone: bData.phone || '',
          bio: bData.bio || ''
        });
      }

      const { data: apts } = await supabase
        .from('appointments')
        .select('rating')
        .eq('barber_id', id)
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
  }, [id]);

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

      if (!currentUser) return;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      if (barber) setBarber({ ...barber, avatar_url: publicUrl } as Profile);
      Swal.fire({ icon: 'success', title: '¡Éxito!', text: 'Foto actualizada', background: '#111', color: '#fff' });
    } catch (error: unknown) {
      Swal.fire({ icon: 'error', title: 'Error', text: error instanceof Error ? error.message : 'Error inesperado', background: '#111', color: '#fff' });
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
      Swal.fire({ icon: 'success', title: 'Perfil Actualizado', background: '#111', color: '#fff' });
    } catch (error: unknown) {
      Swal.fire({ icon: 'error', title: 'Error', text: error instanceof Error ? error.message : 'Error inesperado', background: '#111', color: '#fff' });
    }
  };

  const handleChangeEmail = async () => {
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      Swal.fire({ icon: 'info', title: 'Verifica tu correo', text: 'Enviamos un enlace de confirmación.', background: '#111', color: '#fff' });
    } catch (error: unknown) {
      Swal.fire({ icon: 'error', title: 'Error', text: error instanceof Error ? error.message : 'Error inesperado', background: '#111', color: '#fff' });
    }
  };

  const handleChangePassword = async () => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      Swal.fire({ icon: 'success', title: 'Clave Actualizada', background: '#111', color: '#fff' });
      setNewPassword('');
    } catch (error: unknown) {
      Swal.fire({ icon: 'error', title: 'Error', text: error instanceof Error ? error.message : 'Error inesperado', background: '#111', color: '#fff' });
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
      background: '#111',
      color: '#fff'
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await supabase.from('appointments').update({ client_id: null }).eq('client_id', currentUser.id);
        await supabase.from('profiles').delete().eq('id', currentUser.id);
        await supabase.auth.signOut();
        router.push('/');
        Swal.fire({ icon: 'success', title: 'Cuenta eliminada', background: '#111', color: '#fff' });
      } catch (error: unknown) {
        Swal.fire({ icon: 'error', title: 'Error', text: error instanceof Error ? error.message : 'Error inesperado', background: '#111', color: '#fff' });
      } finally {
        setLoading(false);
      }
    }
  };

  const isClient = barber?.role === 'client';
  const isOwnerOfProfile = currentUser?.id === id;

  return (
    <main className="min-h-screen bg-[#050505] text-white relative overflow-x-hidden">
      {/* Background Photo - Full Hero */}
      <div className="fixed inset-0 z-0">
        {barber?.avatar_url ? (
          <img src={barber.avatar_url} alt="Profile" className="w-full h-full object-cover opacity-60" />
        ) : (
          <img src="/nathon-oski-EW_rqoSdDes-unsplash.jpg" alt="Profile" className="w-full h-full object-cover opacity-20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent" />
      </div>

      {/* Header / Navigation - Minimal & Transparent - ALWAYS VISIBLE */}
      <nav className="fixed top-0 left-0 right-0 z-[60] p-4 flex justify-between items-center">
        <button onClick={() => router.back()} className="bg-black/60 backdrop-blur-2xl px-5 py-3 rounded-2xl border border-white/10 active:scale-90 transition-all flex items-center gap-3">
          <ArrowLeft size={18} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Volver</span>
        </button>
        
        {!isClient && barber && (
          <button
            disabled={!barber?.is_online}
            onClick={() => router.push(`/barber/${id}`)}
            className={`px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 transition-all ${barber?.is_online ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}
          >
            {barber?.is_online ? 'Agendar Cita' : 'Offline'}
          </button>
        )}
      </nav>

      {loading ? (
         <div className="relative z-10 min-h-screen flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#f59e0b] border-t-transparent rounded-full animate-spin" />
         </div>
      ) : (
         <>
         {/* Content Wrapper */}
         <div className="relative z-10 min-h-screen flex flex-col justify-end p-4 pb-12 pt-24 max-w-lg mx-auto space-y-6 animate-in fade-in duration-500">
           
           {/* Profile Info Header */}
           <div className="space-y-2">
             <div className="flex items-center gap-2">
               <span className="bg-amber-500 text-black px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                 {isClient ? 'Cliente VIP' : 'Master Barber'}
               </span>
               {isOwnerOfProfile && (
                 <label className="bg-white/10 backdrop-blur-md text-white p-2 rounded-full border border-white/20 active:scale-90 transition-all cursor-pointer">
                   <Camera size={14} />
                   <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
                 </label>
               )}
             </div>
             <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">{barber?.nickname || barber?.name}</h1>
             <p className="text-white/40 text-xs font-bold uppercase tracking-[0.3em]">{barber?.name}</p>
           </div>

        {/* Info Card */}
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 space-y-8 shadow-2xl">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-4">
             <div className="text-center">
                <p className="text-2xl font-black text-amber-500 leading-none">{barber?.services_completed || 0}</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mt-1">Citas</p>
             </div>
             <div className="text-center border-l border-white/10">
                <p className="text-2xl font-black text-white leading-none">{isClient ? 'VIP' : (rating.average > 0 ? rating.average.toFixed(1) : '5.0')}</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mt-1">{isClient ? 'Nivel' : 'Rating'}</p>
             </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center">
                <Mail size={16} className="text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Email</p>
                <p className="text-[11px] font-bold truncate">{barber?.email || '---'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center">
                <MessageSquare size={16} className="text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">WhatsApp</p>
                <p className="text-[11px] font-bold">{barber?.phone || '---'}</p>
              </div>
            </div>
          </div>

          {/* Actions - Integrated */}
          {isOwnerOfProfile && (
            <div className="pt-4 space-y-3">
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="w-full bg-white text-black py-4 rounded-3xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
              >
                <Settings size={16} />
                Gestionar Cuenta
              </button>
              <button 
                onClick={handleDeleteAccount}
                className="w-full bg-red-500/10 text-red-500 border border-red-500/20 py-4 rounded-3xl font-black uppercase tracking-widest text-[9px] active:bg-red-500 active:text-white transition-all"
              >
                Eliminar Cuenta Permanentemente
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Settings Panel - Bottom Sheet Style */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)} />
          <div className="relative bg-[#0a0a0a] border-t border-white/10 rounded-t-[3rem] p-8 pb-32 space-y-8 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">Editar Datos</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="bg-white/5 p-2 rounded-full"><X size={20}/></button>
            </div>

            <div className="space-y-4">
              <input type="text" placeholder="Nombre" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none" />
              <input type="text" placeholder="Nickname" value={editForm.nickname} onChange={(e) => setEditForm({...editForm, nickname: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none" />
              <input type="text" placeholder="WhatsApp" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none" />
              
              <button onClick={handleUpdateProfile} className="w-full bg-amber-500 text-black py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] mt-4">Guardar Cambios</button>
              
              <div className="h-px bg-white/5 my-4" />
              
              <div className="space-y-4">
                <input type="email" placeholder="Nuevo email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs outline-none" />
                <button onClick={handleChangeEmail} className="text-[10px] font-black uppercase text-amber-500 ml-1">Actualizar Email</button>
                
                <input type="password" placeholder="Nueva clave" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs outline-none" />
                <button onClick={handleChangePassword} className="text-[10px] font-black uppercase text-amber-500 ml-1">Cambiar Clave</button>
              </div>
            </div>
            </div>
          </div>
        )}
        </>
      )}
    </main>
  );
}
