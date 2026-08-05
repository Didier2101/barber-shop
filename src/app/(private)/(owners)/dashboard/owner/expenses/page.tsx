'use client';
import { useOwnerBaseData, useOwnerMutations, useOwnerExpenses } from '@/hooks/owner';
import { 
  DollarSign, 
  Trash, 
  Filter,
  TrendingDown,
  ArrowRight,
  Plus,
  Receipt
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { formatPrice } from '@/lib/format';

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
        <div className="w-8 h-8 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalMonthlyExpenses = expenses.reduce((sum: number, exp: { amount: number }) => sum + Number(exp.amount), 0);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-8xl mx-auto pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-black border border-white/5 rounded-2xl shadow-xl text-red-500">
            <TrendingDown size={28} />
          </div>
          <div>
            <p className="text-red-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Egresos</p>
            <h2 className="text-3xl font-bold tracking-tight text-white uppercase">Gastos</h2>
          </div>
        </div>
        
        <div className="bg-black border border-red-500/20 px-8 py-4 rounded-2xl shadow-xl">
           <p className="text-[10px] font-bold uppercase tracking-widest text-red-400/80 mb-1">Salida Total del Mes</p>
           <p className="text-3xl font-bold text-white tracking-tight leading-none">-{formatPrice(totalMonthlyExpenses)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Listado de Gastos */}
        <div className="lg:col-span-6 space-y-6">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-medium uppercase tracking-[0.1em] text-white/40">Libro de Salidas</h3>
              <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-red-500 transition-all">
                 <Filter size={14} /> Filtrar Periodo
              </button>
           </div>

           <div className="flex flex-col gap-4">
              {expenses.length === 0 ? (
                 <div className="py-24 text-center border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3">
                    <Receipt size={32} className="text-white/20" />
                    <p className="text-sm font-medium text-white/40">Sin gastos registrados</p>
                 </div>
              ) : (
                 expenses.map((expense: { id: string; amount: number; description: string; category?: string; expense_date: string }, idx: number) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={expense.id} 
                      className="bg-black border border-white/5 p-6 rounded-2xl flex items-center justify-between transition-all group hover:border-white/10 hover:shadow-xl hover:shadow-red-500/5"
                    >
                       <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-bg-base border border-white/5 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                             <DollarSign size={20} />
                          </div>
                          <div>
                             <p className="text-lg font-bold text-white uppercase tracking-tight mb-1">{expense.description}</p>
                             <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider">
                                <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/10">{expense.category || 'General'}</span>
                                <span className="text-white/20">•</span>
                                <span className="text-white/40">{format(new Date(expense.expense_date), 'dd MMM, yyyy')}</span>
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-6">
                          <p className="text-xl font-bold text-white tracking-tight leading-none">-{formatPrice(expense.amount)}</p>
                          <button 
                             onClick={() => {
                                Swal.fire({
                                  title: '¿ELIMINAR REGISTRO?',
                                  text: 'Esta acción afectará el balance mensual.',
                                  icon: 'warning',
                                  showCancelButton: true,
                                  confirmButtonColor: '#ef4444',
                                  confirmButtonText: 'ELIMINAR',
                                  cancelButtonText: 'CANCELAR',
                                  background: '#111111',
                                  color: '#fff',
                                }).then(result => {
                                  if (result.isConfirmed) deleteExpense.mutate(expense.id);
                                });
                             }}
                             className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                             <Trash size={16} />
                          </button>
                       </div>
                    </motion.div>
                 ))
              )}
           </div>
        </div>

        {/* Formulario Nuevo Gasto */}
        <div className="lg:col-span-6 space-y-6">
           <h3 className="text-xs font-medium uppercase tracking-[0.1em] text-white/40 px-2">Contabilidad</h3>
           <div className="bg-black border border-white/5 rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden">
              <div className="space-y-2 relative z-10">
                 <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl w-fit text-red-500 mb-4">
                    <Plus size={20} />
                 </div>
                 <h4 className="text-lg font-bold text-white">Registrar Gasto</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider ml-1">Monto de la Salida ($)</label>
                    <input 
                       type="number" 
                       placeholder="0.00"
                       className="w-full bg-bg-base border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-red-500/40 transition-all shadow-sm"
                       value={newExpense.amount}
                       onChange={e => {
                         const val = e.target.value;
                         if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
                           setNewExpense({ ...newExpense, amount: val.replace(/^0+/, '') });
                         } else {
                           setNewExpense({ ...newExpense, amount: val });
                         }
                       }}
                    />
                 </div>

                 <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider ml-1">Descripción / Concepto</label>
                    <textarea 
                       placeholder="Ej: Pago de Arriendo Mayo"
                       className="w-full bg-bg-base border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-red-500/40 transition-all min-h-[80px] resize-none shadow-sm"
                       value={newExpense.description}
                       onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                    />
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider ml-1">Categoría Administrativa</label>
                    <div className="relative">
                      <select 
                         className="w-full bg-bg-base border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-red-500/40 transition-all appearance-none cursor-pointer shadow-sm"
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
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40"><ArrowRight size={16} className="rotate-90" /></div>
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider ml-1">Fecha del Egreso</label>
                    <input 
                       type="date" 
                       className="w-full bg-bg-base border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-red-500/40 transition-all [color-scheme:dark] shadow-sm"
                       value={newExpense.expense_date}
                       onChange={e => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                    />
                 </div>
              </div>

              <button 
                 onClick={() => {
                    if (!newExpense.amount || !newExpense.description) return toast.error('Completa los datos obligatorios (Monto y Descripción)');
                    createExpense.mutate({
                       amount: Number(newExpense.amount),
                       description: newExpense.description,
                       category: newExpense.category,
                       expense_date: newExpense.expense_date
                    }, {
                       onSuccess: () => {
                          toast.success('Gasto registrado con éxito');
                          setNewExpense({ amount: '', description: '', category: '', expense_date: new Date().toISOString().split('T')[0] });
                       }
                    });
                 }}
                 className="w-full bg-red-600 text-white py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 active:scale-95 relative z-10 mt-4"
              >
                 Registrar Salida
              </button>
              <TrendingDown size={150} className="absolute -bottom-10 -right-10 opacity-5 text-red-500" />
           </div>
        </div>
      </div>
    </div>
  );
}
