'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Lock, User, KeyRound, Loader2, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

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
      .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
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
    const { value: newPassword } = await Swal.fire({
      title: 'Resetear Contraseña',
      html: `Escribe una contraseña temporal para <b>${userName}</b>.<br><small class="text-gray-500">El usuario podrá cambiarla desde su perfil.</small>`,
      input: 'text',
      inputPlaceholder: 'Mínimo 6 caracteres',
      showCancelButton: true,
      confirmButtonText: 'Resetear',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--color-erp-primary)',
      cancelButtonColor: '#ef4444',
      inputValidator: (value) => {
        if (!value) return 'Debes ingresar una contraseña';
        if (value.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
      }
    });

    if (!newPassword) return;

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
        body: JSON.stringify({ userId, newPassword })
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(`Contraseña de ${userName} reseteada exitosamente.`);
      } else {
        toast.error(result.error || 'Error al resetear la contraseña');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de conexión');
    } finally {
      setResettingId(null);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-erp-surface border border-erp-border p-10 rounded-2xl shadow-xl w-full max-w-md text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
          
          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100">
            <Lock size={32} />
          </div>
          
          <h2 className="text-2xl font-black text-erp-text tracking-tight uppercase mb-2">Acceso Restringido</h2>
          <p className="text-sm font-medium text-erp-text-muted mb-8 px-4">
            Ingresa tu contraseña de administrador para gestionar las credenciales de tu equipo.
          </p>

          <form onSubmit={handleUnlock} className="space-y-6">
            <div className="relative group text-left">
              <label className="text-[10px] font-bold uppercase tracking-widest text-erp-text-muted mb-1 block ml-1">Contraseña de Dueño</label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full bg-erp-bg border border-erp-border rounded-xl px-4 py-3.5 text-sm font-bold text-erp-text outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all shadow-sm pr-12"
                placeholder="••••••••"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[30px] p-1 text-erp-text-muted hover:text-erp-text transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            <button
              type="submit"
              disabled={isUnlocking || !unlockPassword}
              className="w-full bg-red-600 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl shadow-md hover:bg-red-700 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUnlocking ? (
                <><Loader2 size={16} className="animate-spin" /> VERIFICANDO...</>
              ) : (
                <><ShieldAlert size={16} /> DESBLOQUEAR PANEL</>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-32">
      
      {/* HEADER ERP */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-erp-bg border border-erp-border p-6 rounded-2xl shadow-sm">
         <div className="flex items-center gap-5">
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 shadow-sm shrink-0">
               <ShieldAlert size={24} />
            </div>
            <div>
               <h2 className="text-2xl font-black text-erp-text tracking-tight uppercase">Seguridad y Accesos</h2>
               <p className="text-sm font-medium text-erp-text-muted mt-0.5">Controla las credenciales de tu equipo de trabajo</p>
            </div>
         </div>
      </div>

      <div className="bg-erp-surface border border-erp-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
         {/* BARRA DE BÚSQUEDA */}
         <div className="p-6 border-b border-erp-border bg-erp-bg">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="relative flex-1 group shadow-sm">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search size={18} className="text-erp-text-muted group-focus-within:text-erp-primary transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o teléfono..."
                  className="w-full bg-erp-surface border border-erp-border rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium text-erp-text outline-none focus:border-erp-primary/50 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-erp-primary text-white px-8 rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all shadow-sm flex items-center justify-center min-w-[120px]"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'BUSCAR'}
              </button>
            </form>
         </div>

         {/* DATA GRID DE USUARIOS */}
         {users.length === 0 && !isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center opacity-60">
              <User size={48} className="text-erp-text-muted mb-4" />
              <p className="text-sm font-bold text-erp-text uppercase tracking-widest">No hay usuarios visibles</p>
              <p className="text-xs text-erp-text-muted mt-2">Usa el buscador para encontrar cuentas</p>
            </div>
         ) : (
            <div className="overflow-x-auto custom-scrollbar">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-erp-bg border-b border-erp-border">
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted whitespace-nowrap">Usuario</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted whitespace-nowrap">Contacto</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted whitespace-nowrap">Rol</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted text-right whitespace-nowrap">Acciones de Seguridad</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-erp-border">
                     {users.map((user) => (
                        <tr key={user.id} className="group hover:bg-erp-bg transition-colors">
                           <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-lg overflow-hidden border border-erp-border bg-erp-surface flex items-center justify-center shrink-0 text-erp-primary">
                                    <User size={18} />
                                 </div>
                                 <p className="text-sm font-bold text-erp-text uppercase tracking-tight">{user.name}</p>
                              </div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                 <span className="text-xs font-bold text-erp-text">{user.email}</span>
                                 <span className="text-[10px] font-medium text-erp-text-muted uppercase tracking-wider">{user.phone || 'Sin teléfono'}</span>
                              </div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md border text-[10px] font-black uppercase tracking-widest ${user.role === 'barber' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                                 {user.role === 'barber' ? 'Barbero' : 'Cliente'}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right whitespace-nowrap">
                              <button
                                 onClick={() => handleResetPassword(user.id, user.name)}
                                 disabled={resettingId === user.id}
                                 className="inline-flex items-center gap-2 bg-erp-surface border border-erp-border text-erp-text-muted px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all disabled:opacity-50"
                              >
                                 {resettingId === user.id ? (
                                    <><Loader2 size={14} className="animate-spin" /> Procesando</>
                                 ) : (
                                    <><KeyRound size={14} /> Resetear Clave</>
                                 )}
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>
    </div>
  );
}
