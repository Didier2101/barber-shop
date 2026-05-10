'use client';
import { useOwnerBaseData, useOwnerMutations, useOwnerExpenses } from '@/hooks/useOwnerData';
import { 
  DollarSign, 
  Trash, 
  Filter,
  TrendingDown
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { format } from 'date-fns';

export default function ExpensesPage() {
  const { isLoading: baseLoading } = useOwnerBaseData();
  const { data: expenses = [], isLoading: expLoading } = useOwnerExpenses();
  const { createExpense, deleteExpense } = useOwnerMutations();
  
  const [newExpense, setNewExpense] = useState({ 
    amount: '', 
    description: '', 
    category: '', 
    expense_date: new Date().toISOString().split('T')[0] 
  });

  if (baseLoading || expLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#0061ff] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm text-red-500">
          <DollarSign size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 uppercase">Control de Gastos</h2>
          <p className="text-[11px] text-gray-500 font-medium tracking-wider">Seguimiento de egresos y costos operativos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Listado de Gastos */}
        <div className="lg:col-span-2 space-y-8">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Historial de Salidas</h3>
              <div className="flex items-center gap-3">
                 <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all">
                    <Filter size={14} /> Filtrar Mes
                 </button>
              </div>
           </div>

           <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="divide-y divide-gray-50">
                 {expenses.length === 0 ? (
                    <div className="p-24 text-center">
                       <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest italic">No hay gastos registrados en este periodo</p>
                    </div>
                 ) : (
                    expenses.map((expense: { id: string; amount: number; description: string; category?: string; expense_date: string }) => (
                       <div key={expense.id} className="p-8 flex items-center justify-between hover:bg-gray-50/50 transition-all group">
                          <div className="flex items-center gap-6">
                             <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                                <TrendingDown size={20} />
                             </div>
                             <div>
                                <p className="text-base font-black text-gray-900 uppercase tracking-tight">{expense.description}</p>
                                <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                   <span className="text-red-400">{expense.category || 'Operativo'}</span>
                                   <span>•</span>
                                   <span>{format(new Date(expense.expense_date), 'dd MMM, yyyy')}</span>
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-8">
                             <p className="text-xl font-black text-gray-900 italic">-${new Intl.NumberFormat('de-DE').format(expense.amount)}</p>
                             <button 
                                onClick={() => {
                                   Swal.fire({
                                     title: '¿Eliminar registro?',
                                     icon: 'warning',
                                     showCancelButton: true,
                                     confirmButtonColor: '#ef4444',
                                     confirmButtonText: 'Eliminar'
                                   }).then(result => {
                                     if (result.isConfirmed) deleteExpense.mutate(expense.id);
                                   });
                                }}
                                className="p-3 text-gray-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                             >
                                <Trash size={18} />
                             </button>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>

        {/* Formulario Nuevo Gasto */}
        <div className="space-y-8">
           <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest px-2">Registrar Gasto</h3>
           <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Monto ($)</label>
                 <input 
                    type="number" 
                    placeholder="0.00"
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-black outline-none focus:border-red-400 focus:bg-white transition-all"
                    value={newExpense.amount}
                    onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Descripción</label>
                 <textarea 
                    placeholder="Ej: Pago de Arriendo Mayo"
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-semibold outline-none focus:border-red-400 focus:bg-white transition-all min-h-[100px]"
                    value={newExpense.description}
                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Categoría</label>
                 <select 
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-black uppercase outline-none focus:border-red-400 focus:bg-white transition-all appearance-none cursor-pointer"
                    value={newExpense.category}
                    onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                 >
                    <option value="">Seleccionar Categoría</option>
                    <option value="Servicios">Servicios Públicos</option>
                    <option value="Arriendo">Arriendo / Renta</option>
                    <option value="Insumos">Insumos de Barbería</option>
                    <option value="Marketing">Marketing / Publicidad</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Otros">Otros Gastos</option>
                 </select>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Fecha</label>
                 <input 
                    type="date" 
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-black outline-none focus:border-red-400 focus:bg-white transition-all"
                    value={newExpense.expense_date}
                    onChange={e => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                 />
              </div>

              <button 
                 onClick={() => {
                    if (!newExpense.amount || !newExpense.description) return toast.error('Completa los datos');
                    createExpense.mutate({
                       amount: Number(newExpense.amount),
                       description: newExpense.description,
                       category: newExpense.category,
                       expense_date: newExpense.expense_date
                    }, {
                       onSuccess: () => {
                          toast.success('Gasto registrado');
                          setNewExpense({ amount: '', description: '', category: '', expense_date: new Date().toISOString().split('T')[0] });
                       }
                    });
                 }}
                 className="w-full bg-red-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-red-500/20 active:scale-95 transition-all mt-4"
              >
                 Registrar Salida
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
