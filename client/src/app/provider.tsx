'use client';

import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '../contexts/AuthContext';
import { AiProvider } from '../contexts/AiContext';
import { ReactNode, useState, useEffect } from 'react';
import { QUERY_CONFIG } from '@/config';
import { validateEnv } from '@/config/env';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: QUERY_CONFIG.RETRY,
            staleTime: QUERY_CONFIG.STALE_TIME.DEFAULT,
          },
        },
      })
  );

  // Validate env vars sau khi app mount trên client (tránh crash server-side)
  useEffect(() => {
    validateEnv();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <AuthProvider>
          <AiProvider>{children}</AiProvider>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}