'use client';
import { motion } from 'framer-motion';

export default function BarberLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="relative">
        {/* Spinner animado premium */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-brand/20 border-t-brand rounded-full shadow-[0_0_20px_rgba(204,58,99,0.2)]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-2 h-2 bg-brand rounded-full" />
        </motion.div>
      </div>
      
      <div className="space-y-2 text-center">
        <p className="text-brand text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Sincronizando Agenda</p>
        <div className="flex gap-1 justify-center">
          <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1 h-1 bg-brand rounded-full" />
          <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-brand rounded-full" />
          <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-brand rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mt-12 opacity-20 blur-sm pointer-events-none">
         <div className="bg-brand/10 h-40 rounded-[2rem]" />
         <div className="bg-brand/10 h-40 rounded-[2rem]" />
      </div>
    </div>
  );
}
