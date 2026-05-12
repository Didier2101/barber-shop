'use client';
import { useOwnerBaseData, useOwnerMutations, useOwnerExpenses } from '@/hooks/useOwnerData';
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
        <div className="w-8 h-8 border-4 border-[#f59e0b]/20 border-t-[#f59e0b] rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalMonthlyExpenses = expenses.reduce((sum: number, exp: { amount: number }) => sum + Number(exp.amount), 0);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-black/80 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl text-red-500">
            <TrendingDown size={28} />
          </div>
          <div>
            <p className="text-red-500 text-[10px] font-black uppercase tracking-[0.4em] mb-1">Egresos</p>
            <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">Gastos</h2>
          </div>
        </div>
        
        <div className="bg-red-500/10 border border-red-500/20 px-8 py-4 rounded-[2rem] backdrop-blur-md">
           <p className="text-[9px] font-black uppercase tracking-[0.3em] text-red-400 mb-1 italic text-center">Salida Total del Mes</p>
           <p className="text-3xl font-black text-white italic tracking-tighter leading-none">-${new Intl.NumberFormat('de-DE').format(totalMonthlyExpenses)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Listado de Gastos */}
        <div className="lg:col-span-8 space-y-6">
           <div className="flex items-center justify-between px-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 italic">Libro de Salidas</h3>
              <button className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-[#f59e0b] transition-all italic">
                 <Filter size={14} /> Filtrar Periodo
              </button>
           </div>

           <div className="flex flex-col -space-y-px">
              {expenses.length === 0 ? (
                 <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-20 flex flex-col items-center justify-center gap-4">
                    <Receipt size={40} className="text-white/20" />
                    <p className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Sin gastos registrados</p>
                 </div>
              ) : (
                 expenses.map((expense: { id: string; amount: number; description: string; category?: string; expense_date: string }, idx: number) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={expense.id} 
                      className={`
                        bg-black/80 border border-white/10 p-5 md:p-8 flex items-center justify-between transition-all group relative z-10 hover:z-20
                        ${idx === 0 ? 'rounded-t-[3rem]' : ''}
                        ${idx === expenses.length - 1 ? 'rounded-b-[3rem]' : ''}
                      `}
                    >
                       <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-red-500/5 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center">
                             <DollarSign size={20} />
                          </div>
                          <div>
                             <p className="text-base md:text-xl font-black text-white uppercase tracking-tighter italic leading-none mb-2">{expense.description}</p>
                             <div className="flex items-center gap-3 text-[8px] font-black uppercase tracking-[0.2em] italic">
                                <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/10">{expense.category || 'General'}</span>
                                <span className="text-white/20">•</span>
                                <span className="text-white/20">{format(new Date(expense.expense_date), 'dd MMM, yyyy')}</span>
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-8">
                          <p className="text-xl md:text-2xl font-black text-white italic tracking-tighter leading-none">-${new Intl.NumberFormat('de-DE').format(expense.amount)}</p>
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
                                  background: '#0a0a0a',
                                  color: '#fff',
                                }).then(result => {
                                  if (result.isConfirmed) deleteExpense.mutate(expense.id);
                                });
                             }}
                             className="p-3 text-white/10 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          >
                             <Trash size={18} />
                          </button>
                       </div>
                    </motion.div>
                 ))
              )}
           </div>
        </div>

        {/* Formulario Nuevo Gasto */}
        <div className="lg:col-span-4 space-y-6">
           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 px-4 italic">Contabilidad</h3>
           <div className="bg-black/80 border border-white/10 rounded-[3rem] p-10 shadow-2xl space-y-8 backdrop-blur-xl relative overflow-hidden">
              <div className="space-y-4 relative z-10">
                 <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl w-fit text-red-500">
                    <Plus size={24} />
                 </div>
                 <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Registrar Gasto</h4>
              </div>

              <div className="space-y-6 relative z-10">
                 <div className="space-y-3">
                    <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-1 italic">Monto de la Salida ($)</label>
                    <input 
                       type="number" 
                       placeholder="0.00"
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-xl font-black text-white outline-none focus:border-red-500/40 transition-all"
                       value={newExpense.amount}
                       onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                    />
                 </div>

                 <div className="space-y-3">
                    <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-1 italic">Descripción / Concepto</label>
                    <textarea 
                       placeholder="Ej: Pago de Arriendo Mayo"
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-[11px] font-black uppercase text-white placeholder:text-white/10 outline-none focus:border-red-500/40 transition-all min-h-[100px]"
                       value={newExpense.description}
                       onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                    />
                 </div>

                 <div className="space-y-3">
                    <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-1 italic">Categoría Administrativa</label>
                    <div className="relative">
                      <select 
                         className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-red-500/40 transition-all appearance-none cursor-pointer"
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
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20"><ArrowRight size={16} className="rotate-90" /></div>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-1 italic">Fecha del Egreso</label>
                    <input 
                       type="date" 
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-[11px] font-black text-white outline-none focus:border-red-500/40 transition-all [color-scheme:dark]"
                       value={newExpense.expense_date}
                       onChange={e => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                    />
                 </div>
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
                          toast.success('Gasto registrado con éxito');
                          setNewExpense({ amount: '', description: '', category: '', expense_date: new Date().toISOString().split('T')[0] });
                       }
                    });
                 }}
                 className="w-full bg-red-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-red-500/20 active:scale-95 transition-all relative z-10"
              >
                 Registrar Salida de Capital
              </button>
              <TrendingDown size={200} className="absolute -bottom-20 -right-20 opacity-[0.02] text-red-500" />
           </div>
        </div>
      </div>
    </div>
  );
}
