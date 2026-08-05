'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Lock, User, KeyRound, Loader2, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function UsersManagementPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [users, setUsers] = useState<{ id: string; name: string; phone: string; email: string; role: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUnlocking(true);
    
    // Obtener el email real de la sesión actual de Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.email) {
      toast.error('No se pudo verificar tu sesión. Intenta recargar la página.');
      setIsUnlocking(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: unlockPassword,
    });

    if (error) {
      toast.error('Contraseña incorrecta');
      setIsUnlocking(false);
      return;
    }

    setIsUnlocked(true);
    setIsUnlocking(false);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) {
      setUsers([]);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('role', 'owner') 
      .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('name')
      .limit(10);
      
    if (error) {
      toast.error('Error al buscar usuarios');
    } else {
      setUsers(data || []);
      if (data?.length === 0) toast.info('No se encontraron usuarios que coincidan');
    }
    setIsLoading(false);
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    const confirm = window.confirm(`¿Seguro que deseas establecer la contraseña temporal "123456" para ${userName}?`);
    if (!confirm) return;

    setResettingId(userId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Tu sesión expiró');
        return;
      }

      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId })
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(`Contraseña de ${userName} reseteada a: 123456`);
      } else {
        toast.error(result.error || 'Error al resetear la contraseña');
      }
    } catch {
      toast.error('Error de red al intentar resetear la contraseña');
    } finally {
      setResettingId(null);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-black/20 p-8 rounded-3xl border border-white/10 w-full max-w-md backdrop-blur-md shadow-xl text-center">
          <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
            <ShieldAlert size={32} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase italic mb-2">Zona de Seguridad</h2>
          <p className="text-white/60 text-sm mb-6">
            Ingresa tu contraseña de dueño para acceder a la gestión de usuarios y recuperar contraseñas.
          </p>
          
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative group text-left">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#f59e0b]" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 text-white text-sm focus:outline-none focus:border-[#f59e0b]"
                placeholder="Tu contraseña actual"
                value={unlockPassword}
                onChange={e => setUnlockPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-[#f59e0b] transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            
            <button
              type="submit"
              disabled={isUnlocking}
              className="w-full bg-[#f59e0b] hover:bg-white text-black h-12 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isUnlocking ? <Loader2 size={16} className="animate-spin" /> : 'Desbloquear'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic">Recuperación de Usuarios</h1>
          <p className="text-white/60 text-sm">Resetea la contraseña de clientes y barberos</p>
        </div>
      </div>

      <div className="bg-black/20 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
        <form onSubmit={handleSearch} className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Buscar por nombre o número de celular..."
              className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white text-sm focus:outline-none focus:border-[#f59e0b]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading || !searchTerm.trim()} 
            className="h-12 px-6 bg-[#f59e0b] hover:bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl transition-colors disabled:opacity-50"
          >
            Buscar
          </button>
        </form>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 size={32} className="animate-spin text-[#f59e0b]" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-white/50">
            {searchTerm.trim() ? 'No se encontraron resultados' : 'Ingresa un nombre o celular para buscar'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((u) => (
              <div key={u.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-white/20 transition-all">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <User size={20} className="text-white/60" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{u.name}</h3>
                    <p className="text-white/50 text-xs mt-1">{u.phone}</p>
                    <p className="text-white/40 text-[10px] mt-0.5 truncate max-w-[180px]" title={u.email || `${u.phone}@barbershop.local`}>
                      {u.email || `${u.phone}@barbershop.local`}
                    </p>
                    <span className="inline-block mt-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                      {u.role === 'barber' ? 'Barbero' : 'Cliente'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleResetPassword(u.id, u.name)}
                  disabled={resettingId === u.id}
                  className="w-full h-10 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-red-500/20 transition-all disabled:opacity-50"
                >
                  {resettingId === u.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <KeyRound size={14} />
                      Generar Clave &quot;123456&quot;
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
