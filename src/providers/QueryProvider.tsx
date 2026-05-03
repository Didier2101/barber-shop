'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // Los datos se consideran "frescos" por 5 minutos
        gcTime: 1000 * 60 * 30, // Mantener en cache por 30 minutos
        refetchOnWindowFocus: false, // No recargar cada vez que cambias de pestaña (ahorra peticiones)
        retry: 1, // Reintentar una vez si falla
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
