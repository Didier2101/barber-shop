'use client';
import { useOwnerBaseData, useOwnerMutations, useOwnerExpenses } from '@/hooks/owner';
import { Expense } from '@/types';
import { 
  DollarSign, 
  Trash, 
  TrendingDown,
  ArrowRight,
  Plus,
  Receipt,
  X,
  Search
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '@/lib/format';

export default function ExpensesPage() {
  const { isLoading: baseLoading } = useOwnerBaseData();
  const { data: expenses = [], isLoading: expLoading } = useOwnerExpenses();
  const { createExpense, deleteExpense } = useOwnerMutations();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [newExpense, setNewExpense] = useState({ 
    amount: '', 
    description: '', 
    category: '', 
    expense_date: new Date().toISOString().split('T')[0] 
  });

  const filteredExpenses = useMemo(() => {
     if (!searchTerm) return expenses;
     return expenses.filter((e: Expense ) => e.description.toLowerCase().includes(searchTerm.toLowerCase()) || (e.category && e.category.toLowerCase().includes(searchTerm.toLowerCase())));
  }, [expenses, searchTerm]);

  const totalMonthlyExpenses = expenses.reduce((sum: number, exp: { amount: number }) => sum + Number(exp.amount), 0);

  const openDrawer = () => {
    setNewExpense({ amount: '', description: '', category: '', expense_date: new Date().toISOString().split('T')[0] });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleCreate = () => {
    if (!newExpense.amount || !newExpense.description) return toast.error('Completa los datos obligatorios (Monto y Descripción)');
    createExpense.mutate({
       amount: Number(newExpense.amount),
       description: newExpense.description,
       category: newExpense.category,
       expense_date: newExpense.expense_date
    }, {
       onSuccess: () => {
          toast.success('Gasto registrado con éxito');
          closeDrawer();
       }
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-32 font-sans animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER ERP CON TOTALES */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-erp-bg border border-erp-border p-6 rounded-2xl shadow-sm">
         <div className="flex items-center gap-5">
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 shadow-sm shrink-0">
               <TrendingDown size={24} />
            </div>
            <div>
               <h2 className="text-2xl font-black text-erp-text tracking-tight uppercase">Libro de Gastos</h2>
               <p className="text-sm font-medium text-erp-text-muted mt-0.5">Lleva el control de todos tus egresos</p>
            </div>
         </div>
         
         <div className="bg-erp-surface border border-erp-border px-6 py-4 rounded-xl shadow-sm min-w-[200px]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-erp-text-muted mb-1">Salida Total del Mes</p>
            <p className="text-2xl font-black text-red-600 tracking-tight leading-none">-{formatPrice(totalMonthlyExpenses)}</p>
         </div>
      </div>

      {/* HEADER DE LA TABLA Y ACCIONES */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-8 mb-4">
         <h3 className="text-lg font-black uppercase tracking-tight text-erp-text flex items-center gap-2">
            <Receipt size={18} className="text-erp-primary" /> Egresos Registrados
         </h3>
         
         <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative group shadow-sm w-full sm:w-72">
               <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search size={16} className="text-erp-text-muted group-focus-within:text-erp-primary transition-colors" />
               </div>
               <input
                  type="text"
                  placeholder="Buscar por concepto..."
                  className="w-full bg-erp-bg border border-erp-border rounded-xl py-2.5 pl-11 pr-4 text-sm text-erp-text outline-none focus:border-erp-primary/50 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            
            <button 
               onClick={openDrawer}
               className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-700 transition-all shadow-sm"
            >
               <Plus size={16} />
               Registrar Gasto
            </button>
         </div>
      </div>

      {/* DATA GRID (TABLA) */}
      <div className="bg-erp-surface border border-erp-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[50vh]">
         {baseLoading || expLoading ? (
            <div className="flex-1 flex items-center justify-center">
               <div className="w-8 h-8 border-4 border-erp-primary/20 border-t-erp-primary rounded-full animate-spin"></div>
            </div>
         ) : filteredExpenses.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 p-12">
               <Receipt size={48} className="text-erp-text-muted mb-4" />
               <p className="text-sm font-bold text-erp-text uppercase tracking-widest">Sin gastos registrados</p>
               {searchTerm && <p className="text-xs text-erp-text-muted mt-2">Intenta con otra búsqueda</p>}
            </div>
         ) : (
            <div className="flex-1 overflow-x-auto custom-scrollbar">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-erp-bg border-b border-erp-border">
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted whitespace-nowrap">Concepto</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted whitespace-nowrap">Categoría</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted whitespace-nowrap">Fecha</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted whitespace-nowrap text-right">Monto</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-erp-text-muted text-right whitespace-nowrap">Acciones</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-erp-border">
                     {filteredExpenses.map((expense: Expense) => (
                        <tr
                           key={expense.id}
                           className="group bg-erp-bg hover:bg-erp-surface transition-colors"
                        >
                           <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-lg overflow-hidden border border-red-100 bg-red-50 flex items-center justify-center shrink-0 text-red-500">
                                    <DollarSign size={18} />
                                 </div>
                                 <p className="text-sm font-bold text-erp-text uppercase tracking-tight">{expense.description}</p>
                              </div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-erp-surface border border-erp-border text-erp-text text-[10px] font-black uppercase tracking-widest">
                                 {expense.category || 'General'}
                              </span>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-xs font-bold text-erp-text-muted">
                                 {format(new Date(expense.expense_date), 'dd MMM, yyyy')}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right whitespace-nowrap">
                              <span className="text-sm font-black text-red-600">
                                 -{formatPrice(expense.amount)}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                 <button 
                                    onClick={(e) => {
                                       e.stopPropagation();
                                       Swal.fire({
                                          title: '¿Eliminar Gasto?',
                                          text: 'Esta acción revertirá la salida en el balance mensual.',
                                          icon: 'warning',
                                          showCancelButton: true,
                                          confirmButtonColor: '#ef4444',
                                          cancelButtonColor: 'var(--color-erp-primary)',
                                          confirmButtonText: 'Sí, eliminar',
                                          cancelButtonText: 'Cancelar'
                                       }).then(result => {
                                          if (result.isConfirmed) deleteExpense.mutate(expense.id);
                                       });
                                    }}
                                    className="p-2 rounded-lg border border-erp-border text-erp-text-muted hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                                    title="Eliminar"
                                 >
                                    <Trash size={16} />
                                 </button>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>

      {/* DRAWER (PANEL LATERAL) - NUEVO GASTO */}
      <AnimatePresence>
         {isDrawerOpen && (
            <>
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={closeDrawer}
                  className="fixed inset-0 bg-transparent z-[200]"
               />

               <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed top-0 right-0 w-full sm:w-[450px] h-full bg-erp-bg border-l border-erp-border shadow-2xl z-[210] flex flex-col"
               >
                  <div className="flex items-center justify-between p-6 border-b border-erp-border bg-erp-surface">
                     <h3 className="text-lg font-black uppercase tracking-tight text-erp-text flex items-center gap-3">
                        <TrendingDown size={20} className="text-red-500" />
                        Registrar Salida
                     </h3>
                     <button onClick={closeDrawer} className="p-2 text-erp-text-muted hover:text-erp-text hover:bg-erp-text/5 rounded-full transition-all">
                        <X size={20} />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                     <div className="space-y-6">
                        
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-erp-text-muted uppercase tracking-widest ml-1">Monto de la Salida <span className="text-red-500">*</span></label>
                           <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 font-black">$</div>
                              <input 
                                 type="number" 
                                 min="0"
                                 placeholder="0.00"
                                 className="w-full bg-erp-surface border border-erp-border rounded-xl pl-8 pr-4 py-3 text-sm font-bold text-red-600 outline-none focus:border-red-500/50 transition-all shadow-sm"
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
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-erp-text-muted uppercase tracking-widest ml-1">Descripción / Concepto <span className="text-red-500">*</span></label>
                           <textarea 
                              placeholder="Ej: Pago de Arriendo Mayo"
                              className="w-full bg-erp-surface border border-erp-border rounded-xl px-4 py-3 text-sm font-bold text-erp-text outline-none focus:border-erp-primary/50 transition-all min-h-[80px] resize-none shadow-sm uppercase"
                              value={newExpense.description}
                              onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                           />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label className="text-[10px] font-bold text-erp-text-muted uppercase tracking-widest ml-1">Categoría</label>
                              <div className="relative">
                                 <select 
                                    className="w-full bg-erp-surface border border-erp-border rounded-xl px-4 py-3 text-sm font-bold text-erp-text outline-none focus:border-erp-primary/50 transition-all appearance-none shadow-sm cursor-pointer"
                                    value={newExpense.category}
                                    onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                 >
                                    <option value="">General</option>
                                    <option value="Servicios">Servicios Públicos</option>
                                    <option value="Arriendo">Arriendo</option>
                                    <option value="Insumos">Insumos</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Mantenimiento">Mantenimiento</option>
                                    <option value="Otros">Otros Gastos</option>
                                 </select>
                                 <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-erp-text-muted">
                                    <ArrowRight size={14} className="rotate-90" />
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-2">
                              <label className="text-[10px] font-bold text-erp-text-muted uppercase tracking-widest ml-1">Fecha</label>
                              <input 
                                 type="date" 
                                 className="w-full bg-erp-surface border border-erp-border rounded-xl px-4 py-3 text-sm font-bold text-erp-text outline-none focus:border-erp-primary/50 transition-all shadow-sm"
                                 value={newExpense.expense_date}
                                 onChange={e => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                              />
                           </div>
                        </div>

                     </div>
                  </div>

                  <div className="p-6 border-t border-erp-border bg-erp-bg flex gap-3">
                     <button
                        onClick={closeDrawer}
                        className="flex-1 py-4 bg-erp-surface border border-erp-border text-erp-text rounded-xl text-xs font-black uppercase tracking-widest hover:border-erp-primary/30 transition-all shadow-sm"
                     >
                        Cancelar
                     </button>
                     <button
                        onClick={handleCreate}
                        className="flex-1 py-4 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-sm hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                     >
                        <Plus size={16} />
                        Registrar Gasto
                     </button>
                  </div>

               </motion.div>
            </>
         )}
      </AnimatePresence>
    </div>
  );
}
